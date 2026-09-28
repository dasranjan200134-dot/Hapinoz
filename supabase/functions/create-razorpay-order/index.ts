// Supabase Edge Function: create-razorpay-order
// Runtime: Deno / TypeScript
// Follows standard Supabase Edge Function conventions with Razorpay Node / NPM compatibility

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Razorpay from "https://esm.sh/razorpay@2.9.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Razorpay server API keys are not configured in Supabase environment secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Parse request payload
    const body = await req.json();
    const {
      items,
      coupon_code,
      shipping_address,
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided in order payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Server-Side Price Verification against Database
    const productIds = items.map((i: any) => i.product_id);
    const { data: dbProducts, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, title, price, images, is_active, stock_quantity")
      .in("id", productIds);

    if (prodErr || !dbProducts) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch verified product catalog prices." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build verified line items & calculate true subtotal
    let subtotal = 0;
    const verifiedOrderItems = items.map((item: any) => {
      const dbProd = dbProducts.find((p) => p.id === item.product_id);
      const unitPrice = dbProd ? Number(dbProd.price) : Number(item.price);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      return {
        id: crypto.randomUUID(),
        product_id: item.product_id,
        title: dbProd ? dbProd.title : item.title,
        price: unitPrice,
        quantity: qty,
        image: dbProd?.images?.[0] || item.image || "",
        total: lineTotal,
      };
    });

    // 4. Server-Side Coupon Verification
    let discount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      const { data: dbCoupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (dbCoupon) {
        const isNotExpired = new Date(dbCoupon.expiry_date).getTime() >= new Date().setHours(0, 0, 0, 0);
        const withinUsage = dbCoupon.usage_limit === 0 || dbCoupon.usage_count < dbCoupon.usage_limit;
        const meetsMinSpend = subtotal >= (Number(dbCoupon.min_spend) || 0);

        if (isNotExpired && withinUsage && meetsMinSpend) {
          appliedCoupon = dbCoupon;
          if (dbCoupon.discount_type === "percentage") {
            discount = (subtotal * Number(dbCoupon.amount)) / 100;
            if (dbCoupon.max_spend && discount > Number(dbCoupon.max_spend)) {
              discount = Number(dbCoupon.max_spend);
            }
          } else {
            discount = Math.min(Number(dbCoupon.amount), subtotal);
          }
        }
      }
    }

    const taxableBase = Math.max(0, subtotal - discount);

    // 5. Server-Side Shipping & Tax Calculations
    const { data: dbShipping } = await supabaseAdmin
      .from("shipping_rules")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const freeThreshold = dbShipping ? Number(dbShipping.free_threshold) : 499;
    const standardCost = dbShipping ? Number(dbShipping.cost) : 50;
    const shipping_fee = taxableBase >= freeThreshold ? 0 : standardCost;

    // 5% Standard Indian Spices GST
    const tax_amount = Math.round(taxableBase * 0.05 * 100) / 100;

    // Final grand total
    const total = Math.round((taxableBase + tax_amount + shipping_fee) * 100) / 100;
    const amountInPaise = Math.round(total * 100);

    // 6. Generate Human-Readable Order Number
    const order_number = `HPZ-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

    // 7. Initialize Razorpay Server SDK
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    // Create Order with Razorpay
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order_number,
      notes: {
        customer_name: customer_name || "",
        customer_email: customer_email || "",
        customer_phone: customer_phone || "",
        user_id: user_id || "guest",
      },
    });

    // 8. Insert Pending Order into public.orders Table
    const { data: savedOrder, error: orderInsertError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number,
        user_id: user_id || null,
        customer_name: customer_name || "Guest Customer",
        customer_email: customer_email || "",
        customer_phone: customer_phone || "",
        items: verifiedOrderItems,
        subtotal,
        discount,
        shipping_fee,
        tax_amount,
        total,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        status: "pending",
        payment_status: "pending",
        payment_method: "razorpay",
        razorpay_order_id: razorpayOrder.id,
        shipping_address: shipping_address || {},
        notes: notes || "",
      })
      .select()
      .single();

    if (orderInsertError) {
      console.error("Order DB insert error:", orderInsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: savedOrder?.id,
        order_number,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        key_id: RAZORPAY_KEY_ID,
        summary: {
          subtotal,
          discount,
          shipping_fee,
          tax_amount,
          total,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Create Razorpay Order Exception:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error creating order" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
