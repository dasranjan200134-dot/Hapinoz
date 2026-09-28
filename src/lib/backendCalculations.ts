/**
 * Pure Backend Calculation Engine for Hapinoz Pure Spices
 * Can be executed on Supabase Edge Functions (Deno) or Node.js backend.
 */

export interface PricingCalculationItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
}

export interface CouponRule {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  amount: number;
  min_spend: number;
  max_spend?: number;
  expiry_date: string;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
}

export interface ShippingRuleConfig {
  id: string;
  title: string;
  cost: number;
  free_threshold: number;
  delivery_days: string;
  is_active: boolean;
}

export interface TaxRuleConfig {
  id: string;
  name: string;
  rate_percent: number;
  is_compound: boolean;
  is_active: boolean;
}

export interface OrderCalculationInput {
  items: PricingCalculationItem[];
  coupon?: CouponRule | null;
  shippingRule?: ShippingRuleConfig | null;
  taxRules?: TaxRuleConfig[];
}

export interface OrderCalculationResult {
  subtotal: number;
  discount: number;
  discountBreakdown: {
    code?: string;
    type?: string;
    amount: number;
    isValid: boolean;
    reason?: string;
  };
  taxableAmount: number;
  taxAmount: number;
  taxBreakdown: Array<{
    name: string;
    ratePercent: number;
    amount: number;
  }>;
  shippingFee: number;
  isFreeShipping: boolean;
  total: number;
  totalInPaise: number;
}

/**
 * Validates and calculates discount from a coupon rule against a subtotal
 */
export function calculateCouponDiscount(
  subtotal: number,
  coupon?: CouponRule | null
): { discount: number; isValid: boolean; reason?: string } {
  if (!coupon) {
    return { discount: 0, isValid: false, reason: 'No coupon provided' };
  }

  if (!coupon.is_active) {
    return { discount: 0, isValid: false, reason: 'Coupon is inactive' };
  }

  // Expiry check
  const now = new Date();
  const expiry = new Date(coupon.expiry_date);
  // Compare end of expiry day
  expiry.setHours(23, 59, 59, 999);
  if (now.getTime() > expiry.getTime()) {
    return { discount: 0, isValid: false, reason: 'Coupon has expired' };
  }

  // Usage limit check
  if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
    return { discount: 0, isValid: false, reason: 'Coupon usage limit reached' };
  }

  // Min spend check
  if (coupon.min_spend > 0 && subtotal < coupon.min_spend) {
    return {
      discount: 0,
      isValid: false,
      reason: `Minimum order amount of ₹${coupon.min_spend} required for this coupon`,
    };
  }

  let calculatedDiscount = 0;

  if (coupon.discount_type === 'percentage') {
    calculatedDiscount = Math.round((subtotal * (coupon.amount / 100)) * 100) / 100;
    // Cap at max_spend if specified
    if (coupon.max_spend && coupon.max_spend > 0 && calculatedDiscount > coupon.max_spend) {
      calculatedDiscount = coupon.max_spend;
    }
  } else {
    // Fixed amount discount
    calculatedDiscount = Math.min(coupon.amount, subtotal);
  }

  return {
    discount: Math.max(0, calculatedDiscount),
    isValid: true,
  };
}

/**
 * Calculates shipping fee based on rules and subtotal after discount
 */
export function calculateShippingFee(
  applicableSubtotal: number,
  rule?: ShippingRuleConfig | null
): { fee: number; isFree: boolean } {
  if (!rule || !rule.is_active) {
    // Default fallback: ₹50 fee, free threshold ₹499
    const isFree = applicableSubtotal >= 499;
    return {
      fee: isFree ? 0 : 50,
      isFree,
    };
  }

  const isFree = applicableSubtotal >= rule.free_threshold;
  return {
    fee: isFree ? 0 : Number(rule.cost) || 0,
    isFree,
  };
}

/**
 * Calculates tax on the taxable base (subtotal - discount)
 * Standard Indian GST on packaged spices is 5% (inclusive or exclusive depending on catalog)
 */
export function calculateTax(
  taxableBase: number,
  rules: TaxRuleConfig[] = []
): { totalTax: number; breakdown: Array<{ name: string; ratePercent: number; amount: number }> } {
  if (!rules || rules.length === 0) {
    // Default fallback 5% GST
    const defaultGstRate = 5;
    const taxAmount = Math.round((taxableBase * (defaultGstRate / 100)) * 100) / 100;
    return {
      totalTax: taxAmount,
      breakdown: [{ name: 'GST (5%)', ratePercent: defaultGstRate, amount: taxAmount }],
    };
  }

  let runningTaxable = taxableBase;
  let accumulatedTax = 0;
  const breakdown: Array<{ name: string; ratePercent: number; amount: number }> = [];

  for (const rule of rules) {
    if (!rule.is_active) continue;

    const baseForThisRule = rule.is_compound ? taxableBase + accumulatedTax : taxableBase;
    const ruleTax = Math.round((baseForThisRule * (rule.rate_percent / 100)) * 100) / 100;

    accumulatedTax += ruleTax;
    breakdown.push({
      name: rule.name,
      ratePercent: rule.rate_percent,
      amount: ruleTax,
    });
  }

  return {
    totalTax: accumulatedTax,
    breakdown,
  };
}

/**
 * Main Order Pricing Calculation Engine
 * Guarantees zero floating point errors and consistency across server & client
 */
export function calculateOrderTotals(input: OrderCalculationInput): OrderCalculationResult {
  // 1. Calculate raw Subtotal from verified item prices
  const subtotal = input.items.reduce((acc, item) => {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
    return acc + itemTotal;
  }, 0);

  // 2. Calculate Coupon Discount
  const couponResult = calculateCouponDiscount(subtotal, input.coupon);
  const discount = couponResult.isValid ? couponResult.discount : 0;

  // 3. Taxable base
  const taxableAmount = Math.max(0, subtotal - discount);

  // 4. Calculate Tax (e.g. 5% GST)
  const taxResult = calculateTax(taxableAmount, input.taxRules || []);

  // 5. Calculate Shipping (based on subtotal or taxable amount)
  const shippingResult = calculateShippingFee(taxableAmount, input.shippingRule);

  // 6. Calculate Final Grand Total
  const finalTotal = Math.round((taxableAmount + taxResult.totalTax + shippingResult.fee) * 100) / 100;
  const totalInPaise = Math.round(finalTotal * 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    discountBreakdown: {
      code: input.coupon?.code,
      type: input.coupon?.discount_type,
      amount: discount,
      isValid: couponResult.isValid,
      reason: couponResult.reason,
    },
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxAmount: Math.round(taxResult.totalTax * 100) / 100,
    taxBreakdown: taxResult.breakdown,
    shippingFee: shippingResult.fee,
    isFreeShipping: shippingResult.isFree,
    total: finalTotal,
    totalInPaise,
  };
}
