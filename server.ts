import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request body with generous limit for image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// -------------------------------------------------------------
// Health Check Endpoint
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'HAPINOZ E-Commerce Core API',
    timestamp: new Date().toISOString(),
    env: {
      supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
      razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
  });
});

// -------------------------------------------------------------
// Razorpay Integration API Endpoints
// -------------------------------------------------------------

/**
 * Create Razorpay Order
 * POST /api/razorpay/order
 * Body: { amount: number (in INR), currency: string, receipt: string, notes: object }
 */
app.post('/api/razorpay/order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If live keys are configured and not test dummy strings, call Razorpay API
    if (keyId && keySecret && !keyId.includes('YourKeyId') && !keySecret.includes('your_razorpay')) {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // convert to paise
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes: notes || {},
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        console.error('Razorpay API error:', orderData);
        return res.status(response.status).json({
          error: 'Razorpay order creation failed',
          details: orderData,
        });
      }

      return res.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
        isSimulated: false,
      });
    }

    // Otherwise, simulate a verified order token for seamless sandbox/preview testing
    const simulatedOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return res.json({
      success: true,
      orderId: simulatedOrderId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      keyId: keyId || 'rzp_test_simulated',
      isSimulated: true,
      message: 'Running in simulated sandbox mode. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for live payments.',
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Verify Razorpay Payment Signature
 * POST /api/razorpay/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
app.post('/api/razorpay/verify', (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If order was simulated
    if (razorpay_order_id.startsWith('order_sim_') || !keySecret || keySecret.includes('your_razorpay')) {
      return res.json({
        success: true,
        verified: true,
        transactionId: razorpay_payment_id,
        orderId: razorpay_order_id,
        method: 'Razorpay (Simulated Sandbox)',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify HMAC SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature',
      });
    }

    return res.json({
      success: true,
      verified: true,
      transactionId: razorpay_payment_id,
      orderId: razorpay_order_id,
      method: 'Razorpay Secure Payment',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Signature verification error:', error);
    return res.status(500).json({ error: error.message || 'Verification error' });
  }
});

/**
 * Razorpay Webhook Handler
 * POST /api/razorpay/webhook
 */
app.post('/api/razorpay/webhook', (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookSignature = req.headers['x-razorpay-signature'] as string;

    if (webhookSecret && webhookSignature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        console.warn('Webhook signature mismatch');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Received Razorpay webhook event: ${event}`);

    // In a live Supabase production database, this updates the order transaction status
    switch (event) {
      case 'payment.captured':
        console.log(`Payment captured: ${payload.payment?.entity?.id}`);
        break;
      case 'payment.failed':
        console.warn(`Payment failed: ${payload.payment?.entity?.id}`);
        break;
      case 'order.paid':
        console.log(`Order marked as paid: ${payload.order?.entity?.id}`);
        break;
      default:
        console.log(`Unhandled event: ${event}`);
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

// -------------------------------------------------------------
// Logo Management API Endpoints
// -------------------------------------------------------------

/**
 * Check if the exact logo exists in public/
 * GET /api/logo-info
 */
app.get('/api/logo-info', (_req: Request, res: Response) => {
  const publicDir = path.join(process.cwd(), 'public');
  const exactFile = 'WhatsApp_Image_2026-04-29_at_9.51.49_PM-removebg-preview.png';
  const exactExists = fs.existsSync(path.join(publicDir, exactFile));
  const logoPngExists = fs.existsSync(path.join(publicDir, 'logo.png'));
  const hapinozLogoExists = fs.existsSync(path.join(publicDir, 'hapinoz-logo.png'));

  res.json({
    exactFileExists: exactExists,
    logoPngExists,
    hapinozLogoExists,
    preferredUrl: exactExists
      ? `/${exactFile}`
      : logoPngExists
      ? '/logo.png'
      : hapinozLogoExists
      ? '/hapinoz-logo.png'
      : null,
  });
});

/**
 * Upload and save exact unedited logo to public folder
 * POST /api/upload-logo
 * Body: { dataBase64: string }
 */
app.post('/api/upload-logo', (req: Request, res: Response) => {
  try {
    const { dataBase64 } = req.body;
    if (!dataBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Strip data URI prefix if present
    const cleanBase64 = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const exactFilename = 'WhatsApp_Image_2026-04-29_at_9.51.49_PM-removebg-preview.png';
    fs.writeFileSync(path.join(publicDir, exactFilename), buffer);
    fs.writeFileSync(path.join(publicDir, 'logo.png'), buffer);
    fs.writeFileSync(path.join(publicDir, 'hapinoz-logo.png'), buffer);

    console.log(`Saved exact unedited logo to ${exactFilename}, logo.png, and hapinoz-logo.png`);

    return res.json({
      success: true,
      url: `/${exactFilename}`,
      message: 'Exact unedited logo successfully saved to public directory',
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save logo' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Asset Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HAPINOZ E-Commerce server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
