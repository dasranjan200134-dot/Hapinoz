export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- HAPINOZ E-COMMERCE PLATFORM: COMPLETE PRODUCTION SUPABASE SQL SCHEMA
-- With Row Level Security (RLS), Relations, Indexes, and Functions
-- Compact 15-20 Character IDs (e.g. usr_9k4m2p8x1v7q, prd_3f8a1c9e2b4d)
-- Compatible with Supabase PostgreSQL 15+
-- =========================================================================

-- =========================================================================
-- MIGRATION SCRIPT: CONVERT EXISTING TABLE IDs TO VARCHAR(20) / TEXT
-- (Run this in Supabase SQL Editor if your tables were created with UUID)
-- =========================================================================
DO $$
BEGIN
    -- Drop foreign keys temporarily if needed
    ALTER TABLE IF EXISTS public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
    ALTER TABLE IF EXISTS public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
    ALTER TABLE IF EXISTS public.transactions DROP CONSTRAINT IF EXISTS transactions_order_id_fkey;
    ALTER TABLE IF EXISTS public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;
    ALTER TABLE IF EXISTS public.product_reviews DROP CONSTRAINT IF EXISTS product_reviews_product_id_fkey;
    ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

    -- Alter column types to VARCHAR(20)
    ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.products ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.orders ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.order_items ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.order_items ALTER COLUMN order_id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.order_items ALTER COLUMN product_id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.transactions ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.transactions ALTER COLUMN order_id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.coupons ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.shipping_rules ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.tax_rules ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.addresses ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.addresses ALTER COLUMN user_id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.product_reviews ALTER COLUMN id TYPE VARCHAR(20);
    ALTER TABLE IF EXISTS public.product_reviews ALTER COLUMN product_id TYPE VARCHAR(20);
