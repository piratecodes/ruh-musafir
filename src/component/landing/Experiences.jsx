"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// --- SPLIDE IMPORTS ---
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

// IMPORT THE API HOOK
import { useGetExperiencesQuery } from "@/store/api/experiencesApi";

// Framer Motion Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
};

export default function ExperiencesSection() {
  // Pull live data from the backend
  const { data: response, isLoading } = useGetExperiencesQuery();
  const liveExperiences = response?.data || [];

  // SLICE LOGIC: Only take the first 2 experiences
  const displayExperiences = liveExperiences.slice(0, 2);

  if (isLoading) {
    return (
      <section id="experiences" className="py-32 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">
          Curating Adventures...
        </p>
      </section>
    );
  }

  return (
    <section id="experiences" className="py-16 md:py-32 relative">
      <div className="container">
        
        {/* Header Section */}
        <motion.div {...fadeInUp} className="text-center mb-20">
          <div className="font-sans text-[11px] tracking-[0.5em] uppercase font-bold text-accent mb-6">
            Beyond the Walls
          </div>
          <h2 className="font-serif text-5xl md:text-7xl mb-8 text-foreground leading-tight">
            Curated <span className="italic font-light text-foreground/70">Experiences</span>
          </h2>
          <p className="font-serif text-foreground/70 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            Immerse yourself in the local rhythm with our handpicked mountain adventures.
          </p>
        </motion.div>
        
        {/* Experiences Grid */}
        {displayExperiences.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {displayExperiences.map((exp, i) => {
              // Extract the fallback image if there is only 1 or 0 images
              const fallbackImage = exp.images && exp.images.length > 0 
                ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${exp.images[0]}`
                : "https://dummyimage.com/600x800/5C6E58/E8E1D9&text=Adventure";

              return (
                <motion.div 
                  key={exp.id} 
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="bg-white rounded-4xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-700 flex flex-col sm:flex-row group"
                >
                  
                  {/* Image Container */}
                  <div className="relative w-full sm:w-2/5 h-72 sm:h-auto overflow-hidden bg-foreground/5">
                    
                    {/* CONDITIONAL RENDER: Splide Carousel for multiple images */}
                    {exp.images && exp.images.length > 1 ? (
                      <Splide
                        options={{
                          type: 'loop',
                          autoplay: true,
                          interval: 4000,
                          speed: 1000,
                          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                          pauseOnHover: true,
                          arrows: false,
                          pagination: true,
                          drag: true,
                        }}
                        className="absolute inset-0 w-full h-full [&_.splide__track]:h-full [&_.splide__list]:h-full [&_.splide__slide]:h-full [&_.splide__pagination]:bottom-4 [&_.splide__pagination]:z-20 [&_.splide__pagination__page]:bg-white/50 [&_.splide__pagination__page.is-active]:bg-white"
                      >
                        {exp.images.map((img, idx) => (
                          <SplideSlide key={idx} className="w-full h-full">
                            <img 
                              src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${img}`} 
                              alt={`${exp.name} - ${idx + 1}`} 
                              className="w-full h-72 object-cover object-center grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000"
                            />
                          </SplideSlide>
                        ))}
                      </Splide>
                    ) : (
                      <img 
                        src={fallbackImage} 
                        alt={exp.name} 
                        className="absolute inset-0 w-full h-full object-cover object-center grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                      />
                    )}

                    {/* Subtle gradient so the pill is always readable */}
                    <div className="absolute inset-0 bg-linear-to-b from-black/30 to-transparent opacity-50 pointer-events-none z-10"></div>
                    
                    {/* Duration Pill (Mapped to timePeriod based on your schema) */}
                    {exp.timePeriod && (
                      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 shadow-sm z-20">
                        <span className="font-sans text-[10px] font-bold tracking-widest uppercase text-foreground">
                          {exp.timePeriod}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Text Content Container */}
                  <div className="p-8 md:p-10 w-full sm:w-3/5 flex flex-col justify-center bg-white">
                    <div className="flex justify-between lg:justify-normal lg:space-x-8 items-start mb-6">
                      <h3 className="font-serif text-3xl text-foreground group-hover:translate-x-1 transition-transform duration-500">
                        {exp.name}
                      </h3>
                      <span className="font-sans text-accent font-bold tracking-widest uppercase text-sm mt-2 shrink-0">
                        ₹{exp.price}
                      </span>
                    </div>
                    
                    <p className="font-serif text-foreground/70 text-base font-light leading-relaxed line-clamp-4">
                      {exp.description}
                    </p>
                  </div>

                </motion.div>
              );
            })}
          </div>
        ) : (
          /* NO DATA FOUND STATE */
          <motion.div 
            {...fadeInUp}
            className="text-center py-20 bg-foreground/5 rounded-3xl border border-foreground/10 max-w-2xl mx-auto"
          >
            <h3 className="font-serif text-2xl text-foreground mb-3">Adventures Coming Soon</h3>
            <p className="text-foreground/60 font-sans text-sm">
              We are currently curating fresh local experiences for your stay. Please check back shortly.
            </p>
          </motion.div>
        )}

      </div>
    </section>
  );
}