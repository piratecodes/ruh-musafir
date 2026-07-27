"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";

// --- SPLIDE IMPORTS ---
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

// IMPORT THE API HOOK
import { useGetExperiencesQuery } from "@/store/api/experiencesApi";

// Framer Motion Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function ExperiencesPage() {
  const { data: response, isLoading } = useGetExperiencesQuery();
  const liveExperiences = response?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">
          Curating Adventures...
        </p>
      </div>
    );
  }

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen overflow-hidden pt-32 pb-24"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="h-px w-16 bg-accent/30"></div>
            <span className="font-sans text-[11px] tracking-[0.6em] uppercase font-bold text-accent">
              Beyond the Threshold
            </span>
            <div className="h-px w-16 bg-accent/30"></div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="font-serif text-6xl md:text-7xl lg:text-8xl text-foreground mb-8 tracking-tight leading-[0.9]"
          >
            Curated <br />
            <span className="italic font-light text-accent">Adventures.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-serif text-foreground/70 text-2xl md:text-3xl max-w-3xl mx-auto font-light leading-relaxed italic"
          >
            "Immerse yourself in the ancient rhythms and untamed beauty of Shangarh through our handpicked local journeys."
          </motion.p>
        </div>

        {/* Experiences Grid */}
        {liveExperiences.length > 0 ? (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10"
          >
            {liveExperiences.map((exp) => (
              <motion.div 
                key={exp.id}
                variants={fadeInUp}
                className="group"
              >
                {/* Image Carousel Container */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-4xl mb-6 shadow-md bg-foreground/5">
                  {exp.images && exp.images.length > 0 ? (
                    <Splide
                      options={{
                        type: 'loop',
                        autoplay: true,
                        interval: 4000,
                        speed: 1000, // Makes the transition much slower and smoother
                        easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // Buttery smooth slide effect
                        pauseOnHover: true,
                        arrows: false,
                        pagination: true,
                        drag: true,
                      }}
                      // Forcing the pagination dots to float over the image and styling them white
                      className="w-full h-full [&_.splide__pagination]:bottom-4 [&_.splide__pagination__page]:bg-white/50 [&_.splide__pagination__page.is-active]:bg-white"
                    >
                      {exp.images.map((img, idx) => (
                        <SplideSlide key={idx} className="w-full h-full">
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${img}`} 
                            alt={`${exp.name} - Image ${idx + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </SplideSlide>
                      ))}
                    </Splide>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/30 font-serif italic text-sm">
                      Wilderness Awaits
                    </div>
                  )}
                </div>
                
                {/* Text Content */}
                <div className="space-y-3 px-2">
                  <h3 className="font-serif text-2xl text-foreground transition-colors duration-300">
                    {exp.name}
                  </h3>
                  
                  {exp.description && (
                    <p className="text-foreground/60 text-sm line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 pt-1">
                    {exp.timePeriod && (
                      <p className="font-sans text-xs font-bold tracking-widest uppercase text-foreground/50">{exp.timePeriod}</p>
                    )}
                    {exp.timePeriod && <div className="w-1 h-1 rounded-full bg-foreground/20"></div>}
                    <p className="font-sans text-sm font-medium text-accent">
                      ₹{exp.price} <span className="text-foreground/50 text-xs font-normal">per person</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-foreground/5 rounded-3xl border border-foreground/10">
            <h3 className="font-serif text-2xl text-foreground mb-3">New Experiences Coming Soon</h3>
            <p className="text-foreground/60 font-sans text-sm max-w-md mx-auto">
              We are currently curating fresh adventures in the Shangarh valley. Please check back shortly for updates.
            </p>
          </div>
        )}

        {/* The Special Booking Note */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 bg-accent/5 border border-accent/10 rounded-3xl p-8 md:p-10 text-center max-w-4xl mx-auto shadow-sm"
        >
          <div className="flex justify-center mb-4 text-accent">
            <Info size={24} />
          </div>
          <h4 className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-accent mb-4">
            How to Experience This
          </h4>
          <p className="font-sans text-sm md:text-base text-foreground/70 leading-relaxed">
            These curated experiences can be seamlessly added to your itinerary as <strong className="text-foreground">add-ons</strong> while placing your room reservation online. 
            If you are already staying with us and wish to embark on a journey, please connect with the Front Desk or reach out via our <Link href="/contact" className="text-accent underline underline-offset-4 hover:text-primary transition-colors font-bold">Contact Us</Link> page.
          </p>
        </motion.div>

        {/* Bottom CTA Block */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 p-10 md:p-20 rounded-4xl bg-primary text-white relative overflow-hidden shadow-2xl text-center"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="font-serif text-5xl md:text-6xl mb-6 tracking-tight leading-tight">
              Ready for a <br />
              <span className="italic font-light text-secondary">Soulful Journey?</span>
            </h2>
            <p className="font-serif text-white/80 text-xl md:text-2xl mb-12 font-light leading-relaxed">
              Our experiences are designed to be personal and intimate. Book your stay and let us curate the perfect mountain escape for you.
            </p>
            <Link 
              href="/rooms" 
              className="inline-flex items-center px-10 py-4 rounded-full bg-white text-primary text-sm font-bold tracking-widest uppercase hover:bg-accent hover:text-white transition-all duration-300 shadow-lg group"
            >
              Start Your Reservation
              <ArrowRight size={18} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

      </div>
    </motion.main>
  );
}