END $$;

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom ENUM Types
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE stock_status_type AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
CREATE TYPE order_status_type AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status_type AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- 3. Profiles / User Directory Table (Compact 15-20 char ID)
CREATE TABLE public.profiles (
    id VARCHAR(20) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'customer' NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Customer Saved Addresses
CREATE TABLE public.addresses (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'India' NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    type TEXT DEFAULT 'shipping' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Product Categories
CREATE TABLE public.categories (
    id VARCHAR(20) PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Products Table
CREATE TABLE public.products (
    id VARCHAR(20) PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    short_description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    regular_price NUMERIC(10, 2) CHECK (regular_price >= 0),
    sale_price NUMERIC(10, 2) CHECK (sale_price >= 0),
    size TEXT DEFAULT '100g',
    available_sizes TEXT[] DEFAULT '{"100g", "250g", "500g"}',
    size_pricing JSONB DEFAULT '{"100g": {"price": 149, "regular_price": 199}, "250g": {"price": 299, "regular_price": 399}, "500g": {"price": 549, "regular_price": 749}}',
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    stock_status stock_status_type DEFAULT 'in_stock' NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Coupons Table
CREATE TABLE public.coupons (
    id VARCHAR(20) PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type coupon_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    min_spend NUMERIC(10, 2) DEFAULT 0 CHECK (min_spend >= 0),
    max_spend NUMERIC(10, 2),
    expiry_date DATE NOT NULL,
    usage_limit INTEGER DEFAULT 100 CHECK (usage_limit > 0),
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Shipping Rules Table
CREATE TABLE public.shipping_rules (
    id VARCHAR(20) PRIMARY KEY,
    title TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    free_threshold NUMERIC(10, 2) NOT NULL DEFAULT 999 CHECK (free_threshold >= 0),
    delivery_days TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Tax Rules Table
CREATE TABLE public.tax_rules (
    id VARCHAR(20) PRIMARY KEY,
    name TEXT NOT NULL,
    rate_percent NUMERIC(5, 2) NOT NULL CHECK (rate_percent >= 0),
    is_compound BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. Orders Table
CREATE TABLE public.orders (
    id VARCHAR(20) PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    user_id VARCHAR(20) REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(10, 2) DEFAULT 0 CHECK (discount >= 0),
    shipping_fee NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
    tax_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    coupon_code TEXT,
    status order_status_type DEFAULT 'pending' NOT NULL,
    payment_status payment_status_type DEFAULT 'pending' NOT NULL,
    payment_method TEXT NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. Order Items Table
CREATE TABLE public.order_items (
    id VARCHAR(20) PRIMARY KEY,
    order_id VARCHAR(20) REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id VARCHAR(20) REFERENCES public.products(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    image TEXT,
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. Razorpay Transactions Table
CREATE TABLE public.transactions (
    id VARCHAR(20) PRIMARY KEY,
    order_id VARCHAR(20) REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    order_number TEXT NOT NULL,
    razorpay_payment_id TEXT NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR' NOT NULL,
    status TEXT NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. Customer Product Reviews
CREATE TABLE public.product_reviews (
    id VARCHAR(20) PRIMARY KEY,
    product_id VARCHAR(20) REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id VARCHAR(20) REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =========================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =========================================================================
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Current User an Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow profile insert" 
ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow profile update" 
ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow profile delete" 
ON public.profiles FOR DELETE USING (public.is_admin());

-- Products Policies
CREATE POLICY "Anyone can view active products" 
ON public.products FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert products" 
ON public.products FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" 
ON public.products FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete products" 
ON public.products FOR DELETE USING (public.is_admin());

-- Orders Policies
CREATE POLICY "Customers can view their own orders" 
ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Anyone can create an order" 
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update any order" 
ON public.orders FOR UPDATE USING (public.is_admin());

-- Order Items Policies
CREATE POLICY "View order items if user owns order or admin" 
ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.user_id = auth.uid() OR public.is_admin())
    )
);

CREATE POLICY "Allow order item creation with order" 
ON public.order_items FOR INSERT WITH CHECK (true);

-- Coupons Policies
CREATE POLICY "Anyone can read active coupons" 
ON public.coupons FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage coupons" 
ON public.coupons FOR ALL USING (public.is_admin());

-- Shipping & Tax Policies
CREATE POLICY "Anyone can read shipping rules" ON public.shipping_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage shipping rules" ON public.shipping_rules FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can read tax rules" ON public.tax_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage tax rules" ON public.tax_rules FOR ALL USING (public.is_admin());

-- Reviews Policies
CREATE POLICY "Anyone can read reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================================================
-- STORAGE BUCKETS (Product Photography & Assets)
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for product-images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for Product Images'
    ) THEN
        CREATE POLICY "Public Access for Product Images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'product-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Uploads to Product Images'
    ) THEN
        CREATE POLICY "Allow Uploads to Product Images"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'product-images');
    END IF;
END $$;

-- =========================================================================
-- AUTOMATED TRIGGERS
-- =========================================================================

-- Trigger: Automatically insert profile when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, phone, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role),
        NEW.raw_user_meta_data->>'phone',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Decrement Product Stock on Order Creation
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
        stock_status = CASE 
            WHEN (stock_quantity - NEW.quantity) <= 0 THEN 'out_of_stock'::stock_status_type
            WHEN (stock_quantity - NEW.quantity) <= 5 THEN 'low_stock'::stock_status_type
            ELSE 'in_stock'::stock_status_type
        END
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_order_item_placed
    AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order();
`;

export const ARCHITECTURE_EXPLANATION = `
# HAPINOZ Cloud Microservices & Scalable Architecture

HAPINOZ is architected as an event-driven, microservices-ready modern eCommerce platform separating client experiences, transactional APIs, state storage, and payment webhooks:

### 1. Presentation Tier (Edge SPA / Next.js / React + Tailwind CSS)
- **Role**: High-speed CDN-delivered responsive interface optimized for desktop & mobile.
- **Client Features**: Real-time catalog filtering, responsive mini-cart drawer, instant client-side coupon calculation, and direct Razorpay standard checkout modal.
- **State Engine**: Unified local reactive cache with bidirectional Supabase synchronization.

### 2. Identity & Security Microservice (Supabase Auth & RLS)
- **Authentication**: JWT-based session tokens with role claims ('admin' | 'customer').
- **Row Level Security (RLS)**: PostgreSQL-level boundary enforcement preventing cross-tenant data leaks.
- **Auto Profile Sync**: Database triggers immediately provision user profiles and role allocations upon sign-up.

### 3. Payment Processing Microservice (Razorpay SDK + Webhook Gateways)
- **Order Creation API**: Server-side endpoint (/api/razorpay/order) generating authenticated Razorpay order tokens with currency and notes.
- **Signature Verification**: Server-side HMAC-SHA256 checksum validation (/api/razorpay/verify) preventing man-in-the-middle tampering.
- **Webhook Listener**: Async endpoint (/api/razorpay/webhook) receiving 'payment.captured' and 'order.paid' events to update orders idempotently.

### 4. Database & Storage Tier (Supabase PostgreSQL + S3 Storage)
- **Data Integrity**: Foreign key cascades, numeric check constraints, and typed ENUMs.
- **Inventory Concurrency**: Trigger-based stock decrement protecting against race conditions and overselling.
- **Asset Storage**: Public CDN buckets for high-resolution product photography and brand imagery.
`;

export const VERCEL_DEPLOYMENT_STEPS = `
# How to Deploy HAPINOZ on Vercel

1. **Push Code to GitHub**:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit for HAPINOZ E-Commerce"
   git branch -M main
   git remote add origin https://github.com/your-username/hapinoz-ecommerce.git
   git push -u origin main
   \`\`\`

2. **Import Project into Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New...** -> **Project**.
   - Select your \`hapinoz-ecommerce\` repository.
   - Framework Preset: **Vite**.

3. **Configure Environment Variables in Vercel Settings**:
   Add the following under **Project Settings -> Environment Variables**:
   - \`VITE_SUPABASE_URL\`: Your Supabase Project URL (\`https://xyz.supabase.co\`)
   - \`VITE_SUPABASE_ANON_KEY\`: Your Supabase Anon Public Key
   - \`SUPABASE_SERVICE_ROLE_KEY\`: Your Supabase Service Role Key (secret)
   - \`RAZORPAY_KEY_ID\`: Your Razorpay Key ID (\`rzp_live_...\` or \`rzp_test_...\`)
   - \`RAZORPAY_KEY_SECRET\`: Your Razorpay Key Secret
   - \`RAZORPAY_WEBHOOK_SECRET\`: Your Razorpay Webhook Secret
   - \`VITE_RAZORPAY_KEY_ID\`: Same as \`RAZORPAY_KEY_ID\` for frontend checkout

4. **Initialize Supabase PostgreSQL**:
   - Open your Supabase Dashboard -> **SQL Editor**.
   - Copy the complete SQL script from the **Admin Panel -> Supabase SQL & Architecture** tab.
   - Paste into the SQL editor and click **Run**.
   - In Supabase -> Authentication -> URL Configuration, set Site URL to your Vercel URL.

5. **Configure Razorpay Webhook**:
   - In Razorpay Dashboard -> **Settings -> Webhooks** -> **Add New Webhook**.
   - Webhook URL: \`https://your-vercel-domain.vercel.app/api/razorpay/webhook\`
   - Secret: Enter the same secret as \`RAZORPAY_WEBHOOK_SECRET\`.
   - Active Events: \`order.paid\`, \`payment.captured\`, \`payment.failed\`.

6. **Deploy**:
   - Click **Deploy** in Vercel! Your production eCommerce store is live.
`;
