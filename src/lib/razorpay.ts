export interface RazorpayCustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface PaymentSuccessResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  method: string;
}

export async function processRazorpayPayment(params: {
  amount: number;
  orderNumber: string;
  customer: RazorpayCustomerDetails;
  onSuccess: (result: PaymentSuccessResult) => void;
  onFailure: (error: string) => void;
  onSimulatorOpen?: (simParams: {
    orderId: string;
    amount: number;
    customer: RazorpayCustomerDetails;
    onSimulateSuccess: () => void;
    onSimulateFail: () => void;
  }) => void;
}) {
  try {
    // 1. Call our secure server endpoint to initiate order
    const orderRes = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amount,
        currency: 'INR',
        receipt: `rcpt_${params.orderNumber}`,
        notes: {
          customer_name: params.customer.name,
          customer_email: params.customer.email,
        },
      }),
    });

    if (!orderRes.ok) {
      throw new Error(`Failed to create order on server (Status: ${orderRes.status})`);
    }

    const orderData = await orderRes.json();
    const orderId = orderData.orderId;
    const keyId = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_simulated';

    // 2. Check if real Razorpay JS SDK is loaded and live keys are present
    const isLiveKey = keyId && !keyId.includes('simulated') && !keyId.includes('YourKeyId');
    const hasRazorpayScript = typeof window !== 'undefined' && Boolean((window as any).Razorpay);

    if (isLiveKey && hasRazorpayScript && !orderData.isSimulated) {
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'HAPINOZ Artisanal Craft',
        description: `Order ${params.orderNumber}`,
        image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=200&q=80',
        order_id: orderId,
        prefill: {
          name: params.customer.name,
          email: params.customer.email,
          contact: params.customer.phone,
        },
        theme: {
          color: '#b45309', // Amber-700 craft brand color
        },
        handler: async (response: any) => {
          // Verify on backend
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              params.onSuccess({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                method: verifyData.method || 'Razorpay Online',
              });
            } else {
              params.onFailure('Payment signature verification failed.');
            }
          } catch (e: any) {
            params.onFailure(e.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            params.onFailure('Payment was cancelled by user.');
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.open();
    } else {
      // 3. Fallback to interactive in-browser Razorpay Gateway Simulator Modal
      if (params.onSimulatorOpen) {
        params.onSimulatorOpen({
          orderId,
          amount: params.amount,
          customer: params.customer,
          onSimulateSuccess: async () => {
            const simPaymentId = `pay_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const simSignature = `sig_sim_${Date.now()}`;

            // Call verify endpoint
            try {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: orderId,
                  razorpay_payment_id: simPaymentId,
                  razorpay_signature: simSignature,
                }),
              });
              const vData = await verifyRes.json();
              params.onSuccess({
                razorpay_order_id: orderId,
                razorpay_payment_id: simPaymentId,
                razorpay_signature: simSignature,
                method: vData.method || 'Razorpay Test Sandbox',
              });
            } catch {
              params.onSuccess({
                razorpay_order_id: orderId,
                razorpay_payment_id: simPaymentId,
                razorpay_signature: simSignature,
                method: 'Razorpay Test Sandbox',
              });
            }
          },
          onSimulateFail: () => {
            params.onFailure('Payment simulation declined or failed.');
          },
        });
      } else {
        // Direct simulation success
        const simPaymentId = `pay_sim_${Date.now()}`;
        params.onSuccess({
          razorpay_order_id: orderId,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: `sig_${Date.now()}`,
          method: 'Razorpay Sandbox (Simulated)',
        });
      }
    }
  } catch (err: any) {
    console.error('Razorpay process error:', err);
    params.onFailure(err.message || 'Unable to connect to Razorpay payment service.');
  }
}
