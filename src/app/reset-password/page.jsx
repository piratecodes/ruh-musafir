"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ShieldAlert, ArrowRight, CheckCircle2, Loader2, AlertCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORT REDUX HOOKS
import { useResetPasswordMutation, useVerifyResetTokenQuery } from '@/store/api/authApi';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // GATEKEEPER: VERIFY TOKEN ON PAGE LOAD
  const { error: tokenError, isLoading: isVerifying } = useVerifyResetTokenQuery(token, {
    skip: !token 
  });

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setIsSuccess(true);
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      
    } catch (err) {
      setLocalError(err?.data?.message || 'Failed to reset password.');
    }
  };

  // --- STATE 1: LOADING & HYDRATION ---
  if (!mounted) return null; // Prevent hydration mismatch

  // --- STATE 2: DIRECT 404 IF NO TOKEN ---
  if (!token) {
    notFound(); // Instantly triggers your app's global not-found.jsx
  }

  // --- STATE 3: VERIFYING TOKEN ---
  if (isVerifying) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin w-8 h-8 text-accent" />
          <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">Verifying Security Link...</p>
        </div>
      </main>
    );
  }

  // --- STATE 4: TOKEN EXPIRED / INVALID ---
  if (tokenError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md relative z-10">
          <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-foreground/10">
            <ShieldAlert className="text-foreground/40 w-10 h-10" />
          </div>
          <h1 className="font-serif text-3xl text-foreground mb-4 tracking-tight">Link Unavailable</h1>
          <p className="font-sans text-foreground/60 mb-10 leading-relaxed text-sm">
            The password reset link you are trying to access maybe expired, or it is invalid. For security purposes, recovery links are strictly single-use and valid for only 15 minutes.
          </p>
          <Link href="/login/forgot-password" className="px-8 py-4 rounded-full bg-primary text-white font-sans font-bold tracking-widest uppercase text-[11px] hover:bg-primary/90 transition-all inline-flex items-center gap-2 shadow-lg">
            Request New Link <ArrowRight size={16} />
          </Link>
        </motion.div>
      </main>
    );
  }

  // --- STATE 5 & 6: FORM & SUCCESS ---
  return (
    <motion.main 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <motion.img 
            initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 10, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=2070" 
            alt="Starry Mountain Night" 
            className="w-full h-full object-cover grayscale-[0.4]"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-xl p-10 md:p-14 rounded-4xl border border-white/10 shadow-2xl">
          
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-6 border border-white/10 shadow-inner">
                    <KeyRound className="text-accent w-8 h-8" />
                  </div>
                  <h1 className="font-serif text-3xl text-white mb-2 tracking-tight">Secure New Password</h1>
                  <p className="font-sans text-white/50 text-sm font-light">Your sanctuary awaits.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {localError && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm">
                      <AlertCircle size={18} className="shrink-0 text-red-400" />
                      <p className="font-sans font-medium text-xs">{localError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                      <input 
                        type="password" required minLength={8}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent outline-none transition-all text-white font-serif text-base placeholder:text-white/20"
                        placeholder="••••••••" disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                      <input 
                        type="password" required minLength={8}
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent outline-none transition-all text-white font-serif text-base placeholder:text-white/20"
                        placeholder="••••••••" disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" disabled={isLoading || !password || !confirmPassword}
                      className="w-full py-5 rounded-full bg-white text-primary font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-accent hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>Update Password <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-3xl mb-8 border border-green-500/30 shadow-inner">
                  <CheckCircle2 className="text-green-400 w-10 h-10" />
                </div>
                <h2 className="font-serif text-3xl text-white mb-4">Password Secured</h2>
                <p className="font-sans text-white/60 text-sm leading-relaxed mb-8">
                  Your locks have been changed successfully. Redirecting you to the entrance...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
        <Loader2 className="animate-spin w-8 h-8 text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">Initializing...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}