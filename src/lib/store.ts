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

const STORAGE_KEYS = {
  PRODUCTS: 'hapinoz_spices_products_v3',
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

// Safe LocalStorage helpers
function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Storage save failed', err);
  }
}

// Global in-memory state listeners
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l());
}

// Internal State
let products: Product[] = loadStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
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

// Sync with Supabase on initial load if configured
if (isSupabaseConfigured && supabase) {
  (async () => {
    try {
      const { data: dbProducts } = await supabase.from('products').select('*');
      if (dbProducts && dbProducts.length > 0) {
        products = dbProducts;
        saveStorage(STORAGE_KEYS.PRODUCTS, products);
        notify();
      }

      const { data: dbCoupons } = await supabase.from('coupons').select('*');
      if (dbCoupons && dbCoupons.length > 0) {
        coupons = dbCoupons;
        saveStorage(STORAGE_KEYS.COUPONS, coupons);
        notify();
      }
    } catch (e) {
      console.warn('Supabase initial fetch notice:', e);
    }
  })();
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
  getOrdersForUser: (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return [];
    return orders.filter((o) => o.user_id === uid || o.customer_email === currentUser?.email);
  },
  getActiveCoupon: () => activeCoupon,
  getTransactions: () => transactions,
  getCustomLogoUrl: () => customLogoUrl,
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

  login: (email: string, _password?: string, role: 'admin' | 'customer' = 'customer'): User => {
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        role,
        created_at: new Date().toISOString(),
      };
      users = [...users, user];
      saveStorage(STORAGE_KEYS.USERS, users);
    }
    currentUser = user;
    saveStorage(STORAGE_KEYS.USER, currentUser);
    notify();
    return user;
  },

  signup: (full_name: string, email: string, phone: string, role: 'admin' | 'customer' = 'customer'): User => {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      currentUser = existing;
      saveStorage(STORAGE_KEYS.USER, currentUser);
      notify();
      return existing;
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      full_name,
      email,
      phone,
      role,
      created_at: new Date().toISOString(),
    };
    users = [...users, newUser];
    currentUser = newUser;
    saveStorage(STORAGE_KEYS.USERS, users);
    saveStorage(STORAGE_KEYS.USER, currentUser);
    notify();
    return newUser;
  },

  logout: () => {
    currentUser = null;
    saveStorage(STORAGE_KEYS.USER, null);
    notify();
  },

  updateProfile: (data: Partial<User>) => {
    if (!currentUser) return;
    currentUser = { ...currentUser, ...data };
    users = users.map((u) => (u.id === currentUser?.id ? currentUser : u));
    saveStorage(STORAGE_KEYS.USER, currentUser);
    saveStorage(STORAGE_KEYS.USERS, users);
    notify();
  },

  // Address Operations
  saveAddress: (addressData: Omit<Address, 'id'> & { id?: string }): Address => {
    const id = addressData.id || `addr-${Date.now()}`;
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
    return newAddress;
  },

  deleteAddress: (id: string) => {
    addresses = addresses.filter((a) => a.id !== id);
    saveStorage(STORAGE_KEYS.ADDRESSES, addresses);
    notify();
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

    // Coupon discount
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

    // Shipping rule
    const activeRules = shippingRules.filter((r) => r.is_active);
    const selectedRule: ShippingRule =
      activeRules.find((r) => r.id === selectedShippingId) ||
      activeRules[0] || {
        id: 'default-ship',
        title: 'Standard Delivery',
        cost: 99,
        free_threshold: 999,
        delivery_days: '3-5 Business Days',
        is_active: true,
      };

    const shippingFee =
      discountedSubtotal >= selectedRule.free_threshold || discountedSubtotal === 0
        ? 0
        : selectedRule.cost;

    // Tax calculation (e.g. GST 18% standard)
    const activeTax = taxRules.find((t) => t.is_active);
    const taxRate = activeTax ? activeTax.rate_percent : 18;
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
      freeShippingRemaining: Math.max(0, (selectedRule.free_threshold || 999) - discountedSubtotal),
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
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product_id: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] || '',
      total: item.product.price * item.quantity,
    }));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
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

    // Decrement stock for purchased items
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

    // Increment coupon usage count if used
    if (activeCoupon) {
      coupons = coupons.map((c) =>
        c.id === activeCoupon?.id ? { ...c, usage_count: c.usage_count + 1 } : c
      );
      saveStorage(STORAGE_KEYS.COUPONS, coupons);
    }

    // Save transaction
    if (orderPayload.razorpay_payment_id) {
      const trans: Transaction = {
        id: `tx-${Date.now()}`,
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
    }

    orders = [newOrder, ...orders];
    cart = [];
    activeCoupon = null;

    saveStorage(STORAGE_KEYS.ORDERS, orders);
    saveStorage(STORAGE_KEYS.PRODUCTS, products);
    saveStorage(STORAGE_KEYS.CART, cart);
    saveStorage(STORAGE_KEYS.ACTIVE_COUPON, null);

    // Asynchronously push to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase.from('orders').insert([newOrder]).then(({ error }) => {
        if (error) console.warn('Supabase order insert error:', error);
      });
    }

    notify();
    return newOrder;
  },

  // Admin Management Operations
  saveProduct: (productData: Partial<Product> & { id?: string }): Product => {
    const isNew = !productData.id;
    const id = productData.id || `prod-${Date.now()}`;
    const stockQty = Number(productData.stock_quantity) || 0;
    const price = Number(productData.price) || 0;

    const fullProduct: Product = {
      id,
      title: productData.title || 'Untitled Product',
      slug: productData.slug || (productData.title || 'product').toLowerCase().replace(/\s+/g, '-'),
      sku: productData.sku || `HPZ-${Math.floor(1000 + Math.random() * 9000)}`,
      description: productData.description || '',
      short_description: productData.short_description || '',
      price,
      regular_price: productData.regular_price ? Number(productData.regular_price) : price,
      sale_price: productData.sale_price ? Number(productData.sale_price) : price,
      stock_quantity: stockQty,
      stock_status: stockQty === 0 ? 'out_of_stock' : stockQty <= 5 ? 'low_stock' : 'in_stock',
      category: productData.category || 'Handcrafted',
      tags: productData.tags || ['Artisan'],
      images: productData.images && productData.images.length > 0 ? productData.images : [
        'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80',
      ],
      rating: productData.rating || 5.0,
      reviews_count: productData.reviews_count || 0,
      is_featured: Boolean(productData.is_featured),
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      created_at: productData.created_at || new Date().toISOString(),
    };

    if (isNew) {
      products.unshift(fullProduct);
    } else {
      products = products.map((p) => (p.id === id ? fullProduct : p));
    }

    saveStorage(STORAGE_KEYS.PRODUCTS, products);
    notify();
    return fullProduct;
  },

  deleteProduct: (id: string) => {
    products = products.filter((p) => p.id !== id);
    saveStorage(STORAGE_KEYS.PRODUCTS, products);
    notify();
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    orders = orders.map((o) => {
      if (o.id === orderId) {
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
  },

  saveCoupon: (couponData: Partial<Coupon> & { id?: string }): Coupon => {
    const isNew = !couponData.id;
    const id = couponData.id || `coup-${Date.now()}`;
    const fullCoupon: Coupon = {
      id,
      code: (couponData.code || 'COUPON').trim().toUpperCase(),
      discount_type: couponData.discount_type || 'percentage',
      amount: Number(couponData.amount) || 10,
      min_spend: Number(couponData.min_spend) || 0,
      max_spend: couponData.max_spend ? Number(couponData.max_spend) : undefined,
      expiry_date: couponData.expiry_date || '2026-12-31',
      usage_limit: Number(couponData.usage_limit) || 100,
      usage_count: Number(couponData.usage_count) || 0,
      is_active: couponData.is_active !== undefined ? couponData.is_active : true,
      created_at: couponData.created_at || new Date().toISOString(),
    };

    if (isNew) {
      coupons.push(fullCoupon);
    } else {
      coupons = coupons.map((c) => (c.id === id ? fullCoupon : c));
    }

    saveStorage(STORAGE_KEYS.COUPONS, coupons);
    notify();
    return fullCoupon;
  },

  deleteCoupon: (id: string) => {
    coupons = coupons.filter((c) => c.id !== id);
    saveStorage(STORAGE_KEYS.COUPONS, coupons);
    notify();
  },

  saveShippingRule: (ruleData: ShippingRule) => {
    const index = shippingRules.findIndex((r) => r.id === ruleData.id);
    if (index >= 0) {
      shippingRules[index] = ruleData;
    } else {
      shippingRules.push(ruleData);
    }
    saveStorage(STORAGE_KEYS.SHIPPING, shippingRules);
    notify();
  },

  saveTaxRule: (ruleData: TaxRule) => {
    const index = taxRules.findIndex((t) => t.id === ruleData.id);
    if (index >= 0) {
      taxRules[index] = ruleData;
    } else {
      taxRules.push(ruleData);
    }
    saveStorage(STORAGE_KEYS.TAX, taxRules);
    notify();
  },

  updateUserRole: (userId: string, role: 'admin' | 'customer') => {
    users = users.map((u) => (u.id === userId ? { ...u, role } : u));
    if (currentUser?.id === userId) {
      currentUser = { ...currentUser, role };
      saveStorage(STORAGE_KEYS.USER, currentUser);
    }
    saveStorage(STORAGE_KEYS.USERS, users);
    notify();
  },
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
    ...store,
  };
}
