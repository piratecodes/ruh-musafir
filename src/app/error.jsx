"use client"; // Error components must be Client Components

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  // Log the error to an error reporting service (optional but good practice)
  useEffect(() => {
    console.error("Sanctuary Error Caught:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 pt-32 pb-24">
      
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center flex flex-col items-center">
        
        {/* Animated Icon */}
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              y: [0, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full rounded-full border border-dashed border-red-400/50 flex items-center justify-center bg-red-500/5 backdrop-blur-sm shadow-sm relative"
          >
            <AlertTriangle size={48} strokeWidth={1.2} className="text-red-400" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-500/5 border border-red-500/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
            <span className="font-sans text-[10px] tracking-[0.4em] uppercase font-bold text-red-400">System Interruption</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4 tracking-tight leading-tight">
            A sudden <br /><span className="italic font-light text-red-400">avalanche.</span>
          </h1>
          
          <p className="font-serif text-foreground/60 text-lg max-w-md mx-auto mb-12 leading-relaxed font-light">
            Something went unexpectedly wrong on our end. The trails are momentarily blocked, but our team is already working to clear the path.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          {/* Try Again Button (Calls Next.js reset function) */}
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-white font-bold tracking-widest uppercase text-xs hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-3 group"
          >
            <RefreshCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500" /> 
            Try Again
          </button>

          {/* Home Button */}
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-foreground/20 text-foreground font-bold tracking-widest uppercase text-xs hover:bg-foreground/5 transition-all flex items-center justify-center gap-3 group"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" /> 
            Return to Sanctuary
          </Link>
        </motion.div>

      </div>
    </main>
  );
}