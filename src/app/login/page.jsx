"use client";

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mountain, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// THE FIX: Imported useDispatch and logout for the Ghostbuster
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';

import { useGuestGuard } from '@/hooks/useAuthGuards';
import { useLoginMutation } from '@/store/api/authApi'; 

function LoginContent() {
  useGuestGuard();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const sessionExpired = searchParams.get('session_expired');

  // THE FIX: The Ghostbuster Hook
  // If baseApi sends them here because of a 401, force Redux to wipe memory completely
  useEffect(() => {
    if (sessionExpired) {
      dispatch(logout());
      setLocalError('Your secure session has expired. Please sign in again.');
    }
  }, [sessionExpired, dispatch]);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    try {
      await login({ email, password }).unwrap();
      
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/'); 
      }
      
    } catch (err) {
      setLocalError(err?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden"
    >
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
        
        <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]"></div>
       </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-black/40 backdrop-blur-xl p-10 md:p-16 rounded-4xl border border-white/10 shadow-2xl">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-3xl mb-8 border border-white/10 shadow-inner"
            >
              <Mountain className="text-accent w-10 h-10" />
            </motion.div>
            <h1 className="font-serif text-5xl md:text-6xl text-white mb-4 tracking-tight leading-tight">
              Welcome <br /><span className="italic font-light text-accent">Back</span>
            </h1>
            <p className="font-serif text-white/60 text-lg font-light tracking-wide">Enter the sanctuary</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {localError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 text-red-400" />
                <p className="font-sans font-medium text-xs">{localError}</p>
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
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/20 font-serif text-base"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 rounded-full bg-white text-primary font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-accent hover:text-white transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Authenticating...' : (
                  <>
                    Sign In
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
            
            <div className="text-center mt-6">
              <Link 
                href="/login/forgot-password" 
                className="font-sans text-[11px] text-white/40 hover:text-white uppercase tracking-widest transition-colors font-bold"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="font-serif text-white/60 text-base font-light">
              Don't have an account? 
              <Link 
                href={returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : "/signup"} 
                className="text-accent hover:text-white underline underline-offset-4 decoration-accent/30 transition-all font-medium ml-2"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
        
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin w-8 h-8 text-accent" /></div>}>
      <LoginContent />
    </Suspense>
  );
}