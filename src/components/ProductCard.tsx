import React from 'react';
import { Star, ShoppingBag, Eye, AlertCircle, Plus, Minus, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../lib/store';
import { IndianVegBadge } from './IndianFoodBadges';
import { getProductImage, DEFAULT_PRODUCT_IMAGE } from '../lib/imageHelper';

interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
  onSelect?: (product: Product) => void;
  activeFilterSize?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onSelect,
}) => {
  const { addToCart, updateCartQuantity, cart } = useStore();
  const handleSelect = onSelectProduct || onSelect || (() => {});

  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const isOutOfStock = product.stock_status === 'out_of_stock' || product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const discountPercent =
    product.regular_price && product.regular_price > product.price
      ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
      : null;
  const savingsAmount =
    product.regular_price && product.regular_price > product.price
      ? product.regular_price - product.price
      : 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-[#22C55E]/60 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative">
      <div>
        {/* Image Container with Badges */}
        <div
          className="relative aspect-4/3 bg-slate-50 overflow-hidden cursor-pointer"
          onClick={() => handleSelect(product)}
        >
          <img
            src={getProductImage(product, 0)}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
            }}
          />

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
            {/* Logo-Matched Light Green Fresh/Pure Badge with Indian Veg Symbol */}
            <span className="bg-white/95 border border-[#B8EBD0] text-[#15803D] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1.5 backdrop-blur-xs">
              <IndianVegBadge size="sm" />
              <span>100% Pure Shuddh</span>
            </span>

            {discountPercent && (
              <span className="bg-[#FF6A00] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                {discountPercent}% OFF
              </span>
            )}
            {product.is_featured && (
              <span className="bg-[#1E2433] text-white text-[10px] font-medium px-2 py-0.5 rounded-md shadow-2xs">
                Artisan Pick
              </span>
            )}
            {isLowStock && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <AlertCircle className="w-3 h-3" /> Only {product.stock_quantity} left
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-2xs">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quick View Button */}
          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <button
              type="button"
              className="bg-white/95 text-slate-900 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-xs transform translate-y-2 group-hover:translate-y-0 transition-transform"
            >
              <Eye className="w-3.5 h-3.5 text-[#FF6A00]" /> Quick View
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-bold text-[#FF6A00] uppercase tracking-wider text-[10px]">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
              <Star className="w-3.5 h-3.5 fill-[#FF6A00] text-[#FF6A00]" />
              <span className="font-bold text-slate-900 text-xs">{product.rating.toFixed(1)}</span>
              <span className="text-slate-400 text-[10px]">({product.reviews_count})</span>
            </div>
          </div>

          {/* Title */}
          <h3
            onClick={() => handleSelect(product)}
            className="font-serif font-medium text-slate-900 text-base leading-snug line-clamp-2 hover:text-[#FF6A00] transition-colors cursor-pointer"
          >
            {product.title}
          </h3>

          {/* Short description */}
          {product.short_description && (
            <p className="text-xs text-slate-500 font-light mt-1 line-clamp-2 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Sourcing terroir pill */}
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded-lg border border-[#DCFCE7] font-medium">
            <Sparkles className="w-3 h-3 text-[#22C55E] shrink-0" />
            <span className="truncate">Single-Origin • Aroma-Locked Foil Pouch</span>
          </div>
        </div>
      </div>

      {/* Pricing & User-Friendly Action Footer */}
      <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-1 bg-slate-50/50">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.regular_price && product.regular_price > product.price && (
              <span className="text-xs text-slate-400 line-through font-mono">
                ₹{product.regular_price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {savingsAmount > 0 ? (
            <span className="text-[10px] text-[#15803D] font-bold block">
              Save ₹{savingsAmount}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-light block">
              Incl. All Taxes
            </span>
          )}
        </div>

        {/* Dynamic Quantity or Add Button for superior UX with logo-matched light green theme */}
        {quantityInCart > 0 ? (
          <div className="flex items-center bg-[#EAF8F0] border border-[#22C55E] rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateCartQuantity(product.id, quantityInCart - 1);
              }}
              className="w-7 h-7 rounded-lg bg-white text-[#15803D] hover:bg-slate-100 flex items-center justify-center font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-mono font-bold text-xs text-[#15803D]">
              {quantityInCart}
            </span>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                updateCartQuantity(product.id, quantityInCart + 1);
              }}
              className="w-7 h-7 rounded-lg bg-[#22C55E] text-white hover:bg-[#16A34A] flex items-center justify-center font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(product);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-sm hover:shadow-md active:scale-95'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
            <span>{isOutOfStock ? 'Sold Out' : 'Select Options'}</span>
          </button>
        )}
      </div>
    </div>
  );
};



