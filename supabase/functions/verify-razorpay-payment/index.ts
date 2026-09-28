// Supabase Edge Function: verify-razorpay-payment
// Runtime: Deno / TypeScript
// Validates cryptographic HMAC SHA-256 signature, records transaction, and updates inventory

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Razorpay server secret not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required payment verification parameters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Cryptographic HMAC SHA-256 Signature Verification
    const expectedData = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(expectedData)
      .digest("hex");

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      // Record failed transaction attempt
      await supabaseAdmin.from("transactions").insert({
        order_id: null,
        order_number: razorpay_order_id,
        razorpay_payment_id,
        razorpay_order_id,
        amount: 0,
        currency: "INR",
        status: "failed",
      });

      return new Response(
        JSON.stringify({ success: false, error: "Invalid payment signature verification failed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch the corresponding order from Supabase
    const { data: order, error: orderFetchErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (orderFetchErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order record not found for this Razorpay transaction." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Update Order Status to 'processing' and payment_status to 'paid'
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        razorpay_payment_id,
        razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .select()
      .single();

    if (updateErr) {
      console.error("Failed to update order status:", updateErr);
    }

    // 4. Record Successful Transaction in public.transactions Table
    await supabaseAdmin.from("transactions").insert({
      order_id: order.id,
      order_number: order.order_number,
      razorpay_payment_id,
      razorpay_order_id,
      amount: order.total,
      currency: "INR",
      status: "captured",
    });

    // 5. Decrement Inventory Quantities for each item in order
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.product_id && item.quantity) {
          // RPC or raw update to atomically deduct stock
          await supabaseAdmin.rpc("decrement_product_stock", {
            product_id: item.product_id,
            qty: item.quantity,
          }).catch(async () => {
            // Fallback: regular query update if RPC not present
            const { data: currentProd } = await supabaseAdmin
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();

            if (currentProd) {
              const newQty = Math.max(0, currentProd.stock_quantity - item.quantity);
              await supabaseAdmin
                .from("products")
                .update({
                  stock_quantity: newQty,
                  stock_status: newQty === 0 ? "out_of_stock" : newQty < 10 ? "low_stock" : "in_stock",
                })
                .eq("id", item.product_id);
            }
          });
        }
      }
    }

    // 6. Increment Coupon Usage Count if coupon was applied
    if (order.coupon_code) {
      await supabaseAdmin.rpc("increment_coupon_usage", {
        coupon_code: order.coupon_code,
      }).catch(async () => {
        const { data: currentCoupon } = await supabaseAdmin
          .from("coupons")
          .select("usage_count")
          .eq("code", order.coupon_code)
          .single();

        if (currentCoupon) {
          await supabaseAdmin
            .from("coupons")
            .update({ usage_count: (currentCoupon.usage_count || 0) + 1 })
            .eq("code", order.coupon_code);
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment successfully verified and order is now processing.",
        order: updatedOrder || order,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Payment Verification Exception:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error verifying payment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
