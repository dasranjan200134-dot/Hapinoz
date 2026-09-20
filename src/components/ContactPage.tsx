import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });
    }, 800);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-[#111622] text-slate-100 py-16 sm:py-20 border-b border-slate-800">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#FF6A00_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
            <MessageSquare className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>We're Here to Help</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl mx-auto">
            Get in Touch with Hapinoz
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Have questions regarding our pure spice powders, bulk orders, or your current order? Our team is always happy to assist.
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Contact Info & Support Channels */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#FF6A00] uppercase tracking-widest">
                Support Channels
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Direct Contact Information
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reach out to our customer care or visit our spice artisanal packaging facility.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6A00] shrink-0 border border-orange-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-500 font-medium">Customer Support Email</div>
                  <a href="mailto:care@hapinoz.com" className="text-sm font-bold text-slate-900 hover:text-[#FF6A00] transition-colors">
                    care@hapinoz.com
                  </a>
                  <div className="text-[11px] text-slate-400">Response within 24 business hours</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6A00] shrink-0 border border-orange-200">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-500 font-medium">Phone & WhatsApp Helpline</div>
                  <a href="tel:+919876543210" className="text-sm font-bold text-slate-900 hover:text-[#FF6A00] transition-colors">
                    +91 98765 43210
                  </a>
                  <div className="text-[11px] text-slate-400">Mon - Sat: 9:30 AM to 6:30 PM IST</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6A00] shrink-0 border border-orange-200">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-500 font-medium">Headquarters & Packaging Hub</div>
                  <div className="text-xs font-semibold text-slate-900">
                    Hapinoz Foods & Spices Private Limited
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    Plot 42, Spice Artisans Park, Industrial Area, Sector 62, Noida, Uttar Pradesh, India - 201301
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/20 flex items-center justify-center text-[#15803D] shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div className="space-y-0.5 text-xs text-slate-700">
                  <div className="font-bold text-slate-900">FSSAI Certified Facility</div>
                  <div className="text-[11px] text-slate-600 font-mono">Lic. No: 10022099000123</div>
                  <div className="text-[11px] text-slate-500">100% Food Safety & Quality Assured</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Send Us a Message
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fill out the form below and our customer experience team will get back to you promptly.
                </p>
              </div>

              {isSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-12 h-12 bg-[#22C55E]/20 rounded-full flex items-center justify-center mx-auto text-[#22C55E]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-lg text-slate-900">
                      Message Received!
                    </h4>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Thank you for contacting Hapinoz. A spice specialist will review your inquiry and reach out within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="px-4 py-2 bg-[#1E2433] hover:bg-[#FF6A00] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Priya Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00] bg-slate-50/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="priya@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00] bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 00000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00] bg-slate-50/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Inquiry Type</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00] bg-slate-50/50 cursor-pointer"
                      >
                        <option value="General Inquiry">General Product Inquiry</option>
                        <option value="Order Status">Order Tracking & Delivery</option>
                        <option value="Bulk & Chef Orders">Bulk & Restaurant Orders</option>
                        <option value="Feedback & Quality">Quality Feedback / Reviews</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Your Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we assist you with our pure spice powders?"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6A00] bg-slate-50/50 resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-green-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Sending Message...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="bg-slate-100 py-12 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6A00] uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quick Answers</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-900">What is the shelf life of your spice powders?</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Because our spices are slow cold-milled and packed in airtight multilayer nitrogen-sealed pouches, they retain peak aroma and potency for 12 months from manufacturing date.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-900">How fast is shipping across India?</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Orders are dispatched fresh within 24 hours. Metro deliveries typically arrive in 2-3 business days, and other locations within 4-5 business days.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-900">Do you offer cash on delivery (COD)?</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes, we support secure online UPI/Card payments via Razorpay as well as Cash on Delivery across most pin codes in India.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-900">Are there any artificial colors or preservatives?</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero. 100% natural, pure, lab-tested spices with no synthetic dyes, no anticaking agents, and no preservatives.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
