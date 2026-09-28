import React from 'react';
import { X, Printer, Download, CheckCircle2, Package, Truck, Clock, Home, ArrowLeft } from 'lucide-react';
import { Order } from '../types';
import { HapinozLogo } from './HapinozLogo';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
  onBackToHome?: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose, onBackToHome }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleReturnHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      onClose();
    }
  };

  const cgst = order.tax_amount / 2;
  const sgst = order.tax_amount / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-6">
        {/* Controls Bar */}
        <div className="bg-[#161B26] text-white px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00]">
              Tax Invoice & Receipt
            </span>
            <span className="text-xs font-mono text-slate-400">#{order.order_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReturnHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleReturnHome}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close and return to home"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Successful Celebration Banner (Hidden when printed) */}
        <div className="bg-[#EAF8F0] border-b border-[#B8EBD0] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">
                Order Placed Successfully!
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Thank you for choosing HAPINOZ Pure Spices. We have confirmed your order and it will be delivered via <strong>Normal Delivery (takes up to 7 days)</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={handleReturnHome}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Home className="w-4 h-4" />
            <span>Back to Website Home Page</span>
          </button>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 sm:p-10 space-y-8 print:p-0 text-slate-900">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="mb-2">
                <HapinozLogo className="h-9" />
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                HAPINOZ Pure Spices & Food Products Pvt Ltd<br />
                84/2 Agro Spices Park, Indiranagar, Bengaluru - 560038<br />
                FSSAI Central Lic No: <strong className="font-mono text-slate-800">11226334000192</strong><br />
                GSTIN: <strong className="font-mono text-slate-800">29AABCH1234F1Z8</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1">
              <div className="text-sm font-bold font-mono text-slate-900">
                INVOICE: #{order.order_number}
              </div>
              <div className="text-slate-500">
                Date: {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
              <div className="text-slate-500">
                Payment: <strong className="text-slate-800">{order.payment_method}</strong>
              </div>
              {order.razorpay_payment_id && (
                <div className="text-[11px] font-mono text-slate-500">
                  Ref: {order.razorpay_payment_id}
                </div>
              )}
              <div className="mt-2 inline-block">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Payment Status: {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
            <div>
              <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                Billed To
              </h3>
              <p className="font-bold text-slate-900 text-sm">{order.customer_name}</p>
              <p className="text-slate-600">{order.customer_email}</p>
              <p className="text-slate-600 font-mono">{order.customer_phone}</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                Shipping Destination (Normal Delivery • Up to 7 Days)
              </h3>
              <p className="font-semibold text-slate-900">{order.shipping_address.full_name}</p>
              <p className="text-slate-600 leading-relaxed">
                {order.shipping_address.address_line1}
                {order.shipping_address.address_line2 && `, ${order.shipping_address.address_line2}`}
                <br />
                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}
                <br />
                {order.shipping_address.country}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b-2 border-slate-300 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-2">
                      <span className="font-semibold text-slate-900 block">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">HSN: 0910 (Spices & Powders)</span>
                    </td>
                    <td className="py-3 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      ₹{item.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Totals */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-full sm:w-72 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[#22C55E] font-medium">
                  <span>Coupon Discount ({order.coupon_code}):</span>
                  <span className="font-mono">-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Normal Delivery (Up to 7 Days):</span>
                <span className="font-mono">
                  {order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%):</span>
                <span className="font-mono">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (2.5%):</span>
                <span className="font-mono">₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-950 pt-2 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="font-mono text-lg">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tracking & Timeline */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[10px] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#FF6A00]" /> Normal Delivery (Takes up to 7 Days)
              </span>
              <span className="font-mono font-bold text-[#FF6A00]">
                Tracking: {order.tracking_number || 'HPZ-TRK-PENDING'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="font-bold text-slate-800">Order Placed</div>
                <div className="text-slate-400">Confirmed</div>
              </div>
              <div className={`p-2 rounded-lg border ${
                ['processing', 'shipped', 'delivered'].includes(order.status)
                  ? 'bg-orange-50 border-orange-200 text-orange-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div>Processing</div>
                <div className="text-[9px]">Craft Packed</div>
              </div>
              <div className={`p-2 rounded-lg border ${
                ['shipped', 'delivered'].includes(order.status)
                  ? 'bg-orange-50 border-orange-200 text-orange-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div>Shipped</div>
                <div className="text-[9px]">In Transit</div>
              </div>
              <div className={`p-2 rounded-lg border ${
                order.status === 'delivered'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div>Delivered</div>
                <div className="text-[9px]">Signed (7 Days)</div>
              </div>
            </div>
          </div>

          {/* Footer declaration */}
          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100">
            This is a computer-generated tax invoice issued in accordance with GST Rules, 2017. No signature required.
          </div>
        </div>

        {/* Modal Bottom Action Bar (Hidden during print) */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Need any assistance with your order? Our Indian spice concierge is here to help.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handleReturnHome}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Website Home Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

