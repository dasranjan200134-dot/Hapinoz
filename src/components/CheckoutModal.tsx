import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Tag,
  Banknote,
  CheckCircle2,
  Building,
  Check,
  Edit2,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Address, Order } from '../types';
import { HapinozLogo } from './HapinozLogo';
import { processRazorpayPayment, RazorpayCustomerDetails } from '../lib/razorpay';
import { RazorpayModal } from './RazorpayModal';
import { lookupIndianPincode, INDIAN_STATES } from '../lib/indianLocations';
import { IndianVegBadge } from './IndianFoodBadges';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../lib/imageHelper';

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

  // Two-step checkout: 'address' (Step 1) -> 'payment' (Step 2: Separate dedicated payment page)
  const [checkoutStep, setCheckoutStep] = useState<'address' | 'payment'>('address');

  // Normal Delivery rule is default and fixed (takes up to 7 days)
  const defaultShippingRule =
    shippingRules.find((r) => r.is_active && !r.title.toLowerCase().includes('express')) ||
    shippingRules[0];
  const [selectedShippingId] = useState<string>(defaultShippingRule?.id || 'ship-1');

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
  const [pincodeHelper, setPincodeHelper] = useState<{
    city: string;
    state: string;
    days: string;
    courier: string;
  } | null>(null);

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

  const handleClose = () => {
    setCheckoutStep('address');
    setErrorMessage(null);
    onClose();
  };

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
          days: 'Up to 7 days',
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
            days: 'Up to 7 days',
            courier: info.courierPartner,
          });
        }
      }
    }
  };

  // Validation before going to Step 2 (Separate Payment Page)
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add spice items before checking out.');
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for delivery updates.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive your GST invoice.');
      return;
    }

    if (!formData.addressLine1.trim()) {
      setErrorMessage('Please enter your delivery street address / building name.');
      return;
    }

    if (!formData.postalCode.trim() || formData.postalCode.length < 6) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    if (!formData.city.trim()) {
      setErrorMessage('Please enter your City / District.');
      return;
    }

    // All valid -> move to separate payment page
    setCheckoutStep('payment');
  };

  // Final Order Submission from Separate Payment Page
  const handleFinalOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
        handleClose();
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
          handleClose();
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
          {/* Header & Step Indicator */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HapinozLogo className="h-8" />
                <div className="border-l border-slate-300 pl-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-base text-slate-900 leading-tight">
                      {checkoutStep === 'address' ? 'Secure Indian Checkout' : 'Make Payment'}
                    </h2>
                    <IndianVegBadge size="sm" />
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#22C55E]" /> 256-Bit Encrypted • UPI / Cards / NetBanking / COD
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="flex items-center gap-2 sm:gap-4 mt-4 pt-3 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCheckoutStep('address')}
                className={`flex items-center gap-2 font-medium cursor-pointer transition-colors ${
                  checkoutStep === 'address'
                    ? 'text-[#FF6A00] font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    checkoutStep === 'payment'
                      ? 'bg-emerald-600 text-white'
                      : checkoutStep === 'address'
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {checkoutStep === 'payment' ? <Check className="w-3 h-3" /> : '1'}
                </span>
                <span>1. Delivery Address & Details</span>
              </button>

              <span className="text-slate-300">/</span>

              <div
                className={`flex items-center gap-2 font-medium ${
                  checkoutStep === 'payment'
                    ? 'text-[#FF6A00] font-bold'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    checkoutStep === 'payment'
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  2
                </span>
                <span>2. Payment & Confirmation</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* STEP 1: DELIVERY ADDRESS & DETAILS PAGE */}
          {/* ============================================================== */}
          {checkoutStep === 'address' && (
            <form onSubmit={handleProceedToPayment} className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Column: Details */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 max-h-[75vh] overflow-y-auto">
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
                          <span className="text-slate-500 block truncate">
                            {addr.address_line1}, {addr.city}
                          </span>
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
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Mobile Number (For Delivery SMS / OTP) *
                      </label>
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
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Email ID (For Order Confirmation & GST Invoice) *
                    </label>
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
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Flat, House No., Building, Street Name *
                    </label>
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
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Landmark (Optional, helps delivery executive)
                    </label>
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
                          <option key={st} value={st}>
                            {st}
                          </option>
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
                        ⚡ ETA: Up to 7 Days
                      </span>
                    </div>
                  )}

                  {/* Normal Delivery Info (Default fixed normal delivery, no fast/normal choice) */}
                  <div className="p-4 bg-orange-50/70 border border-orange-200/90 rounded-2xl flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FF6A00]/10 text-[#FF6A00] flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          Normal Delivery (Standard Pan-India)
                        </span>
                        <span className="font-mono font-bold text-xs">
                          {totals.shippingFee === 0 ? (
                            <span className="text-[#15803D] uppercase font-bold text-[11px] bg-[#EAF8F0] px-2 py-0.5 rounded border border-[#B8EBD0]">
                              FREE
                            </span>
                          ) : (
                            `₹${totals.shippingFee.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Default shipping method. Freshly milled and aroma-sealed in foil stand-up pouches. Doorstep delivery takes <strong>up to 7 days</strong> across India.
                      </p>
                      <span className="inline-block mt-1 text-[10px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        ✓ Free shipping on orders above ₹499
                      </span>
                    </div>
                  </div>

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
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              GSTIN Number
                            </label>
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
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              Company / Restaurant Name
                            </label>
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
              </div>

              {/* Right Column: Order Summary & Proceed to Payment Button */}
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
                          src={getProductImage(item.product, 0)}
                          alt={item.product.title}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                          }}
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
                      <span>Normal Delivery (Up to 7 Days)</span>
                      <span className="font-mono">
                        {totals.shippingFee === 0 ? (
                          <span className="text-[#15803D] font-bold uppercase text-[11px] bg-[#EAF8F0] px-1.5 py-0.5 rounded border border-[#B8EBD0]">
                            FREE
                          </span>
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

                {/* Next Step CTA */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className="w-full py-4 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 bg-[#FF6A00] hover:bg-[#E55F00] shadow-lg shadow-orange-600/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>Proceed to Payment (₹{totals.total.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="mt-3 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Next: Select Razorpay (UPI/Cards) or Cash on Delivery</span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 2: DEDICATED SEPARATE PAYMENT PAGE */}
          {/* ============================================================== */}
          {checkoutStep === 'payment' && (
            <form onSubmit={handleFinalOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 animate-in fade-in">
              {/* Left Column: Payment Methods & Selected Destination Summary */}
              <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 max-h-[75vh] overflow-y-auto">
                {/* Back to Step 1 Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('address')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#FF6A00] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Delivery Details</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">Step 2 of 2</span>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Delivery Destination Summary Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" /> Delivering To
                    </span>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('address')}
                      className="text-xs font-semibold text-[#FF6A00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Change
                    </button>
                  </div>
                  <div className="text-xs text-slate-800">
                    <p className="font-bold text-slate-900">
                      {formData.fullName} • <span className="font-mono text-slate-600">{formData.phone}</span>
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                      {formData.addressLine1}
                      {formData.landmark ? `, Landmark: ${formData.landmark}` : ''}, {formData.city}, {formData.state} -{' '}
                      <span className="font-mono font-semibold">{formData.postalCode}</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium mt-1">
                      📦 Delivery Type: <strong>Normal Delivery (Takes up to 7 days)</strong>
                    </p>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#22C55E]" /> Choose Payment Method
                  </h3>

                  <div className="space-y-3">
                    {/* Option 1: Razorpay Online */}
                    <label
                      className={`p-4 rounded-2xl border flex items-start justify-between cursor-pointer transition-all ${
                        paymentChoice === 'razorpay'
                          ? 'border-[#22C55E] bg-[#EAF8F0]/50 ring-2 ring-[#22C55E]/40'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentChoice"
                          checked={paymentChoice === 'razorpay'}
                          onChange={() => setPaymentChoice('razorpay')}
                          className="text-[#22C55E] focus:ring-[#22C55E] mt-1"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Razorpay Online Payment</span>
                            <span className="bg-[#22C55E] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Pay securely via <strong>Google Pay, PhonePe, Paytm, BHIM UPI, RuPay / Visa / Mastercard, NetBanking</strong>, or Wallets.
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">UPI</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Cards</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">NetBanking</span>
                            <span className="text-emerald-700 font-semibold">⚡ Instant Order Confirmation</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        {paymentChoice === 'razorpay' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                        )}
                      </div>
                    </label>

                    {/* Option 2: Cash on Delivery */}
                    <label
                      className={`p-4 rounded-2xl border flex items-start justify-between cursor-pointer transition-all ${
                        paymentChoice === 'cod'
                          ? 'border-[#FF6A00] bg-orange-50/50 ring-2 ring-[#FF6A00]/40'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="paymentChoice"
                          checked={paymentChoice === 'cod'}
                          onChange={() => setPaymentChoice('cod')}
                          className="text-[#FF6A00] focus:ring-[#FF6A00] mt-1"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-[#FF6A00]" />
                            <span>Cash on Delivery (COD)</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Pay in cash or scan UPI directly with the delivery agent when your spices arrive at your doorstep.
                          </p>
                          <span className="inline-block mt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                            Delivered via Normal Delivery (takes up to 7 days)
                          </span>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        {paymentChoice === 'cod' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6A00]" />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                    <span>100% Genuine Single-Origin Spices</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Final Summary & Payment CTA */}
              <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 pb-3 border-b border-slate-200 mb-4 flex items-center justify-between">
                    <span>Payment Summary</span>
                    <span className="text-xs font-sans font-normal text-slate-500">
                      {cart.reduce((s, i) => s + i.quantity, 0)} Items
                    </span>
                  </h3>

                  {/* Compact items preview */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 mb-4 divide-y divide-slate-100">
                    {cart.map((item) => (
                      <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <span className="font-medium text-slate-900">{item.product.title}</span>
                          <span className="text-slate-500 text-[11px] block">Qty: {item.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 shrink-0">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-3">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-mono">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-[#15803D] font-semibold">
                        <span>Coupon Discount ({activeCoupon?.code})</span>
                        <span className="font-mono">-₹{totals.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Normal Delivery (Up to 7 Days)</span>
                      <span className="font-mono">
                        {totals.shippingFee === 0 ? (
                          <span className="text-[#15803D] font-bold uppercase text-[11px] bg-[#EAF8F0] px-1.5 py-0.5 rounded border border-[#B8EBD0]">
                            FREE
                          </span>
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

                {/* Final Submit CTA */}
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
                    <span>Instant GST Tax Invoice & SMS Tracking Link provided</span>
                  </div>
                </div>
              </div>
            </form>
          )}
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
