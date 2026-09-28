import { useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Coupon,
  ShippingRule,
  TaxRule,
  Order,
  User,
  Address,
  Transaction,
  OrderStatus,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_SHIPPING_RULES,
  INITIAL_TAX_RULES,
  SAMPLE_USERS,
  INITIAL_ORDERS,
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SupabaseAdminService } from './supabaseAdmin';
import { fileToDataUrl, getProductImage } from './imageHelper';
import { POUCH_IMAGES } from './productImages';

const STORAGE_KEYS = {
  PRODUCTS: 'hapinoz_spices_products_v3',
  DELETED_PRODUCTS: 'hapinoz_spices_deleted_products_v2',
  CART: 'hapinoz_spices_cart_v2',
  USER: 'hapinoz_spices_user_v2',
  USERS: 'hapinoz_spices_users_v2',
  ADDRESSES: 'hapinoz_spices_addresses_v2',
  COUPONS: 'hapinoz_spices_coupons_v2',
  SHIPPING: 'hapinoz_spices_shipping_v2',
  TAX: 'hapinoz_spices_tax_v2',
  ORDERS: 'hapinoz_spices_orders_v2',
  TRANSACTIONS: 'hapinoz_spices_transactions_v2',
  ACTIVE_COUPON: 'hapinoz_spices_active_coupon_v2',
  LOGO: 'hapinoz_custom_logo_v2',
};

// Safe LocalStorage helpers with automatic quota protection and iframe/incognito safety
function loadStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed)) return fallback;
      return parsed.filter((item) => item !== null && item !== undefined && typeof item === 'object') as unknown as T;
    }
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err: any) {
    console.warn(`Storage save warning for ${key}:`, err);
    // If quota exceeded, clean up old non-essential caches
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      try {
        window.localStorage.removeItem('hapinoz_spices_products_v2');
        window.localStorage.removeItem('hapinoz_spices_products_v1');
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (retryErr) {
        console.warn('Could not free storage quota:', retryErr);
      }
    }
  }
}

/**
 * Generates compact, human-readable IDs up to 15-20 characters (e.g., usr_9k4m2p8x1v7q, prd_3f8a1c9e2b4d)
 */
export function generateShortId(prefix: string): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  const cleanPrefix = (prefix || 'id').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'id';
  let randomPart = '';
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const randomBytes = new Uint8Array(11);
      crypto.getRandomValues(randomBytes);
      for (let i = 0; i < 11; i++) {
        randomPart += chars[randomBytes[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 11; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
      }
    }
  } catch {
    for (let i = 0; i < 11; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  // Total: prefix (3-4) + '_' (1) + 11 chars = 15 to 16 characters!
  return `${cleanPrefix}_${randomPart}`;
}

/**
 * Normalizes any existing raw ID (including legacy 36-char UUIDs like 00000000-0000-4000-8000-000000000001)
 * to a short, compact, human-readable ID (e.g., usr_0001, prd_0001, usr_9k4m2p8x)
 */
export function normalizeShortId(prefix: string, rawId?: string): string {
  if (!rawId || typeof rawId !== 'string') return generateShortId(prefix);

  const cleanPrefix = (prefix || 'id').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'id';

  // Specifically detect and shorten 00000000-0000-4000-8000-xxxx legacy UUIDs
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

  // If already a short and clean compact ID between 4 and 18 chars without hyphens or UUID artifacts, keep it
  if (rawId.length >= 4 && rawId.length <= 18 && !rawId.includes('-') && !rawId.includes('00000000')) {
    return rawId;
  }

  // If already prefixed with standard format (e.g., usr_1001, prd_001)
  if (/^[a-z]{3,4}[_-][a-z0-9]{3,12}$/i.test(rawId)) {
    return rawId.replace('-', '_');
  }

  // Convert 36-char UUID or overly long string deterministically into an 8-char clean suffix
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash << 5) - hash + rawId.charCodeAt(i);
    hash |= 0;
  }
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let randomPart = '';
  let current = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    current = (current * 9301 + 49297) % 233280;
    randomPart += chars[current % chars.length];
  }
  return `${cleanPrefix}_${randomPart}`;
}

/**
 * Helper to display any entity ID cleanly and shortly in tables and cards
 */
export function shortenId(rawId?: string, prefix = 'id'): string {
  if (!rawId) return '';
  return normalizeShortId(prefix, rawId);
}

/**
 * Ensures any string identifier is formatted as a valid UUID for PostgreSQL UUID columns
 */
export function ensureUuid(id?: string): string {
  if (!id) {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch {}
    return '00000000-0000-4000-8000-' + Math.floor(Math.random() * 1e12).toString(16).padStart(12, '0');
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  // Convert custom short string IDs deterministically to a valid UUID format
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
}

// Global in-memory state listeners
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l());
}

// Persistent tombstone set for products explicitly deleted by admin
const deletedProductIds = new Set<string>(loadStorage<string[]>(STORAGE_KEYS.DELETED_PRODUCTS, []));

// Internal State
const rawStoredProducts = loadStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
const initialStoredProducts = Array.isArray(rawStoredProducts)
  ? rawStoredProducts.filter((p): p is Product => Boolean(p && typeof p === 'object' && (p.slug || p.id)))
  : [];
const storedProductSlugs = new Set(initialStoredProducts.map((p) => p.slug || p.id).filter(Boolean));

// Filter out any explicitly deleted products so they never resurrect
let products: Product[] = initialStoredProducts.length > 0
  ? [
      ...initialStoredProducts.filter((p) => p && !deletedProductIds.has(p.id) && !deletedProductIds.has(p.slug)),
      ...INITIAL_PRODUCTS.filter(
        (ip) =>
          ip &&
          !storedProductSlugs.has(ip.slug) &&
          !storedProductSlugs.has(ip.id) &&
          !deletedProductIds.has(ip.id) &&
          !deletedProductIds.has(ip.slug)
      ),
    ]
  : INITIAL_PRODUCTS.filter((ip) => ip && !deletedProductIds.has(ip.id) && !deletedProductIds.has(ip.slug));
