import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  X,
  Flame,
  Truck,
  CheckCircle2,
  MapPin,
  Filter,
  Layers,
  Package,
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { lookupIndianPincode } from '../lib/indianLocations';
import { IndianVegBadge, FssaiBadge } from './IndianFoodBadges';

interface ShopPageProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  onCopyCoupon: (code: string) => void;
  copiedCoupon: boolean;
  initialSize?: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onCopyCoupon,
  copiedCoupon,
  initialSize = 'all',
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ checked: boolean; valid: boolean; message: string } | null>(null);

  useEffect(() => {
    if (initialSize) {
      setSelectedSize(initialSize);
    }
  }, [initialSize]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['all', ...cats];
  }, [products]);

  // Count products by pack sizes
  const sizeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.filter((p) => p.is_active).length,
      '100g': 0,
      '250g': 0,
      '500g': 0,
    };

    products.forEach((p) => {
      if (!p.is_active) return;
      if (p.available_sizes?.includes('100g') || p.size === '100g' || p.size_pricing?.['100g']) {
        counts['100g']++;
      }
      if (p.available_sizes?.includes('250g') || p.size === '250g' || p.size_pricing?.['250g']) {
        counts['250g']++;
      }
      if (p.available_sizes?.includes('500g') || p.size === '500g' || p.size_pricing?.['500g']) {
        counts['500g']++;
      }
    });

    return counts;
  }, [products]);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6 || isNaN(Number(pincode))) {
      setPincodeStatus({ checked: true, valid: false, message: 'Please enter a valid 6-digit Indian PIN code' });
      return;
    }
    const info = lookupIndianPincode(pincode);
    if (info.city) {
      setPincodeStatus({
        checked: true,
        valid: true,
        message: `⚡ Express Serviceable to ${info.city}, ${info.state} — Delivery in ${info.estimatedDays} via ${info.courierPartner}! Free delivery on orders above ₹499.`,
      });
    } else {
      setPincodeStatus({
        checked: true,
        valid: true,
        message: `⚡ Serviceable to PIN ${pincode} in ${info.estimatedDays} via ${info.courierPartner}. Fresh batch guaranteed!`,
      });
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let list = products.filter((product) => {
      if (!product.is_active) return false;

      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Size filter (100g, 250g, 500g)
      if (selectedSize !== 'all') {
        const matchesAvailableSizes = product.available_sizes?.includes(selectedSize);
        const matchesCurrentSize = product.size === selectedSize;
        const matchesPricing = Boolean(product.size_pricing?.[selectedSize]);
        const matchesTitle = product.title.toLowerCase().includes(selectedSize.toLowerCase());

        if (!matchesAvailableSizes && !matchesCurrentSize && !matchesPricing && !matchesTitle) {
          return false;
        }
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      return (
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.tags.some((t) => t.toLowerCase().includes(query))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    });
  }, [products, searchQuery, sortBy, selectedCategory, selectedSize]);

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Page Header Banner */}
      <section className="bg-gradient-to-r from-[#111622] via-[#1E2738] to-[#111622] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF8F0]/15 border border-[#22C55E]/40 text-[#4ADE80] text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>Small-Batch Pure Spice Powders • Stand-Up Zipper Pouches</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-white">
              Authentic Pure Spice Powders
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
              100% pure single-origin Indian spices milled with care to preserve authentic aroma and color. Filter by your preferred pouch size or spice category.
            </p>
          </div>

          {/* Special Promo Coupon Badge */}
          <div className="bg-[#161B26]/90 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-[#FF6A00] tracking-wider">Launch Discount</div>
              <div className="text-xs text-slate-300 font-light">Flat 10% OFF on all orders</div>
            </div>
            <button
              onClick={() => onCopyCoupon('HAPINOZ10')}
              className="px-3.5 py-1.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {copiedCoupon ? 'COPIED!' : 'HAPINOZ10'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Filters & Pincode Reassurance Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        {/* Dual Filter Row: Size Filter Bar & Category Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
          
          {/* Size Filter Bar (100g, 250g, 500g) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px] shrink-0 mr-1 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#FF6A00]" /> Pouch Size:
              </span>
              {[
                { key: 'all', label: 'All Sizes', sub: `(${sizeCounts.all})` },
                { key: '100g', label: '100g Trial Pack', sub: `(${sizeCounts['100g']})` },
                { key: '250g', label: '250g Kitchen Pack', sub: `(${sizeCounts['250g']})` },
                { key: '500g', label: '500g Value Pack', sub: `(${sizeCounts['500g']})` },
              ].map((sz) => (
                <button
                  key={sz.key}
                  onClick={() => setSelectedSize(sz.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedSize === sz.key
                      ? 'bg-[#1E2433] text-white font-bold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-transparent'
                  }`}
                >
                  <span>{sz.label}</span>
                  <span className={`text-[10px] ${selectedSize === sz.key ? 'text-[#4ADE80]' : 'text-slate-400'}`}>
                    {sz.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Pincode Estimator Form */}
            <form onSubmit={handleCheckPincode} className="flex items-center gap-2 shrink-0">
              <div className="relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-[#22C55E] rounded-xl px-2.5 py-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mr-1.5" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    if (pincodeStatus) setPincodeStatus(null);
                  }}
                  placeholder="Enter PIN code"
                  className="w-28 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-hidden font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Check
              </button>
            </form>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#22C55E]" /> Spice Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#EAF8F0] border border-[#22C55E] text-[#15803D] font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-transparent'
                }`}
              >
                {cat === 'all' ? 'All Spice Powders' : cat}
              </button>
            ))}
          </div>

        </div>

        {pincodeStatus && (
          <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
            pincodeStatus.valid
              ? 'bg-[#EAF8F0] text-[#15803D] border border-[#B8EBD0]'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {pincodeStatus.valid ? (
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
            ) : (
              <X className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{pincodeStatus.message}</span>
          </div>
        )}
      </div>

      {/* 3. Main Product Catalog Grid & Quick Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Controls Bar: Search summary & Sort By */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600 w-full sm:w-auto">
            <span>
              Showing <strong className="text-slate-900 font-bold">{filteredAndSortedProducts.length}</strong> handcrafted spice powders
            </span>
            {selectedSize !== 'all' && (
              <span className="bg-slate-900 text-white px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                Size: {selectedSize}
                <button
                  onClick={() => setSelectedSize('all')}
                  className="hover:text-red-300 cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(searchQuery || selectedCategory !== 'all' || selectedSize !== 'all') && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setSelectedCategory('all');
                  setSelectedSize('all');
                }}
                className="text-[#FF6A00] font-medium hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Reset all filters</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-light">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/30 cursor-pointer"
            >
              <option value="featured">Featured Artisans</option>
              <option value="rating">Highest Customer Rating</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-white rounded-3xl border border-slate-200 p-8 my-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-slate-900">
              No matching spice powders found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your size filter ({selectedSize}) or searching for terms like "turmeric", "kashmiri", "pepper", "jeera", or "garam masala".
            </p>
            <button
              onClick={() => {
                onSearchChange('');
                setSelectedCategory('all');
                setSelectedSize('all');
              }}
              className="px-4 py-2 bg-[#1E2433] hover:bg-[#22C55E] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              View All Spice Powders
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                activeFilterSize={selectedSize !== 'all' ? selectedSize : undefined}
              />
            ))}
          </div>
        )}

        {/* Quality Guarantee Strip with Light Green Accent */}
        <div className="mt-12 p-6 rounded-3xl bg-[#EAF8F0]/70 border border-[#B8EBD0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span>
              <strong className="text-[#15803D]">100% Purity & Terroir Guarantee:</strong> Every batch is third-party lab certified for zero pesticides, zero artificial colors, and natural essential oils intact in moisture-resistant zipper pouches.
            </span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#FF6A00] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <Flame className="w-4 h-4 text-[#FF6A00]" />
            <span>Aroma-Locked Milling (&lt;40°C)</span>
          </div>
        </div>
      </div>
    </div>
  );
};


