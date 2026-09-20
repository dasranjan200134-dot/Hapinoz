import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Leaf, 
  HeartHandshake, 
  Award, 
  ArrowRight,
  Sun,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface AboutPageProps {
  onGoToShop: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onGoToShop }) => {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-[#111622] text-slate-100 py-16 sm:py-24 border-b border-slate-800">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#FF6A00_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-xs font-medium tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Our Heritage & Purpose</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Restoring the Lost Purity of Traditional Indian Spices
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
            Hapinoz was born from a simple belief: genuine Indian spices should never be adulterated with spent powders, chemical extracts, artificial colorants, or high-friction heat grinding.
          </p>
        </div>
      </section>

      {/* Story & Philosophy Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest">
              The Story
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 leading-snug">
              From Sacred Soil to Your Family Kitchen
            </h2>
            <p className="text-slate-600 font-light text-sm leading-relaxed">
              Industrial mass production often strips spices of their natural volatile essential oils through high-speed hammer mills that heat spices above 80°C. This destroys the medicinal curcumin in turmeric, the delicate linalool in coriander, and the pungent piperine in black pepper.
            </p>
            <p className="text-slate-600 font-light text-sm leading-relaxed">
              At Hapinoz, we exclusively grind our spices using slow temperature-controlled milling running under 40°C. This meticulous technique locks in 100% of the natural aromas, deep therapeutic colors, and authentic farm flavor.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
                <div className="font-serif font-bold text-2xl text-[#FF6A00]">100%</div>
                <div className="text-xs text-slate-500 font-light mt-1">Single-Origin Sourced</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="font-serif font-bold text-2xl text-[#22C55E]">&lt; 40°C</div>
                <div className="text-xs text-slate-500 font-light mt-1">Slow Cold Milled</div>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
            <img 
              src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80" 
              alt="Hapinoz Spice Crafting"
              className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
              <div className="text-white space-y-1">
                <div className="text-xs uppercase tracking-wider text-[#FF6A00] font-semibold">Artisanal Milling</div>
                <div className="font-serif text-lg font-bold">Temperature Controlled Micro-Milling</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Hapinoz Quality */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest">
              Guaranteed Standard
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Our 4 Pillars of Spice Purity
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Every single batch of Hapinoz spice powder passes stringent quality and lab checks before it arrives at your doorstep.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6A00] border border-orange-200">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">Zero Additives</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No MSG, no artificial colors, no synthetic preservatives, and zero starch or filler powders.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6A00] border border-orange-200">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">Cold Micro-Milled</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Slow temperature-controlled grinding preserving volatile essential aroma oils and authentic therapeutic benefits.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6A00] border border-orange-200">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">Direct Farmer Trade</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct partnerships with smallholder spice growers across Meghalaya, Malabar, Kashmir, and Rajasthan.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#22C55E] border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">Aroma Sealed</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Food-grade multilayer nitrogen-flushed packaging ensures freshness from day one until the last pinch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sourcing Origin Highlight */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#111622] via-[#1E2738] to-[#111622] text-white rounded-3xl p-8 sm:p-12 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest">
              Direct Single-Origin
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">
              Experience the True Taste of India
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Explore our small-batch pure spice powders crafted for home cooks, passionate foodies, and professional chefs who refuse to compromise on flavor.
            </p>
          </div>

          <button
            onClick={onGoToShop}
            className="px-6 py-3.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-green-950/30 shrink-0 hover:scale-[1.02] active:scale-95"
          >
            <span>Explore Spice Powders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
