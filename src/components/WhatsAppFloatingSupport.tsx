import React, { useState } from 'react';
import { MessageCircle, X, Send, PhoneCall, Sparkles, Check } from 'lucide-react';

export const WhatsAppFloatingSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  const predefinedPrompts = [
    '🌶️ I want to order pure spices',
    '📦 Track my order delivery status',
    '🌿 Ask about Lakadong Turmeric Curcumin %',
    '💼 Need bulk/restaurant spice quote',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || message;
    if (!text.trim()) return;

    const encoded = encodeURIComponent(`Namaste Hapinoz Team! ${text}`);
    const whatsappUrl = `https://wa.me/919876543210?text=${encoded}`;
    
    // Open WhatsApp in new tab safely
    try {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback
    }

    setSentNotice(true);
    setTimeout(() => {
      setSentNotice(false);
      setIsOpen(false);
      setMessage('');
    }, 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Expanded WhatsApp Chat Bubble */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                  <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] ring-2 ring-emerald-600 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none">Hapinoz Spice Care</h4>
                <p className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1">
                  <span>⚡ Instant Indian Support</span>
                  <span>•</span>
                  <span>Online</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-emerald-50/40 space-y-3 max-h-72 overflow-y-auto">
            <div className="bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs border border-emerald-100 text-xs text-slate-800 space-y-1.5">
              <p className="font-medium">
                🙏 <strong>Namaste!</strong> Welcome to Hapinoz Pure Spices.
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Need help picking the right pure spice powders, tracking an order, or placing a fast order directly? Chat with our spice experts on WhatsApp!
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Inquiries:
              </span>
              <div className="flex flex-col gap-1.5">
                {predefinedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 p-2 rounded-xl border border-slate-200 transition-all text-slate-700 cursor-pointer shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            {sentNotice ? (
              <div className="py-2 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Redirecting to WhatsApp...</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message or order request..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-slate-50 focus:bg-white"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                  title="Send via WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
            <div className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-2">
              <PhoneCall className="w-3 h-3 text-emerald-600" />
              <span>Direct Hotline: +91 98765 43210</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer font-bold text-xs"
          title="Chat with Hapinoz Spices on WhatsApp"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 fill-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          </div>
          <span className="hidden sm:inline font-sans tracking-wide">WhatsApp Support</span>
        </button>
      )}
    </div>
  );
};
