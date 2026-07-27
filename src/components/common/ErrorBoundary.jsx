import { useRouteError, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mountain, RotateCcw, Compass, ArrowRight } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Log the error under the hood for debugging purposes
  console.error("Application runtime error caught by Router Boundary:", error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-6 relative overflow-hidden">
      
      {/* Premium Ambient Background Accents */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-10 max-w-lg w-full bg-white/60 backdrop-blur-xl p-10 md:p-16 rounded-[2.5rem] border border-primary/10 shadow-[0_20px_50px_rgba(17,36,64,0.03)] text-center flex flex-col items-center"
      >
        {/* Elegant Floating Brand Icon Wrap */}
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-20 h-20 bg-white border border-primary/10 text-accent rounded-3xl flex items-center justify-center shadow-sm mb-8"
        >
          <Mountain size={36} strokeWidth={1.2} />
        </motion.div>
        
        {/* Luxury Typography Header */}
        <h1 className="font-serif text-4xl text-primary tracking-tight mb-3">
          Sanctuary <span className="italic font-light text-foreground/60">Interrupted</span>
        </h1>
        
        <p className="font-sans text-[9px] uppercase tracking-[0.3em] font-bold text-accent mb-8">
          System Runtime Exception
        </p>

        {/* Elegant Technical Context Card */}
        <div className="w-full bg-primary/5 border border-primary/5 rounded-2xl p-5 mb-10 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <span className="flex items-center gap-2 text-primary/40 mb-2">
            <Compass size={14} />
            <span className="font-sans text-[8px] uppercase tracking-widest font-black">Diagnostics Details</span>
          </span>
          <p className="font-serif text-sm text-primary/80 leading-relaxed italic pr-2">
            "{error?.message || error?.statusText || "An unexpected state conflict occurred within the application core layout."}"
          </p>
        </div>

        {/* Professional Action Matrix */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-primary text-white hover:bg-primary-hover rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-primary/10 flex items-center justify-center gap-2 group"
          >
            <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
            Retry Operation
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-4 bg-white border border-primary/10 text-primary hover:bg-secondary/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Dashboard Hub 
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Subtle Luxury Footer */}
        <div className="mt-12 pt-6 border-t border-primary/5 w-full">
          <p className="font-sans text-[8px] uppercase tracking-[0.4em] font-medium text-foreground/30">
            Ruh Musafir Portal • Automated Recovery Layer
          </p>
        </div>
      </motion.div>
    </div>
  );
}