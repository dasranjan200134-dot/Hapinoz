export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
  type?: 'shipping' | 'billing';
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  short_description?: string;
  price: number;
  regular_price?: number;
  sale_price?: number;
  size?: string; // '100g' | '250g' | '500g' | '1000g'
  available_sizes?: string[]; // e.g. ['100g', '250g', '500g']
  size_pricing?: Record<string, { price: number; regular_price?: number }>;
  stock_quantity: number;
  stock_status: StockStatus;
  category: string;
  tags: string[];
  images: string[];
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected_variant?: string;
}

export type CouponType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponType;
  amount: number;
  min_spend: number;
  max_spend?: number;
  expiry_date: string;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ShippingRule {
  id: string;
  title: string;
  cost: number;
  free_threshold: number;
  delivery_days: string;
  is_active: boolean;
}

export interface TaxRule {
  id: string;
  name: string;
  rate_percent: number;
  is_compound: boolean;
  is_active: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping_fee: number;
  tax_amount: number;
  total: number;
  coupon_code?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  shipping_address: Address;
  billing_address?: Address;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  order_number: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: 'captured' | 'failed' | 'refunded';
  created_at: string;
}
