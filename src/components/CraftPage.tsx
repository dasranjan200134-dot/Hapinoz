import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Award,
  ArrowRight,
  Leaf,
  Flame,
  Package,
  MapPin,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { HapinozLogo } from './HapinozLogo';
import { POUCH_IMAGES } from '../lib/productImages';

interface CraftPageProps {
  onGoToShop: () => void;
  onSelectCategory: (cat: string) => void;
}

export const CraftPage: React.FC<CraftPageProps> = ({ onGoToShop, onSelectCategory }) => {
  const farmRegions = [
    {
      region: 'Jaintia Hills, Meghalaya',
      spice: 'Organic Lakadong Turmeric Powder',
      curcumin: '7.5% - 8.2% Active Curcumin',
      desc: 'Pulverized from high-altitude organic rhizomes. Globally renowned for the world’s highest natural curcumin potency & vibrant golden hue.',
      image: POUCH_IMAGES.turmeric,
      category: 'Pure Spice Powders',
    },
    {
      region: 'Malabar Coast, Tellicherry, Kerala',
      spice: 'Pure Tellicherry Black Pepper Powder',
      curcumin: 'High Piperine & Essential Oils',
      desc: 'Milled from bold TGSEB Tellicherry berries. Cold-processed fresh to release crisp pine and citrus warmth into curries.',
      image: POUCH_IMAGES.garamMasala,
      category: 'Pure Spice Powders',
    },
    {
      region: 'Pampore & Anantnag, Kashmir',
      spice: 'Royal Kashmiri Mirch Powder',
      curcumin: 'Mild Heat & 100% Natural Ruby Color',
      desc: 'Pulverized stemless Kashmiri chillies slow-milled carefully. Imparts an iconic rich red curry hue without artificial coloring.',
      image: POUCH_IMAGES.chilli,
      category: 'Pure Spice Powders',
    },
    {
      region: 'Idukki & Wayanad, Kerala',
      spice: 'Imperial Shahi Garam Masala Powder',
      curcumin: '16 Aromatic Slow-Roasted Spices',
      desc: 'Hand-roasted green cardamom, mace, cinnamon, and cloves micro-milled in small batches for imperial royal aroma.',
      image: POUCH_IMAGES.garamMasala,
      category: 'Blended Masalas',
    },
  ];

  const millingComparison = [
    {
      feature: 'Grinding Temperature',
      hapinoz: 'Strictly below 40°C (Slow Cold Milled)',
      commercial: 'Exceeds 120°C (High-Speed Industrial)',
      winner: true,
    },
    {
      feature: 'Volatile Essential Oils',
      hapinoz: '100% Sealed & Retained',
      commercial: 'Evaporated & Lost to Heat',
      winner: true,
    },
    {
      feature: 'Natural Vibrant Color',
      hapinoz: 'Rich organic color without dyes',
      commercial: 'Often faded; requires dye or polish',
      winner: true,
    },
    {
      feature: 'Artificial Additives & Starch',
      hapinoz: '0% — Pure Spices Only',
      commercial: 'Often diluted with starch & husk',
      winner: true,
    },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 pb-16">
      {/* 1. Hero Header */}
      <section className="relative bg-[#111622] text-white overflow-hidden py-14 sm:py-20 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-[#111622] via-[#1E2738] to-[#111622] opacity-95" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF8F0]/20 text-[#4ADE80] text-xs font-semibold border border-[#22C55E]/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>The Hapinoz Craft & Terroir Philosophy</span>
            </div>

            <div className="space-y-1">
              <HapinozLogo variant="light" className="h-10 sm:h-12" />
              <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-white leading-tight">
                From Single-Origin Soil to Your Kitchen Kadai
              </h1>
            </div>

            <p className="text-slate-300 font-light text-sm sm:text-base leading-relaxed max-w-2xl">
              We started Hapinoz with a simple promise: never let heat or artificial colors ruin authentic Indian spices. We partner directly with heritage farmers and use slow temperature-controlled milling to preserve 100% of the natural aromatic essential oils.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <button
                onClick={onGoToShop}
                className="px-6 py-3 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>Shop All Farm Spices</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sourcing Regions Grid */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-xs uppercase tracking-widest text-[#FF6A00] font-bold">
            Heritage Terroirs
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
            Direct Single-Origin Farm Partnerships
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-light">
            Each spice thrives in its native geography. We source exclusively from micro-climates where soil minerals produce extraordinary essential oil concentrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {farmRegions.map((item) => (
            <div
              key={item.region}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.spice}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 text-white text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                    <span className="truncate">{item.region}</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-serif font-medium text-slate-900 text-base leading-snug">
                    {item.spice}
                  </h3>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6A00] text-[11px] font-medium border border-orange-200/60 font-mono">
                    {item.curcumin}
                  </div>
                  <p className="text-xs text-slate-600 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={() => {
                    onSelectCategory(item.category);
                    onGoToShop();
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-orange-50 hover:text-[#FF6A00] text-slate-800 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <span>Explore {item.category}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF6A00]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. The Cold Milling Difference Table */}
      <section className="py-12 bg-[#111622] text-white border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-1">
            <div className="text-xs uppercase tracking-widest text-[#FF6A00] font-bold">
              The Milling Standard
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-white">
              Aroma-Lock Micro-Milling vs Industrial Pulverizing
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light">
              Why sub-40°C temperature makes your curries richer, brighter, and deeply aromatic.
            </p>
          </div>

          <div className="bg-[#161B26] rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-[#1E2433] text-slate-200">
                    <th className="p-4 font-medium">Quality Attribute</th>
                    <th className="p-4 font-medium text-[#FF6A00]">Hapinoz Cold Process</th>
                    <th className="p-4 font-medium text-slate-400">Commercial Mills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {millingComparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-slate-100">{row.feature}</td>
                      <td className="p-4 text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
                        <span>{row.hapinoz}</span>
                      </td>
                      <td className="p-4 text-slate-400 font-light">{row.commercial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quality Guarantee Purity Pillars */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">100% Lab Tested</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every production batch is tested for active curcumin, piperine levels, moisture limits, and certified 100% free of Sudan dye, lead chromate, and synthetic starch.
            </p>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E] text-white flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Zero Preservatives</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No artificial anti-caking agents (E551), no MSG, and no artificial color enhancers. What you get is purely what nature grew on the farm.
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E2433] text-white flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Nitrogen Aroma-Lock</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Packed inside high-barrier food-grade pouches flushed with nitrogen to protect volatile aromatic molecules from oxygen and UV degradation for up to 12 months.
            </p>
          </div>
        </div>

        {/* Big Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#1E2433] to-[#2B3548] text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-700">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              Taste The Difference In Your Cooking
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              Browse our complete catalog of freshly milled spice powders and handcrafted masalas.
            </p>
          </div>

          <button
            onClick={onGoToShop}
            className="px-8 py-3.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-bold rounded-2xl text-sm transition-all shadow-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Explore Spice Powders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
