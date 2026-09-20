import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { HapinozLogo } from './HapinozLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup } = useStore();
  const [tab, setTab] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'signin') {
      login(email, password, email.includes('admin') ? 'admin' : 'customer');
      onClose();
    } else if (tab === 'signup') {
      signup(fullName, email, phone, 'customer');
      onClose();
    } else {
      setMessage(`Password reset email sent to ${email}. Check your inbox.`);
      setTimeout(() => {
        setMessage(null);
        setTab('signin');
      }, 3000);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      login('admin@hapinoz.com', 'admin123', 'admin');
    } else {
      login('ananya.sharma@example.com', 'customer123', 'customer');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Top Header */}
        <div className="bg-stone-50 border-b border-stone-200 p-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HapinozLogo className="h-8" />
            <div className="border-l border-stone-300 pl-3">
              <h2 className="font-serif font-bold text-base text-stone-900 leading-tight">
                {tab === 'signin' && 'Sign in to Account'}
                {tab === 'signup' && 'Create your Account'}
                {tab === 'reset' && 'Reset your Password'}
              </h2>
              <span className="text-[11px] text-stone-500">
                {tab === 'signin' && 'Welcome back to Hapinoz'}
                {tab === 'signup' && 'Join the Hapinoz family'}
                {tab === 'reset' && 'Enter your email to reset'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Fast Sandbox Switcher */}
        <div className="bg-amber-50/60 p-4 border-b border-amber-100 space-y-2">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
            ⚡ 1-Click Fast Test Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2 bg-white hover:bg-amber-100/70 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Login as Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('customer')}
              className="p-2 bg-white hover:bg-amber-100/70 border border-amber-200 rounded-xl text-xs font-semibold text-stone-800 shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-stone-500" />
              <span>Login as Customer</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-stone-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${
              tab === 'signin'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 bg-stone-50/50'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${
              tab === 'signup'
                ? 'border-[#22C55E] text-[#15803D] bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 bg-stone-50/50'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <div className="p-3 bg-[#EAF8F0] border border-[#B8EBD0] rounded-xl text-xs text-[#15803D] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
              <span>{message}</span>
            </div>
          )}

          {tab === 'signup' && (
            <>
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ananya Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-stone-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@hapinoz.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
              />
            </div>
          </div>

          {tab !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-700">Password</label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setTab('reset')}
                    className="text-[11px] text-[#15803D] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-green-600/20 transition-all cursor-pointer"
          >
            <span>{tab === 'signin' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Send Reset Link'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
