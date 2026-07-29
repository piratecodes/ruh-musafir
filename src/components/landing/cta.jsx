"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Framer Motion Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
};

export default function CtaSection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      
      {/* Content Container */}
      <div className="container relative z-10 flex flex-col items-center text-center">
        
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="font-serif text-5xl md:text-6xl lg:text-8xl mb-12 tracking-tight leading-[0.85] text-foreground"
        >
          Ready to Experience <br />
          <span className="italic font-light text-foreground/60 text-4xl">the Slow Life?</span>
        </motion.h2>
        
        <motion.p 
          {...fadeInUp} 
          className="font-serif text-foreground/70 text-lg md:text-2xl mb-16 font-light leading-relaxed max-w-3xl"
        >
          Whether you're planning a solo retreat or a group getaway, we're here to make your stay in Shangarh unforgettable.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-8 justify-center items-center w-full sm:w-auto"
        >
          {/* Primary Action */}
          <Link 
            href="/rooms" 
            className="w-full sm:w-auto px-12 py-4 rounded-full bg-accent hover:bg-[#8A6853] text-white text-sm font-bold tracking-widest transition-all shadow-md"
          >
            Book Your Stay
          </Link>
          
          {/* Secondary Action */}
          <Link 
            href="/contact" 
            className="w-full sm:w-auto px-12 py-4 rounded-full border border-foreground/20 text-foreground text-sm font-bold tracking-widest hover:bg-foreground hover:text-background transition-all"
          >
            Contact Us
          </Link>
        </motion.div>

      </div>
    </section>
  );
}