let cart: CartItem[] = loadStorage(STORAGE_KEYS.CART, []);
let users: User[] = loadStorage(STORAGE_KEYS.USERS, SAMPLE_USERS);
let currentUser: User | null = loadStorage(STORAGE_KEYS.USER, null);
let addresses: Address[] = loadStorage(STORAGE_KEYS.ADDRESSES, [
  {
    id: 'addr-default-1',
    user_id: SAMPLE_USERS[0].id,
    full_name: 'Vikram Mehta',
    phone: '+91 98765 43210',
    address_line1: 'B-204, Artisan Enclave, MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560001',
    country: 'India',
    is_default: true,
    type: 'shipping',
  },
]);
let coupons: Coupon[] = loadStorage(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
let shippingRules: ShippingRule[] = loadStorage(STORAGE_KEYS.SHIPPING, INITIAL_SHIPPING_RULES);
let taxRules: TaxRule[] = loadStorage(STORAGE_KEYS.TAX, INITIAL_TAX_RULES);
let orders: Order[] = loadStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
let transactions: Transaction[] = loadStorage(STORAGE_KEYS.TRANSACTIONS, []);
let activeCoupon: Coupon | null = loadStorage(STORAGE_KEYS.ACTIVE_COUPON, null);
let customLogoUrl: string = loadStorage(
  STORAGE_KEYS.LOGO,
  '/WhatsApp_Image_2026-04-29_at_9.51.49_PM-removebg-preview.png'
);

// One-time automatic normalization of all stored entities to clean, compact 15-18 char IDs and authentic pouch images
try {
  products = (products || []).filter((p): p is Product => Boolean(p && typeof p === 'object' && p.id)).map((p) => {
    const authenticImg = getProductImage(p, 0);
    const rawImages = Array.isArray(p.images) ? p.images : [];
    const hasCustomUpload = rawImages.some((img: string) => typeof img === 'string' && img.startsWith('data:image/'));
    const cleanImages = hasCustomUpload
      ? rawImages
      : [authenticImg, POUCH_IMAGES.heroBanner];

    return {
      ...p,
      id: normalizeShortId('prd', p.id),
      images: cleanImages,
    };
  });
  users = (users || []).filter((u): u is User => Boolean(u && typeof u === 'object' && u.id)).map((u) => ({ ...u, id: normalizeShortId('usr', u.id) }));
  orders = (orders || []).filter((o): o is Order => Boolean(o && typeof o === 'object' && o.id)).map((o) => ({ ...o, id: normalizeShortId('ord', o.id), user_id: normalizeShortId('usr', o.user_id) }));
  transactions = (transactions || []).filter((t): t is Transaction => Boolean(t && typeof t === 'object' && t.id)).map((t) => ({ ...t, id: normalizeShortId('txn', t.id), order_id: normalizeShortId('ord', t.order_id) }));
  coupons = (coupons || []).filter((c): c is Coupon => Boolean(c && typeof c === 'object' && c.id)).map((c) => ({ ...c, id: normalizeShortId('cpn', c.id) }));
  shippingRules = (shippingRules || []).filter((s): s is ShippingRule => Boolean(s && typeof s === 'object' && s.id)).map((s) => ({ ...s, id: normalizeShortId('shp', s.id) }));
  taxRules = (taxRules || []).filter((t): t is TaxRule => Boolean(t && typeof t === 'object' && t.id)).map((t) => ({ ...t, id: normalizeShortId('tax', t.id) }));
  addresses = (addresses || []).filter((a): a is Address => Boolean(a && typeof a === 'object' && a.id)).map((a) => ({ ...a, id: normalizeShortId('adr', a.id), user_id: normalizeShortId('usr', a.user_id) }));
  if (currentUser && currentUser.id) {
    currentUser = { ...currentUser, id: normalizeShortId('usr', currentUser.id) };
    saveStorage(STORAGE_KEYS.USER, currentUser);
  }
  saveStorage(STORAGE_KEYS.PRODUCTS, products);
  saveStorage(STORAGE_KEYS.USERS, users);
  saveStorage(STORAGE_KEYS.ORDERS, orders);
  saveStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  saveStorage(STORAGE_KEYS.COUPONS, coupons);
  saveStorage(STORAGE_KEYS.SHIPPING, shippingRules);
  saveStorage(STORAGE_KEYS.TAX, taxRules);
  saveStorage(STORAGE_KEYS.ADDRESSES, addresses);
} catch (normErr) {
  console.warn('Initial store normalization warning:', normErr);
}

let isSyncingWithSupabase = false;
let lastSupabaseSyncTime: string | null = null;

// Initialize Supabase Admin Service if configured
const adminService = supabase ? new SupabaseAdminService(supabase) : null;

/**
 * Directly synchronizes any user or admin profile with the Supabase public.profiles table
 */
export async function syncUserProfileToSupabase(user: User): Promise<boolean> {
  const usrUuid = ensureUuid(user.id);
  const email = user.email.trim().toLowerCase();
  const fullName = user.full_name || email.split('@')[0];
  const role = user.role || 'customer';
  const phone = user.phone || '';

  // 1. Concurrent server-side direct sync for production reliability
  try {
    fetch('/api/profiles/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: usrUuid,
        email,
        full_name: fullName,
        phone,
        role,
        avatar_url: user.avatar_url || null,
        created_at: user.created_at || new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {}

  // 2. Direct client-side Supabase upsert
  if (!isSupabaseConfigured || !supabase) return true;

  try {
    // 1. Direct upsert by ID
    const { error: idUpsertErr } = await supabase.from('profiles').upsert({
      id: usrUuid,
      email,
      full_name: fullName,
      phone: phone || null,
      role,
      avatar_url: user.avatar_url || null,
      updated_at: new Date().toISOString(),
      created_at: user.created_at || new Date().toISOString(),
    }, { onConflict: 'id' });

    if (!idUpsertErr) return true;

    // 2. Fallback check by email to update existing record
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProf) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          role,
          avatar_url: user.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProf.id);

      return !updateErr;
    }

    // 3. Fallback direct insert
    const { error: insertErr } = await supabase.from('profiles').insert({
      id: usrUuid,
      email,
      full_name: fullName,
      phone: phone || null,
      role,
      avatar_url: user.avatar_url || null,
      updated_at: new Date().toISOString(),
      created_at: user.created_at || new Date().toISOString(),
    });

    return !insertErr;
  } catch (err) {
    console.warn('Profile sync warning:', err);
    return false;
  }
}

/**
 * Push / Seed all current store details (Products, Coupons, Shipping, Tax, Orders, User Profiles) to Supabase tables
 */
export async function pushAllToSupabase(): Promise<{
  success: boolean;
  productsCount: number;
  couponsCount: number;
  shippingRulesCount: number;
  taxRulesCount: number;
  ordersCount: number;
  profilesCount: number;
  errors: string[];
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      productsCount: 0,
      couponsCount: 0,
      shippingRulesCount: 0,
      taxRulesCount: 0,
      ordersCount: 0,
      profilesCount: 0,
      errors: ['Supabase is not configured or missing credentials.'],
    };
  }

  const errors: string[] = [];
  let productsCount = 0;
  let couponsCount = 0;
  let shippingRulesCount = 0;
  let taxRulesCount = 0;
  let ordersCount = 0;
  let profilesCount = 0;

  isSyncingWithSupabase = true;
  notify();

  try {
    // 1. Push All Products
    for (const prod of products) {
      try {
        const prodUuid = ensureUuid(prod.id);
        const { error } = await supabase.from('products').upsert({
          id: prodUuid,
          title: prod.title,
          slug: prod.slug || prod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          sku: prod.sku || `HPZ-${Math.floor(1000 + Math.random() * 9000)}`,
          description: prod.description,
          short_description: prod.short_description || '',
          price: prod.price,
          regular_price: prod.regular_price || null,
          sale_price: prod.sale_price || null,
          size: prod.size || '100g',
          available_sizes: prod.available_sizes || ['100g', '250g', '500g'],
          size_pricing: prod.size_pricing || {
            '100g': { price: prod.price, regular_price: prod.regular_price || prod.price },
            '250g': { price: Math.round(prod.price * 2.25), regular_price: Math.round((prod.regular_price || prod.price) * 2.25) },
            '500g': { price: Math.round(prod.price * 4.2), regular_price: Math.round((prod.regular_price || prod.price) * 4.2) },
          },
          stock_quantity: prod.stock_quantity ?? 0,
          stock_status: prod.stock_status || (prod.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'),
          category: prod.category || 'Pure Spice Powders',
          tags: prod.tags || ['Pure Spices'],
          images:
            Array.isArray(prod.images) && prod.images.length > 0 && !prod.images[0].includes('unsplash.com')
              ? prod.images
              : [getProductImage(prod, 0), POUCH_IMAGES.heroBanner],
          rating: prod.rating || 5.0,
          reviews_count: prod.reviews_count || 0,
          is_featured: Boolean(prod.is_featured),
          is_active: prod.is_active !== undefined ? prod.is_active : true,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          errors.push(`Product "${prod.title}": ${error.message}`);
        } else {
          productsCount++;
        }
      } catch (err: any) {
        errors.push(`Product "${prod.title}": ${err?.message || err}`);
      }
    }

    // 2. Push All Coupons
    for (const coup of coupons) {
      try {
        const coupUuid = ensureUuid(coup.id);
        const { error } = await supabase.from('coupons').upsert({
          id: coupUuid,
          code: coup.code.trim().toUpperCase(),
          discount_type: coup.discount_type || 'percentage',
          amount: coup.amount,
          min_spend: coup.min_spend || 0,
          max_spend: coup.max_spend || null,
          expiry_date: coup.expiry_date || '2026-12-31',
          usage_limit: coup.usage_limit || 100,
          usage_count: coup.usage_count || 0,
          is_active: coup.is_active !== undefined ? coup.is_active : true,
          created_at: coup.created_at || new Date().toISOString(),
        });

        if (error) {
          errors.push(`Coupon "${coup.code}": ${error.message}`);
        } else {
          couponsCount++;
        }
      } catch (err: any) {
        errors.push(`Coupon "${coup.code}": ${err?.message || err}`);
      }
    }

    // 3. Push All Shipping Rules
    for (const rule of shippingRules) {
      try {
        const ruleUuid = ensureUuid(rule.id);
        const { error } = await supabase.from('shipping_rules').upsert({
          id: ruleUuid,
          title: rule.title,
          cost: rule.cost,
          free_threshold: rule.free_threshold,
          delivery_days: rule.delivery_days,
          is_active: rule.is_active !== undefined ? rule.is_active : true,
          created_at: (rule as any).created_at || new Date().toISOString(),
        });

        if (error) {
          errors.push(`Shipping rule "${rule.title}": ${error.message}`);
        } else {
          shippingRulesCount++;
        }
      } catch (err: any) {
        errors.push(`Shipping rule "${rule.title}": ${err?.message || err}`);
      }
    }

    // 4. Push All Tax Rules
    for (const tax of taxRules) {
      try {
        const taxUuid = ensureUuid(tax.id);
        const { error } = await supabase.from('tax_rules').upsert({
          id: taxUuid,
          name: tax.name,
          rate_percent: tax.rate_percent,
          is_compound: Boolean(tax.is_compound),
          is_active: tax.is_active !== undefined ? tax.is_active : true,
          created_at: (tax as any).created_at || new Date().toISOString(),
        });

        if (error) {
          errors.push(`Tax rule "${tax.name}": ${error.message}`);
        } else {
          taxRulesCount++;
        }
      } catch (err: any) {
        errors.push(`Tax rule "${tax.name}": ${err?.message || err}`);
      }
    }

    // 5. Push All Orders & Order Items
    for (const ord of orders) {
      try {
        const ordUuid = ensureUuid(ord.id);
        const { error: ordError } = await supabase.from('orders').upsert({
          id: ordUuid,
          order_number: ord.order_number,
          user_id: ord.user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ord.user_id) ? ord.user_id : null,
          customer_name: ord.customer_name,
          customer_email: ord.customer_email,
          customer_phone: ord.customer_phone,
          subtotal: ord.subtotal,
          discount: ord.discount || 0,
          shipping_fee: ord.shipping_fee || 0,
          tax_amount: ord.tax_amount || 0,
          total: ord.total,
          coupon_code: ord.coupon_code || null,
          status: ord.status || 'pending',
          payment_status: ord.payment_status || 'paid',
          payment_method: ord.payment_method || 'Online Payment',
          razorpay_order_id: ord.razorpay_order_id || null,
          razorpay_payment_id: ord.razorpay_payment_id || null,
          razorpay_signature: ord.razorpay_signature || null,
          shipping_address: ord.shipping_address,
          billing_address: ord.billing_address || ord.shipping_address,
          tracking_number: ord.tracking_number || null,
          notes: ord.notes || null,
          created_at: ord.created_at || new Date().toISOString(),
          updated_at: ord.updated_at || new Date().toISOString(),
        });

        if (ordError) {
          errors.push(`Order "${ord.order_number}": ${ordError.message}`);
        } else {
          ordersCount++;
          // Also upsert order items
          if (ord.items && ord.items.length > 0) {
            for (const it of ord.items) {
              const itUuid = ensureUuid(it.id || `${ord.id}-${it.product_id}`);
              await supabase.from('order_items').upsert({
                id: itUuid,
                order_id: ordUuid,
                product_id: it.product_id ? ensureUuid(it.product_id) : null,
                title: it.title,
                price: it.price,
                quantity: it.quantity,
                image: it.image || null,
                total: it.price * it.quantity,
              });
            }
          }
        }
      } catch (err: any) {
        errors.push(`Order "${ord.order_number}": ${err?.message || err}`);
      }
    }

    // 6. Push All User & Admin Profiles
    for (const usr of users) {
      try {
        const synced = await syncUserProfileToSupabase(usr);
        if (synced) {
          profilesCount++;
        } else {
          errors.push(`Profile "${usr.email}": could not sync to profiles table`);
        }
      } catch (err: any) {
        errors.push(`Profile "${usr.email}": ${err?.message || err}`);
      }
    }

    lastSupabaseSyncTime = new Date().toLocaleTimeString();
  } catch (globalErr: any) {
    errors.push(`Global push error: ${globalErr?.message || globalErr}`);
  } finally {
    isSyncingWithSupabase = false;
    notify();
  }

  return {
    success: errors.length === 0,
    productsCount,
    couponsCount,
    shippingRulesCount,
    taxRulesCount,
    ordersCount,
    profilesCount,
    errors,
  };
}

