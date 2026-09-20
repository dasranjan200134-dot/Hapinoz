import React from 'react';
import { ShieldCheck, Award, Leaf, CheckCircle2 } from 'lucide-react';

export const IndianVegBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'sm',
  className = '',
}) => {
  const dimensions =
    size === 'sm'
      ? { box: 'w-3.5 h-3.5 border', dot: 'w-1.5 h-1.5' }
      : size === 'md'
      ? { box: 'w-4 h-4 border-[1.5px]', dot: 'w-2 h-2' }
      : { box: 'w-5 h-5 border-2', dot: 'w-2.5 h-2.5' };

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="100% Pure Vegetarian Food Product (Green Dot Mandate)"
    >
      <div
        className={`${dimensions.box} border-emerald-600 bg-white rounded-xs flex items-center justify-center p-[1px] shrink-0 shadow-2xs`}
      >
        <div className={`${dimensions.dot} rounded-full bg-emerald-600`} />
      </div>
      {size !== 'sm' && (
        <span className="text-[11px] font-bold text-emerald-800 tracking-tight">100% VEG</span>
      )}
    </div>
  );
};

export const FssaiBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-mono font-medium border border-slate-700 shadow-2xs ${className}`}
      title="Food Safety and Standards Authority of India Certified"
    >
      <span className="font-sans font-black text-amber-400">fssai</span>
      <span className="text-slate-400">|</span>
      <span className="text-slate-200">Lic. 10021043000123</span>
    </div>
  );
};

export const IndianQualityPillars: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-[#EAF8F0]/70 border border-[#B8EBD0] p-3.5 rounded-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">100% Shuddh & Pure</div>
          <div className="text-[11px] text-slate-600">Zero Added Colors or MSG</div>
        </div>
      </div>

      <div className="bg-orange-50/70 border border-orange-200/80 p-3.5 rounded-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Leaf className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">Direct From Kisan</div>
          <div className="text-[11px] text-slate-600">Single-Origin Terroirs</div>
        </div>
      </div>

      <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">Slow Cold Milled</div>
          <div className="text-[11px] text-slate-600">Fresh Milled Below 40°C</div>
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1E2433] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">Pan-India Delivery</div>
          <div className="text-[11px] text-slate-600">Aroma-Lock Foil Pouches</div>
        </div>
      </div>
    </div>
  );
};
