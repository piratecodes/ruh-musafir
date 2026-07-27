"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, ArrowLeft, Snowflake, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// 1. Import our custom guard and RTK Query hook
import { useGuestGuard } from '@/hooks/useAuthGuards';
import { useSignupMutation } from '@/store/api/authApi';

function SignupContent() {
  // 2. Activate the shield: Kicks logged-in users to the dashboard
  useGuestGuard();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  const router = useRouter();

  // THE FIX 1: Grab the returnUrl from the browser's address bar
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  // 3. RTK Query Hook (Replaces local loading state)
  const [signup, { isLoading }] = useSignupMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // 4. Password Confirmation Check
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match. Please try again.");
      return;
    }

    try {
      // 5. Fire the API with the explicit GUEST role included
      await signup({
        firstName,
        lastName,
        email,
        phone,
        password,
        role: 'GUEST' // Explicitly setting the role from the frontend
      }).unwrap();
      
      // THE FIX 2: Redirect to the returnUrl if it exists, otherwise go to home ('/')
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push('/');
      }
    } catch (err) {
      setLocalError(err?.data?.message || 'Failed to create account. Please try again.');
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
          src="https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=2070" 
          alt="Snowy Forest" 
          className="w-full h-full object-cover grayscale-[0.3] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,transparent_100%)] -webkit-[mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,transparent_100%)]"
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Signup Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-black/40 backdrop-blur-xl py-10 px-5 rounded-4xl border border-white/10 shadow-2xl">
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-3xl mb-8 border border-white/10 shadow-inner"
            >
              <Snowflake className="text-accent w-10 h-10" />
            </motion.div>
            <h1 className="font-serif text-5xl md:text-6xl text-white mb-4 tracking-tight leading-tight">
              Join the <br /><span className="italic font-light text-accent">Journey</span>
            </h1>
            <p className="font-serif text-white/60 text-lg font-light tracking-wide">Begin your mountain escape</p>
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
            
            {/* Row 1: Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">First Name</label>
                <input 
                  type="text" 
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/20 font-serif text-base"
                  placeholder="John"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Last Name</label>
                <input 
                  type="text" 
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/20 font-serif text-base"
                  placeholder="Doe"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Row 2: Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/20 font-serif text-base"
                  placeholder="+91 00000 00000"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* Row 3: Security */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <div className="space-y-2">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold ml-2">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full focus:border-accent focus:bg-white/10 outline-none transition-all text-white placeholder:text-white/20 font-serif text-base"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 rounded-full bg-white text-primary font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-accent hover:text-white transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : (
                  <>
                    Create Account
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center border-t border-white/5 pt-6">
            <p className="font-serif text-white/60 text-base font-light">
              Already have an account? 
              {/* THE FIX 3: Pass the returnUrl along to the login page if it exists! */}
              <Link 
                href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login"} 
                className="text-accent hover:text-white underline underline-offset-4 decoration-accent/30 transition-all font-medium ml-2"
              >
                Sign in
              </Link>
            </p>
          </div>
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

// Wrap the entire component in Suspense so useSearchParams works correctly in Next.js App Router
export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin w-8 h-8 text-accent" /></div>}>
      <SignupContent />
    </Suspense>
  );
}