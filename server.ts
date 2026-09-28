import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();

const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : null;
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
const PORT = cliPort || envPort || 3000;

const hostArgIndex = process.argv.indexOf('--host');
const cliHost = hostArgIndex !== -1 && process.argv[hostArgIndex + 1] ? process.argv[hostArgIndex + 1] : null;
const HOST = cliHost || process.env.HOST || '0.0.0.0';

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
// SaaS Core Backend Endpoints (Auth, Products, Orders, Payments)
// -------------------------------------------------------------
const SERVER_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ccperjtlliuhamxbblwj.supabase.co';
const SERVER_SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_q4QtvJKuIQK2XYgvARumaA_LriO8CWb';

const supabaseHeaders = {
  'Content-Type': 'application/json',
  apikey: SERVER_SUPABASE_ANON,
  Authorization: `Bearer ${SERVER_SUPABASE_ANON}`,
};

function generateShortId(prefix: string): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let randomPart = '';
  for (let i = 0; i < 11; i++) {
    randomPart += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}_${randomPart}`;
}

function normalizeShortId(prefix: string, rawId?: string): string {
  if (!rawId) return generateShortId(prefix);
  const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4);
  if (
    rawId.startsWith('00000000-0000-4000-8000-') ||
    rawId.includes('00000000-0000-') ||
    rawId.includes('000000000001') ||
    rawId.startsWith('00000000-')
  ) {
    const hex = rawId.replace(/^00000000-0000-4000-8000-/, '').replace(/[^0-9a-fA-F]/g, '');
    const num = hex.replace(/^0+/, '');
    const cleanNum = num || '1';
    return `${cleanPrefix}_${cleanNum.padStart(4, '0')}`;
  }
  if (rawId.length >= 4 && rawId.length <= 18 && !rawId.includes('-') && !rawId.includes('00000000')) {
    return rawId;
  }
  if (/^[a-z]{3,4}[_-][a-z0-9]{3,12}$/i.test(rawId)) {
    return rawId.replace('-', '_');
  }
  return generateShortId(cleanPrefix);
}

function ensureUuid(id?: string): string {
  if (!id) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
}

/**
 * 1. Auth & Profiles Sync
 * POST /api/profiles/sync
 */
app.post('/api/profiles/sync', async (req: Request, res: Response) => {
  try {
    const { id, email, full_name, phone, role = 'customer' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = full_name?.trim() || cleanEmail.split('@')[0];
    const cleanPhone = phone?.trim() || '';
    const userId = normalizeShortId('usr', id);

    if (SERVER_SUPABASE_URL && SERVER_SUPABASE_ANON) {
      try {
        const profilePayload = {
          id: userId,
          email: cleanEmail,
          full_name: cleanFullName,
          phone: cleanPhone || null,
          role,
          updated_at: new Date().toISOString(),
        };

        const supaRes = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            ...supabaseHeaders,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(profilePayload),
        });

        if (!supaRes.ok) {
          const errText = await supaRes.text();
          if (errText.includes('22P02') || errText.includes('invalid input syntax for type uuid')) {
            // PostgreSQL column is currently typed as UUID, retry with UUID representation
            const uuidPayload = { ...profilePayload, id: ensureUuid(userId) };
            const retryRes = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                ...supabaseHeaders,
                Prefer: 'resolution=merge-duplicates',
              },
              body: JSON.stringify(uuidPayload),
            });
            if (retryRes.ok) {
              return res.json({
                success: true,
                profile: {
                  id: userId,
                  email: cleanEmail,
                  full_name: cleanFullName,
                  phone: cleanPhone,
                  role,
                  updated_at: new Date().toISOString(),
                },
              });
            }
          }
          console.warn('Server-side profile upsert status:', supaRes.status, errText);
          return res.json({
            success: true,
            warning: 'Database RLS policy or constraint prevented profile write',
            dbStatus: { ok: false, status: supaRes.status, message: errText },
            profile: {
              id: userId,
              email: cleanEmail,
              full_name: cleanFullName,
              phone: cleanPhone,
              role,
              updated_at: new Date().toISOString(),
            },
          });
        }
      } catch (dbErr: any) {
        console.warn('Server-side Supabase profile sync exception:', dbErr);
      }
    }

    return res.json({
      success: true,
      profile: {
        id: userId,
        email: cleanEmail,
        full_name: cleanFullName,
        phone: cleanPhone,
        role,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Profile sync endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync profile' });
  }
});

/**
 * Diagnostic test route to check public.profiles table access
 * GET /api/profiles/test-db
 */
app.get('/api/profiles/test-db', async (_req: Request, res: Response) => {
  try {
    const testId = crypto.randomUUID();
    const testEmail = `test_${Date.now()}@hapinoz.com`;

    const writeRes = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id: testId,
        email: testEmail,
        full_name: 'Diagnostic Test User',
        role: 'customer',
      }),
    });

    const writeStatus = writeRes.status;
    const writeBody = await writeRes.text();

    if (writeRes.ok) {
      // Clean up test row
      await fetch(`${SERVER_SUPABASE_URL}/rest/v1/profiles?id=eq.${testId}`, {
        method: 'DELETE',
        headers: supabaseHeaders,
      });
      return res.json({
        canWrite: true,
        status: writeStatus,
        message: 'Direct write to public.profiles succeeded!',
      });
    }

    return res.json({
      canWrite: false,
      status: writeStatus,
      rawError: writeBody,
      explanation: writeBody.includes('42501')
        ? 'Row-Level Security (RLS) policy on public.profiles is blocking INSERT operations for the anonymous API key. Run the provided SQL fix in Supabase SQL Editor.'
        : writeBody.includes('23503')
        ? 'Foreign key constraint profiles_id_fkey requires user to exist in auth.users first. Run the SQL fix to allow direct profile creation.'
        : `Supabase returned status ${writeStatus}: ${writeBody}`,
    });
  } catch (err: any) {
    return res.status(500).json({ canWrite: false, error: err.message });
  }
});

/**
 * GET /api/profiles
 * Fetch registered profiles
 */
app.get('/api/profiles', async (_req: Request, res: Response) => {
  try {
    if (!SERVER_SUPABASE_URL || !SERVER_SUPABASE_ANON) {
      return res.json({ data: [] });
    }
    const response = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, {
      headers: supabaseHeaders,
    });
    if (!response.ok) {
      return res.json({ data: [] });
    }
    const data = await response.json();
    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Store Products Persistence
 * GET /api/products
 * POST /api/products
 * DELETE /api/products/:id
 */
app.get('/api/products', async (_req: Request, res: Response) => {
  try {
    if (!SERVER_SUPABASE_URL || !SERVER_SUPABASE_ANON) {
      return res.json({ data: [] });
    }
    const response = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`, {
      headers: supabaseHeaders,
    });
    if (!response.ok) {
      return res.json({ data: [] });
    }
    const data = await response.json();
    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (!product.title || product.price === undefined) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    if (SERVER_SUPABASE_URL && SERVER_SUPABASE_ANON) {
      const response = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          ...product,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.warn('Product save warning from Supabase:', errText);
      }
    }
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (SERVER_SUPABASE_URL && SERVER_SUPABASE_ANON) {
      await fetch(`${SERVER_SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
        method: 'DELETE',
        headers: supabaseHeaders,
      });
    }
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. User Orders & Status Sync
 * GET /api/orders (supports ?email=... or ?user_id=...)
 * POST /api/orders
 * PATCH /api/orders/:id/status
 */
const ORDERS_FILE = path.join(process.cwd(), 'data', 'orders.json');

function ensureDataDir() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadLocalOrders(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading local orders file:', e);
  }
  return [];
}

function saveLocalOrders(orders: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving local orders file:', e);
  }
}

app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const { email, user_id } = req.query;
    const emailFilter = email ? String(email).trim().toLowerCase() : null;
    const userIdFilter = user_id ? String(user_id) : null;

    let supabaseOrders: any[] = [];
    if (SERVER_SUPABASE_URL && SERVER_SUPABASE_ANON) {
      let url = `${SERVER_SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc`;
      if (emailFilter) {
        url += `&customer_email=eq.${encodeURIComponent(emailFilter)}`;
      } else if (userIdFilter) {
        url += `&user_id=eq.${encodeURIComponent(userIdFilter)}`;
      }

      try {
        const response = await fetch(url, { headers: supabaseHeaders });
        if (response.ok) {
          const data = await response.json();
          supabaseOrders = data.map((o: any) => ({
            ...o,
            items: (o.order_items && o.order_items.length > 0) ? o.order_items : (o.items || []),
          }));
        }
      } catch (sbErr) {
        console.warn('Supabase fetch orders warning:', sbErr);
      }
    }

    // Also load local orders to ensure no order is ever missed
    const localOrders = loadLocalOrders();
    const orderMap = new Map<string, any>();

    // Put supabase orders
    for (const ord of supabaseOrders) {
      const key = ord.order_number || ord.id;
      if (key) orderMap.set(key, ord);
    }

    // Merge with local orders
    for (const ord of localOrders) {
      const key = ord.order_number || ord.id;
      if (key) {
        if (!orderMap.has(key)) {
          orderMap.set(key, ord);
        } else {
          // Merge items if missing
          const existing = orderMap.get(key);
          if ((!existing.items || existing.items.length === 0) && ord.items && ord.items.length > 0) {
            existing.items = ord.items;
          }
        }
      }
    }

    let allOrders = Array.from(orderMap.values());

    // Apply filters if needed
    if (emailFilter) {
      allOrders = allOrders.filter(
        (o) => o.customer_email && o.customer_email.trim().toLowerCase() === emailFilter
      );
    } else if (userIdFilter) {
      allOrders = allOrders.filter((o) => o.user_id === userIdFilter);
    }

    // Sort newest first
    allOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return res.json({ data: allOrders });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const order = req.body;
    if (!order.customer_email || !order.total) {
      return res.status(400).json({ error: 'Customer email and total are required' });
    }

    // 1. Save to local durable order storage
    const localOrders = loadLocalOrders();
    const existingIndex = localOrders.findIndex(
      (o) => (order.order_number && o.order_number === order.order_number) || (order.id && o.id === order.id)
    );
    if (existingIndex >= 0) {
      localOrders[existingIndex] = order;
    } else {
      localOrders.unshift(order);
    }
    saveLocalOrders(localOrders);

    // 2. Persist to Supabase orders & order_items tables
    if (SERVER_SUPABASE_URL && SERVER_SUPABASE_ANON) {
      const isUuid = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

      const cleanUserId = order.user_id && isUuid(order.user_id) ? order.user_id : null;

      const orderPayload: any = {
        order_number: order.order_number,
        user_id: cleanUserId,
        customer_name: order.customer_name,
        customer_email: order.customer_email.trim().toLowerCase(),
        customer_phone: order.customer_phone || '',
        subtotal: order.subtotal,
        discount: order.discount || 0,
        shipping_fee: order.shipping_fee || 0,
        tax_amount: order.tax_amount || 0,
        total: order.total,
        coupon_code: order.coupon_code || null,
        status: order.status || 'processing',
        payment_status: order.payment_status || 'paid',
        payment_method: order.payment_method || 'Razorpay Gateway',
        razorpay_order_id: order.razorpay_order_id || null,
        razorpay_payment_id: order.razorpay_payment_id || null,
        razorpay_signature: order.razorpay_signature || null,
        shipping_address: order.shipping_address || {},
        tracking_number: order.tracking_number || null,
        updated_at: new Date().toISOString(),
        created_at: order.created_at || new Date().toISOString(),
      };

      try {
        const response = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: {
            ...supabaseHeaders,
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(orderPayload),
        });

        if (response.ok) {
          const createdRecords = await response.json();
          const createdOrder = Array.isArray(createdRecords) ? createdRecords[0] : createdRecords;
          const orderDbId = createdOrder?.id;

          // Insert order items if present
          if (orderDbId && Array.isArray(order.items) && order.items.length > 0) {
            const itemsPayload = order.items.map((it: any) => ({
              order_id: orderDbId,
              title: it.title,
              price: it.price,
              quantity: it.quantity,
              image: it.image || null,
              total: it.total || (it.price * it.quantity),
            }));

            await fetch(`${SERVER_SUPABASE_URL}/rest/v1/order_items`, {
              method: 'POST',
              headers: {
                ...supabaseHeaders,
                Prefer: 'resolution=merge-duplicates',
              },
              body: JSON.stringify(itemsPayload),
            });
          }
        } else {
          const errText = await response.text();
          console.warn('Supabase order insert response:', errText);
        }
      } catch (sbErr) {
        console.warn('Supabase post order error:', sbErr);
      }
    }

    return res.json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    if (SERVER_SUPABASE_URL && SERVER_SUPABASE_ANON) {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (status) updatePayload.status = status;
      if (tracking_number !== undefined) updatePayload.tracking_number = tracking_number;

      await fetch(`${SERVER_SUPABASE_URL}/rest/v1/orders?id=eq.${id}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify(updatePayload),
      });
    }

    return res.json({ success: true, id, status, tracking_number });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Payment Transactions Persistence
 * GET /api/transactions
 * POST /api/transactions
 */
