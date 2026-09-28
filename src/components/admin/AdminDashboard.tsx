import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Truck,
  Percent,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  UploadCloud,
  ImageIcon,
  Sparkles,
  X,
  UserPlus,
  RefreshCw,
  Lock,
  Mail,
  Phone,
  Shield,
  Copy,
  Check,
  Terminal,
  Database,
} from 'lucide-react';
import { useStore, shortenId } from '../../lib/store';
import { Product, Order, Coupon, ShippingRule, TaxRule, OrderStatus, User } from '../../types';
import {
  getProductImage,
  DEFAULT_PRODUCT_IMAGE,
  CURATED_SPICE_PRESETS,
  SpicePreset,
  fileToDataUrl,
} from '../../lib/imageHelper';

interface AdminDashboardProps {
  onViewInvoice: (order: Order) => void;
  onExitAdmin: () => void;
  onViewProductOnLiveStore?: (product: Product) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onViewInvoice,
  onExitAdmin,
  onViewProductOnLiveStore,
}) => {
  const {
    products,
    orders,
    coupons,
    shippingRules,
    taxRules,
    users,
    saveProduct,
    deleteProduct,
    updateOrderStatus,
    saveCoupon,
    deleteCoupon,
    saveShippingRule,
    saveTaxRule,
    updateUserRole,
    saveUser,
    deleteUser,
    pushAllToSupabase,
    transactions,
    uploadImageToStorage,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'coupons' | 'shipping' | 'tax' | 'users'
  >('overview');

  // Product Filter & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [savedSuccessProduct, setSavedSuccessProduct] = useState<Product | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [showSpicePresets, setShowSpicePresets] = useState(false);

  // Delete Product Confirmation State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  // Coupon Edit Modal State
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // User Profile Modal & Management State
  const [editingUser, setEditingUser] = useState<(Partial<User> & { password?: string }) | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);

  // Order Filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  // Computed KPIs
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrdersCount = orders.length;
  const lowStockItems = products.filter((p) => p.stock_quantity <= 5);
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory =
      productCategoryFilter === 'all' || p.category.toLowerCase() === productCategoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title || !editingProduct.title.trim()) {
      showToast('error', 'Please enter a product title before saving.');
      return;
    }

    const effectivePrice = Number(editingProduct.price) ||
      Number(editingProduct.size_pricing?.['100g']?.price) ||
      Number(editingProduct.size_pricing?.['250g']?.price) ||
      Number(editingProduct.size_pricing?.['500g']?.price) ||
      149;

    const effectiveRegPrice = Number(editingProduct.regular_price) ||
      Number(editingProduct.size_pricing?.['100g']?.regular_price) ||
      Math.round(effectivePrice * 1.33);

    // Ensure valid non-empty images array with fallback
    const currentImg = editingProduct.images?.[0]?.trim();
    const resolvedImages = currentImg && currentImg.length > 0
      ? editingProduct.images
      : [getProductImage(editingProduct, 0)];

    const fullPayload: Partial<Product> = {
      ...editingProduct,
      title: editingProduct.title.trim(),
      images: resolvedImages,
      price: effectivePrice,
      regular_price: effectiveRegPrice,
      sale_price: effectivePrice,
      size: editingProduct.size || '100g',
      available_sizes: editingProduct.available_sizes && editingProduct.available_sizes.length > 0
        ? editingProduct.available_sizes
        : ['100g', '250g', '500g'],
      size_pricing: editingProduct.size_pricing || {
        '100g': { price: effectivePrice, regular_price: effectiveRegPrice },
        '250g': { price: Math.round(effectivePrice * 2.25), regular_price: Math.round(effectiveRegPrice * 2.25) },
        '500g': { price: Math.round(effectivePrice * 4.2), regular_price: Math.round(effectiveRegPrice * 4.2) },
      },
    };

    setIsSavingProduct(true);
    try {
      const savedProd = await saveProduct(fullPayload);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setSavedSuccessProduct(savedProd);
      showToast('success', `✓ Product "${savedProd.title}" saved and synced with database!`);
    } catch (err: any) {
      console.error('Failed to save product:', err);
      showToast('error', `Error saving product: ${err?.message || err}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const deletedTitle = productToDelete.title;
    setIsDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      showToast('success', `✓ Product "${deletedTitle}" was deleted from catalog and database.`);
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast('error', `Failed to delete product: ${err?.message || err}`);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadMessage(`Processing & attaching ${file.name}...`);
    try {
      // 1. Generate optimized base64 data URL directly from user's selected file
      const dataUrl = await fileToDataUrl(file, 1200, 1200, 0.9);
      
      // 2. Directly set as the primary image of this product
      setEditingProduct((prev) => ({
        ...prev,
        images: [dataUrl],
      }));
      setUploadMessage(`✓ "${file.name}" attached successfully!`);
    } catch (err: any) {
      console.error('Image upload fallback error:', err);
      // Fallback to raw FileReader
      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawData = evt.target?.result as string;
        if (rawData) {
          setEditingProduct((prev) => ({
            ...prev,
            images: [rawData],
          }));
          setUploadMessage(`✓ "${file.name}" attached!`);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
      // Clear file input value so user can re-upload or choose another file anytime
      e.target.value = '';
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  const handleSaveCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code || !editingCoupon?.amount) return;
    await saveCoupon(editingCoupon);
    const code = editingCoupon.code;
    setIsCouponModalOpen(false);
    setEditingCoupon(null);
    showToast('success', `✓ Coupon "${code}" saved successfully!`);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.email) return;
    setIsSavingUser(true);
    try {
      const saved = await saveUser({
        id: editingUser.id,
        email: editingUser.email.trim(),
        full_name: editingUser.full_name?.trim() || editingUser.email.split('@')[0],
        phone: editingUser.phone?.trim() || '',
        role: editingUser.role || 'customer',
        password: editingUser.password || 'HapinozUser#2026',
      });
      setIsUserModalOpen(false);
      setEditingUser(null);
      showToast('success', `✓ Profile for ${saved.full_name} (${saved.role}) saved & synced with backend database!`);
    } catch (err: any) {
      showToast('error', `Failed to save user: ${err?.message || err}`);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSavingUser(true);
    try {
      await deleteUser(userToDelete.id);
      showToast('info', `Removed profile "${userToDelete.email}" from database`);
      setUserToDelete(null);
    } catch (err: any) {
      showToast('error', `Failed to delete profile: ${err?.message || err}`);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleSyncAllProfiles = async () => {
    setIsSyncingUsers(true);
    try {
      const res = await pushAllToSupabase();
      if (res.success) {
        showToast('success', `✓ All ${users.length} profiles synced with Supabase public.profiles!`);
      } else {
        showToast('info', `Sync completed: ${res.profilesCount || 0} profiles synchronized.`);
      }
    } catch (err: any) {
      showToast('error', `Could not sync profiles: ${err?.message || err}`);
    } finally {
      setIsSyncingUsers(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased font-admin text-slate-800">
      {/* Top Admin Nav Header */}
      <header className="bg-[#161B26] text-white px-4 sm:px-8 py-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6A00] text-white flex items-center justify-center font-bold shadow-inner">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm sm:text-base tracking-wide text-white uppercase">
              Store Management Console
            </div>
            <div className="text-[11px] text-slate-400 font-mono-admin tracking-tight">
              HAPINOZ Pure Spices Operations & Fulfillment
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onExitAdmin}
            className="px-4 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#e05d00] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Back to Storefront
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-[#1E2433] text-slate-300 p-4 border-r border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider">
              Management
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Products Catalog</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono-admin font-bold text-slate-300">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders Lifecycle</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono-admin font-bold text-orange-400">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'coupons'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4" />
                <span>Coupons & Promos</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono-admin font-bold text-slate-300">
                {coupons.length}
              </span>
            </button>

            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-2 mt-4 tracking-wider">
              Store Configuration
            </div>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'shipping'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Shipping Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('tax')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'tax'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Tax & GST Rates</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User & Role Management</span>
            </button>
          </div>
        </aside>

        {/* Right Content View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-[calc(100vh-60px)]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Dashboard Overview
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Live analytics, store revenue metrics, inventory status, and order tracking.
                  </p>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div className="text-2xl font-mono-admin font-black text-slate-900 tracking-tight">
                    ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-[#22C55E] font-semibold flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> Real Razorpay Settlement
                  </span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-[#FF6A00]" />
                  </div>
                  <div className="text-2xl font-mono-admin font-black text-slate-900 tracking-tight">
                    {totalOrdersCount}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                    {orders.filter((o) => o.status === 'processing').length} Processing
                  </span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Average Order Value</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-mono-admin font-black text-slate-900 tracking-tight">
                    ₹{avgOrderValue.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">Across all paid baskets</span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Low-Stock Alerts</span>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-mono-admin font-black text-rose-700 tracking-tight">
                    {lowStockItems.length}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                    Needs warehouse reorder
                  </span>
                </div>
              </div>

              {/* Low Stock Items Callout & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                      Recent Orders Activity
                    </h2>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-[#FF6A00] font-bold hover:underline cursor-pointer"
                    >
                      View All Orders
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <th className="pb-2">Order</th>
                          <th className="pb-2">Customer</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2">Payment</th>
                          <th className="pb-2 text-right">Total</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="py-3 font-mono-admin font-bold text-slate-900">
                              #{ord.order_number}
                            </td>
                            <td className="py-3">
                              <span className="font-bold text-slate-800 block">{ord.customer_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono-admin">{ord.customer_email}</span>
                            </td>
                            <td className="py-3">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                ord.status === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-[11px] font-mono-admin font-semibold text-slate-600">
                                {ord.payment_method}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono-admin font-bold text-slate-900">
                              ₹{ord.total.toFixed(2)}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => onViewInvoice(ord)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                                title="View Tax Invoice"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Low Stock Quick Alert */}
                <div className="lg:col-span-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2 tracking-tight">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Inventory Low Stock
                  </h2>

                  <div className="space-y-3">
                    {lowStockItems.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium">All inventory items are well-stocked.</p>
                    ) : (
                      lowStockItems.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getProductImage(prod, 0)}
                              alt={prod.title}
                              className="w-10 h-10 rounded-lg object-cover bg-white"
                            />
                            <div>
                              <span className="font-bold text-slate-900 line-clamp-1">
                                {prod.title}
                              </span>
                              <span className="text-[10px] font-mono-admin text-slate-500 font-medium">
                                SKU: {prod.sku}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono-admin font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                            {prod.stock_quantity} left
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CRUD */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Product Catalog & Inventory
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Manage prices, stock levels, categories, images, and sales badges.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({
                      title: '',
                      sku: `HPZ-${Math.floor(1000 + Math.random() * 9000)}`,
                      price: 149,
                      regular_price: 199,
                      sale_price: 149,
                      size: '100g',
                      available_sizes: ['100g', '250g', '500g'],
                      size_pricing: {
                        '100g': { price: 149, regular_price: 199 },
                        '250g': { price: 299, regular_price: 399 },
                        '500g': { price: 549, regular_price: 749 },
                      },
                      stock_quantity: 50,
                      category: 'Blended Masalas',
                      tags: ['Pure Spices', 'Aroma Locked', '100% Shuddh'],
                      images: [],
                      description: '',
                      is_featured: false,
                      is_active: true,
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#1E2433] hover:bg-[#FF6A00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by title or SKU..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white font-medium"
                >
                  <option value="all">All Spice Powder Categories</option>
                  <option value="Pure Spice Powders">Pure Spice Powders</option>
                  <option value="Blended Masalas">Blended Masalas (Powders)</option>
                  <option value="Kitchen Combos">Kitchen Combo Packs</option>
                </select>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-4">Item</th>
                        <th className="p-4">SKU</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getProductImage(prod, 0)}
                                alt={prod.title}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                                }}
                              />
                              <div>
                                <span className="font-bold text-slate-900 block line-clamp-1">
                                  {prod.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono-admin block mt-0.5">
                                  ID: {shortenId(prod.id, 'prd')}
                                </span>
                                {prod.is_featured && (
                                  <span className="text-[9px] bg-orange-100 text-orange-900 font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 tracking-wider uppercase">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono-admin font-medium text-slate-600">{prod.sku}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-mono-admin font-bold text-slate-900">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </div>
                            {prod.regular_price && prod.regular_price > prod.price && (
                              <div className="font-mono-admin text-[10px] text-slate-400 line-through">
                                ₹{prod.regular_price.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`font-mono-admin font-bold px-2 py-0.5 rounded text-[11px] ${
                              prod.stock_quantity === 0
                                ? 'bg-slate-200 text-slate-600'
                                : prod.stock_quantity <= 5
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {prod.stock_quantity} units
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              prod.is_active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {prod.is_active ? 'Active' : 'Draft'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            {onViewProductOnLiveStore && (
                              <button
                                onClick={() => onViewProductOnLiveStore(prod)}
                                className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                title="View live on website"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const baseP = prod.price || 149;
                                const baseR = prod.regular_price || Math.round(baseP * 1.33);
                                const currentPricing = prod.size_pricing || {
                                  '100g': { price: baseP, regular_price: baseR },
                                  '250g': { price: Math.round(baseP * 2.25), regular_price: Math.round(baseR * 2.25) },
                                  '500g': { price: Math.round(baseP * 4.2), regular_price: Math.round(baseR * 4.2) },
                                };
                                const availableSizes = prod.available_sizes && prod.available_sizes.length > 0
                                  ? prod.available_sizes
                                  : ['100g', '250g', '500g'];

                                setEditingProduct({
                                  ...prod,
                                  size: prod.size || availableSizes[0] || '100g',
                                  available_sizes: availableSizes,
                                  size_pricing: currentPricing,
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-[#FF6A00] rounded-lg transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Order Processing & Shipping
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Fulfill orders, dispatch couriers, record tracking IDs, and print GST tax invoices.
                  </p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors cursor-pointer ${
                        orderStatusFilter === st
                          ? 'bg-[#1E2433] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-4">Order #</th>
                        <th className="p-4">Customer & Phone</th>
                        <th className="p-4">Items</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Status Changer</th>
                        <th className="p-4">Courier Tracking</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/70">
                          <td className="p-4">
                            <span className="font-mono-admin font-bold text-slate-900 block">
                              #{ord.order_number}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono-admin block">
                              ID: {shortenId(ord.id, 'ord')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono-admin">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{ord.customer_name}</div>
                            <div className="text-[11px] font-mono-admin text-slate-500 font-medium">{ord.customer_phone}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {ord.shipping_address.city}, {ord.shipping_address.state}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-700">
                              {ord.items.length} items
                            </span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {ord.items.map((i) => i.title).join(', ')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono-admin text-[10px] font-bold block w-max">
                              PAID
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono-admin mt-0.5 block">
                              {ord.payment_method}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                updateOrderStatus(ord.id, e.target.value as OrderStatus)
                              }
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {editingTrackingOrderId === ord.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={trackingInput}
                                  onChange={(e) => setTrackingInput(e.target.value)}
                                  placeholder="e.g. BLRDTC-1234"
                                  className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono-admin"
                                />
                                <button
                                  onClick={() => {
                                    updateOrderStatus(ord.id, ord.status, trackingInput);
                                    setEditingTrackingOrderId(null);
                                  }}
                                  className="px-2 py-1 bg-[#1E2433] text-white rounded text-[10px] font-bold cursor-pointer hover:bg-[#FF6A00]"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingTrackingOrderId(ord.id);
                                  setTrackingInput(ord.tracking_number || '');
                                }}
                                className="font-mono-admin text-xs text-[#FF6A00] font-semibold cursor-pointer hover:underline"
                                title="Click to update tracking ID"
                              >
                                {ord.tracking_number || '+ Add Tracking'}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono-admin font-bold text-slate-900">
                            ₹{ord.total.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => onViewInvoice(ord)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Coupons & Promotional Codes
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure promotional codes, percentage discounts, minimum cart spend, and usage limits.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCoupon({
                      code: '',
                      discount_type: 'percentage',
                      amount: 10,
                      min_spend: 999,
                      expiry_date: '2026-12-31',
                      usage_limit: 100,
                      usage_count: 0,
                      is_active: true,
                    });
                    setIsCouponModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#1E2433] hover:bg-[#FF6A00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Coupon</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {coupons.map((coup) => (
                  <div
                    key={coup.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono-admin text-base font-black text-[#FF6A00] tracking-wider block">
                          {coup.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-admin block">
                          ID: {shortenId(coup.id, 'cpn')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {coup.discount_type === 'percentage'
                            ? `${coup.amount}% Off order total`
                            : `Flat ₹${coup.amount} Off order`}
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        coup.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {coup.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Min Spend:</span>
                        <span className="font-mono-admin font-bold">₹{coup.min_spend}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Expiry Date:</span>
                        <span className="font-mono-admin font-medium">{coup.expiry_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Usage Limit:</span>
                        <span className="font-mono-admin font-medium">{coup.usage_count} / {coup.usage_limit}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setEditingCoupon({ ...coup });
                          setIsCouponModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          await deleteCoupon(coup.id);
                          showToast('success', `✓ Coupon "${coup.code}" deleted.`);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SHIPPING RULES */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Shipping Zones & Rates
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure delivery rates, free shipping cart thresholds, and estimated turnaround times.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shippingRules.map((rule) => (
                  <div key={rule.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{rule.title}</h3>
                        <span className="text-[10px] text-slate-400 font-mono-admin block">ID: {shortenId(rule.id, 'shp')}</span>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.is_active}
                          onChange={(e) =>
                            saveShippingRule({ ...rule, is_active: e.target.checked })
                          }
                          className="rounded text-[#FF6A00]"
                        />
                        <span>Active</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-500 font-medium block mb-1">Standard Cost (₹)</label>
                        <input
                          type="number"
                          value={rule.cost}
                          onChange={(e) =>
                            saveShippingRule({ ...rule, cost: Number(e.target.value) })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg font-mono-admin font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 font-medium block mb-1">Free Above (₹)</label>
                        <input
                          type="number"
                          value={rule.free_threshold}
                          onChange={(e) =>
                            saveShippingRule({ ...rule, free_threshold: Number(e.target.value) })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg font-mono-admin font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 font-medium block mb-1 text-xs">Turnaround Time</label>
                      <input
                        type="text"
                        value={rule.delivery_days}
                        onChange={(e) =>
                          saveShippingRule({ ...rule, delivery_days: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TAX RULES */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                GST & Global Tax Configuration
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage goods and services tax (GST) rates applied at checkout.
              </p>

              <div className="space-y-4">
                {taxRules.map((tax) => (
                  <div
                    key={tax.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{tax.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono-admin block">ID: {shortenId(tax.id, 'tax')}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        Splits into equal CGST ({(tax.rate_percent / 2).toFixed(1)}%) + SGST ({(tax.rate_percent / 2).toFixed(1)}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 font-mono-admin font-bold text-base text-slate-900">
                        <input
                          type="number"
                          value={tax.rate_percent}
                          onChange={(e) =>
                            saveTaxRule({ ...tax, rate_percent: Number(e.target.value) })
                          }
                          className="w-16 p-1.5 text-right border border-slate-300 rounded-lg font-mono-admin text-sm font-bold"
                        />
                        <span>%</span>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tax.is_active}
                          onChange={(e) =>
                            saveTaxRule({ ...tax, is_active: e.target.checked })
                          }
                          className="rounded text-[#FF6A00]"
                        />
                        <span className="font-medium">Active</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    User Management & Access Control
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Create customer or admin profiles, manage permissions, and sync data directly with Supabase.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser({
                        full_name: '',
                        email: '',
                        phone: '',
                        role: 'customer',
                        password: '',
                      });
                      setIsUserModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#FF6A00] hover:bg-[#e05d00] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add New Profile</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-4">User Profile</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Orders Placed</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((usr) => {
                        const userOrders = orders.filter((o) => o.user_id === usr.id || o.customer_email === usr.email);
                        const initials = usr.full_name
                          ? usr.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                          : usr.email.substring(0, 2).toUpperCase();

                        return (
                          <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  usr.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                                }`}>
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{usr.full_name}</div>
                                  <span className="text-[10px] text-slate-500 font-mono-admin bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                                    ID: {shortenId(usr.id, 'usr')}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono-admin font-medium text-slate-700">{usr.email}</td>
                            <td className="p-4 font-mono-admin text-slate-500">{usr.phone || '—'}</td>
                            <td className="p-4">
                              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                usr.role === 'admin'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {usr.role === 'admin' ? 'Administrator' : 'Customer'}
                              </span>
                            </td>
                            <td className="p-4 font-mono-admin font-medium">{userOrders.length} orders</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser({ ...usr });
                                    setIsUserModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Profile"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateUserRole(usr.id, usr.role === 'admin' ? 'customer' : 'admin')
                                  }
                                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-[11px] font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
                                >
                                  Toggle to {usr.role === 'admin' ? 'Customer' : 'Admin'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setUserToDelete(usr)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Edit / Add Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden font-admin animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{editingProduct.id ? 'Edit Spice Product' : 'Add New Spice Product'}</span>
                  {editingProduct.category && (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
                      {editingProduct.category}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Configure spice details, package size pricing (100g / 250g / 500g), and upload photos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSaveProductSubmit} id="productForm" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    placeholder="e.g. Royal Kashmiri Red Chilli Powder"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="e.g. HPN-KMR-100"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              {/* Package Weights & Variant Pricing Section */}
              <div className="bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/90 space-y-2.5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Package Weights & Size-Specific Pricing</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Aroma-Lock Pouches
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Enter selling prices (₹) and MRPs (₹) for 100g, 250g, and 500g stay-fresh zipper packs.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono-admin text-slate-400 font-semibold hidden sm:block">
                    Multi-Variant Pricing
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 100g Weight Card */}
                  {(() => {
                    const is100Enabled = editingProduct.available_sizes?.includes('100g') ?? true;
                    const p100 = editingProduct.size_pricing?.['100g']?.price ?? editingProduct.price ?? 149;
                    const r100 = editingProduct.size_pricing?.['100g']?.regular_price ?? editingProduct.regular_price ?? 199;
                    const discount100 = r100 > p100 ? Math.round(((r100 - p100) / r100) * 100) : null;

                    return (
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        is100Enabled
                          ? 'bg-white border-orange-200 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={is100Enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                const currentSizes = editingProduct.available_sizes || ['100g', '250g', '500g'];
                                const updatedSizes = enabled
                                  ? Array.from(new Set([...currentSizes, '100g']))
                                  : currentSizes.filter((s) => s !== '100g');
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  available_sizes: updatedSizes.length > 0 ? updatedSizes : ['100g'],
                                }));
                              }}
                              className="rounded text-[#FF6A00] focus:ring-orange-500"
                            />
                            <span className="font-extrabold text-xs text-slate-900 font-mono-admin">100g Pouch</span>
                          </label>
                          {discount100 && is100Enabled && (
                            <span className="text-[9px] font-extrabold bg-[#FF6A00] text-white px-1 py-0.5 rounded">
                              {discount100}% OFF
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Selling Price (₹) *
                            </label>
                            <input
                              type="number"
                              disabled={!is100Enabled}
                              value={p100}
                              onChange={(e) => {
                                const newP = Number(e.target.value);
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  price: newP,
                                  size_pricing: {
                                    ...(prev?.size_pricing || {}),
                                    '100g': {
                                      price: newP,
                                      regular_price: prev?.size_pricing?.['100g']?.regular_price ?? r100,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono-admin font-bold text-slate-900 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                              placeholder="149"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                              Regular / MRP Price (₹)
                            </label>
                            <input
                              type="number"
                              disabled={!is100Enabled}
                              value={r100}
                              onChange={(e) => {
                                const newR = Number(e.target.value);
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  regular_price: newR,
                                  size_pricing: {
                                    ...(prev?.size_pricing || {}),
                                    '100g': {
                                      price: prev?.size_pricing?.['100g']?.price ?? p100,
                                      regular_price: newR,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono-admin text-slate-600 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                              placeholder="199"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 250g Weight Card */}
                  {(() => {
                    const is250Enabled = editingProduct.available_sizes?.includes('250g') ?? true;
                    const p250 = editingProduct.size_pricing?.['250g']?.price ?? (editingProduct.price ? Math.round(editingProduct.price * 2.25) : 299);
                    const r250 = editingProduct.size_pricing?.['250g']?.regular_price ?? (editingProduct.regular_price ? Math.round(editingProduct.regular_price * 2.25) : 399);
                    const discount250 = r250 > p250 ? Math.round(((r250 - p250) / r250) * 100) : null;

                    return (
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        is250Enabled
                          ? 'bg-white border-orange-200 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={is250Enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                const currentSizes = editingProduct.available_sizes || ['100g', '250g', '500g'];
                                const updatedSizes = enabled
                                  ? Array.from(new Set([...currentSizes, '250g']))
                                  : currentSizes.filter((s) => s !== '250g');
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  available_sizes: updatedSizes.length > 0 ? updatedSizes : ['250g'],
                                }));
                              }}
                              className="rounded text-[#FF6A00] focus:ring-orange-500"
                            />
                            <span className="font-extrabold text-xs text-slate-900 font-mono-admin">250g Pack</span>
                          </label>
                          {discount250 && is250Enabled && (
                            <span className="text-[9px] font-extrabold bg-[#FF6A00] text-white px-1 py-0.5 rounded">
                              {discount250}% OFF
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Selling Price (₹) *
                            </label>
                            <input
                              type="number"
                              disabled={!is250Enabled}
                              value={p250}
                              onChange={(e) => {
                                const newP = Number(e.target.value);
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  size_pricing: {
                                    ...(prev?.size_pricing || {}),
                                    '250g': {
                                      price: newP,
                                      regular_price: prev?.size_pricing?.['250g']?.regular_price ?? r250,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono-admin font-bold text-slate-900 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                              placeholder="299"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                              Regular / MRP Price (₹)
                            </label>
                            <input
                              type="number"
                              disabled={!is250Enabled}
                              value={r250}
                              onChange={(e) => {
                                const newR = Number(e.target.value);
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  size_pricing: {
                                    ...(prev?.size_pricing || {}),
                                    '250g': {
                                      price: prev?.size_pricing?.['250g']?.price ?? p250,
                                      regular_price: newR,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono-admin text-slate-600 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                              placeholder="399"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 500g Weight Card */}
                  {(() => {
                    const is500Enabled = editingProduct.available_sizes?.includes('500g') ?? true;
                    const p500 = editingProduct.size_pricing?.['500g']?.price ?? (editingProduct.price ? Math.round(editingProduct.price * 4.2) : 549);
                    const r500 = editingProduct.size_pricing?.['500g']?.regular_price ?? (editingProduct.regular_price ? Math.round(editingProduct.regular_price * 4.2) : 749);
                    const discount500 = r500 > p500 ? Math.round(((r500 - p500) / r500) * 100) : null;

                    return (
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        is500Enabled
                          ? 'bg-white border-orange-200 shadow-xs'
                          : 'bg-slate-100/70 border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={is500Enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                const currentSizes = editingProduct.available_sizes || ['100g', '250g', '500g'];
                                const updatedSizes = enabled
                                  ? Array.from(new Set([...currentSizes, '500g']))
                                  : currentSizes.filter((s) => s !== '500g');
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  available_sizes: updatedSizes.length > 0 ? updatedSizes : ['500g'],
                                }));
                              }}
                              className="rounded text-[#FF6A00] focus:ring-orange-500"
                            />
                            <span className="font-extrabold text-xs text-slate-900 font-mono-admin">500g Pack</span>
                          </label>
                          {discount500 && is500Enabled && (
                            <span className="text-[9px] font-extrabold bg-[#FF6A00] text-white px-1 py-0.5 rounded">
                              {discount500}% OFF
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Selling Price (₹) *
                            </label>
                            <input
                              type="number"
                              disabled={!is500Enabled}
                              value={p500}
                              onChange={(e) => {
                                const newP = Number(e.target.value);
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  size_pricing: {
                                    ...(prev?.size_pricing || {}),
                                    '500g': {
                                      price: newP,
                                      regular_price: prev?.size_pricing?.['500g']?.regular_price ?? r500,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono-admin font-bold text-slate-900 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                              placeholder="549"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                              Regular / MRP Price (₹)
                            </label>
                            <input
                              type="number"
                              disabled={!is500Enabled}
                              value={r500}
                              onChange={(e) => {
                                const newR = Number(e.target.value);
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  size_pricing: {
                                    ...(prev?.size_pricing || {}),
                                    '500g': {
                                      price: prev?.size_pricing?.['500g']?.price ?? p500,
                                      regular_price: newR,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono-admin text-slate-600 bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                              placeholder="749"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Total Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock_quantity || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock_quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Pure Spice Powders'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  >
                    <option value="Pure Spice Powders">Pure Spice Powders</option>
                    <option value="Blended Masalas">Blended Masalas</option>
                    <option value="Kitchen Combos">Kitchen Combos</option>
                  </select>
                </div>
              </div>

              {/* Product Image Management Section */}
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#FF6A00]" />
                      <span>Product Image (Storefront Visual)</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Upload from your system, choose spice preset, or paste image URL.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSpicePresets(!showSpicePresets)}
                    className="text-[10px] font-bold text-[#FF6A00] hover:text-[#e05d00] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    {showSpicePresets ? 'Hide Library' : 'Pick Spice Photo'}
                  </button>
                </div>

                {/* Curated Spice Presets Picker */}
                {showSpicePresets && (
                  <div className="p-2.5 bg-white rounded-xl border border-orange-200 shadow-xs animate-in fade-in">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Click to apply authentic spice pouch photo:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                      {CURATED_SPICE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setEditingProduct((prev) => ({
                              ...prev,
                              images: [preset.image, ...(prev?.images?.filter((img) => img !== preset.image).slice(0, 2) || [])],
                            }));
                            setUploadMessage(`✓ Applied ${preset.name} image!`);
                            setTimeout(() => setUploadMessage(null), 3000);
                          }}
                          className="group p-1.5 rounded-lg border border-slate-200 hover:border-[#FF6A00] bg-slate-50 hover:bg-orange-50 text-left transition-all cursor-pointer flex flex-col items-center text-center"
                        >
                          <img
                            src={preset.image}
                            alt={preset.name}
                            className="w-10 h-10 object-cover rounded-md mb-1 group-hover:scale-105 transition-transform"
                          />
                          <span className="text-[10px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#FF6A00]">
                            {preset.name.split('(')[0]}
                          </span>
                          <span className="text-[9px] text-slate-400 line-clamp-1">{preset.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Preview & Upload Controls */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const fakeEvent = {
                        target: { files: [file], value: '' },
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleImageFileUpload(fakeEvent);
                    }
                  }}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 hover:border-[#FF6A00]/40 transition-colors"
                >
                  {/* Thumbnail Preview */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 shadow-inner flex items-center justify-center group">
                    <img
                      src={getProductImage(editingProduct, 0)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                    <span
                      className={`absolute bottom-0 inset-x-0 text-white text-[8px] font-bold text-center py-0.5 tracking-wider backdrop-blur-2xs ${
                        editingProduct.images?.[0] ? 'bg-emerald-700/90' : 'bg-slate-900/75'
                      }`}
                    >
                      {editingProduct.images?.[0] ? 'UPLOADED' : 'PREVIEW'}
                    </span>
                  </div>

                  {/* Actions & File Upload */}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 bg-[#FF6A00] hover:bg-[#e05d00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isUploadingImage ? 'Attaching...' : 'Upload From Your System'}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/heic"
                          onChange={handleImageFileUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>

                      {editingProduct.images?.[0] && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, images: [] })}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste an image web URL (https://...)"
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, images: [e.target.value] })
                      }
                      className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                    />
                  </div>
                </div>

                {uploadMessage && (
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{uploadMessage}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Describe authentic origin, aroma, color intensity, and culinary pairing..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured || false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_featured: e.target.checked })
                    }
                    className="rounded text-[#FF6A00] focus:ring-orange-500"
                  />
                  <span>Featured Product (Artisan Pick)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active !== undefined ? editingProduct.is_active : true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                    }
                    className="rounded text-[#FF6A00] focus:ring-orange-500"
                  />
                  <span>Active in Store Catalog</span>
                </label>
              </div>
            </form>

            {/* Modal Sticky Footer */}
            <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-mono-admin hidden sm:inline">
                {editingProduct.sku ? `SKU: ${editingProduct.sku}` : 'Ready to save'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="productForm"
                  disabled={isSavingProduct}
                  className="px-4 py-1.5 sm:px-5 sm:py-2 bg-[#1E2433] hover:bg-[#FF6A00] disabled:bg-slate-400 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs"
                >
                  {isSavingProduct && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingProduct ? 'Saving to Database...' : (editingProduct.id ? 'Save Changes' : 'Save Product')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Saved Live Redirection Modal */}
      {savedSuccessProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 text-center font-admin">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#15803D] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Synced with Backend & Live Store
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-2.5">
                Product Published Successfully!
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                "{savedSuccessProduct.title}" is stored in the database and immediately active across all product catalog pages.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center gap-3 text-left">
              <img
                src={getProductImage(savedSuccessProduct, 0)}
                alt={savedSuccessProduct.title}
                className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {savedSuccessProduct.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono-admin block">
                  SKU: {savedSuccessProduct.sku} • {savedSuccessProduct.category}
                </span>
                <span className="text-xs font-mono-admin font-black text-[#FF6A00] block mt-0.5">
                  ₹{savedSuccessProduct.price.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  const prod = savedSuccessProduct;
                  setSavedSuccessProduct(null);
                  if (onViewProductOnLiveStore) {
                    onViewProductOnLiveStore(prod);
                  } else {
                    onExitAdmin();
                  }
                }}
                className="w-full py-3 bg-[#FF6A00] hover:bg-[#E55F00] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-600/20 transition-transform active:scale-98"
              >
                <span>View on Live Website Now</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSavedSuccessProduct(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Stay in Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Edit / Add Modal */}
      {isCouponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-admin animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {editingCoupon.id ? 'Edit Coupon' : 'Create Coupon Code'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSaveCouponSubmit} id="couponForm" className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={editingCoupon.code || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER25"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg uppercase font-mono-admin font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={editingCoupon.discount_type || 'percentage'}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Amount *</label>
                  <input
                    type="number"
                    required
                    value={editingCoupon.amount || 10}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, amount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    value={editingCoupon.min_spend || 0}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, min_spend: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={editingCoupon.usage_limit || 100}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, usage_limit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editingCoupon.expiry_date || '2026-12-31'}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, expiry_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="coupActive"
                  checked={editingCoupon.is_active !== undefined ? editingCoupon.is_active : true}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, is_active: e.target.checked })}
                  className="rounded text-[#FF6A00]"
                />
                <label htmlFor="coupActive" className="text-xs font-medium text-slate-700">
                  Active in Store
                </label>
              </div>
            </form>

            {/* Modal Sticky Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="couponForm"
                className="px-5 py-1.5 bg-[#1E2433] hover:bg-[#FF6A00] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Save Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product In-App Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 font-admin animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Product</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to permanently remove this product from the storefront catalog and database?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <img
                src={getProductImage(productToDelete, 0)}
                alt={productToDelete.title}
                className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">{productToDelete.title}</div>
                <div className="text-[11px] text-slate-500 font-mono-admin">SKU: {productToDelete.sku} • ₹{productToDelete.price}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={handleConfirmDeleteProduct}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingProduct ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Add / Edit Modal */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden font-admin animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{editingUser.id ? 'Edit User Profile' : 'Create New Profile'}</span>
                  {editingUser.role && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      editingUser.role === 'admin'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {editingUser.role === 'admin' ? 'Administrator' : 'Customer'}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Save credentials and sync directly to Supabase public.profiles table.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveUserSubmit} id="userForm" className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="e.g. Vikram Mehta"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="e.g. admin@hapinoz.com"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono-admin focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Account Role *</label>
                  <select
                    value={editingUser.role || 'customer'}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        role: e.target.value as 'admin' | 'customer',
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  >
                    <option value="customer">Customer (Shopper)</option>
                    <option value="admin">Administrator (Store Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Account Password {editingUser.id ? '(Leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder={editingUser.id ? '••••••••' : 'Enter temporary or permanent password'}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Automatically provisions login credentials in Supabase Auth and public.profiles.
                </span>
              </div>
            </form>

            {/* Modal Sticky Footer */}
            <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400 font-mono-admin hidden sm:inline">
                {editingUser.role === 'admin' ? '🛡️ Admin Privileges' : '👤 Customer Role'}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="userForm"
                  disabled={isSavingUser}
                  className="px-4 py-1.5 bg-[#1E2433] hover:bg-[#FF6A00] disabled:bg-slate-400 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {isSavingUser && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingUser ? 'Syncing to Database...' : (editingUser.id ? 'Save Changes' : 'Create & Sync Profile')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Profile In-App Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 font-admin animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete User Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove this user profile from the database?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                {userToDelete.full_name?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate">{userToDelete.full_name}</div>
                <div className="text-[11px] text-slate-500 font-mono-admin truncate">{userToDelete.email} • {userToDelete.role}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingUser}
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingUser ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

