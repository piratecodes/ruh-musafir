"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mountain, Coffee, Flame, Map, Loader2 } from "lucide-react";

// --- ADDED SPLIDE IMPORTS ---
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

// IMPORT THE API HOOK
import { useGetRoomsQuery } from "@/store/api/roomsApi";

// Framer Motion Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 }
};

// Experience Strip Data
const experiences = [
  { icon: Mountain, label: "Mountain Views" },
  { icon: Coffee, label: "Home Meals" },
  { icon: Flame, label: "Bonfire Nights" },
  { icon: Map, label: "Trail Access" }
];

export default function RoomsSection() {
  // Pull live data from the backend
  const { data: response, isLoading } = useGetRoomsQuery();
  const liveRooms = response?.data || [];
  const displayRooms = liveRooms.slice(0, 4); // Only show the first 4 rooms for the preview
  if (isLoading) {
    return (
      <section id="stay" className="py-24 bg-primary text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold animate-pulse">
          Preparing the Sanctuary...
        </p>
      </section>
    );
  }

  return (
    <section id="stay" className="py-16 relative overflow-hidden bg-primary text-white">
      <div className="container relative z-10">
        
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-20">
          <span className="font-sans text-[10px] tracking-[0.5em] uppercase font-bold text-white/50 mb-4 block">
            The Sanctuary
          </span>
          <h2 className="font-serif text-5xl md:text-7xl text-secondary leading-tight">
            Rooms made for <br />
            <span className="italic font-light text-white/80">rest & wonder</span>
          </h2>
        </motion.div>
        
        {/* Rooms Grid */}
        {displayRooms.length > 0 ? (
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayRooms.map((room, idx) => {
              // Safely extract the first image or use a fallback for rooms with 0/1 images
              const displayImage = room.images && room.images.length > 0 
                ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${room.images[0]}`
                : "https://dummyimage.com/600x800/2A2C26/E8E1D9&text=Sanctuary+Room";

              // Dynamically format the capacity and room type string
              const isDorm = room.type === 'DORM';
              const capacityText = `${room.capacity} ${room.capacity > 1 ? 'Guests' : 'Guest'}`;
              const typeText = isDorm ? 'Shared Bed' : 'Private Suite';

              return (
                <motion.div 
                  key={room.id} 
                  variants={fadeInUp} 
                  className={`group ${idx % 2 === 1 ? 'lg:mt-12' : ''}`}
                >
                  <Link href={`/rooms/${room.slug}`} className="block">
                    
                    {/* Image Card (Updated for Splide) */}
                    <div className="relative overflow-hidden rounded-4xl aspect-[4/5] mb-6 shadow-xl bg-black/20">
                      
                      {/* CONDITIONAL RENDER: Use Carousel if multiple images exist */}
                      {room.images && room.images.length > 1 ? (
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
                          // THE FIX: Added track/list h-full for fitting, and z-20 so dots sit above the gradient
                          className="absolute inset-0 w-full h-full [&_.splide__track]:h-full [&_.splide__list]:h-full [&_.splide__pagination]:bottom-6 [&_.splide__pagination]:pr-20 [&_.splide__pagination]:z-20 [&_.splide__pagination__page]:bg-white/50 [&_.splide__pagination__page.is-active]:bg-white"
                        >
                          {room.images.map((img, i) => (
                            <SplideSlide key={i} className="w-full h-full">
                              <img 
                                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${img}`} 
                                alt={`${room.name} - Image ${i + 1}`} 
                                // THE FIX: Added object-center
                                className="aspect-4/5 object-cover object-center"
                              />
                            </SplideSlide>
                          ))}
                        </Splide>
                      ) : (
                        // Fallback to static image if there's only 1 (or none)
                        <img 
                          src={displayImage} 
                          alt={room.name} 
                          // THE FIX: Added object-center
                          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                      )}

                      {/* Gradient Overlay & Pointer Events None so it doesn't block swiping! */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-70 pointer-events-none"></div>
                      
                      {/* Price Pill */}
                      <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-none z-30">
                        <span className="font-sans text-xs font-bold text-white">
                          ₹{room.basePrice}
                          <span className="text-[9px] opacity-70 font-normal ml-1">/ night</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Text Content */}
                    <div className="px-2">
                      <h3 className="font-serif text-2xl text-secondary group-hover:text-accent transition-colors duration-300">
                        {room.name}
                      </h3>
                      <p className="font-sans text-white/50 text-[9px] uppercase tracking-[0.3em] font-bold mt-1 mb-6">
                        {capacityText} • {typeText}
                      </p>
                      
                      <div className="inline-block px-6 py-2 rounded-full border border-white/20 text-[10px] font-bold tracking-widest uppercase text-white group-hover:bg-white group-hover:text-primary transition-all duration-500">
                        View Room
                      </div>
                    </div>

                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-white/50 font-serif italic text-xl border border-white/10 rounded-3xl">
            Our sanctuary spaces are currently being prepared.
          </div>
        )}

        {/* COMBINED EXPERIENCES STRIP */}
        <motion.div 
          variants={fadeInUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="mt-16 pt-12 border-t border-white/10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {experiences.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-4 text-white/60 group"
              >
                <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all duration-500 shadow-sm">
                  <item.icon strokeWidth={1.5} size={24} />
                </div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] group-hover:text-white transition-colors duration-300">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}