/**
 * Full Bidirectional Supabase Sync & Realtime Channel Subscription
 */
export async function syncFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  isSyncingWithSupabase = true;
  notify();

  try {
    // 1. Fetch Products
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!prodErr && dbProducts && dbProducts.length > 0) {
      // Filter out deleted products from DB response and normalize IDs & authentic pouch images
      const validDbProducts: Product[] = dbProducts
        .filter((p: any) => !deletedProductIds.has(p.id) && !deletedProductIds.has(p.slug))
        .map((p: any) => {
          const authenticImg = getProductImage(p, 0);
          const rawImages = Array.isArray(p.images) ? p.images : [];
          const hasCustomUpload = rawImages.some((img: string) => typeof img === 'string' && img.startsWith('data:image/'));
          const cleanImages = hasCustomUpload
            ? rawImages
            : [authenticImg, POUCH_IMAGES.heroBanner];

          return {
            ...p,
            id: normalizeShortId('prd', p.id),
            images: cleanImages,
          };
        });
      const dbIds = new Set(validDbProducts.map((p: any) => p.id));
      const dbSlugs = new Set(validDbProducts.map((p: any) => p.slug));
      const localOnly = products.filter(
        (p) => !dbIds.has(p.id) && !dbSlugs.has(p.slug) && !deletedProductIds.has(p.id) && !deletedProductIds.has(p.slug)
      );
      products = [...validDbProducts, ...localOnly];
      saveStorage(STORAGE_KEYS.PRODUCTS, products);
    } else if (!prodErr && (!dbProducts || dbProducts.length === 0)) {
      // Auto-populate empty Supabase database with all demo products & catalog
      console.log('Supabase tables are empty. Auto-seeding initial store details...');
      await pushAllToSupabase();
    }

    // 2. Fetch Coupons
    const { data: dbCoupons, error: coupErr } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (!coupErr && dbCoupons && dbCoupons.length > 0) {
      coupons = dbCoupons.map((c: any) => ({ ...c, id: normalizeShortId('cpn', c.id) }));
      saveStorage(STORAGE_KEYS.COUPONS, coupons);
    }

    // 3. Fetch Shipping Rules
    const { data: dbShipping, error: shipErr } = await supabase
      .from('shipping_rules')
      .select('*')
      .order('created_at', { ascending: true });

    if (!shipErr && dbShipping && dbShipping.length > 0) {
      shippingRules = dbShipping.map((s: any) => ({ ...s, id: normalizeShortId('shp', s.id) }));
      saveStorage(STORAGE_KEYS.SHIPPING, shippingRules);
    }

    // 4. Fetch Tax Rules
    const { data: dbTax, error: taxErr } = await supabase
      .from('tax_rules')
      .select('*')
      .order('created_at', { ascending: true });

    if (!taxErr && dbTax && dbTax.length > 0) {
      taxRules = dbTax.map((t: any) => ({ ...t, id: normalizeShortId('tax', t.id) }));
      saveStorage(STORAGE_KEYS.TAX, taxRules);
    }

    // 5. Fetch Orders
    try {
      const apiRes = await fetch('/api/orders').catch(() => null);
      if (apiRes && apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const apiOrders = json.data.map((o: any) => ({
            ...o,
            id: normalizeShortId('ord', o.id),
            user_id: normalizeShortId('usr', o.user_id),
            items: o.items || o.order_items || [],
          }));
          const existingIds = new Set(apiOrders.map((a: any) => a.order_number || a.id));
          const merged = [...apiOrders, ...orders.filter((loc) => !existingIds.has(loc.order_number || loc.id))];
          orders = merged;
          saveStorage(STORAGE_KEYS.ORDERS, orders);
        }
      } else {
        const { data: dbOrders, error: ordErr } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (!ordErr && dbOrders && dbOrders.length > 0) {
          orders = dbOrders.map((o: any) => ({
            ...o,
            id: normalizeShortId('ord', o.id),
            user_id: normalizeShortId('usr', o.user_id),
            items: o.order_items && o.order_items.length > 0 ? o.order_items : (o.items || []),
          }));
          saveStorage(STORAGE_KEYS.ORDERS, orders);
        }
      }
    } catch (ordFetchErr) {
      console.warn('Order sync warning:', ordFetchErr);
    }

    // 6. Fetch Transactions
    const { data: dbTransactions, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!txErr && dbTransactions && dbTransactions.length > 0) {
      transactions = dbTransactions.map((t: any) => ({
        ...t,
        id: normalizeShortId('txn', t.id),
        order_id: normalizeShortId('ord', t.order_id),
      }));
      saveStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
    }

    // 7. Fetch User Profiles
    const { data: dbProfiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!profErr && dbProfiles && dbProfiles.length > 0) {
      const mergedProfiles: User[] = dbProfiles.map((p: any) => ({
        id: normalizeShortId('usr', p.id),
        email: p.email,
        full_name: p.full_name || p.email?.split('@')[0] || 'User',
        role: (p.role === 'admin' ? 'admin' : 'customer') as 'admin' | 'customer',
        phone: p.phone || '',
        avatar_url: p.avatar_url || '',
        created_at: p.created_at || new Date().toISOString(),
      }));

      const dbEmails = new Set(mergedProfiles.map((u) => u.email.toLowerCase()));
      // Preserve local users that might not yet be in db
      const localOnly = users.filter((u) => !dbEmails.has(u.email.toLowerCase()));
      users = [...mergedProfiles, ...localOnly];
      saveStorage(STORAGE_KEYS.USERS, users);

      if (currentUser) {
        const refreshedCurrent = users.find((u) => u.email.toLowerCase() === currentUser?.email.toLowerCase());
        if (refreshedCurrent) {
          currentUser = refreshedCurrent;
          saveStorage(STORAGE_KEYS.USER, currentUser);
        }
      }
    } else if (!profErr && (!dbProfiles || dbProfiles.length === 0)) {
      // Auto-populate empty profiles table with default admin & demo users
      for (const su of SAMPLE_USERS) {
        await syncUserProfileToSupabase(su);
      }
    }

    // 8. Restore Auth Session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      const authUser = sessionData.session.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const role: 'admin' | 'customer' =
        profile?.role ||
        authUser.user_metadata?.role ||
        (authUser.email?.includes('admin') ? 'admin' : 'customer');

      currentUser = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Customer',
        phone: profile?.phone || authUser.user_metadata?.phone || '',
        role,
        created_at: profile?.created_at || authUser.created_at || new Date().toISOString(),
      };
      saveStorage(STORAGE_KEYS.USER, currentUser);

      // Fetch user addresses
      const { data: dbAddrs } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', authUser.id);

      if (dbAddrs && dbAddrs.length > 0) {
        addresses = dbAddrs;
        saveStorage(STORAGE_KEYS.ADDRESSES, addresses);
      }
    }

    lastSupabaseSyncTime = new Date().toLocaleTimeString();
  } catch (err) {
    console.warn('Supabase sync warning:', err);
  } finally {
    isSyncingWithSupabase = false;
    notify();
  }
}

