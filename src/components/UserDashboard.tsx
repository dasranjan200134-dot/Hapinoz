import React, { useState } from 'react';
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
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Address, Order } from '../types';

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
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    updateProfile,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>(initialTab);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        {/* User Dashboard Header */}
        <div className="bg-stone-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-700 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-lg">
              {currentUser?.full_name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">{currentUser?.full_name}</h1>
              <p className="text-xs text-stone-400 font-mono mt-0.5">{currentUser?.email}</p>
              <div className="flex gap-2 mt-1.5">
                <span className="text-[10px] bg-stone-800 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                  {currentUser?.role === 'admin' ? 'Store Administrator' : 'Verified Customer'}
                </span>
                <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full">
                  Member since {new Date(currentUser?.created_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 text-xs">
            <span className="bg-stone-800 px-3.5 py-1.5 rounded-xl text-stone-300 font-mono">
              Orders: <strong className="text-white">{userOrders.length}</strong>
            </span>
            <span className="bg-stone-800 px-3.5 py-1.5 rounded-xl text-stone-300 font-mono">
              Addresses: <strong className="text-white">{addresses.length}</strong>
            </span>
          </div>
        </div>

        {/* Dashboard Tabs Bar */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Clock className="w-4 h-4 text-[#22C55E]" />
            <span>Order History ({userOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-6 py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#22C55E]" />
            <span>Address Book ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserIcon className="w-4 h-4 text-[#22C55E]" />
            <span>Account Profile</span>
          </button>
        </div>

        {/* Tab 1: Orders History */}
        {activeTab === 'orders' && (
          <div className="p-6 sm:p-8 space-y-6">
            {userOrders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 mx-auto flex items-center justify-center text-stone-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-stone-800 text-lg">No orders yet</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  When you complete checkout with Razorpay, your order receipt, tracking details, and GST invoices will be listed here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-amber-300 transition-all shadow-2xs space-y-4"
                  >
                    {/* Order Meta Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-stone-900">
                            #{ord.order_number}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'processing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {ord.status}
                          </span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-mono">
                            {ord.payment_method}
                          </span>
                        </div>
                        <span className="text-xs text-stone-400 mt-1 block">
                          Placed on {new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewInvoice(ord)}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-800" />
                          <span>Tax Invoice</span>
                        </button>
                      </div>
                    </div>

                    {/* Items Thumbnails */}
                    <div className="flex flex-wrap gap-3">
                      {ord.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2.5 bg-stone-50 p-2 rounded-xl border border-stone-100 text-xs">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover bg-stone-200"
                          />
                          <div>
                            <span className="font-semibold text-stone-800 max-w-[140px] truncate block">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-stone-500 font-mono">
                              Qty {item.quantity} × ₹{item.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tracking and Grand Total Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs pt-3 border-t border-stone-100 gap-2">
                      <div className="text-stone-500">
                        {ord.tracking_number && (
                          <span>
                            Tracking ID: <strong className="font-mono text-stone-800">{ord.tracking_number}</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-stone-500 text-xs mr-2">Order Total:</span>
                        <span className="font-mono font-bold text-base text-stone-900">
                          ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'addresses' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-serif font-bold text-lg text-stone-900">Saved Addresses</h2>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="px-3.5 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleSaveNewAddress} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">New Shipping Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-700 block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-700 block mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-700 block mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDef"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded text-amber-800 focus:ring-amber-700"
                  />
                  <label htmlFor="isDef" className="text-xs text-stone-700 font-medium">
                    Make this my default shipping address
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Address Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-5 rounded-2xl border transition-all relative ${
                    addr.is_default
                      ? 'border-amber-700 bg-amber-50/20 ring-1 ring-amber-700'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-stone-900">{addr.full_name}</span>
                    {addr.is_default && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    {addr.address_line1}
                    {addr.address_line2 && `, ${addr.address_line2}`}<br />
                    {addr.city}, {addr.state} - {addr.postal_code}<br />
                    {addr.country}
                  </p>
                  <div className="text-xs font-mono text-stone-500 mb-4">Phone: {addr.phone}</div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                    {!addr.is_default ? (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-amber-800 hover:underline font-semibold cursor-pointer"
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
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
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
            <h2 className="font-serif font-bold text-lg text-stone-900">Personal Information</h2>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg bg-stone-100 text-stone-500 cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">Primary verified account email</span>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-700/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-700/20 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">Account Role</label>
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs flex items-center justify-between">
                  <span className="font-semibold text-stone-800 uppercase font-mono">
                    {currentUser?.role}
                  </span>
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> RLS Protected
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
