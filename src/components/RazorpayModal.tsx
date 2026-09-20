import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { RazorpayCustomerDetails } from '../lib/razorpay';

interface RazorpayModalProps {
  isOpen: boolean;
  orderId: string;
  amount: number;
  customer: RazorpayCustomerDetails;
  onClose: () => void;
  onSuccess: () => void;
  onFail: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  orderId,
  amount,
  customer,
  onClose,
  onSuccess,
  onFail,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl border border-slate-200">
        {/* Razorpay Authentic Blue/Navy Header */}
        <div className="bg-[#1E2433] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF6A00] text-white font-serif font-black flex items-center justify-center text-sm shadow-inner">
              H
            </div>
            <div>
              <div className="font-semibold text-sm tracking-wide">HAPINOZ SPICES</div>
              <div className="text-xs text-slate-300 font-mono">Order: {orderId}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Razorpay Banner & Trust Badge */}
        <div className="bg-orange-50/80 px-6 py-2.5 border-b border-orange-100 flex items-center justify-between text-xs text-slate-800">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#FF6A00]" /> Razorpay Trusted Sandbox Gateway
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">₹{amount.toFixed(2)}</span>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer prefill summary */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex justify-between">
            <div>
              <span className="font-medium text-slate-800">{customer.name}</span>
              <div className="text-slate-500">{customer.email}</div>
            </div>
            <div className="text-right text-slate-500 font-mono">{customer.phone}</div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('upi')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  selectedMethod === 'upi'
                    ? 'border-[#FF6A00] bg-orange-50 text-[#FF6A00] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1 text-[#FF6A00]" />
                UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'border-[#FF6A00] bg-orange-50 text-[#FF6A00] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-[#FF6A00]" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('netbanking')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  selectedMethod === 'netbanking'
                    ? 'border-[#FF6A00] bg-orange-50 text-[#FF6A00] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Building className="w-5 h-5 mb-1 text-[#FF6A00]" />
                NetBanking
              </button>
            </div>
          </div>

          {/* Method Content */}
          {selectedMethod === 'upi' && (
            <div className="space-y-2">
              <label className="text-xs text-slate-600 font-medium">Enter Virtual Payment Address (VPA)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00] font-mono"
              />
              <div className="flex gap-2 pt-1">
                {['@okaxis', '@okhdfcbank', '@paytm', '@ybl'].map((suf) => (
                  <button
                    key={suf}
                    type="button"
                    onClick={() => setUpiId(`user${suf}`)}
                    className="text-[11px] bg-slate-100 hover:bg-orange-100 hover:text-[#FF6A00] px-2 py-0.5 rounded-md text-slate-600 cursor-pointer transition-colors"
                  >
                    {suf}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                <span className="font-semibold block text-slate-800 mb-1">Razorpay Sandbox Test Card</span>
                Card: <code className="font-mono text-[#FF6A00] font-bold">4111 2222 3333 4444</code> | Expiry: 12/28 | CVV: 123
              </div>
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <div className="space-y-2 text-xs">
              <select className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-700">
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>State Bank of India</option>
                <option>Axis Bank</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={processing}
              onClick={handlePay}
              className="w-full py-3 bg-[#1E2433] hover:bg-[#FF6A00] text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  Pay ₹{amount.toFixed(2)} Securely
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onFail}
              className="w-full py-2 text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Simulate Payment Failure / Cancel
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>PCI-DSS Level 1 Compliant</span>
          <span className="font-semibold text-slate-700">Powered by Razorpay</span>
        </div>
      </div>
    </div>
  );
};
