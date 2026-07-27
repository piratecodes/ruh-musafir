"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Compass, MapPinOff } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 pt-32 pb-24">
      
      {/* NO BG-COLOR APPLIED: 
        This wrapper is completely transparent so it perfectly inherits 
        your global background or any layout wrappers you have. 
      */}

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center flex flex-col items-center">

        {/* --- LOTTIE FILE PLACEHOLDER --- */}
        {/* Replace the motion.div below with your <Lottie /> component when ready */}
        <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full flex items-center justify-center relative"
          >
            {/* Decorative pinging circle to simulate search/radar */}
            <div className="absolute inset-0 border border-foreground/10 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
            
            {/* Main Icon Wrapper */}
            <div className="w-32 h-32 rounded-full border border-dashed border-accent/50 flex items-center justify-center bg-foreground/5 backdrop-blur-sm shadow-sm relative overflow-hidden">
              <MapPinOff size={56} strokeWidth={1.2} className="text-accent absolute opacity-20 right-4 top-4" />
              <Compass size={64} strokeWidth={1} className="text-foreground relative z-10" />
            </div>
          </motion.div>
        </div>

        {/* --- FUNNY COPY --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-foreground/5 border border-foreground/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
            <span className="font-sans text-[10px] tracking-[0.4em] uppercase font-bold text-foreground">Error 404</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4 tracking-tight leading-tight">
            Lost in the <br /><span className="italic font-light text-accent">Wilderness?</span>
          </h1>
          
          <p className="font-serif text-foreground/60 text-lg max-w-md mx-auto mb-12 leading-relaxed font-light">
            Looks like you took a wrong turn at the last pine tree. Even our best mountain guides have no idea where this page went. It might have been eaten by a yeti or drifted away with the morning mist!
          </p>
        </motion.div>

        {/* --- NAVIGATION BUTTONS --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-foreground/20 text-foreground font-bold tracking-widest uppercase text-xs hover:bg-foreground/5 transition-all flex items-center justify-center gap-3 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Hike Back
          </button>

          {/* Home Button */}
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-white font-bold tracking-widest uppercase text-xs hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-3 group"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" /> 
            Return to Sanctuary
          </Link>
        </motion.div>

      </div>
    </main>
  );
}