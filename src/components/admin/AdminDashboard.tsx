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
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Product, Order, Coupon, ShippingRule, TaxRule, OrderStatus, User } from '../../types';

interface AdminDashboardProps {
  onViewInvoice: (order: Order) => void;
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onViewInvoice,
  onExitAdmin,
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
    transactions,
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

  // Coupon Edit Modal State
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

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

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title || !editingProduct?.price) return;
    saveProduct(editingProduct);
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code || !editingCoupon?.amount) return;
    saveCoupon(editingCoupon);
    setIsCouponModalOpen(false);
    setEditingCoupon(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      {/* Top Admin Nav Header */}
      <header className="bg-[#161B26] text-white px-4 sm:px-8 py-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6A00] text-white flex items-center justify-center font-bold shadow-inner">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm sm:text-base tracking-wider text-white">
              STORE MANAGEMENT CONSOLE
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Operations, Inventory & Fulfillment
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExitAdmin}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#1E2433] text-xs font-bold transition-all cursor-pointer shadow-xs"
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
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 tracking-wider">
              Management
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Products Catalog</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders Lifecycle</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-orange-400">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'coupons'
                  ? 'bg-[#FF6A00] text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4" />
                <span>Coupons & Promos</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">
                {coupons.length}
              </span>
            </button>

            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-2 mt-4 tracking-wider">
              Store Configuration
            </div>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
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
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
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
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
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
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Dashboard Overview
                  </h1>
                  <p className="text-xs text-slate-500">
                    Live analytics, store revenue metrics, and pending order statuses.
                  </p>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-slate-900">
                    ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-[#22C55E] font-semibold flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> Real Razorpay Settlement
                  </span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-[#FF6A00]" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-slate-900">
                    {totalOrdersCount}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {orders.filter((o) => o.status === 'processing').length} Processing
                  </span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Average Order Value</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-slate-900">
                    ₹{avgOrderValue.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Across all paid baskets</span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Low-Stock Alerts</span>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-rose-700">
                    {lowStockItems.length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Needs warehouse reorder
                  </span>
                </div>
              </div>

              {/* Low Stock Items Callout & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base text-slate-900">
                      Recent Orders Activity
                    </h2>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-[#FF6A00] font-semibold hover:underline cursor-pointer"
                    >
                      View All Orders
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
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
                            <td className="py-3 font-mono font-bold text-slate-900">
                              #{ord.order_number}
                            </td>
                            <td className="py-3">
                              <span className="font-medium text-slate-800 block">{ord.customer_name}</span>
                              <span className="text-[10px] text-slate-400">{ord.customer_email}</span>
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
                              <span className="text-[11px] font-mono text-slate-600">
                                {ord.payment_method}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-slate-900">
                              ₹{ord.total.toFixed(2)}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => onViewInvoice(ord)}
                                className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
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
                  <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Inventory Low Stock
                  </h2>

                  <div className="space-y-3">
                    {lowStockItems.length === 0 ? (
                      <p className="text-xs text-slate-500">All inventory items are well-stocked.</p>
                    ) : (
                      lowStockItems.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={prod.images[0]}
                              alt={prod.title}
                              className="w-10 h-10 rounded-lg object-cover bg-white"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 line-clamp-1">
                                {prod.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                SKU: {prod.sku}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
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
                  <h1 className="text-2xl font-bold text-slate-900">
                    Product Catalog & Inventory
                  </h1>
                  <p className="text-xs text-slate-500">
                    Manage prices, stock levels, categories, images, and sales badges.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({
                      title: '',
                      sku: `HPZ-${Math.floor(1000 + Math.random() * 9000)}`,
                      price: 999,
                      regular_price: 1299,
                      sale_price: 999,
                      stock_quantity: 20,
                      category: 'Pure Spice Powders',
                      tags: ['Pure Spices', 'Aroma Locked'],
                      images: [
                        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
                      ],
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
              <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200">
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
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
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
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
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
                                src={prod.images[0]}
                                alt={prod.title}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block line-clamp-1">
                                  {prod.title}
                                </span>
                                {prod.is_featured && (
                                  <span className="text-[9px] bg-orange-100 text-orange-900 font-bold px-1.5 py-0.2 rounded inline-block mt-0.5">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-600">{prod.sku}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-mono font-bold text-slate-900">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </div>
                            {prod.regular_price && prod.regular_price > prod.price && (
                              <div className="font-mono text-[10px] text-slate-400 line-through">
                                ₹{prod.regular_price.toLocaleString('en-IN')}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
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
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct({ ...prod });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-[#FF6A00] rounded-lg transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${prod.title}"?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
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
                  <h1 className="text-2xl font-bold text-slate-900">
                    Order Processing & Shipping
                  </h1>
                  <p className="text-xs text-slate-500">
                    Fulfill orders, dispatch couriers, record tracking IDs, and print GST tax invoices.
                  </p>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
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
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
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
                            <span className="font-mono font-bold text-slate-900 block">
                              #{ord.order_number}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{ord.customer_name}</div>
                            <div className="text-[11px] font-mono text-slate-500">{ord.customer_phone}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {ord.shipping_address.city}, {ord.shipping_address.state}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-slate-700">
                              {ord.items.length} items
                            </span>
                            <span className="text-[10px] text-slate-400 block line-clamp-1">
                              {ord.items.map((i) => i.title).join(', ')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono text-[10px] font-bold block w-max">
                              PAID
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
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
                                  className="w-28 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
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
                                className="font-mono text-xs text-[#FF6A00] cursor-pointer hover:underline"
                                title="Click to update tracking ID"
                              >
                                {ord.tracking_number || '+ Add Tracking'}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-slate-900">
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
                  <h1 className="text-2xl font-bold text-slate-900">
                    Coupons & Promotional Codes
                  </h1>
                  <p className="text-xs text-slate-500">
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
                        <span className="font-mono text-base font-black text-[#FF6A00] tracking-wider block">
                          {coup.code}
                        </span>
                        <span className="text-xs text-slate-500">
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
                        <span>Min Spend:</span>
                        <span className="font-mono font-bold">₹{coup.min_spend}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expiry Date:</span>
                        <span className="font-mono">{coup.expiry_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage Limit:</span>
                        <span className="font-mono">{coup.usage_count} / {coup.usage_limit}</span>
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
                        onClick={() => deleteCoupon(coup.id)}
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
              <h1 className="text-2xl font-bold text-slate-900">
                Shipping Zones & Rates
              </h1>
              <p className="text-xs text-slate-500">
                Configure delivery rates, free shipping cart thresholds, and estimated turnaround times.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shippingRules.map((rule) => (
                  <div key={rule.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 text-sm">{rule.title}</h3>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
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
                        <label className="text-slate-500 block mb-1">Standard Cost (₹)</label>
                        <input
                          type="number"
                          value={rule.cost}
                          onChange={(e) =>
                            saveShippingRule({ ...rule, cost: Number(e.target.value) })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Free Above (₹)</label>
                        <input
                          type="number"
                          value={rule.free_threshold}
                          onChange={(e) =>
                            saveShippingRule({ ...rule, free_threshold: Number(e.target.value) })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1 text-xs">Turnaround Time</label>
                      <input
                        type="text"
                        value={rule.delivery_days}
                        onChange={(e) =>
                          saveShippingRule({ ...rule, delivery_days: e.target.value })
                        }
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg"
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
              <h1 className="text-2xl font-bold text-slate-900">
                GST & Global Tax Configuration
              </h1>
              <p className="text-xs text-slate-500">
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
                      <span className="text-xs text-slate-500">
                        Splits into equal CGST ({(tax.rate_percent / 2).toFixed(1)}%) + SGST ({(tax.rate_percent / 2).toFixed(1)}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 font-mono font-bold text-base text-slate-900">
                        <input
                          type="number"
                          value={tax.rate_percent}
                          onChange={(e) =>
                            saveTaxRule({ ...tax, rate_percent: Number(e.target.value) })
                          }
                          className="w-16 p-1.5 text-right border border-slate-300 rounded-lg font-mono text-sm"
                        />
                        <span>%</span>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
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
              <h1 className="text-2xl font-bold text-slate-900">
                User Management & Access Control
              </h1>
              <p className="text-xs text-slate-500">
                Promote customers to store administrators or manage user permissions.
              </p>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-4">User</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Orders Placed</th>
                      <th className="p-4 text-right">Role Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((usr) => {
                      const userOrders = orders.filter((o) => o.user_id === usr.id || o.customer_email === usr.email);
                      return (
                        <tr key={usr.id} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-900">{usr.full_name}</td>
                          <td className="p-4 font-mono text-slate-600">{usr.email}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              usr.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="p-4 font-mono">{userOrders.length} orders</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() =>
                                updateUserRole(usr.id, usr.role === 'admin' ? 'customer' : 'admin')
                              }
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                            >
                              Toggle to {usr.role === 'admin' ? 'Customer' : 'Admin'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Edit / Add Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-900">
              {editingProduct.id ? 'Edit Spice Product' : 'Add New Spice Product'}
            </h3>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Regular Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.regular_price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, regular_price: Number(e.target.value) })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock_quantity || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock_quantity: Number(e.target.value) })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Pure Spice Powders'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  >
                    <option value="Pure Spice Powders">Pure Spice Powders</option>
                    <option value="Blended Masalas">Blended Masalas</option>
                    <option value="Kitchen Combos">Kitchen Combos</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Primary Image URL</label>
                  <input
                    type="url"
                    value={editingProduct.images?.[0] || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, images: [e.target.value] })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
              </div>

              <div className="flex items-center gap-6 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured || false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_featured: e.target.checked })
                    }
                    className="rounded text-[#FF6A00]"
                  />
                  <span>Featured Product (Artisan Pick)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active !== undefined ? editingProduct.is_active : true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                    }
                    className="rounded text-[#FF6A00]"
                  />
                  <span>Active in Store Catalog</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E2433] hover:bg-[#FF6A00] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Edit / Add Modal */}
      {isCouponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCoupon.id ? 'Edit Coupon' : 'Create Coupon Code'}
            </h3>

            <form onSubmit={handleSaveCouponSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={editingCoupon.code || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER25"
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg uppercase font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={editingCoupon.discount_type || 'percentage'}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Amount *</label>
                  <input
                    type="number"
                    required
                    value={editingCoupon.amount || 10}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, amount: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    value={editingCoupon.min_spend || 0}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, min_spend: Number(e.target.value) })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={editingCoupon.usage_limit || 100}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, usage_limit: Number(e.target.value) })
                    }
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editingCoupon.expiry_date || '2026-12-31'}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, expiry_date: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
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
                <label htmlFor="coupActive" className="text-xs text-slate-700">
                  Active in Store
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E2433] hover:bg-[#FF6A00] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

