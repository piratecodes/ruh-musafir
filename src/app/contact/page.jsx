"use client";

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle2, Navigation, ArrowRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORT THE NEW RTK QUERY HOOK
import { useSubmitInquiryMutation } from '@/store/api/inquiriesApi';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
};

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  // THE FIX: Added 'phone' to the initial state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '', 
    message: ''
  });

  const [submitInquiry, { isLoading }] = useSubmitInquiryMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await submitInquiry(formData).unwrap();
      
      setIsSubmitted(true);
      // THE FIX: Ensure 'phone' is cleared on success
      setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError(err?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-hidden pt-32 pb-24"
    >
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -left-20 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="container relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="h-px w-16 bg-accent/30"></div>
            <span className="font-sans text-[11px] tracking-[0.6em] uppercase font-bold text-accent">
              Establish Connection
            </span>
            <div className="h-px w-16 bg-accent/30"></div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground mb-8 tracking-tight leading-[0.9]"
          >
            Get in <br />
            <span className="italic font-light text-accent">Touch.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-serif text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed italic text-foreground/70"
          >
            "Whether you're planning a retreat or seeking a quiet escape, we are here to guide your journey to the mountains."
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Contact Info & Map */}
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            >
              <h2 className="font-serif text-3xl text-foreground mb-8 tracking-tighter">
                Find Your <span className="italic font-light text-accent">Way.</span>
              </h2>
              
              <div className="space-y-8">
                {[
                  { icon: MapPin, title: "Sanctuary Location", desc: "Village Dhaghara, next to Sunset Point, Shangarh, Himachal Pradesh 175134", sub: "Q95F+XC Shangarh, HP" },
                  { icon: Clock, title: "Arrival Guide", desc: "The nearest railhead is Chandigarh. From there, a scenic 6-hour drive brings you to our doorstep.", sub: "Taxi arrangements available" },
                  { icon: Navigation, title: "By Air", desc: "Bhuntar Airport (KUU) is just 1.5 hours away. We recommend pre-booking your mountain transfer.", sub: "Daily flights from Delhi" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-8 group">
                    <div className="w-14 h-14 bg-foreground/5 rounded-2xl flex items-center justify-center text-foreground shrink-0 border border-foreground/5 group-hover:bg-accent group-hover:text-white transition-all duration-500 shadow-sm">
                      <item.icon size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-foreground mb-2">{item.title}</h3>
                      <p className="font-sans text-foreground/60 text-sm leading-relaxed">{item.desc}</p>
                      {item.sub && (
                        <div className="font-sans text-accent text-[10px] font-bold uppercase tracking-[0.3em] mt-4 flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                          {item.sub}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Immersive Map Card */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group rounded-4xl overflow-hidden shadow-xl aspect-video border border-foreground/5"
            >
              <img 
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" 
                alt="Map location" 
                className="w-full h-full object-cover transition-all duration-[2s] group-hover:scale-105 grayscale-[0.5] group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-primary/30 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-1000"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <a 
                  href="https://maps.google.com/?q=Ruh+Musafir+Homestay+Shangarh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-lg group-hover:scale-110 group-hover:bg-accent transition-all duration-500"
                >
                  <Navigation size={20} />
                </a>
              </div>
              
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-white shadow-sm">
                  <p className="font-sans text-[10px] uppercase tracking-[0.3em] font-bold mb-1 text-white/70">Coordinates</p>
                  <p className="font-sans text-sm font-medium tracking-wide">31.7819° N, 77.4048° E</p>
                </div>
              </div>
            </motion.div>

            {/* Direct Channels */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="pt-8 border-t border-foreground/5"
            >
              <h2 className="font-serif text-3xl text-foreground mb-8 tracking-tighter">
                Direct <span className="italic font-light text-accent">Channels.</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Phone, label: "+91 86971 25852", href: "tel:+918697125852", sub: "Voice & WhatsApp" },
                  { icon: Mail, label: "hello@ruhmusafir.com", href: "mailto:hello@ruhmusafir.com", sub: "General Inquiries" }
                ].map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.href} 
                    className="group p-6 rounded-3xl bg-white border border-foreground/5 hover:bg-accent transition-all duration-500 shadow-sm hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-foreground/5 group-hover:bg-white/20 rounded-2xl flex items-center justify-center text-foreground group-hover:text-white mb-6 transition-all duration-500">
                      <item.icon size={20} />
                    </div>
                    <p className="font-sans text-[9px] text-foreground/50 group-hover:text-white/70 uppercase tracking-[0.3em] font-bold mb-2 transition-colors">
                      {item.sub}
                    </p>
                    <p className="text-sm font-sans font-bold text-foreground group-hover:text-white transition-colors">
                      {item.label}
                    </p>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Contact Form Container */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-32"
          >
            <div className="bg-white p-8 md:p-10 rounded-4xl border border-foreground/5 shadow-xl relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center text-center py-16"
                  >
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-8 border border-green-100 shadow-inner">
                      <CheckCircle2 size={48} strokeWidth={1.5} />
                    </div>
                    <h2 className="font-serif text-3xl text-foreground mb-4 tracking-tighter">
                      Message <span className="italic font-light text-accent">Received.</span>
                    </h2>
                    <p className="font-serif text-foreground/70 text-lg font-light leading-relaxed mb-10">
                      Thank you for reaching out. A member of our team will connect with you within one mountain sunrise.
                    </p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="font-sans text-accent font-bold uppercase tracking-[0.3em] text-[10px] hover:text-[#8A6853] transition-colors flex items-center gap-3 border border-accent/20 px-6 py-3 rounded-full hover:bg-accent/5"
                    >
                      <ArrowRight size={14} className="rotate-180" />
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="font-serif text-3xl text-foreground mb-8 tracking-tighter">
                      Send a <span className="italic font-light text-accent">Message.</span>
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">First Name</label>
                          <input 
                            type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                            className="w-full px-5 py-4 rounded-2xl bg-background border border-foreground/10 focus:border-accent outline-none transition-all text-foreground font-sans text-sm"
                            placeholder="John"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Last Name</label>
                          <input 
                            type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                            className="w-full px-5 py-4 rounded-2xl bg-background border border-foreground/10 focus:border-accent outline-none transition-all text-foreground font-sans text-sm"
                            placeholder="Doe"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      
                      {/* THE FIX: Grouped Email and Phone into a new 2-column grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Email Address</label>
                          <input 
                            type="email" name="email" value={formData.email} onChange={handleChange} required
                            className="w-full px-5 py-4 rounded-2xl bg-background border border-foreground/10 focus:border-accent outline-none transition-all text-foreground font-sans text-sm"
                            placeholder="john@example.com"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Phone Number</label>
                          <input 
                            type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                            className="w-full px-5 py-4 rounded-2xl bg-background border border-foreground/10 focus:border-accent outline-none transition-all text-foreground font-sans text-sm"
                            placeholder="+91 00000 00000"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Your Inquiry</label>
                        <textarea 
                          name="message" value={formData.message} onChange={handleChange} required rows={5}
                          className="w-full px-5 py-4 rounded-2xl bg-background border border-foreground/10 focus:border-accent outline-none transition-all text-foreground font-sans text-sm resize-none"
                          placeholder="How can we help you find your peace?"
                          disabled={isLoading}
                        ></textarea>
                      </div>

                      {error && (
                        <p className="text-red-500 text-xs font-sans font-bold uppercase tracking-widest ml-2">{error}</p>
                      )}

                      <div className="pt-4">
                        <button 
                          type="submit" disabled={isLoading}
                          className="w-full py-4 rounded-full bg-accent text-white font-bold tracking-widest uppercase text-xs hover:bg-[#8A6853] transition-colors shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              Dispatch Message
                              <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.main>
  );
}