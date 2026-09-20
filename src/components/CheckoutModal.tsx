import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Lock,
  ArrowRight,
  AlertCircle,
  Tag,
  Banknote,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Address, Order } from '../types';
import { HapinozLogo } from './HapinozLogo';
import { processRazorpayPayment, RazorpayCustomerDetails } from '../lib/razorpay';
import { RazorpayModal } from './RazorpayModal';
import { lookupIndianPincode, INDIAN_STATES } from '../lib/indianLocations';
import { IndianVegBadge } from './IndianFoodBadges';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderComplete,
}) => {
  const {
    cart,
    shippingRules,
    activeCoupon,
    calculateTotals,
    currentUser,
    addresses,
    createOrder,
  } = useStore();

  const [selectedShippingId, setSelectedShippingId] = useState<string>(
    shippingRules[0]?.id || 'ship-1'
  );

  const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddr ? defaultAddr.id : 'new'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<'razorpay' | 'cod'>('razorpay');
  const [needGstInvoice, setNeedGstInvoice] = useState(false);
  const [gstin, setGstin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [pincodeHelper, setPincodeHelper] = useState<{ city: string; state: string; days: string; courier: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: currentUser?.full_name || defaultAddr?.full_name || '',
    email: currentUser?.email || 'customer@hapinoz.com',
    phone: currentUser?.phone || defaultAddr?.phone || '+91 98765 43210',
    addressLine1: defaultAddr?.address_line1 || '',
    addressLine2: defaultAddr?.address_line2 || '',
    landmark: '',
    city: defaultAddr?.city || 'Bengaluru',
    state: defaultAddr?.state || 'Karnataka',
    postalCode: defaultAddr?.postal_code || '560001',
    country: 'India',
  });

  // Simulator Modal State
  const [simulatorState, setSimulatorState] = useState<{
    isOpen: boolean;
    orderId: string;
    amount: number;
    customer: RazorpayCustomerDetails;
    onSimulateSuccess: () => void;
    onSimulateFail: () => void;
  } | null>(null);

  if (!isOpen) return null;

  const totals = calculateTotals(selectedShippingId);

  const handlePincodeChange = (val: string) => {
    const cleanPin = val.replace(/\D/g, '').substring(0, 6);
    setFormData((prev) => ({ ...prev, postalCode: cleanPin }));

    if (cleanPin.length >= 3) {
      const info = lookupIndianPincode(cleanPin);
      if (info.city) {
        setFormData((prev) => ({
          ...prev,
          city: info.city,
          state: info.state,
          postalCode: cleanPin,
        }));
        setPincodeHelper({
          city: info.city,
          state: info.state,
          days: info.estimatedDays,
          courier: info.courierPartner,
        });
      }
    } else {
      setPincodeHelper(null);
    }
  };

  const handleSavedAddressChange = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setFormData({
        fullName: currentUser?.full_name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: '',
        state: 'Karnataka',
        postalCode: '',
        country: 'India',
      });
      setPincodeHelper(null);
    } else {
      const match = addresses.find((a) => a.id === addrId);
      if (match) {
        setFormData({
          fullName: match.full_name,
          email: currentUser?.email || 'customer@hapinoz.com',
          phone: match.phone,
          addressLine1: match.address_line1,
          addressLine2: match.address_line2 || '',
          landmark: '',
          city: match.city,
          state: match.state,
          postalCode: match.postal_code,
          country: match.country,
        });
        const info = lookupIndianPincode(match.postal_code);
        if (info.city) {
          setPincodeHelper({
            city: info.city,
            state: info.state,
            days: info.estimatedDays,
            courier: info.courierPartner,
          });
        }
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.addressLine1.trim() || !formData.postalCode.trim()) {
      setErrorMessage('Please fill in all required shipping address fields (Name, Phone, Address, PIN code).');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsProcessing(true);

    const fullStreet = formData.landmark
      ? `${formData.addressLine1} (Landmark: ${formData.landmark})`
      : formData.addressLine1;

    const shippingAddress: Address = {
      id: `addr-${Date.now()}`,
      full_name: formData.fullName,
      phone: formData.phone,
      address_line1: fullStreet,
      address_line2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postalCode,
      country: formData.country,
      type: 'shipping',
    };

    // Handle Cash on Delivery (COD)
    if (paymentChoice === 'cod') {
      setTimeout(() => {
        const completedOrder = createOrder({
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_address: shippingAddress,
          payment_method: 'Cash on Delivery (COD)',
          selected_shipping_id: selectedShippingId,
        });

        setIsProcessing(false);
        onClose();
        onOrderComplete(completedOrder);
      }, 700);
      return;
    }

    // Handle Razorpay Online
    const tempOrderNumber = `HPZ-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await processRazorpayPayment({
        amount: totals.total,
        orderNumber: tempOrderNumber,
        customer: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        onSimulatorOpen: (sim) => {
          setIsProcessing(false);
          setSimulatorState({
            isOpen: true,
            orderId: sim.orderId,
            amount: sim.amount,
            customer: sim.customer,
            onSimulateSuccess: () => {
              setSimulatorState(null);
              sim.onSimulateSuccess();
            },
            onSimulateFail: () => {
              setSimulatorState(null);
              sim.onSimulateFail();
            },
          });
        },
        onSuccess: (paymentResult) => {
          const completedOrder = createOrder({
            customer_name: formData.fullName,
            customer_email: formData.email,
            customer_phone: formData.phone,
            shipping_address: shippingAddress,
            payment_method: paymentResult.method || 'Razorpay Gateway',
            razorpay_order_id: paymentResult.razorpay_order_id,
            razorpay_payment_id: paymentResult.razorpay_payment_id,
            razorpay_signature: paymentResult.razorpay_signature,
            selected_shipping_id: selectedShippingId,
          });

          setIsProcessing(false);
          onClose();
          onOrderComplete(completedOrder);
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setErrorMessage(err || 'Payment was cancelled or could not be completed.');
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'An error occurred during checkout.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HapinozLogo className="h-8" />
              <div className="border-l border-slate-300 pl-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-base text-slate-900 leading-tight">Secure Indian Checkout</h2>
                  <IndianVegBadge size="sm" />
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#22C55E]" /> 256-Bit Encrypted • UPI / Cards / NetBanking / COD
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Details */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Saved Address Selector */}
              {addresses.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Select Delivery Address
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSavedAddressChange(addr.id)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          selectedAddressId === addr.id
                            ? 'border-[#FF6A00] bg-orange-50/50 ring-1 ring-[#FF6A00]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold block text-slate-800">{addr.full_name}</span>
                        <span className="text-slate-500 block truncate">{addr.address_line1}, {addr.city}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{addr.postal_code}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSavedAddressChange('new')}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        selectedAddressId === 'new'
                          ? 'border-[#FF6A00] bg-orange-50 text-[#FF6A00]'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      + Enter New Address
                    </button>
                  </div>
                </div>
              )}

              {/* Shipping Address Form */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF6A00]" /> Delivery Address (Pan-India)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Mobile Number (For Delivery SMS / OTP) *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Email ID (For Order Confirmation & GST Invoice) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Flat, House No., Building, Street Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="e.g. Flat 402, Lotus Heights, 12th Main Road"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Landmark (Optional, helps delivery executive)</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g. Near HDFC Bank / Behind Apollo Pharmacy"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                  />
                </div>

                {/* PIN Code & Auto-Resolved City/State */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      PIN Code * <span className="text-[10px] text-emerald-600 font-normal">(Auto City)</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={formData.postalCode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="e.g. 560001"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">City / District *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00]"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Pincode Courier Resolver */}
                {pincodeHelper && (
                  <div className="p-2.5 bg-[#EAF8F0] border border-[#B8EBD0] rounded-xl text-xs text-[#15803D] flex items-center justify-between animate-in fade-in">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      Delivering to <strong>{pincodeHelper.city}</strong> via {pincodeHelper.courier}
                    </span>
                    <span className="font-bold text-[11px] bg-white px-2 py-0.5 rounded shadow-2xs">
                      ⚡ ETA: {pincodeHelper.days}
                    </span>
                  </div>
                )}

                {/* Optional GST Invoice Checkbox for Kitchens/Restaurants */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={needGstInvoice}
                      onChange={(e) => setNeedGstInvoice(e.target.checked)}
                      className="rounded text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <span>Need GST Invoice for Business / Kitchen? (Claim ITC 5%)</span>
                  </label>

                  {needGstInvoice && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-1">GSTIN Number</label>
                          <input
                            type="text"
                            maxLength={15}
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            placeholder="e.g. 29AAAAA0000A1Z5"
                            className="w-full px-2.5 py-1.5 text-xs uppercase font-mono border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-1">Company / Restaurant Name</label>
                          <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Swad Restaurant & Caterers"
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Speed Rule */}
              <div className="space-y-3 pt-2">
                <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#FF6A00]" /> Delivery Speed
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {shippingRules.filter((r) => r.is_active).map((rule) => {
                    const isFree = totals.subtotal >= rule.free_threshold;
                    return (
                      <label
                        key={rule.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedShippingId === rule.id
                            ? 'border-[#22C55E] bg-[#EAF8F0]/40 ring-1 ring-[#22C55E]'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shippingMethod"
                            checked={selectedShippingId === rule.id}
                            onChange={() => setSelectedShippingId(rule.id)}
                            className="text-[#22C55E] focus:ring-[#22C55E]"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{rule.title}</div>
                            <div className="text-[11px] text-slate-500">{rule.delivery_days}</div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs">
                          {isFree ? (
                            <span className="text-[#15803D] uppercase font-black text-[11px]">FREE</span>
                          ) : (
                            `₹${rule.cost}`
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selector (Razorpay vs COD) */}
              <div className="space-y-3 pt-2">
                <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#22C55E]" /> Payment Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Razorpay Online */}
                  <label
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentChoice === 'razorpay'
                        ? 'border-[#22C55E] bg-[#EAF8F0]/50 ring-1 ring-[#22C55E]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="paymentChoice"
                        checked={paymentChoice === 'razorpay'}
                        onChange={() => setPaymentChoice('razorpay')}
                        className="text-[#22C55E] focus:ring-[#22C55E] mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Razorpay UPI & Cards</span>
                          <span className="bg-[#22C55E] text-white text-[9px] font-bold px-1.5 py-0.2 rounded">Fastest</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Google Pay, PhonePe, Paytm, BHIM UPI, Cards, NetBanking
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Cash on Delivery */}
                  <label
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentChoice === 'cod'
                        ? 'border-[#FF6A00] bg-orange-50/50 ring-1 ring-[#FF6A00]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="paymentChoice"
                        checked={paymentChoice === 'cod'}
                        onChange={() => setPaymentChoice('cod')}
                        className="text-[#FF6A00] focus:ring-[#FF6A00] mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>Cash on Delivery (COD)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Pay by Cash or UPI to courier executive upon delivery
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900 pb-3 border-b border-slate-200 mb-4 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs font-sans font-normal text-slate-500">
                    {cart.reduce((s, i) => s + i.quantity, 0)} Items
                  </span>
                </h3>

                {/* Items preview */}
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1 mb-4 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-2 first:pt-0 flex items-center gap-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-slate-900 truncate">
                          {item.product.title}
                        </h4>
                        <div className="text-[11px] text-slate-500">
                          Qty: {item.quantity} × ₹{item.product.price}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Active Coupon Badge */}
                {activeCoupon && (
                  <div className="mb-4 p-2.5 bg-[#EAF8F0] border border-[#B8EBD0] rounded-xl text-xs text-[#15803D] flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Tag className="w-3.5 h-3.5 text-[#22C55E]" />
                      Coupon: <strong className="font-mono">{activeCoupon.code}</strong>
                    </span>
                    <span className="font-mono font-bold">-₹{totals.discount.toFixed(2)}</span>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-mono">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-[#15803D] font-semibold">
                      <span>Coupon Discount</span>
                      <span className="font-mono">-₹{totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery ({totals.selectedRule.title})</span>
                    <span className="font-mono">
                      {totals.shippingFee === 0 ? (
                        <span className="text-[#15803D] font-bold uppercase text-[11px] bg-[#EAF8F0] px-1.5 py-0.5 rounded border border-[#B8EBD0]">FREE</span>
                      ) : (
                        `₹${totals.shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5% HSN 0910)</span>
                    <span className="font-mono">₹{totals.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Amount Payable</span>
                    <span className="font-mono text-xl text-slate-950 font-bold">
                      ₹{totals.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isProcessing || cart.length === 0}
                  className={`w-full py-4 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all cursor-pointer ${
                    paymentChoice === 'cod'
                      ? 'bg-[#FF6A00] hover:bg-[#E55F00] shadow-orange-600/20'
                      : 'bg-[#22C55E] hover:bg-[#16A34A] shadow-green-600/20'
                  }`}
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : paymentChoice === 'cod' ? (
                    <>
                      <Banknote className="w-4 h-4" />
                      <span>Confirm COD Order (₹{totals.total.toFixed(2)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay ₹{totals.total.toFixed(2)} with Razorpay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="mt-3 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>GST Tax Invoice & SMS Tracking Link provided instantly</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Simulator Modal */}
      {simulatorState && (
        <RazorpayModal
          isOpen={simulatorState.isOpen}
          orderId={simulatorState.orderId}
          amount={simulatorState.amount}
          customer={simulatorState.customer}
          onClose={() => setSimulatorState(null)}
          onSuccess={simulatorState.onSimulateSuccess}
          onFail={simulatorState.onSimulateFail}
        />
      )}
    </>
  );
};
