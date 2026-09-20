import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Gift,
  Check,
  ShieldCheck,
  Truck,
  Flame,
  Award,
  Layers,
  Sparkle,
} from 'lucide-react';
import { HapinozLogo } from './HapinozLogo';
import { POUCH_IMAGES } from '../lib/productImages';

interface HeroBannerProps {
  onExploreClick: () => void;
  onCraftClick: () => void;
  onCopyCoupon: (code: string) => void;
  copiedCoupon: boolean;
}

const FEATURED_POUCHES = [
  {
    id: 'garam-masala',
    name: 'Garam Masala',
    hindiName: 'शाही गरम मसाला',
    subtitle: '16 Aromatic Royal Spices Blend',
    color: 'from-amber-600/30 to-stone-900/90',
    borderColor: 'border-amber-500/40',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    image: POUCH_IMAGES.garamMasala,
    tasteNote: 'Warm Mace, Cardamom & Star Anise',
  },
  {
    id: 'lakadong-turmeric',
    name: 'Lakadong Turmeric',
    hindiName: 'लकाडोंग हल्दी >7.5%',
    subtitle: 'Meghalaya High-Curcumin Gold',
    color: 'from-yellow-600/30 to-stone-900/90',
    borderColor: 'border-yellow-500/40',
    tagColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    image: POUCH_IMAGES.turmeric,
    tasteNote: 'Rich Golden Yellow & Earthy Aroma',
  },
  {
    id: 'kashmiri-mirch',
    name: 'Kashmiri Mirch',
    hindiName: 'कश्मीरी लाल मिर्च',
    subtitle: '100% Sun-Dried Ruby Red',
    color: 'from-red-600/30 to-stone-900/90',
    borderColor: 'border-red-500/40',
    tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    image: POUCH_IMAGES.chilli,
    tasteNote: 'Vibrant Ruby Color, Gentle Warmth',
  },
  {
    id: 'roasted-jeera',
    name: 'Bhuna Jeera',
    hindiName: 'भुना जीरा पाउडर',
    subtitle: 'Slow-Roasted Rajasthan Seeds',
    color: 'from-amber-700/30 to-stone-900/90',
    borderColor: 'border-amber-600/40',
    tagColor: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
    image: POUCH_IMAGES.jeera,
    tasteNote: 'Nutty, Smoky Digestive Flavor',
  },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onCraftClick,
  onCopyCoupon,
  copiedCoupon,
}) => {
  const [activePouchIndex, setActivePouchIndex] = useState(0);
  const currentPouch = FEATURED_POUCHES[activePouchIndex];

  return (
    <section className="relative overflow-hidden bg-[#111622] text-white border-b border-slate-800">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#161B26] via-[#1E2738] to-[#0E121B] opacity-95" />

      {/* Subtle Pattern Grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Subtitle, CTAs */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border bg-[#EAF8F0]/20 text-[#4ADE80] border-[#22C55E]/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>Aroma-Lock Resealable Zipper Pouches • 100% Pure Indian Spices</span>
            </div>

            {/* Headline with Logo */}
            <div className="space-y-3">
              <div className="inline-block">
                <HapinozLogo variant="light" className="h-10 sm:h-12" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal sm:font-medium tracking-tight text-white leading-tight">
                Authentic Indian Spice Powders in Fresh Zipper Pouches.
              </h1>
            </div>

            {/* Concise Subtitle */}
            <p className="text-slate-300 font-light text-sm sm:text-base leading-relaxed max-w-xl">
              Discover our signature stand-up zipper packs. Pure spices with zero artificial colors, zero added preservatives or fillers, milled to preserve peak natural aroma and deep essential oils.
            </p>

            {/* CTAs & Coupon */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onExploreClick}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-[#22C55E] hover:bg-[#16A34A] text-white transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 shadow-green-950/30"
              >
                <span>Explore Spice Pouches</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onCraftClick}
                className="px-5 py-3 rounded-xl font-medium text-xs sm:text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-slate-600/60 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Our Spice Craft</span>
              </button>

              {/* Coupon Pill */}
              <button
                onClick={() => onCopyCoupon('HAPINOZ10')}
                className="inline-flex items-center gap-2 bg-[#161B26]/90 hover:bg-[#1E2433] border border-slate-700 hover:border-[#22C55E] rounded-xl px-3.5 py-3 text-xs text-slate-200 transition-all cursor-pointer group"
                title="Click to copy coupon code"
              >
                <Gift className="w-3.5 h-3.5 text-[#FF6A00] group-hover:scale-110 transition-transform" />
                <span className="font-mono font-bold text-[#FF6A00]">HAPINOZ10</span>
                <span className="text-[10px] text-slate-400">(10% OFF)</span>
                {copiedCoupon ? (
                  <span className="text-[10px] bg-[#22C55E] text-white px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 group-hover:text-white underline font-normal">
                    Copy
                  </span>
                )}
              </button>
            </div>

            {/* Quick 3 Value Badges */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span>Zero Pesticides</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#FF6A00]" />
                <span>Free Ship &gt; ₹499</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>FSSAI Certified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Pouch Picture Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none space-y-4">
              
              {/* Main Featured Pouch Visual Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900 group aspect-4/3 transition-all duration-500">
                <img
                  src={currentPouch.image}
                  alt={currentPouch.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                {/* Floating Top Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span>Pure Stand-Up Zipper Pouch</span>
                  </span>

                  <span className="bg-[#FF6A00] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    100% Shuddh
                  </span>
                </div>

                {/* Bottom Image Caption Tag */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                  <div className="text-left">
                    <div className="text-base font-bold text-white drop-shadow">
                      Hapinoz {currentPouch.name}
                    </div>
                    <div className="text-xs text-amber-300 font-medium">
                      {currentPouch.hindiName} • {currentPouch.tasteNote}
                    </div>
                  </div>

                  <button
                    onClick={onExploreClick}
                    className="px-3 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer shrink-0"
                  >
                    View Spices
                  </button>
                </div>
              </div>

              {/* Pouch Image Switcher Thumbnails */}
              <div className="grid grid-cols-4 gap-2">
                {FEATURED_POUCHES.map((pouch, idx) => (
                  <button
                    key={pouch.id}
                    onClick={() => setActivePouchIndex(idx)}
                    className={`relative rounded-2xl overflow-hidden border-2 p-1 transition-all cursor-pointer bg-slate-900/90 text-left ${
                      activePouchIndex === idx
                        ? 'border-[#22C55E] ring-2 ring-[#22C55E]/30 scale-105'
                        : 'border-slate-700/80 opacity-70 hover:opacity-100 hover:border-slate-500'
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-1">
                      <img
                        src={pouch.image}
                        alt={pouch.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="px-1 pb-1">
                      <div className="text-[10px] font-bold text-white truncate">{pouch.name}</div>
                      <div className="text-[9px] text-[#4ADE80] font-medium">Aroma-Lock</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Floating Mini Guarantee Card */}
              <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-[#161B26]/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-700 items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#FF6A00] flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="text-left pr-2">
                  <div className="text-xs font-bold text-white">Artisanal Aroma-Locked Milling</div>
                  <div className="text-[10px] text-[#22C55E] font-medium">100% Volatile Aroma Oils Intact</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

