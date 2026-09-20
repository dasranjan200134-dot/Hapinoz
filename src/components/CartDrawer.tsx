import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../lib/store';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    activeCoupon,
    applyCoupon,
    removeCoupon,
    calculateTotals,
    coupons,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  if (!isOpen) return null;

  const totals = calculateTotals();
  const freeShippingThreshold = 999;
  const progressPercent = Math.min(100, Math.round((totals.subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponFeedback({ type: 'success', message: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#FF6A00]" />
              <h2 className="font-serif font-bold text-lg text-slate-900">Your Cart</h2>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator in Logo-Matched Light Green */}
          <div className="bg-[#EAF8F0]/80 border-b border-[#B8EBD0] p-3.5 px-5">
            <div className="flex items-center justify-between text-xs text-slate-800 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#22C55E]" />
                {totals.subtotal >= freeShippingThreshold ? (
                  <span className="text-[#15803D] font-bold">You unlocked FREE Aroma-Locked Delivery!</span>
                ) : (
                  <span>
                    Add <strong className="font-mono text-[#15803D]">₹{(freeShippingThreshold - totals.subtotal).toFixed(0)}</strong> more for <strong>FREE Delivery</strong>
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-[#15803D] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#DCFCE7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#22C55E] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-slate-800 text-lg">Your bag is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Explore our pure single-origin spice powders crafted with authentic ingredients.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#1E2433] hover:bg-[#FF6A00] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="pt-4 first:pt-0 flex gap-3.5">
                  {/* Thumbnail */}
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif font-bold text-sm text-slate-900 line-clamp-1">
                          {item.product.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-[#FF6A00] font-semibold uppercase tracking-wider mt-0.5">
                        {item.product.category}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 px-2 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-2 text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock_quantity}
                          className="p-1 px-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Coupon & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
              {/* Coupon Box */}
              <div>
                {activeCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-[#EAF8F0] border border-[#B8EBD0] rounded-xl text-xs text-[#15803D]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Tag className="w-4 h-4 text-[#22C55E]" />
                      <span>
                        Applied <strong className="font-mono">{activeCoupon.code}</strong> (
                        {activeCoupon.discount_type === 'percentage'
                          ? `${activeCoupon.amount}% OFF`
                          : `₹${activeCoupon.amount} OFF`}
                        )
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Coupon code (e.g. HAPINOZ10)"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl uppercase font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Quick Available Coupons Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-medium">Popular:</span>
                      {coupons.filter(c => c.is_active).map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCouponInput(c.code);
                            applyCoupon(c.code);
                          }}
                          className="text-[10px] bg-[#EAF8F0] hover:bg-[#22C55E] hover:text-white text-[#15803D] border border-[#B8EBD0] px-2 py-0.5 rounded-md font-mono font-bold cursor-pointer transition-colors"
                        >
                          {c.code}
                        </button>
                      ))}
                    </div>

                    {couponFeedback.type && (
                      <div
                        className={`text-[11px] flex items-center gap-1 mt-1 ${
                          couponFeedback.type === 'success'
                            ? 'text-[#15803D]'
                            : 'text-rose-600'
                        }`}
                      >
                        {couponFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {couponFeedback.message}
                      </div>
                    )}
                  </form>
                )}
              </div>

              {/* Order Calculations Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-[#15803D] font-medium">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-₹{totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Standard Shipping</span>
                  <span className="font-mono">
                    {totals.shippingFee === 0 ? (
                      <span className="text-[#15803D] font-bold uppercase text-[11px] bg-[#EAF8F0] px-1.5 py-0.5 rounded border border-[#B8EBD0]">FREE</span>
                    ) : (
                      `₹${totals.shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST ({totals.taxRate}%)</span>
                  <span className="font-mono">₹{totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base text-slate-900">
                    ₹{totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
