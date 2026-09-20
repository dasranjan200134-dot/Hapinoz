import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Sparkles,
  LayoutDashboard,
  X,
  PhoneCall,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { HapinozLogo } from './HapinozLogo';

interface HeaderProps {
  currentView: 'home' | 'spice_powders' | 'craft' | 'about' | 'contact' | 'user_dashboard' | 'admin_dashboard';
  onNavigate: (view: 'home' | 'spice_powders' | 'craft' | 'about' | 'contact') => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenDashboard: (tab?: 'orders' | 'addresses' | 'profile') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenCart,
  onOpenAuth,
  onOpenAdmin,
  onOpenDashboard,
  searchQuery,
  onSearchChange,
  isAdminView,
  onToggleAdminView,
}) => {
  const { cart, currentUser, logout, products } = useStore();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const activeProductsCount = products.filter(p => p.is_active).length;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200">
      {/* 1. Top Craft Announcement & Support Strip with Logo-Matched Light Green Accents */}
      <div className="bg-[#161B26] text-slate-300 text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EAF8F0] text-[#15803D] border border-[#22C55E]/40 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
              PURE & NATURAL
            </span>
            <span className="text-[11px] sm:text-xs text-slate-200">
              Pure Indian Spice Powders: Use coupon <strong className="text-[#FF6A00] font-mono font-bold">HAPINOZ10</strong> for 10% OFF | Free Aroma-Locked Delivery above ₹499
            </span>
          </div>

          <div className="hidden md:flex items-center gap-5 text-slate-400 text-[11px]">
            <button
              onClick={() => {
                if (currentUser) {
                  onOpenDashboard('orders');
                } else {
                  onOpenAuth();
                }
              }}
              className="hover:text-[#22C55E] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Track Order</span>
            </button>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Care: +91 98765 43210</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-[#22C55E] font-medium bg-[#22C55E]/10 px-2 py-0.5 rounded-md border border-[#22C55E]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>100% Lab Tested</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 lg:gap-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('home');
              }}
              className="text-left group flex items-center cursor-pointer transition-transform active:scale-95"
              aria-label="Hapinoz Home"
            >
              <HapinozLogo className="h-10 sm:h-12" />
            </button>
          </div>

          {/* Simple Clean Navigation (Home, Spice Powders, Our Craft, About, Contact) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('home');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'bg-[#22C55E] text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-[#15803D] hover:bg-slate-200/70'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('spice_powders');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentView === 'spice_powders'
                  ? 'bg-[#22C55E] text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-[#15803D] hover:bg-slate-200/70'
              }`}
            >
              <span>Spice Powders</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                currentView === 'spice_powders' ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {activeProductsCount}
              </span>
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('craft');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentView === 'craft'
                  ? 'bg-[#22C55E] text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-[#15803D] hover:bg-slate-200/70'
              }`}
            >
              Our Craft
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('about');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentView === 'about'
                  ? 'bg-[#22C55E] text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-[#15803D] hover:bg-slate-200/70'
              }`}
            >
              About
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('contact');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentView === 'contact'
                  ? 'bg-[#22C55E] text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-[#15803D] hover:bg-slate-200/70'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Simple Clean Search Input */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <div className="w-full flex items-center bg-slate-50 border border-slate-200 focus-within:border-[#22C55E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#22C55E]/20 rounded-full transition-all shadow-2xs overflow-hidden px-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentView !== 'spice_powders' && e.target.value.trim().length > 0) {
                    onNavigate('spice_powders');
                  }
                }}
                onFocus={() => {
                  if (currentView !== 'spice_powders' && searchQuery.trim().length > 0) {
                    onNavigate('spice_powders');
                  }
                }}
                placeholder="Search turmeric, mirch, jeera, pepper..."
                className="w-full pl-2 pr-2 py-2 text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons (User Account / Admin Persona & Cart) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Conditional Authentication & Persona Display */}
            {!currentUser ? (
              /* Case 1: Visitor / Not Signed In - Show Sign In */
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#1E2433] hover:bg-[#EAF8F0] hover:text-[#15803D] hover:border-[#22C55E]/40 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
              >
                <UserIcon className="w-4 h-4 text-[#22C55E]" />
                <span>Sign In</span>
              </button>
            ) : currentUser.role === 'admin' ? (
              /* Case 2: Admin Signed In - Show Admin Persona ONLY */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                    isAdminView
                      ? 'bg-[#1E2433] text-white border-[#161B26] shadow-xs ring-2 ring-[#22C55E]/40'
                      : 'bg-[#EAF8F0] hover:bg-emerald-100/90 text-[#15803D] border-[#22C55E]/50'
                  }`}
                  title="Admin Account & Dashboard"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#22C55E] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#15803D] leading-none">
                      Admin
                    </span>
                    <span className="text-xs font-bold text-slate-900 max-w-[85px] truncate leading-tight mt-0.5">
                      {currentUser.full_name.split(' ')[0]}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAF8F0] text-[#15803D] text-[10px] font-bold mb-1 border border-[#22C55E]/30">
                        <ShieldCheck className="w-3 h-3 text-[#22C55E]" />
                        <span>Store Administrator</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenAdmin();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:bg-[#EAF8F0] hover:text-[#15803D] font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#22C55E]" />
                      <span>{isAdminView ? 'Store Management Center' : 'Go to Admin Dashboard'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDashboard('orders');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span>All Orders View</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Admin</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Case 3: Customer Signed In - Show Customer Profile ONLY */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-[#EAF8F0] border border-slate-200 transition-colors cursor-pointer text-slate-700 text-sm font-medium"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#22C55E] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {currentUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-[10px] text-slate-400 font-medium leading-none">Hello,</span>
                    <span className="text-xs font-bold text-slate-900 max-w-[90px] truncate leading-tight mt-0.5">
                      {currentUser.full_name.split(' ')[0]}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDashboard('orders');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-4 h-4 text-[#22C55E]" />
                      <span>My Orders</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDashboard('addresses');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Saved Addresses</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDashboard('profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#1E2433]" />
                      <span>Account Profile</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative px-3.5 py-2 rounded-xl bg-[#1E2433] hover:bg-[#161B26] text-white transition-all shadow-xs flex items-center gap-2.5 cursor-pointer group"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#FF6A00] group-hover:scale-110 transition-transform" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF6A00] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono ring-2 ring-[#1E2433]">
                    {totalCartItems}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[10px] text-slate-400 font-normal">Cart</span>
                <span className="text-xs font-bold text-white font-mono mt-0.5">
                  ₹{cartSubtotal}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip (Home, Spice Powders, Our Craft, About, Contact) */}
        <div className="lg:hidden flex items-center justify-between gap-1 pb-3 overflow-x-auto no-scrollbar text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('home');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'bg-[#22C55E] text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:text-[#15803D]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('spice_powders');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                currentView === 'spice_powders'
                  ? 'bg-[#22C55E] text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:text-[#15803D]'
              }`}
            >
              <span>Spice Powders</span>
              <span className="text-[10px] px-1 bg-black/20 text-white rounded-full font-mono">{activeProductsCount}</span>
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('craft');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentView === 'craft'
                  ? 'bg-[#22C55E] text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:text-[#15803D]'
              }`}
            >
              Our Craft
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('about');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentView === 'about'
                  ? 'bg-[#22C55E] text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:text-[#15803D]'
              }`}
            >
              About
            </button>

            <button
              onClick={() => {
                if (isAdminView) onToggleAdminView();
                onNavigate('contact');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                currentView === 'contact'
                  ? 'bg-[#22C55E] text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:text-[#15803D]'
              }`}
            >
              Contact
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-[#FF6A00] focus-within:bg-white transition-all shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (currentView !== 'spice_powders' && e.target.value.trim().length > 0) {
                  onNavigate('spice_powders');
                }
              }}
              placeholder="Search turmeric, mirch, jeera..."
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
