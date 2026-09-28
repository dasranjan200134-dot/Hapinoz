import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  MapPin,
  User as UserIcon,
  Package,
  FileText,
  Plus,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Copy,
  Check,
  Search,
  AlertCircle,
  ExternalLink,
  Flame,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Filter,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Address, Order, OrderStatus } from '../types';
import { DEFAULT_PRODUCT_IMAGE } from '../lib/imageHelper';

interface UserDashboardProps {
  initialTab?: 'orders' | 'addresses' | 'profile';
  onViewInvoice: (order: Order) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  initialTab = 'orders',
  onViewInvoice,
}) => {
  const {
    currentUser,
    userOrders,
    orders: allStoreOrders,
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    updateProfile,
    products,
    addToCart,
    refreshFromSupabase,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>(initialTab);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Live order fetching state
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [lastOrderSyncTime, setLastOrderSyncTime] = useState<string>('');

  const fetchLiveOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      // 1. Sync store cache
      if (refreshFromSupabase) {
        await refreshFromSupabase();
      }

      // 2. Direct fetch from API
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      let url = '/api/orders';
      if (userEmail) {
        url += `?email=${encodeURIComponent(userEmail)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setLiveOrders(json.data);
        }
      }
    } catch (e) {
      console.warn('Live order fetch warning:', e);
    } finally {
      setIsLoadingOrders(false);
      setLastOrderSyncTime(new Date().toLocaleTimeString());
    }
  }, [currentUser?.email, currentUser?.id, refreshFromSupabase]);

  useEffect(() => {
    fetchLiveOrders();
  }, [fetchLiveOrders]);

  // Merge live orders with store userOrders
  const combinedUserOrders = useMemo(() => {
    const orderMap = new Map<string, Order>();

    // 1. Store user orders
    for (const ord of userOrders) {
      if (ord) {
        const key = ord.order_number || ord.id;
        if (key) orderMap.set(key, ord);
      }
    }

    // 2. Live API orders
    for (const ord of liveOrders) {
      if (ord) {
        const key = ord.order_number || ord.id;
        if (key) {
          orderMap.set(key, ord);
        }
      }
    }

    // 3. Fallback: filter all store orders by email or phone
    const email = (currentUser?.email || '').trim().toLowerCase();
    const phone = (currentUser?.phone || '').replace(/\D/g, '');
    const uid = currentUser?.id || '';

    if (allStoreOrders && allStoreOrders.length > 0) {
      for (const ord of allStoreOrders) {
        if (!ord) continue;
        const key = ord.order_number || ord.id;
        if (orderMap.has(key)) continue;

        const ordEmail = (ord.customer_email || '').trim().toLowerCase();
        const ordPhone = (ord.customer_phone || '').replace(/\D/g, '');
        const ordUid = ord.user_id || '';

        const matchEmail = email && ordEmail === email;
        const matchPhone = phone && phone.length >= 10 && ordPhone.endsWith(phone.slice(-10));
        const matchUid = uid && (ordUid === uid || ordUid === `usr-${uid}` || ordUid === `usr_${uid}`);

        if (matchEmail || matchPhone || matchUid) {
          orderMap.set(key, ord);
        }
      }
    }

    const list = Array.from(orderMap.values());
    list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return list;
  }, [userOrders, liveOrders, allStoreOrders, currentUser?.email, currentUser?.phone, currentUser?.id]);

  // Orders summary filters & state
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [reorderSuccessId, setReorderSuccessId] = useState<string | null>(null);

  // Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '',
    country: 'India',
    isDefault: true,
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
  });

  // Metrics Calculations for Recent Orders
  const totalOrdersCount = combinedUserOrders.length;
  const processingOrdersCount = combinedUserOrders.filter((o) => o.status === 'processing').length;
  const shippedOrdersCount = combinedUserOrders.filter((o) => o.status === 'shipped').length;
  const deliveredOrdersCount = combinedUserOrders.filter((o) => o.status === 'delivered').length;
  const totalSpent = combinedUserOrders.reduce((sum, o) => sum + o.total, 0);

  // Filtered orders list
  const filteredOrders = combinedUserOrders.filter((ord) => {
    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;

    const matchesSearch =
      ord.order_number.toLowerCase().includes(q) ||
      (ord.tracking_number && ord.tracking_number.toLowerCase().includes(q)) ||
      ord.items.some((item) => item.title.toLowerCase().includes(q)) ||
      ord.shipping_address?.city?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleCopyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderId(orderNumber);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  const handleReorder = (ord: Order) => {
    ord.items.forEach((item) => {
      const matchedProduct = products.find((p) => p.id === item.product_id) || {
        id: item.product_id,
        title: item.title,
        slug: item.title.toLowerCase().replace(/\s+/g, '-'),
        sku: 'HPZ-REORDER',
        description: 'Pure Hapinoz Single-Origin Spices',
        short_description: item.title,
        price: item.price,
        regular_price: Math.round(item.price * 1.25),
        cost_price: Math.round(item.price * 0.5),
        stock_quantity: 50,
        stock_status: 'in_stock' as const,
        category: 'Pure Spice Powders',
        tags: ['Pure Spices'],
        images: [item.image],
        origin_region: 'India',
        purity_rating: 100,
        grind_type: 'Low-Temp Milled',
        rating: 5.0,
        reviews_count: 12,
        is_featured: false,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      addToCart(matchedProduct, item.quantity);
    });

    setReorderSuccessId(ord.id);
    setTimeout(() => setReorderSuccessId(null), 3000);
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.addressLine1 || !addressForm.postalCode) return;

    saveAddress({
      full_name: addressForm.fullName,
      phone: addressForm.phone,
      address_line1: addressForm.addressLine1,
      address_line2: addressForm.addressLine2,
      city: addressForm.city,
      state: addressForm.state,
      postal_code: addressForm.postalCode,
      country: addressForm.country,
      is_default: addressForm.isDefault,
      type: 'shipping',
    });

    setIsAddingAddress(false);
    setAddressForm({
      fullName: currentUser?.full_name || '',
      phone: currentUser?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '',
      country: 'India',
      isDefault: false,
    });
  };

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: profileForm.fullName,
      phone: profileForm.phone,
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Helper for rendering status timeline progress
  const getProgressStage = (status: OrderStatus) => {
    switch (status) {
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
      case 'refunded':
        return 0;
      default:
        return 1;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* User Dashboard Header Banner */}
        <div className="bg-[#161B26] text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#22C55E] text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-[#22C55E]/20">
              {currentUser?.full_name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{currentUser?.full_name}</h1>
                <span className="text-[10px] bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 px-2 py-0.5 rounded-full font-bold">
                  {currentUser?.role === 'admin' ? 'Store Administrator' : 'Verified Customer'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser?.email}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                <span>Member since {new Date(currentUser?.created_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#22C55E]">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Pure Spice Club
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial bg-slate-800/80 px-4 py-2 rounded-xl text-slate-300 font-mono border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Total Orders</span>
              <strong className="text-white text-sm">{totalOrdersCount}</strong>
            </div>
            <div className="flex-1 sm:flex-initial bg-slate-800/80 px-4 py-2 rounded-xl text-slate-300 font-mono border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Lifetime Value</span>
              <strong className="text-[#22C55E] text-sm">₹{totalSpent.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Clock className="w-4 h-4 text-[#22C55E]" />
            <span>Recent Orders & Status</span>
            <span className="ml-1.5 px-2 py-0.2 rounded-full text-[10px] font-mono bg-[#EAF8F0] text-[#15803D] border border-[#22C55E]/30 font-bold">
              {combinedUserOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#22C55E]" />
            <span>Address Book</span>
            <span className="ml-1.5 px-2 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">
              {addresses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <UserIcon className="w-4 h-4 text-[#22C55E]" />
            <span>Account Profile</span>
          </button>
        </div>

        {/* Tab 1: Recent Orders & Comprehensive Status Summary */}
        {activeTab === 'orders' && (
          <div className="p-4 sm:p-8 space-y-6">
            {/* 1. Orders KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div
                onClick={() => setStatusFilter('all')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#EAF8F0] border-[#22C55E] ring-2 ring-[#22C55E]/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600">All Orders</span>
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
                  {totalOrdersCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Total placed</div>
              </div>

              <div
                onClick={() => setStatusFilter('processing')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  statusFilter === 'processing'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-700">Milling & Packing</span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-900">
                  {processingOrdersCount}
                </div>
                <div className="text-[11px] text-amber-700 mt-1">Under temperature lock</div>
              </div>

              <div
                onClick={() => setStatusFilter('shipped')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  statusFilter === 'shipped'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-700">In Transit</span>
                  <Truck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-blue-900">
                  {shippedOrdersCount}
                </div>
                <div className="text-[11px] text-blue-600 mt-1">On the way via courier</div>
              </div>

              <div
                onClick={() => setStatusFilter('delivered')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  statusFilter === 'delivered'
                    ? 'bg-emerald-50 border-[#22C55E] ring-2 ring-[#22C55E]/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-800">Delivered</span>
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-900">
                  {deliveredOrdersCount}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">Delivered to kitchen</div>
              </div>
            </div>

            {/* 2. Filter & Search Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 mr-1 text-[11px] font-semibold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
                </span>
                {(['all', 'processing', 'shipped', 'delivered'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-all cursor-pointer text-xs ${
                      statusFilter === st
                        ? 'bg-[#1E2433] text-white shadow-xs font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {st === 'all' ? 'All Orders' : st}
                  </button>
                ))}
              </div>

              {/* Search & Sync Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by #HPZ, spice name, city..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/30 focus:bg-white transition-all text-slate-800"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={() => fetchLiveOrders()}
                  disabled={isLoadingOrders}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Sync with cloud order database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingOrders ? 'animate-spin text-[#22C55E]' : ''}`} />
                  <span className="hidden sm:inline">{isLoadingOrders ? 'Syncing...' : 'Sync'}</span>
                </button>
              </div>
            </div>

            {/* 3. Orders List or Empty State */}
            {combinedUserOrders.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-300 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#EAF8F0] mx-auto flex items-center justify-center text-[#15803D] shadow-inner">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No orders placed yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Explore our range of 100% pure turmeric, Kashmiri mirch, Tellicherry black pepper, and single-origin spices.
                  </p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No orders match your filter</h3>
                <p className="text-xs text-slate-500">Try changing your search terms or status filter.</p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((ord, ordIdx) => {
                  const stage = getProgressStage(ord.status);
                  const isCopied = copiedOrderId === ord.order_number;
                  const isReordered = reorderSuccessId === ord.id;
                  const uniqueOrderKey = ord.order_number || ord.id || `order-${ordIdx}`;

                  return (
                    <div
                      key={uniqueOrderKey}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 hover:border-[#22C55E]/40 transition-all shadow-xs overflow-hidden"
                    >
                      {/* Order Card Header */}
                      <div className="bg-slate-50/80 p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900">
                              #{ord.order_number}
                            </span>
                            <button
                              onClick={() => handleCopyOrderNumber(ord.order_number)}
                              title="Copy Order ID"
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : ord.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : ord.status === 'processing'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ord.status === 'delivered'
                                  ? 'bg-emerald-600'
                                  : ord.status === 'shipped'
                                  ? 'bg-blue-600 animate-pulse'
                                  : ord.status === 'processing'
                                  ? 'bg-amber-600 animate-ping'
                                  : 'bg-slate-500'
                              }`}
                            />
                            <span>{ord.status}</span>
                          </span>

                          <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-lg font-mono font-medium">
                            {ord.payment_method === 'razorpay' ? 'Razorpay Prepaid' : ord.payment_method}
                          </span>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-500">
                          <span>
                            Placed: <strong>{new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          </span>
                          <button
                            onClick={() => onViewInvoice(ord)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#22C55E]" />
                            <span>Tax Invoice</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 space-y-5">
                        {/* Interactive Status Timeline Stepper */}
                        {stage > 0 && (
                          <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-[#22C55E]" />
                                <span>Live Delivery Progress</span>
                              </span>
                              {ord.tracking_number && (
                                <span className="text-[11px] font-mono text-slate-600">
                                  Air AWB: <strong className="text-slate-900">{ord.tracking_number}</strong>
                                </span>
                              )}
                            </div>

                            {/* Stepper Progress Bar */}
                            <div className="relative py-2">
                              {/* Background Line */}
                              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-200 rounded-full" />
                              {/* Filled Progress Line */}
                              <div
                                className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-[#22C55E] rounded-full transition-all duration-500"
                                style={{
                                  width:
                                    stage === 1
                                      ? '15%'
                                      : stage === 2
                                      ? '45%'
                                      : stage === 3
                                      ? '75%'
                                      : '94%',
                                }}
                              />

                              {/* 4 Checkpoint Nodes */}
                              <div className="relative flex justify-between">
                                {/* Stage 1: Placed */}
                                <div className="flex flex-col items-center text-center">
                                  <div className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                    ✓
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-800 mt-1.5">Order Placed</span>
                                </div>

                                {/* Stage 2: Milling */}
                                <div className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                                      stage >= 2
                                        ? 'bg-[#22C55E] text-white'
                                        : 'bg-white border-2 border-slate-300 text-slate-400'
                                    }`}
                                  >
                                    {stage > 2 ? '✓' : '2'}
                                  </div>
                                  <span className={`text-[10px] mt-1.5 ${stage >= 2 ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                                    Packing Lock
                                  </span>
                                </div>

                                {/* Stage 3: Shipped */}
                                <div className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                                      stage >= 3
                                        ? 'bg-[#22C55E] text-white'
                                        : 'bg-white border-2 border-slate-300 text-slate-400'
                                    }`}
                                  >
                                    {stage > 3 ? '✓' : '3'}
                                  </div>
                                  <span className={`text-[10px] mt-1.5 ${stage >= 3 ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                                    In Transit
                                  </span>
                                </div>

                                {/* Stage 4: Delivered */}
                                <div className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                                      stage >= 4
                                        ? 'bg-[#22C55E] text-white'
                                        : 'bg-white border-2 border-slate-300 text-slate-400'
                                    }`}
                                  >
                                    {stage >= 4 ? '✓' : '4'}
                                  </div>
                                  <span className={`text-[10px] mt-1.5 ${stage >= 4 ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                                    Delivered
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status Narrative Note */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2">
                              <span className="text-slate-600">
                                {ord.status === 'processing' && '✨ Freshly processed & sealed in 3-layer aroma locked pouch.'}
                                {ord.status === 'shipped' && '🚀 Dispatched with express courier. In transit for fast delivery.'}
                                {ord.status === 'delivered' && '🌿 Package safely delivered to your doorstep. Thank you for choosing Hapinoz Pure Spices!'}
                              </span>

                              <a
                                href={`https://wa.me/919876543210?text=${encodeURIComponent(
                                  `Hi Hapinoz Care, I'd like an update on my order #${ord.order_number}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#15803D] hover:underline font-bold inline-flex items-center gap-1 shrink-0"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                                <span>WhatsApp Track Support</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Items Purchased List */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                            Items in Order ({ord.items.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ord.items.map((item, itemIdx) => {
                              const uniqueItemKey = item.id || `${uniqueOrderKey}-item-${itemIdx}-${item.product_id || item.title}`;
                              return (
                                <div
                                  key={uniqueItemKey}
                                  className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100"
                                >
                                  <img
                                    src={item.image || DEFAULT_PRODUCT_IMAGE}
                                    alt={item.title}
                                    className="w-12 h-12 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="font-bold text-xs text-slate-900 truncate block">
                                      {item.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                                      <span>Qty: {item.quantity}</span>
                                      <span>•</span>
                                      <span>₹{item.price} each</span>
                                    </div>
                                  </div>
                                  <div className="text-right font-mono font-bold text-xs text-slate-900 shrink-0">
                                    ₹{item.quantity * item.price}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Destination Address & Summary Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                          {/* Shipping Details */}
                          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Delivery Address
                            </span>
                            {ord.shipping_address ? (
                              <p className="text-slate-700 leading-relaxed text-[11px]">
                                <strong>{ord.shipping_address.full_name}</strong><br />
                                {ord.shipping_address.address_line1}, {ord.shipping_address.city} - {ord.shipping_address.postal_code}<br />
                                <span className="font-mono text-slate-500">Ph: {ord.shipping_address.phone}</span>
                              </p>
                            ) : (
                              <p className="text-slate-500 text-[11px]">Verified Home Kitchen Delivery</p>
                            )}
                          </div>

                          {/* Pricing Details & Action */}
                          <div className="flex flex-col justify-between space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <div className="space-y-1 text-[11px] text-slate-600">
                              <div className="flex justify-between">
                                <span>Items Subtotal:</span>
                                <span className="font-mono">₹{ord.subtotal.toFixed(2)}</span>
                              </div>
                              {ord.discount > 0 && (
                                <div className="flex justify-between text-emerald-700 font-semibold">
                                  <span>Discount Savings:</span>
                                  <span className="font-mono">-₹{ord.discount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Shipping:</span>
                                <span className="font-mono text-emerald-700 font-bold">
                                  {ord.shipping_fee === 0 ? 'FREE' : `₹${ord.shipping_fee}`}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-xs">
                                <span>Total Paid:</span>
                                <span className="font-mono text-sm text-[#15803D]">
                                  ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Reorder and Support Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <button
                            onClick={() => handleReorder(ord)}
                            className="px-4 py-2 bg-[#1E2433] hover:bg-[#161B26] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#22C55E]" />
                            <span>{isReordered ? '✓ Added to Cart!' : 'Reorder These Spices'}</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onViewInvoice(ord)}
                              className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer underline"
                            >
                              Download GST PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'addresses' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Saved Addresses</h2>
                <p className="text-xs text-slate-500">Manage your delivery destinations across India</p>
              </div>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleSaveNewAddress} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Shipping Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDef"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded text-[#22C55E] focus:ring-[#22C55E]"
                  />
                  <label htmlFor="isDef" className="text-xs text-slate-700 font-medium">
                    Make this my default shipping address
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Address Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr, addrIdx) => (
                <div
                  key={addr.id || `addr-${addrIdx}-${addr.postal_code || addr.full_name}`}
                  className={`p-5 rounded-2xl border transition-all relative ${
                    addr.is_default
                      ? 'border-[#22C55E] bg-[#EAF8F0]/30 ring-1 ring-[#22C55E]/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-slate-900">{addr.full_name}</span>
                    {addr.is_default && (
                      <span className="bg-[#EAF8F0] text-[#15803D] border border-[#22C55E]/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {addr.address_line1}
                    {addr.address_line2 && `, ${addr.address_line2}`}<br />
                    {addr.city}, {addr.state} - {addr.postal_code}<br />
                    {addr.country}
                  </p>
                  <div className="text-xs font-mono text-slate-500 mb-4">Phone: {addr.phone}</div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    {!addr.is_default ? (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-[#15803D] hover:underline font-semibold cursor-pointer"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Primary Address
                      </span>
                    )}

                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Profile */}
        {activeTab === 'profile' && (
          <div className="p-6 sm:p-8 max-w-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Update your account credentials and contact details</p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Primary verified account email</span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/20 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Account Role</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-800 uppercase font-mono">
                    {currentUser?.role}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Secure Customer Session
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
