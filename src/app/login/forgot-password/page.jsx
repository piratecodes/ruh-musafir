"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. IMPORT THE REDUX MUTATION
import { useForgotPasswordMutation } from '@/store/api/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 2. INITIALIZE THE API HOOK
  const [forgotPassword, { isLoading: loading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // 3. CALL THE REAL BACKEND
    try {
      await forgotPassword({ email }).unwrap();
      setIsSubmitted(true);
    } catch (err) {
      setError(err?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
            alt="Snowy Mountains" 
            className="w-full h-full object-cover grayscale-[0.3] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,transparent_100%)] -webkit-[mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,transparent_100%)]"
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]"></div>
       </div>

      {/* Forgot Password Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-black/40 backdrop-blur-xl p-10 md:p-16 rounded-4xl border border-white/10 shadow-2xl">
          
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-3xl mb-8 border border-green-500/30 shadow-inner">
                  <CheckCircle2 className="text-green-400 w-10 h-10" />
                </div>
                <h2 className="font-serif text-4xl text-white mb-4 tracking-tight leading-tight">
                  Check your <br /><span className="italic font-light text-green-400">Email</span>
                </h2>
                <p className="font-serif text-white/70 text-base font-light tracking-wide mb-10 leading-relaxed">
                  We have sent password recovery instructions to <br/><span className="text-white font-medium">{email}</span>
                </p>
                <Link 
                  href="/login"
                  className="inline-block w-full py-5 rounded-full bg-white text-primary font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-accent hover:text-white transition-all duration-300 shadow-xl"
                >
                  Return to Login
                </Link>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-12">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-3xl mb-8 border border-white/10 shadow-inner"
                  >
                    <KeyRound className="text-accent w-10 h-10" />
                  </motion.div>
                  <h1 className="font-serif text-4xl md:text-5xl text-white mb-4 tracking-tight leading-tight">
                    Reset <br /><span className="italic font-light text-accent">Password</span>
                  </h1>
                  <p className="font-serif text-white/60 text-base font-light tracking-wide leading-relaxed">
                    Enter your email and we'll send you a link to get back into your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm"
                    >
                      <AlertCircle size={18} className="shrink-0 text-red-400" />
                      <p className="font-sans font-medium text-xs">{error}</p>
                    </motion.div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/20 font-serif text-base"
                      placeholder="you@example.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-5 rounded-full bg-white text-primary font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-accent hover:text-white transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending Link...' : (
                        <>
                          Send Reset Link
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center mt-6 border-t border-white/5 pt-6">
                    <Link 
                      href="/login" 
                      className="font-sans text-[11px] text-white/40 hover:text-white uppercase tracking-widest transition-colors font-bold"
                    >
                      Return to Login
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer Branding */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-center relative z-10"
        >
          <p className="font-sans text-white/40 text-[9px] uppercase tracking-[0.6em] font-bold">Ruh Musafir • Shangarh</p>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}