// Initial sync execution & Auth listener
if (isSupabaseConfigured && supabase) {
  syncFromSupabase();

  // Auth State Listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      if (session?.user) {
        const authUser = session.user;
        const { data: profile } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        const role: 'admin' | 'customer' =
          profile?.role ||
          authUser.user_metadata?.role ||
          (authUser.email?.includes('admin') ? 'admin' : 'customer');

        currentUser = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Customer',
          phone: profile?.phone || authUser.user_metadata?.phone || '',
          role,
          created_at: profile?.created_at || authUser.created_at || new Date().toISOString(),
        };
        saveStorage(STORAGE_KEYS.USER, currentUser);
        notify();
      }
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      saveStorage(STORAGE_KEYS.USER, null);
      notify();
    }
  });

  // Realtime DB updates listener
  try {
    supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_rules' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tax_rules' }, () => syncFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => syncFromSupabase())
      .subscribe();
  } catch (channelErr) {
    console.warn('Realtime channel subscribe warning:', channelErr);
  }
}

export const store = {
  // Getters
  getProducts: () => products,
  getProductBySlug: (slug: string) => products.find((p) => p.slug === slug || p.id === slug),
  getCart: () => cart,
  getCurrentUser: () => currentUser,
  getUsers: () => users,
  getAddresses: () => addresses.filter((a) => !currentUser || a.user_id === currentUser.id || !a.user_id),
  getCoupons: () => coupons,
  getShippingRules: () => shippingRules,
  getTaxRules: () => taxRules,
  getOrders: () => orders,
  getOrdersForUser: (userId?: string, userEmail?: string) => {
    const uid = userId || currentUser?.id;
    const email = (userEmail || currentUser?.email || '').trim().toLowerCase();
    const phone = (currentUser?.phone || '').replace(/\D/g, '');

    return orders.filter((o) => {
      if (!o) return false;
      // 1. Direct user_id match
      if (uid && o.user_id) {
        if (o.user_id === uid || o.user_id === `usr-${uid}` || o.user_id === `usr_${uid}`) return true;
        const cleanUid = uid.replace(/^usr[-_]/, '');
        const cleanOUid = o.user_id.replace(/^usr[-_]/, '');
        if (cleanUid && cleanOUid && (cleanUid === cleanOUid || cleanOUid.includes(cleanUid) || cleanUid.includes(cleanOUid))) return true;
      }
      // 2. Email match (case-insensitive)
      if (email && o.customer_email && o.customer_email.trim().toLowerCase() === email) return true;
      // 3. Phone number match (last 10 digits)
      if (phone && phone.length >= 10 && o.customer_phone) {
        const cleanOPhone = o.customer_phone.replace(/\D/g, '');
        if (cleanOPhone.endsWith(phone.slice(-10))) return true;
      }
      return false;
    });
  },
  getActiveCoupon: () => activeCoupon,
  getTransactions: () => transactions,
  getCustomLogoUrl: () => customLogoUrl,
  getSyncStatus: () => ({
    isConfigured: isSupabaseConfigured,
    isSyncing: isSyncingWithSupabase,
    lastSyncTime: lastSupabaseSyncTime,
  }),
  refreshFromSupabase: () => syncFromSupabase(),

  setCustomLogoUrl: (url: string) => {
    customLogoUrl = url;
    saveStorage(STORAGE_KEYS.LOGO, url);
    notify();
  },

  // Auth Operations
  setCurrentUser: (user: User | null) => {
    currentUser = user;
    saveStorage(STORAGE_KEYS.USER, currentUser);
    notify();
  },

  login: (email: string, password?: string, role: 'admin' | 'customer' = 'customer'): User => {
    const cleanEmail = email.trim().toLowerCase();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      user = {
        id: generateShortId('usr'),
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0],
        role,
        created_at: new Date().toISOString(),
      };
      users = [user, ...users];
      saveStorage(STORAGE_KEYS.USERS, users);
    }
    currentUser = user;
    saveStorage(STORAGE_KEYS.USER, currentUser);
    notify();

    // Directly synchronize profile with backend
    if (isSupabaseConfigured && supabase) {
      syncUserProfileToSupabase(user);
      const pwd = password || 'HapinozUser#2026';
      supabase.auth.signInWithPassword({ email: cleanEmail, password: pwd }).then(async ({ data, error }) => {
        if (error) {
          const { data: signUpData } = await supabase.auth.signUp({
            email: cleanEmail,
            password: pwd,
            options: {
              data: { full_name: user?.full_name || cleanEmail.split('@')[0], role: user?.role || role },
            },
          });
          if (signUpData?.user && user) {
            user.id = normalizeShortId('usr', signUpData.user.id);
            currentUser = user;
            users = users.map((u) => (u.email.toLowerCase() === cleanEmail ? user! : u));
            saveStorage(STORAGE_KEYS.USERS, users);
            saveStorage(STORAGE_KEYS.USER, currentUser);
            notify();
            await syncUserProfileToSupabase(user);
          }
        } else if (data?.user && user) {
          user.id = normalizeShortId('usr', data.user.id);
          currentUser = user;
          users = users.map((u) => (u.email.toLowerCase() === cleanEmail ? user! : u));
          saveStorage(STORAGE_KEYS.USERS, users);
          saveStorage(STORAGE_KEYS.USER, currentUser);
          notify();
          await syncUserProfileToSupabase(user);
        }
      }).catch((e) => console.warn('Supabase login warning:', e));
    }

    return user;
  },

  signup: (full_name: string, email: string, phone: string, role: 'admin' | 'customer' = 'customer', password?: string): User => {
    const cleanEmail = email.trim().toLowerCase();
    const pwd = password || 'HapinozUser#2026';
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      currentUser = existing;
      saveStorage(STORAGE_KEYS.USER, currentUser);
      notify();
      syncUserProfileToSupabase(existing);
      return existing;
    }
    const newUser: User = {
      id: generateShortId('usr'),
      full_name: full_name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      role,
      created_at: new Date().toISOString(),
    };
    users = [newUser, ...users];
    currentUser = newUser;
    saveStorage(STORAGE_KEYS.USERS, users);
    saveStorage(STORAGE_KEYS.USER, currentUser);
    notify();

    if (isSupabaseConfigured && supabase) {
      // 1. Instantly and directly upsert profile to backend database table
      syncUserProfileToSupabase(newUser);

      // 2. Provision user credentials in Supabase Auth
      supabase.auth.signUp({
        email: cleanEmail,
        password: pwd,
        options: {
          data: { full_name: newUser.full_name, phone: newUser.phone, role },
        },
      }).then(async ({ data }) => {
        if (data?.user) {
          newUser.id = normalizeShortId('usr', data.user.id);
          currentUser = newUser;
          users = users.map((u) => (u.email.toLowerCase() === cleanEmail ? newUser : u));
          saveStorage(STORAGE_KEYS.USERS, users);
          saveStorage(STORAGE_KEYS.USER, currentUser);
          notify();
          await syncUserProfileToSupabase(newUser);
        }
      }).catch((e) => console.warn('Supabase signup warning:', e));
    }

    return newUser;
  },

  logout: () => {
    currentUser = null;
    saveStorage(STORAGE_KEYS.USER, null);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    notify();
  },

  updateProfile: async (data: Partial<User>) => {
    if (!currentUser) return;
    currentUser = { ...currentUser, ...data };
    users = users.map((u) => (u.id === currentUser?.id ? currentUser! : u));
    saveStorage(STORAGE_KEYS.USER, currentUser);
    saveStorage(STORAGE_KEYS.USERS, users);
    notify();

    if (isSupabaseConfigured && supabase && currentUser) {
      await syncUserProfileToSupabase(currentUser);
    }
  },

  saveUser: async (userData: Partial<User> & { email: string; password?: string }): Promise<User> => {
    const email = userData.email.trim().toLowerCase();
    const existingIndex = users.findIndex(
      (u) => (userData.id && u.id === userData.id) || u.email.toLowerCase() === email
    );
    const id = existingIndex >= 0 ? users[existingIndex].id : (userData.id ? normalizeShortId('usr', userData.id) : generateShortId('usr'));

    const fullUser: User = {
      id,
      email,
      full_name: userData.full_name?.trim() || email.split('@')[0],
      phone: userData.phone?.trim() || '',
      role: (userData.role === 'admin' ? 'admin' : 'customer') as 'admin' | 'customer',
      avatar_url: userData.avatar_url || '',
      created_at: userData.created_at || (existingIndex >= 0 ? users[existingIndex].created_at : new Date().toISOString()),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = fullUser;
    } else {
      users.unshift(fullUser);
    }

    if (currentUser?.email.toLowerCase() === email || currentUser?.id === id) {
      currentUser = fullUser;
      saveStorage(STORAGE_KEYS.USER, currentUser);
    }

    saveStorage(STORAGE_KEYS.USERS, users);
    notify();

    // Direct Supabase Profile Upsert
    if (isSupabaseConfigured && supabase) {
      await syncUserProfileToSupabase(fullUser);

      // Also create Supabase auth user in background if password provided
      const pwd = userData.password || 'HapinozUser#2026';
      supabase.auth.signUp({
        email,
        password: pwd,
        options: {
          data: { full_name: fullUser.full_name, phone: fullUser.phone, role: fullUser.role },
        },
      }).catch(() => {});
    }

    return fullUser;
  },

  deleteUser: async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    users = users.filter((u) => u.id !== userId);
    if (currentUser?.id === userId) {
      currentUser = null;
      saveStorage(STORAGE_KEYS.USER, null);
    }
    saveStorage(STORAGE_KEYS.USERS, users);
    notify();

    if (isSupabaseConfigured && supabase) {
      try {
        const usrUuid = ensureUuid(userId);
        if (target?.email) {
          await supabase.from('profiles').delete().or(`id.eq.${usrUuid},email.eq.${target.email}`);
        } else {
          await supabase.from('profiles').delete().eq('id', usrUuid);
        }
      } catch (err) {
        console.warn('Supabase profile delete error:', err);
      }
    }
  },

  // Address Operations
  saveAddress: (addressData: Omit<Address, 'id'> & { id?: string }): Address => {
    const id = addressData.id ? normalizeShortId('adr', addressData.id) : generateShortId('adr');
    const newAddress: Address = {
      ...addressData,
      id,
      user_id: currentUser?.id,
    };

    if (newAddress.is_default) {
      addresses = addresses.map((a) => (a.user_id === currentUser?.id ? { ...a, is_default: false } : a));
    }

    const index = addresses.findIndex((a) => a.id === id);
    if (index >= 0) {
      addresses[index] = newAddress;
    } else {
      addresses.push(newAddress);
    }

    saveStorage(STORAGE_KEYS.ADDRESSES, addresses);
    notify();

    if (isSupabaseConfigured && supabase && currentUser?.id) {
      supabase.from('addresses').upsert({
        id: newAddress.id,
        user_id: currentUser.id,
        full_name: newAddress.full_name,
        phone: newAddress.phone,
        address_line1: newAddress.address_line1,
        address_line2: newAddress.address_line2 || '',
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.postal_code,
        country: newAddress.country || 'India',
        is_default: Boolean(newAddress.is_default),
        type: newAddress.type || 'shipping',
      }).then();
    }

    return newAddress;
  },

  deleteAddress: (id: string) => {
    addresses = addresses.filter((a) => a.id !== id);
    saveStorage(STORAGE_KEYS.ADDRESSES, addresses);
    notify();

    if (isSupabaseConfigured && supabase) {
      supabase.from('addresses').delete().eq('id', id).then();
    }
  },

  setDefaultAddress: (id: string) => {
    addresses = addresses.map((a) => ({
      ...a,
      is_default: a.id === id,
    }));
    saveStorage(STORAGE_KEYS.ADDRESSES, addresses);
    notify();
  },

  // Cart Operations
  addToCart: (product: Product, quantity = 1, selectedVariant?: string) => {
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.selected_variant === selectedVariant
    );

    if (existingIndex >= 0) {
      const updatedQuantity = cart[existingIndex].quantity + quantity;
      if (updatedQuantity <= product.stock_quantity) {
        cart[existingIndex].quantity = updatedQuantity;
      }
    } else {
      cart.push({
        product,
        quantity: Math.min(quantity, Math.max(1, product.stock_quantity)),
        selected_variant: selectedVariant,
      });
    }

    saveStorage(STORAGE_KEYS.CART, cart);
    notify();
  },

  updateCartQuantity: (productId: string, quantity: number, selectedVariant?: string) => {
    if (quantity <= 0) {
      store.removeFromCart(productId, selectedVariant);
      return;
    }

    cart = cart.map((item) => {
      if (item.product.id === productId && item.selected_variant === selectedVariant) {
        const clampedQty = Math.min(quantity, item.product.stock_quantity);
        return { ...item, quantity: clampedQty };
      }
      return item;
    });

    saveStorage(STORAGE_KEYS.CART, cart);
    notify();
  },

  removeFromCart: (productId: string, selectedVariant?: string) => {
    cart = cart.filter(
      (item) => !(item.product.id === productId && item.selected_variant === selectedVariant)
    );
    saveStorage(STORAGE_KEYS.CART, cart);
    notify();
  },

  clearCart: () => {
    cart = [];
    activeCoupon = null;
    saveStorage(STORAGE_KEYS.CART, cart);
    saveStorage(STORAGE_KEYS.ACTIVE_COUPON, null);
    notify();
  },

  // Coupon Logic
  applyCoupon: (code: string): { success: boolean; message: string; discount: number } => {
    const formatted = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === formatted && c.is_active);

    if (!coupon) {
      return { success: false, message: 'Invalid or expired coupon code.', discount: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    if (coupon.expiry_date < today) {
      return { success: false, message: 'This coupon code has expired.', discount: 0 };
    }

    if (coupon.usage_count >= coupon.usage_limit) {
      return { success: false, message: 'Coupon usage limit has been reached.', discount: 0 };
    }

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    if (subtotal < coupon.min_spend) {
      return {
        success: false,
        message: `Minimum order value of ₹${coupon.min_spend} required for this coupon.`,
        discount: 0,
      };
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * coupon.amount) / 100;
      if (coupon.max_spend) {
        discount = Math.min(discount, coupon.max_spend);
      }
    } else {
      discount = Math.min(coupon.amount, subtotal);
    }

    activeCoupon = coupon;
    saveStorage(STORAGE_KEYS.ACTIVE_COUPON, activeCoupon);
    notify();

    return {
      success: true,
      message: `Coupon "${coupon.code}" applied! You saved ₹${discount.toFixed(2)}`,
      discount,
    };
  },

  removeCoupon: () => {
    activeCoupon = null;
    saveStorage(STORAGE_KEYS.ACTIVE_COUPON, null);
    notify();
  },

  // Dynamic Totals Calculation
  calculateTotals: (selectedShippingId?: string) => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    let discount = 0;
    if (activeCoupon) {
      if (activeCoupon.discount_type === 'percentage') {
        discount = (subtotal * activeCoupon.amount) / 100;
        if (activeCoupon.max_spend) {
          discount = Math.min(discount, activeCoupon.max_spend);
        }
      } else {
        discount = Math.min(activeCoupon.amount, subtotal);
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);

    const activeRules = shippingRules.filter((r) => r.is_active);
    const selectedRule: ShippingRule =
      activeRules.find((r) => r.id === selectedShippingId) ||
      activeRules[0] || {
        id: 'default-ship',
        title: 'Normal Delivery',
        cost: 49,
        free_threshold: 499,
        delivery_days: 'Up to 7 Days',
        is_active: true,
      };

    const shippingFee =
      discountedSubtotal >= selectedRule.free_threshold || discountedSubtotal === 0
        ? 0
        : selectedRule.cost;

    const activeTax = taxRules.find((t) => t.is_active);
    const taxRate = activeTax ? activeTax.rate_percent : 5;
    const taxAmount = (discountedSubtotal * taxRate) / 100;

    const total = discountedSubtotal + shippingFee + taxAmount;

    return {
      subtotal,
      discount,
      shippingFee,
      taxAmount,
      total,
      selectedRule,
      taxRate,
      freeShippingRemaining: Math.max(0, (selectedRule.free_threshold || 499) - discountedSubtotal),
    };
  },

  // Order Placement & Inventory Lifecycle
  createOrder: (orderPayload: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: Address;
    payment_method: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    selected_shipping_id?: string;
  }): Order => {
    const totals = store.calculateTotals(orderPayload.selected_shipping_id);

    const orderItems = cart.map((item) => ({
      id: generateShortId('itm'),
      product_id: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      image: getProductImage(item.product, 0),
      total: item.product.price * item.quantity,
    }));

    const newOrder: Order = {
      id: generateShortId('ord'),
      order_number: `HPZ-${Math.floor(100000 + Math.random() * 900000)}`,
      user_id: currentUser?.id || 'usr-guest',
      customer_name: orderPayload.customer_name,
      customer_email: orderPayload.customer_email,
      customer_phone: orderPayload.customer_phone,
      items: orderItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping_fee: totals.shippingFee,
      tax_amount: totals.taxAmount,
      total: totals.total,
      coupon_code: activeCoupon?.code,
      status: 'processing',
      payment_status: 'paid',
      payment_method: orderPayload.payment_method,
      razorpay_order_id: orderPayload.razorpay_order_id,
      razorpay_payment_id: orderPayload.razorpay_payment_id,
      razorpay_signature: orderPayload.razorpay_signature,
      shipping_address: orderPayload.shipping_address,
      tracking_number: `HPZTRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      created_at: new Date().toISOString(),
    };

    // Decrement stock for purchased items locally
    products = products.map((prod) => {
      const cartItem = cart.find((c) => c.product.id === prod.id);
      if (cartItem) {
        const remaining = Math.max(0, prod.stock_quantity - cartItem.quantity);
        return {
          ...prod,
          stock_quantity: remaining,
          stock_status: remaining === 0 ? 'out_of_stock' : remaining <= 5 ? 'low_stock' : 'in_stock',
        };
      }
      return prod;
    });

    if (activeCoupon) {
      coupons = coupons.map((c) =>
        c.id === activeCoupon?.id ? { ...c, usage_count: c.usage_count + 1 } : c
      );
      saveStorage(STORAGE_KEYS.COUPONS, coupons);
    }

    if (orderPayload.razorpay_payment_id) {
      const trans: Transaction = {
        id: generateShortId('txn'),
        order_id: newOrder.id,
        order_number: newOrder.order_number,
        razorpay_payment_id: orderPayload.razorpay_payment_id,
        razorpay_order_id: orderPayload.razorpay_order_id || 'manual',
        amount: totals.total,
        currency: 'INR',
        status: 'captured',
        created_at: new Date().toISOString(),
      };
      transactions.unshift(trans);
      saveStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

      // Parallel server-side endpoint proxy
      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trans),
      }).catch(() => {});

      if (isSupabaseConfigured && supabase) {
        supabase.from('transactions').insert([trans]).then();
      }
    }

    orders = [newOrder, ...orders];
    cart = [];
    activeCoupon = null;

    saveStorage(STORAGE_KEYS.ORDERS, orders);
    saveStorage(STORAGE_KEYS.PRODUCTS, products);
    saveStorage(STORAGE_KEYS.CART, cart);
    saveStorage(STORAGE_KEYS.ACTIVE_COUPON, null);

    // Automatically record and sync customer profile to backend public.profiles
    const existingUser = users.find((u) => u.email.toLowerCase() === newOrder.customer_email.toLowerCase());
    if (!existingUser) {
      const guestUser: User = {
        id: generateShortId('usr'),
        email: newOrder.customer_email.toLowerCase(),
        full_name: newOrder.customer_name,
        phone: newOrder.customer_phone,
        role: 'customer',
        created_at: new Date().toISOString(),
      };
      users = [guestUser, ...users];
      saveStorage(STORAGE_KEYS.USERS, users);
      syncUserProfileToSupabase(guestUser);
    } else if (!existingUser.phone && newOrder.customer_phone) {
      existingUser.phone = newOrder.customer_phone;
      saveStorage(STORAGE_KEYS.USERS, users);
      syncUserProfileToSupabase(existingUser);
    }

    // 1. Parallel server-side endpoint proxy (saves to durable local server storage & Supabase)
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch((err) => console.warn('Server orders API proxy warning:', err));

    // 2. Persist order directly to Supabase orders & order_items tables
    if (isSupabaseConfigured && supabase) {
      const isUuid = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

      const cleanUserId = currentUser?.id && isUuid(currentUser.id) ? currentUser.id : null;

      supabase
        .from('orders')
        .insert({
          order_number: newOrder.order_number,
          user_id: cleanUserId,
          customer_name: newOrder.customer_name,
          customer_email: newOrder.customer_email.trim().toLowerCase(),
          customer_phone: newOrder.customer_phone,
          subtotal: newOrder.subtotal,
          discount: newOrder.discount || 0,
          shipping_fee: newOrder.shipping_fee || 0,
          tax_amount: newOrder.tax_amount || 0,
          total: newOrder.total,
          coupon_code: newOrder.coupon_code || null,
          status: newOrder.status,
          payment_status: newOrder.payment_status,
          payment_method: newOrder.payment_method,
          razorpay_order_id: newOrder.razorpay_order_id || null,
          razorpay_payment_id: newOrder.razorpay_payment_id || null,
          razorpay_signature: newOrder.razorpay_signature || null,
          shipping_address: newOrder.shipping_address,
          tracking_number: newOrder.tracking_number || null,
        })
        .select()
        .maybeSingle()
        .then(async ({ data: dbOrder, error }) => {
          if (error) {
            console.warn('Supabase direct order insert error:', error);
          } else if (dbOrder?.id && newOrder.items && newOrder.items.length > 0) {
            const itemsPayload = newOrder.items.map((it) => ({
              order_id: dbOrder.id,
              title: it.title,
              price: it.price,
              quantity: it.quantity,
              image: it.image || null,
              total: it.total,
            }));
            await supabase.from('order_items').insert(itemsPayload);
          }
        });
    }

    notify();
    return newOrder;
  },

  // ==========================================
  // ADMIN OPERATIONS DIRECTLY SYNCED TO SUPABASE
  // ==========================================

  saveProduct: async (productData: Partial<Product> & { id?: string }): Promise<Product> => {
    const title = productData.title?.trim() || 'Untitled Spice Product';
    let slug = productData.slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) slug = `spice-${Date.now()}`;
    const sku = productData.sku?.trim() || `HPZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const stockQty = typeof productData.stock_quantity === 'number' ? productData.stock_quantity : Number(productData.stock_quantity) || 0;
    const price = typeof productData.price === 'number' ? productData.price : Number(productData.price) || 0;
    const regPrice = productData.regular_price !== undefined ? Number(productData.regular_price) : price;
    const salePrice = productData.sale_price !== undefined ? Number(productData.sale_price) : price;

    // Check if updating an existing product
    const existingIndex = products.findIndex(
      (p) => (productData.id && p.id === productData.id) || (p.slug === slug)
    );

    const id = existingIndex >= 0 ? products[existingIndex].id : (productData.id ? normalizeShortId('prd', productData.id) : generateShortId('prd'));

    // Clear from deleted tombstones if re-saved
    deletedProductIds.delete(id);
    deletedProductIds.delete(slug);
    saveStorage(STORAGE_KEYS.DELETED_PRODUCTS, Array.from(deletedProductIds));

    const fullProduct: Product = {
      id,
      title,
      slug,
      sku,
      description: productData.description || '',
      short_description: productData.short_description || '',
      price,
      regular_price: regPrice,
      sale_price: salePrice,
      size: productData.size || '100g',
      available_sizes: productData.available_sizes && productData.available_sizes.length > 0
        ? productData.available_sizes
        : ['100g', '250g', '500g'],
      size_pricing: productData.size_pricing || {
        '100g': { price, regular_price: regPrice },
        '250g': { price: Math.round(price * 2.25), regular_price: Math.round(regPrice * 2.25) },
        '500g': { price: Math.round(price * 4.2), regular_price: Math.round(regPrice * 4.2) },
      },
      stock_quantity: stockQty,
      stock_status: stockQty === 0 ? 'out_of_stock' : stockQty <= 5 ? 'low_stock' : 'in_stock',
      category: productData.category || 'Pure Spice Powders',
      tags: productData.tags && productData.tags.length > 0 ? productData.tags : ['Pure Spices', 'Aroma Locked'],
      images:
        productData.images && productData.images.length > 0 && !productData.images[0].includes('unsplash.com')
          ? productData.images
          : [getProductImage(productData, 0), POUCH_IMAGES.heroBanner],
      rating: productData.rating || 5.0,
      reviews_count: productData.reviews_count || 0,
      is_featured: Boolean(productData.is_featured),
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      created_at: productData.created_at || (existingIndex >= 0 ? products[existingIndex].created_at : new Date().toISOString()),
    };

    if (existingIndex >= 0) {
      products[existingIndex] = fullProduct;
    } else {
      products.unshift(fullProduct);
    }

    saveStorage(STORAGE_KEYS.PRODUCTS, products);
    notify();

    // Parallel server-side endpoint proxy
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullProduct),
    }).catch(() => {});

    // Direct Supabase Table Upsert / Sync
    if (isSupabaseConfigured && supabase) {
      try {
        const prodUuid = ensureUuid(fullProduct.id);

        // Ensure Category exists in backend
        if (fullProduct.category) {
          const catSlug = fullProduct.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          try {
            await supabase.from('categories').upsert({
              name: fullProduct.category,
              slug: catSlug,
              description: `${fullProduct.category} collection`,
            }, { onConflict: 'slug' });
          } catch {
            // non-fatal category upsert
          }
        }

        // Upsert product into Supabase table
        const { data: upsertData, error: upsertError } = await supabase
          .from('products')
          .upsert({
            id: prodUuid,
            title: fullProduct.title,
            slug: fullProduct.slug,
            sku: fullProduct.sku,
            description: fullProduct.description,
            short_description: fullProduct.short_description || '',
            price: fullProduct.price,
            regular_price: fullProduct.regular_price || null,
            sale_price: fullProduct.sale_price || null,
            size: fullProduct.size || '100g',
            available_sizes: fullProduct.available_sizes || ['100g', '250g', '500g'],
            size_pricing: fullProduct.size_pricing || {
              '100g': { price: fullProduct.price, regular_price: fullProduct.regular_price || fullProduct.price },
              '250g': { price: Math.round(fullProduct.price * 2.25), regular_price: Math.round((fullProduct.regular_price || fullProduct.price) * 2.25) },
              '500g': { price: Math.round(fullProduct.price * 4.2), regular_price: Math.round((fullProduct.regular_price || fullProduct.price) * 4.2) },
            },
            stock_quantity: fullProduct.stock_quantity,
            stock_status: fullProduct.stock_status,
            category: fullProduct.category,
            tags: fullProduct.tags,
            images: fullProduct.images,
            rating: fullProduct.rating,
            reviews_count: fullProduct.reviews_count,
            is_featured: fullProduct.is_featured,
            is_active: fullProduct.is_active,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (upsertError) {
          console.warn('Supabase product upsert warning, retrying with core columns:', upsertError);
          // Fallback for minimal column schemas
          const { data: fallbackData } = await supabase
            .from('products')
            .upsert({
              id: prodUuid,
              title: fullProduct.title,
              slug: fullProduct.slug,
              sku: fullProduct.sku,
              description: fullProduct.description,
              short_description: fullProduct.short_description || '',
              price: fullProduct.price,
              regular_price: fullProduct.regular_price || null,
              sale_price: fullProduct.sale_price || null,
              stock_quantity: fullProduct.stock_quantity,
              stock_status: fullProduct.stock_status,
              category: fullProduct.category,
              tags: fullProduct.tags,
              images: fullProduct.images,
              rating: fullProduct.rating,
              reviews_count: fullProduct.reviews_count,
              is_featured: fullProduct.is_featured,
              is_active: fullProduct.is_active,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (fallbackData?.id) {
            fullProduct.id = fallbackData.id;
          }
        } else if (upsertData?.id) {
          fullProduct.id = upsertData.id;
        }
      } catch (err) {
        console.warn('Supabase product save error:', err);
      }
    }

    return fullProduct;
  },

  deleteProduct: async (id: string) => {
    const targetProduct = products.find((p) => p.id === id || p.slug === id);
    const targetId = targetProduct?.id || id;
    const targetSlug = targetProduct?.slug;

    // Record tombstone so this item is never re-seeded
    deletedProductIds.add(targetId);
    if (targetSlug) deletedProductIds.add(targetSlug);
    saveStorage(STORAGE_KEYS.DELETED_PRODUCTS, Array.from(deletedProductIds));

    // Remove from in-memory products and active cart
    products = products.filter((p) => p.id !== targetId && p.id !== id && (targetSlug ? p.slug !== targetSlug : true));
    cart = cart.filter((item) => item.product.id !== targetId && item.product.id !== id && (targetSlug ? item.product.slug !== targetSlug : true));

    saveStorage(STORAGE_KEYS.PRODUCTS, products);
    saveStorage(STORAGE_KEYS.CART, cart);
    notify();

    // Parallel server-side endpoint proxy
    fetch(`/api/products/${targetId}`, {
      method: 'DELETE',
    }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const prodUuid = ensureUuid(targetId);
        // Remove dependent reviews to prevent foreign key errors
        try {
          await supabase.from('product_reviews').delete().eq('product_id', prodUuid);
        } catch {
          // non-fatal review deletion
        }
        
        if (targetSlug) {
          await supabase.from('products').delete().or(`id.eq.${prodUuid},slug.eq.${targetSlug}`);
        } else {
          await supabase.from('products').delete().eq('id', prodUuid);
        }
      } catch (err) {
        console.warn('Supabase product delete error:', err);
      }
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    let orderNumber: string | undefined;

    orders = orders.map((o) => {
      if (o.id === orderId || o.order_number === orderId) {
        orderNumber = o.order_number;
        return {
          ...o,
          status,
          tracking_number: trackingNumber !== undefined ? trackingNumber : o.tracking_number,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });

    saveStorage(STORAGE_KEYS.ORDERS, orders);
    notify();

    // Parallel server-side endpoint proxy
    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, tracking_number: trackingNumber }),
    }).catch(() => {});

    if (isSupabaseConfigured && supabase) {
      try {
        const orderUuid = ensureUuid(orderId);
        const updatePayload: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        };
        if (trackingNumber !== undefined) {
          updatePayload.tracking_number = trackingNumber;
        }

        if (orderNumber) {
          await supabase
            .from('orders')
            .update(updatePayload)
            .or(`id.eq.${orderUuid},order_number.eq.${orderNumber}`);
        } else {
          await supabase.from('orders').update(updatePayload).eq('id', orderUuid);
        }
      } catch (err) {
        console.warn('Supabase order status update error:', err);
      }
    }
  },

  saveCoupon: async (couponData: Partial<Coupon> & { id?: string }): Promise<Coupon> => {
    const code = (couponData.code || 'COUPON').trim().toUpperCase();
    const existingIndex = coupons.findIndex((c) => (couponData.id && c.id === couponData.id) || (c.code.toUpperCase() === code));
    const id = existingIndex >= 0 ? coupons[existingIndex].id : (couponData.id ? normalizeShortId('cpn', couponData.id) : generateShortId('cpn'));

    const fullCoupon: Coupon = {
      id,
      code,
      discount_type: couponData.discount_type || 'percentage',
      amount: Number(couponData.amount) || 10,
      min_spend: Number(couponData.min_spend) || 0,
      max_spend: couponData.max_spend ? Number(couponData.max_spend) : undefined,
      expiry_date: couponData.expiry_date || '2026-12-31',
      usage_limit: Number(couponData.usage_limit) || 100,
      usage_count: Number(couponData.usage_count) || 0,
      is_active: couponData.is_active !== undefined ? couponData.is_active : true,
      created_at: couponData.created_at || (existingIndex >= 0 ? coupons[existingIndex].created_at : new Date().toISOString()),
    };

    if (existingIndex >= 0) {
      coupons[existingIndex] = fullCoupon;
    } else {
      coupons.push(fullCoupon);
    }

    saveStorage(STORAGE_KEYS.COUPONS, coupons);
    notify();

    if (isSupabaseConfigured && supabase) {
      try {
        const coupUuid = ensureUuid(fullCoupon.id);
        const { data: existingCoup } = await supabase
          .from('coupons')
          .select('id')
          .or(`id.eq.${coupUuid},code.eq.${fullCoupon.code}`)
          .maybeSingle();

        if (existingCoup) {
          await supabase
            .from('coupons')
            .update({
              code: fullCoupon.code,
              discount_type: fullCoupon.discount_type,
              amount: fullCoupon.amount,
              min_spend: fullCoupon.min_spend,
              max_spend: fullCoupon.max_spend || null,
              expiry_date: fullCoupon.expiry_date,
              usage_limit: fullCoupon.usage_limit,
              usage_count: fullCoupon.usage_count,
              is_active: fullCoupon.is_active,
            })
            .eq('id', existingCoup.id);
        } else {
          await supabase.from('coupons').insert({
            id: coupUuid,
            code: fullCoupon.code,
            discount_type: fullCoupon.discount_type,
            amount: fullCoupon.amount,
            min_spend: fullCoupon.min_spend,
            max_spend: fullCoupon.max_spend || null,
            expiry_date: fullCoupon.expiry_date,
            usage_limit: fullCoupon.usage_limit,
            usage_count: fullCoupon.usage_count,
            is_active: fullCoupon.is_active,
            created_at: fullCoupon.created_at,
          });
        }
      } catch (err) {
        console.warn('Supabase coupon save error:', err);
      }
    }

    return fullCoupon;
  },

  deleteCoupon: async (id: string) => {
    const targetCoupon = coupons.find((c) => c.id === id);
    const targetCode = targetCoupon?.code;

    coupons = coupons.filter((c) => c.id !== id);
    saveStorage(STORAGE_KEYS.COUPONS, coupons);
    notify();

    if (isSupabaseConfigured && supabase) {
      try {
        const coupUuid = ensureUuid(id);
        if (targetCode) {
          await supabase.from('coupons').delete().or(`id.eq.${coupUuid},code.eq.${targetCode}`);
        } else {
          await supabase.from('coupons').delete().eq('id', coupUuid);
        }
      } catch (err) {
        console.warn('Supabase coupon delete error:', err);
      }
    }
  },

  saveShippingRule: async (ruleData: ShippingRule) => {
    const cleanId = normalizeShortId('shp', ruleData.id);
    const updatedRule = { ...ruleData, id: cleanId };
    const index = shippingRules.findIndex((r) => r.id === updatedRule.id || r.id === ruleData.id);
    if (index >= 0) {
      shippingRules[index] = updatedRule;
    } else {
      shippingRules.push(updatedRule);
    }
    saveStorage(STORAGE_KEYS.SHIPPING, shippingRules);
    notify();

    if (isSupabaseConfigured && supabase) {
      try {
        const ruleUuid = ensureUuid(updatedRule.id);
        const { data: existingRule } = await supabase
          .from('shipping_rules')
          .select('id')
          .or(`id.eq.${ruleUuid},title.eq.${updatedRule.title}`)
          .maybeSingle();

        if (existingRule) {
          await supabase
            .from('shipping_rules')
            .update({
              title: updatedRule.title,
              cost: updatedRule.cost,
              free_threshold: updatedRule.free_threshold,
              delivery_days: updatedRule.delivery_days,
              is_active: updatedRule.is_active,
            })
            .eq('id', existingRule.id);
        } else {
          await supabase.from('shipping_rules').insert({
            id: ruleUuid,
            title: updatedRule.title,
            cost: updatedRule.cost,
            free_threshold: updatedRule.free_threshold,
            delivery_days: updatedRule.delivery_days,
            is_active: updatedRule.is_active,
          });
        }
      } catch (err) {
        console.warn('Supabase shipping rule save error:', err);
      }
    }
  },

  deleteShippingRule: async (id: string) => {
    shippingRules = shippingRules.filter((r) => r.id !== id);
    saveStorage(STORAGE_KEYS.SHIPPING, shippingRules);
    notify();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('shipping_rules').delete().eq('id', ensureUuid(id));
      } catch (err) {
        console.warn('Supabase shipping rule delete error:', err);
      }
    }
  },

  saveTaxRule: async (ruleData: TaxRule) => {
    const cleanId = normalizeShortId('tax', ruleData.id);
    const updatedRule = { ...ruleData, id: cleanId };
    const index = taxRules.findIndex((t) => t.id === updatedRule.id || t.id === ruleData.id);
    if (index >= 0) {
      taxRules[index] = updatedRule;
    } else {
      taxRules.push(updatedRule);
    }
    saveStorage(STORAGE_KEYS.TAX, taxRules);
    notify();

    if (isSupabaseConfigured && supabase) {
      try {
        const taxUuid = ensureUuid(ruleData.id);
        const { data: existingTax } = await supabase
          .from('tax_rules')
          .select('id')
          .or(`id.eq.${taxUuid},name.eq.${ruleData.name}`)
          .maybeSingle();

        if (existingTax) {
          await supabase
            .from('tax_rules')
            .update({
              name: ruleData.name,
              rate_percent: ruleData.rate_percent,
              is_compound: ruleData.is_compound,
              is_active: ruleData.is_active,
            })
            .eq('id', existingTax.id);
        } else {
          await supabase.from('tax_rules').insert({
            id: taxUuid,
            name: ruleData.name,
            rate_percent: ruleData.rate_percent,
            is_compound: ruleData.is_compound,
            is_active: ruleData.is_active,
          });
        }
      } catch (err) {
        console.warn('Supabase tax rule save error:', err);
      }
    }
  },

  deleteTaxRule: async (id: string) => {
    taxRules = taxRules.filter((t) => t.id !== id);
    saveStorage(STORAGE_KEYS.TAX, taxRules);
    notify();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('tax_rules').delete().eq('id', ensureUuid(id));
      } catch (err) {
        console.warn('Supabase tax rule delete error:', err);
      }
    }
  },

  updateUserRole: async (userId: string, role: 'admin' | 'customer') => {
    const targetUser = users.find((u) => u.id === userId);
    users = users.map((u) => (u.id === userId ? { ...u, role } : u));
    if (currentUser?.id === userId) {
      currentUser = { ...currentUser, role };
      saveStorage(STORAGE_KEYS.USER, currentUser);
    }
    saveStorage(STORAGE_KEYS.USERS, users);
    notify();

    if (isSupabaseConfigured && supabase && targetUser) {
      await syncUserProfileToSupabase({ ...targetUser, role });
    }
  },

  uploadImageToStorage: async (file: File | Blob, prefix = 'spice') => {
    if (adminService) {
      const res = await adminService.uploadProductImage(file, prefix);
      if (res.publicUrl) return res;
    }
    const dataUrl = await fileToDataUrl(file, 1200, 1200, 0.85);
    return {
      path: 'inline-compressed',
      publicUrl: dataUrl,
    };
  },

  pushAllToSupabase: () => pushAllToSupabase(),
};

// React Hook for Reactive Store Subscriptions
export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    products: store.getProducts(),
    cart: store.getCart(),
    currentUser: store.getCurrentUser(),
    users: store.getUsers(),
    addresses: store.getAddresses(),
    coupons: store.getCoupons(),
    shippingRules: store.getShippingRules(),
    taxRules: store.getTaxRules(),
    orders: store.getOrders(),
    userOrders: store.getOrdersForUser(),
    activeCoupon: store.getActiveCoupon(),
    transactions: store.getTransactions(),
    customLogoUrl: store.getCustomLogoUrl(),
    syncStatus: store.getSyncStatus(),
    ...store,
  };
}