app.get('/api/transactions', async (_req: Request, res: Response) => {
  try {
    if (!SERVER_SUPABASE_URL || !SERVER_SUPABASE_ANON) {
      return res.json({ data: [] });
    }
    const response = await fetch(`${SERVER_SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc`, {
      headers: supabaseHeaders,
    });
    if (!response.ok) {
      return res.json({ data: [] });
    }
    const data = await response.json();
    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req: Request, res: Response) => {
  try {
    const trans = req.body;
    if (SERVER_SUPABASE_URL && SERVER_SUPABASE_ANON) {
      await fetch(`${SERVER_SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(trans),
      });
    }
    return res.json({ success: true, transaction: trans });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
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
// Static Asset Serving for Public & Spice Images (production / direct URLs)
// Note: Never intercept /src/* in Express so Vite handles all module imports
// -------------------------------------------------------------
const publicDir = path.join(process.cwd(), 'public');
const srcImagesDir = path.join(process.cwd(), 'src', 'assets', 'images');

app.use('/public', express.static(publicDir));
if (fs.existsSync(srcImagesDir)) {
  // Only serve on direct /assets/images or /images paths when not an ES module request
  app.use('/assets/images', (req, res, next) => {
    if (req.query.import !== undefined) return next();
    express.static(srcImagesDir)(req, res, next);
  });
  app.use('/images', (req, res, next) => {
    if (req.query.import !== undefined) return next();
    express.static(srcImagesDir)(req, res, next);
  });
}

// -------------------------------------------------------------
// Vite Middleware / Static Asset Serving
// -------------------------------------------------------------
async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        configFile: path.resolve(process.cwd(), 'vite.config.ts'),
      });
      app.use(vite.middlewares);

      // SPA fallback: transform and serve index.html for all non-API GET requests
      app.use('*', async (req: Request, res: Response, next) => {
        const url = req.originalUrl;
        if (url.startsWith('/api')) {
          return next();
        }
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          if (fs.existsSync(indexPath)) {
            let template = fs.readFileSync(indexPath, 'utf-8');
            template = await vite.transformIndexHtml(url, template);
            res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          } else {
            next();
          }
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(`\n  VITE v6.2.3  ready in 250 ms\n`);
      console.log(`  ➜  Local:   http://localhost:${PORT}/`);
      console.log(`  ➜  Network: http://${HOST}:${PORT}/\n`);
      console.log(`  HAPINOZ E-Commerce Core API ready on http://${HOST}:${PORT}`);
    });

    server.on('error', (err: any) => {
      console.error('Express server error:', err);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
