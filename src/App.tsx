import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Package,
  Flame,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useStore } from './lib/store';
import { Product, Order } from './types';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HapinozLogo } from './components/HapinozLogo';
import { HeroBanner } from './components/HeroBanner';
import { ShopPage } from './components/ShopPage';
import { CraftPage } from './components/CraftPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { WhatsAppFloatingSupport } from './components/WhatsAppFloatingSupport';
import { IndianVegBadge, FssaiBadge } from './components/IndianFoodBadges';
import spiceMillingImg from './assets/images/spice_milling_craft_1789702023820.jpg';

export default function App() {
  const { products } = useStore();

  // Navigation State: 'home' | 'spice_powders' | 'craft' | 'about' | 'contact' | 'user_dashboard' | 'admin_dashboard'
  const [currentView, setCurrentView] = useState<'home' | 'spice_powders' | 'craft' | 'about' | 'contact' | 'user_dashboard' | 'admin_dashboard'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const handleCopyCoupon = (code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
    } catch {}
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleOrderComplete = (order: Order) => {
    setLastPlacedOrder(order);
    setSelectedInvoiceOrder(order);
  };

  // If Admin View is active, render full-screen WooCommerce Admin Dashboard
  if (currentView === 'admin_dashboard') {
    return (
      <>
        <AdminDashboard
          onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
          onExitAdmin={() => setCurrentView('home')}
          onViewProductOnLiveStore={(product) => {
            setSelectedProduct(product);
            setCurrentView('spice_powders');
          }}
        />
        {selectedInvoiceOrder && (
          <InvoiceModal
            order={selectedInvoiceOrder}
            onClose={() => setSelectedInvoiceOrder(null)}
            onBackToHome={() => {
              setSelectedInvoiceOrder(null);
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-amber-800 selection:text-white antialiased font-sans">
      {/* Global Store Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setCurrentView('admin_dashboard')}
        onOpenDashboard={() => setCurrentView('user_dashboard')}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        isAdminView={false}
        onToggleAdminView={() => setCurrentView('admin_dashboard')}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Order Placed Success Banner (if any) */}
        {lastPlacedOrder && (
          <div className="bg-emerald-900 text-white py-3.5 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  Order <strong>#{lastPlacedOrder.order_number}</strong> placed successfully via Razorpay!
                  Paid ₹{lastPlacedOrder.total.toFixed(2)}.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedInvoiceOrder(lastPlacedOrder)}
                  className="px-3 py-1 bg-white text-emerald-950 font-bold rounded-lg text-xs cursor-pointer hover:bg-emerald-50"
                >
                  View GST Invoice
                </button>
                <button
                  onClick={() => setLastPlacedOrder(null)}
                  className="text-stone-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View 1: Customer Account Dashboard */}
        {currentView === 'user_dashboard' && (
          <UserDashboard
            onViewInvoice={(order) => setSelectedInvoiceOrder(order)}
          />
        )}

        {/* View 2: Spice Powders Collection */}
        {currentView === 'spice_powders' && (
          <ShopPage
            products={products}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onCopyCoupon={(code) => handleCopyCoupon(code)}
            copiedCoupon={copiedCoupon}
          />
        )}

        {/* View 3: Our Craft & Heritage */}
        {currentView === 'craft' && (
          <CraftPage
            onGoToShop={() => setCurrentView('spice_powders')}
            onSelectCategory={() => setCurrentView('spice_powders')}
          />
        )}

        {/* View 4: About Us */}
        {currentView === 'about' && (
          <AboutPage
            onGoToShop={() => setCurrentView('spice_powders')}
          />
        )}

        {/* View 5: Contact Us */}
        {currentView === 'contact' && (
          <ContactPage />
        )}

        {/* View 6: Home Page */}
        {currentView === 'home' && (
          <div>
            {/* Minimal & High-Impact Hero Banner */}
            <HeroBanner
              onExploreClick={() => setCurrentView('spice_powders')}
              onCraftClick={() => setCurrentView('craft')}
              onCopyCoupon={(code) => handleCopyCoupon(code)}
              copiedCoupon={copiedCoupon}
            />

            {/* 4 Value Propositions with Logo-Matched Light Green Accents */}
            <section className="border-b border-slate-200 bg-white py-6 shadow-2xs">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-700">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EAF8F0]/70 border border-[#B8EBD0]">
                    <div className="w-10 h-10 rounded-xl bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#15803D] text-xs">Express Delivery</div>
                      <div className="text-[11px] text-slate-500 font-light">Free above ₹499</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EAF8F0]/70 border border-[#B8EBD0]">
                    <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#15803D] text-xs">100% Pure Tested</div>
                      <div className="text-[11px] text-slate-500 font-light">Zero artificial colors</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6A00] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Slow Micro-Milled</div>
                      <div className="text-[11px] text-slate-500 font-light">&lt; 40°C temperature control</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#EAF8F0]/70 border border-[#B8EBD0]">
                    <div className="w-10 h-10 rounded-xl bg-[#15803D] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-[#15803D] text-xs">Aroma Guaranteed</div>
                      <div className="text-[11px] text-slate-500 font-light">12-Month Freshness</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Flagship Pure Spice Powders (The 6 Products) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#15803D] font-bold mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    Small Batch Terroir Harvest
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                    Flagship Pure Spice Powders
                  </h2>
                  <p className="text-xs text-slate-500 font-light mt-1">
                    Carefully crafted from high-potency single-origin harvests across India with zero heat degradation.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView('spice_powders')}
                  className="px-5 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-green-600/20 self-start sm:self-auto"
                >
                  <span>View All Spice Powders</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* 6 Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.filter(p => p.is_active).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </section>

            {/* The Hapinoz Craft Breakdown */}
            <section className="py-14 bg-white border-y border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  {/* Left Column: Artisanal Milling Visual */}
                  <div className="lg:col-span-6 relative">
                    <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group aspect-16/11">
                      <img
                        src={spiceMillingImg}
                        alt="Authentic pure Indian spices and artisanal milling craft"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5 text-white">
                        <div className="font-serif font-medium text-lg">Artisanal Aroma-Lock Milling</div>
                        <div className="text-xs text-[#FF6A00] font-light">Natural slow temperature-controlled process below 40°C</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 4 Clean Key Benefits */}
                  <div className="lg:col-span-6 space-y-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-[#FF6A00] font-bold mb-1">
                        The Hapinoz Craft
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 leading-tight">
                        Why Pure Artisanal Spice Powders Taste Incomparably Richer
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200">
                        <div className="w-8 h-8 rounded-lg bg-[#FF6A00] text-white flex items-center justify-center mb-2 font-medium shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h4 className="font-serif font-medium text-sm text-slate-900">&lt; 40°C Cold Milling</h4>
                        <p className="text-xs text-slate-600 font-light mt-1 leading-relaxed">
                          Locks in natural volatile aroma oils and medicinal curcumin.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                        <div className="w-8 h-8 rounded-lg bg-[#22C55E] text-white flex items-center justify-center mb-2 font-medium shadow-xs">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-serif font-medium text-sm text-slate-900">Zero Adulterants</h4>
                        <p className="text-xs text-slate-600 font-light mt-1 leading-relaxed">
                          Zero artificial food color, zero starch, and no chemicals.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-8 h-8 rounded-lg bg-[#1E2433] text-white flex items-center justify-center mb-2 font-medium shadow-xs">
                          <Package className="w-4 h-4" />
                        </div>
                        <h4 className="font-serif font-medium text-sm text-slate-900">Aroma-Lock Pouches</h4>
                        <p className="text-xs text-slate-600 font-light mt-1 leading-relaxed">
                          Nitrogen-flushed multilayer foil keeps peak potency for 12 months.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80">
                        <div className="w-8 h-8 rounded-lg bg-[#FF6A00] text-white flex items-center justify-center mb-2 font-medium shadow-xs">
                          <Award className="w-4 h-4" />
                        </div>
                        <h4 className="font-serif font-medium text-sm text-slate-900">Single-Origin Terroirs</h4>
                        <p className="text-xs text-slate-600 font-light mt-1 leading-relaxed">
                          Direct sourcing from Meghalaya, Malabar, and Rajasthan.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center gap-4">
                      <button
                        onClick={() => setCurrentView('craft')}
                        className="text-xs font-medium text-[#1E2433] hover:text-[#FF6A00] flex items-center gap-1.5 cursor-pointer group transition-colors"
                      >
                        <span>Read our complete sourcing & milling story</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#FF6A00]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Experience CTA */}
            <section className="relative overflow-hidden bg-gradient-to-r from-[#111622] via-[#1E2738] to-[#111622] text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-400/30">
                    <Flame className="w-3.5 h-3.5 text-[#FF6A00]" />
                    <span>Pure Taste In Every Pinch</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium leading-tight text-white">
                    Experience Pure Authentic Spices
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 font-light">
                    Enjoy authentic home-style aroma, rich natural color, and health benefits in every meal.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView('spice_powders')}
                  className="px-6 py-3 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shrink-0 hover:scale-[1.02] active:scale-95"
                >
                  <span>Shop Spice Powders</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Simplified Global Footer */}
      <footer className="bg-[#111622] text-slate-400 text-xs border-t border-slate-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <HapinozLogo variant="light" className="h-10" />
              <p className="text-xs leading-relaxed text-slate-300 pt-1 font-light">
                Authentic Indian single-origin spices and pure spice powders crafted with authentic ingredients and zero additives.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-white uppercase tracking-wider text-xs mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <button onClick={() => setCurrentView('home')} className="hover:text-[#FF6A00] cursor-pointer transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('spice_powders')} className="hover:text-[#FF6A00] cursor-pointer font-medium text-[#FF6A00] transition-colors">
                    Spice Powders ({products.filter(p => p.is_active).length})
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('craft')} className="hover:text-[#FF6A00] cursor-pointer transition-colors">
                    Our Craft & Terroir
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('about')} className="hover:text-[#FF6A00] cursor-pointer transition-colors">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('contact')} className="hover:text-[#FF6A00] cursor-pointer transition-colors">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white uppercase tracking-wider text-xs mb-3">
                Customer Care & Help
              </h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <button onClick={() => setCurrentView('user_dashboard')} className="hover:text-white cursor-pointer transition-colors">
                    Track Orders & Account
                  </button>
                </li>
                <li>
                  <a href="mailto:care@hapinoz.com" className="hover:text-[#FF6A00] transition-colors">
                    care@hapinoz.com
                  </a>
                </li>
                <li>
                  <span className="text-slate-300 font-light">Helpline: +91 98765 43210</span>
                </li>
                <li className="font-mono text-[11px] text-[#FF6A00]">
                  Coupon: HAPINOZ10 (10% Off)
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white uppercase tracking-wider text-xs mb-3">
                FSSAI & Standards
              </h4>
              <p className="text-xs leading-relaxed text-slate-300 font-light">
                Hapinoz Foods & Spices Private Limited<br />
                FSSAI Lic. No: <span className="font-mono text-emerald-400">10022099000123</span><br />
                100% Lab Tested Pure & Fresh Milled
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span>© 2026 HAPINOZ Spices. All rights reserved.</span>
              <span className="hidden sm:inline text-stone-700">•</span>
              <a
                href="https://www.aksglobaltech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-[#22C55E] transition-colors font-medium tracking-wide uppercase text-[11px] inline-flex items-center gap-1"
              >
                <span>POWERED BY</span>
                <span className="text-stone-200 hover:text-[#22C55E] font-bold">AKS GLOBAL TECH</span>
              </a>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('admin_dashboard')}
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                Store Admin
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCheckoutDirect={(prod) => {
          setSelectedProduct(null);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderComplete={handleOrderComplete}
      />

      {/* GST Tax Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
        onBackToHome={() => {
          setSelectedInvoiceOrder(null);
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* WhatsApp Indian Live Chat Support */}
      <WhatsAppFloatingSupport />
    </div>
  );
}
