import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  MessageSquare,
  MapPin,
  Flame,
  ChefHat,
  Sparkles,
} from 'lucide-react';
import { Product, ProductReview } from '../types';
import { SAMPLE_REVIEWS } from '../lib/mockData';
import { useStore } from '../lib/store';
import { IndianVegBadge, FssaiBadge } from './IndianFoodBadges';
import { lookupIndianPincode } from '../lib/indianLocations';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCheckoutDirect?: (product: Product, quantity: number) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onOpenCheckoutDirect,
}) => {
  const { addToCart } = useStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>(SAMPLE_REVIEWS);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);
  
  const [quickPin, setQuickPin] = useState('');
  const [pinResult, setPinResult] = useState<string | null>(null);

  const availableSizes = product?.available_sizes || ['100g', '250g', '500g'];
  const [modalSelectedSize, setModalSelectedSize] = useState<string>(
    product?.size || availableSizes[0] || '100g'
  );

  if (!product) return null;

  // Compute pricing for the selected size
  const sizeConfig = product.size_pricing?.[modalSelectedSize];
  const currentPrice = sizeConfig?.price ?? (
    modalSelectedSize === '500g'
      ? Math.round(product.price * 4.2)
      : modalSelectedSize === '250g'
      ? Math.round(product.price * 2.25)
      : product.price
  );
  const currentRegularPrice = sizeConfig?.regular_price ?? (
    product.regular_price
      ? (modalSelectedSize === '500g'
          ? Math.round(product.regular_price * 4.2)
          : modalSelectedSize === '250g'
          ? Math.round(product.regular_price * 2.25)
          : product.regular_price)
      : undefined
  );

  const productWithSize: Product = {
    ...product,
    size: modalSelectedSize,
    price: currentPrice,
    regular_price: currentRegularPrice,
  };

  const isOutOfStock = product.stock_status === 'out_of_stock' || product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const productReviews = reviews.filter((r) => r.product_id === product.id || r.product_id === 'prod-001');

  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPin || quickPin.length !== 6) {
      setPinResult('Please enter a valid 6-digit PIN code.');
      return;
    }
    const info = lookupIndianPincode(quickPin);
    if (info.city) {
      setPinResult(`✅ Fast Delivery to ${info.city}, ${info.state} in ${info.estimatedDays} via ${info.courierPartner}`);
    } else {
      setPinResult(`✅ Delivery serviceable to ${quickPin} in ${info.estimatedDays} with Aroma-Lock guarantee.`);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      product_id: product.id,
      user_name: 'Verified Indian Buyer',
      rating: newRating,
      comment: newComment.trim(),
      created_at: new Date().toISOString(),
    };

    setReviews([newRev, ...reviews]);
    setNewComment('');
    setShowReviewSuccess(true);
    setTimeout(() => setShowReviewSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Gallery Column */}
          <div className="p-6 bg-stone-50 border-r border-stone-200 flex flex-col justify-between">
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-200 mb-4 shadow-inner">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                    <IndianVegBadge size="sm" />
                    <span>100% Shuddh Vegetarian</span>
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-xs border border-slate-700 shadow-md">
                    Net Wt: {modalSelectedSize}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === idx ? 'border-[#FF6A00] ring-2 ring-orange-500/20' : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Indian Trust & Quality Badges */}
            <div className="pt-6 border-t border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <FssaiBadge />
                <span className="text-[11px] font-bold text-[#15803D] bg-[#EAF8F0] px-2 py-0.5 rounded-md border border-[#B8EBD0]">
                  100% Pure &amp; Authentic
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-stone-600">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                  <span>Lab-Certified Pure</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-5 h-5 text-[#FF6A00]" />
                  <span>Aroma-Lock Pouch</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="w-5 h-5 text-[#1E2433]" />
                  <span>Fresh Batch Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            <div>
              {/* Category & Indian Origin Tag */}
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-bold text-[#FF6A00] tracking-wider uppercase">
                  {product.category}
                </span>
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded-md text-stone-600">
                  SKU: {product.sku}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {product.title}
              </h1>

              {/* Rating and Stock */}
              <div className="flex items-center gap-4 my-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-1 text-sm font-semibold text-stone-800">
                  <Star className="w-4 h-4 fill-[#FF6A00] text-[#FF6A00]" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-stone-400 font-normal">({product.reviews_count} verified reviews)</span>
                </div>

                <div className="h-4 w-px bg-stone-200" />

                {isOutOfStock ? (
                  <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Out of stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-semibold text-orange-700 flex items-center gap-1 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5" /> Only {product.stock_quantity} left in stock!
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#15803D] flex items-center gap-1 bg-[#EAF8F0] border border-[#B8EBD0] px-2.5 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> In Stock Fresh Batch
                  </span>
                )}
              </div>

              {/* Pack Size Selector in Modal */}
              <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Select Pouch Size:
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">Resealable Aroma-Lock Pack</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {availableSizes.map((sz) => {
                    const priceForSize = product.size_pricing?.[sz]?.price ?? (
                      sz === '500g'
                        ? Math.round(product.price * 4.2)
                        : sz === '250g'
                        ? Math.round(product.price * 2.25)
                        : product.price
                    );
                    const isSelected = modalSelectedSize === sz;

                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setModalSelectedSize(sz)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E2433] text-white border-[#1E2433] shadow-md ring-2 ring-[#22C55E]/40'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{sz}</div>
                        <div className={`text-xs font-mono font-bold mt-0.5 ${isSelected ? 'text-[#4ADE80]' : 'text-slate-900'}`}>
                          ₹{priceForSize.toLocaleString('en-IN')}
                        </div>
                        <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {sz === '100g' ? 'Aroma Trial' : sz === '250g' ? 'Kitchen Pack' : 'Value Pack'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-stone-900 font-mono">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                  {currentRegularPrice && currentRegularPrice > currentPrice && (
                    <>
                      <span className="text-sm text-stone-400 line-through font-mono">
                        ₹{currentRegularPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-bold text-[#FF6A00] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        Save ₹{(currentRegularPrice - currentPrice).toLocaleString('en-IN')} ({modalSelectedSize})
                      </span>
                    </>
                  )}
                </div>
                <span className="text-xs text-stone-500">Includes all taxes (Spices GST 5% • HSN 0910 • {modalSelectedSize} pack)</span>
              </div>

              {/* Description */}
              <p className="text-sm text-stone-600 leading-relaxed mb-4">
                {product.description}
              </p>

              {/* Indian Pincode Delivery Check */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" /> Check Delivery Pincode:
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Free Shipping &gt; ₹499</span>
                </div>
                <form onSubmit={handleCheckDelivery} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={quickPin}
                    onChange={(e) => setQuickPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN code (e.g. 560001)"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#22C55E] font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#1E2433] hover:bg-[#22C55E] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {pinResult && (
                  <p className="text-xs text-[#15803D] font-medium pt-1 animate-in fade-in">
                    {pinResult}
                  </p>
                )}
              </div>

              {/* Culinary Usage Guide */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl mb-5 text-xs text-amber-900 flex items-start gap-2.5">
                <ChefHat className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Kitchen Savor Tip:</strong>
                  <span className="text-amber-800 text-[11px] leading-relaxed">
                    Add in low flame tadka or near the end of cooking to seal the fresh essential oils and fragrant aroma.
                  </span>
                </div>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Quantity Selector & Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                  <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold font-mono text-stone-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= product.stock_quantity || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                      className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      addToCart(productWithSize, quantity);
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-green-600/20 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <ShoppingBag className="w-4 h-4 text-white" />
                    {isOutOfStock ? 'Sold Out' : `Add ${quantity} × ${modalSelectedSize} to Bag`}
                  </button>

                  {onOpenCheckoutDirect && !isOutOfStock && (
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(productWithSize, quantity);
                        onClose();
                        onOpenCheckoutDirect(productWithSize, quantity);
                      }}
                      className="px-5 py-3 rounded-xl bg-[#1E2433] hover:bg-[#161B26] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                    >
                      Buy Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-stone-900 text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-700" /> Customer Reviews ({productReviews.length})
                </h3>
              </div>

              {/* Review list */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-1">
                {productReviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-stone-800">{rev.user_name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>

              {/* Write Review */}
              <form onSubmit={handleAddReview} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">Write a Review:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewRating(s)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your culinary experience with this spice..."
                    className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-700/20"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Post Review
                  </button>
                </div>

                {showReviewSuccess && (
                  <p className="text-xs text-emerald-700 font-medium animate-in fade-in">
                    Thank you! Your verified review has been posted.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

