"use client"; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MountainSnow, RefreshCcw } from 'lucide-react';

// IMPORTANT: Because the root layout crashed, you must manually import your global CSS here
// so the Tailwind classes still work! Adjust this path if your globals.css is elsewhere.
import '@/styles/globals.css'; 

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the catastrophic error to an APM tool like Sentry
    console.error("CRITICAL ROOT ERROR:", error);
  }, [error]);

  return (
    <html lang="en">
      {/* Fallback inline colors just in case Tailwind completely fails to inject */}
      <body className="min-h-screen flex items-center justify-center p-6 bg-foreground text-secondary">
        <div className="w-full max-w-2xl mx-auto text-center flex flex-col items-center">
          
          {/* Animated Icon */}
          <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
            <motion.div
              animate={{ 
                rotate: [-2, 2, -2],
                y: [0, -5, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full rounded-full border-2 border-dashed border-red-400/30 flex items-center justify-center bg-black/20 backdrop-blur-md shadow-2xl relative"
            >
              <MountainSnow size={64} strokeWidth={1} className="text-red-400" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-sans text-[10px] tracking-[0.4em] uppercase font-bold text-red-400">Total Whiteout</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl text-white mb-6 tracking-tight leading-tight">
              The whole mountain <br /><span className="italic font-light text-red-400">just moved.</span>
            </h1>
            
            <p className="font-serif text-white/60 text-lg max-w-md mx-auto mb-12 leading-relaxed font-light">
              This isn't a normal roadblock. You've stumbled into a complete system whiteout. Our digital sherpas have been dispatched to fix the core infrastructure. 
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Global Reset Button */}
            <button
              onClick={() => reset()}
              className="px-10 py-5 rounded-full bg-white text-black font-bold tracking-widest uppercase text-xs hover:bg-gray-200 transition-all shadow-xl flex items-center justify-center gap-3 group mx-auto"
            >
              <RefreshCcw size={18} className="group-hover:-rotate-180 transition-transform duration-700" /> 
              Reboot Sanctuary
            </button>
          </motion.div>

        </div>
      </body>
    </html>
  );
}