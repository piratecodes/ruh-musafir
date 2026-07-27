"use client";

import { Leaf, Heart, Users, Compass, Shield, Map, Quote, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
};

export default function OurStoryPage() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full overflow-hidden"
    >
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" 
            alt="The Host and the Homestay" 
            className="w-full h-full object-cover"
          />
          {/* Updated to Tailwind v4 linear gradient, fading to transparent to respect your bg rule */}
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/30 to-transparent"></div>
        </div>
        
        <div className="container relative z-10 text-center text-white mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-10"
          >
            <div className="h-px w-16 bg-white/30"></div>
            <span className="font-sans text-[11px] tracking-[0.6em] uppercase font-bold text-white">The Genesis</span>
            <div className="h-px w-16 bg-white/30"></div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 leading-[0.9] tracking-tight text-white"
          >
            Our <br /><span className="italic font-light text-accent">Legacy.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-serif text-lg md:text-xl text-white/90 mb-16 max-w-3xl mx-auto font-light leading-relaxed italic"
          >
            "A passion project born from the high meadows, dedicated to the slow rhythm of the Himalayas."
          </motion.p>
        </div>
      </section>

      {/* The Host & Philosophy */}
      <section className="py-20 lg:py-32">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="relative"
          >
            <div className="absolute -inset-8 md:-inset-12 bg-accent/5 rounded-4xl -rotate-6"></div>
            <div className="relative z-10 overflow-hidden rounded-4xl shadow-xl aspect-[4/5] border border-foreground/5">
              <img 
                src="https://dummyimage.com/800x1000/2A2C26/E8E1D9&text=Host+Portrait" 
                alt="The Host" 
                className="w-full h-full object-cover grayscale-[0.8] hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-8 -right-8 bg-background/75 backdrop-blur-md p-8 rounded-4xl border border-foreground/5 shadow-2xl max-w-sm hidden lg:block z-20"
            >
              <Quote size={28} className="text-accent/40 mb-8" />
              <p className="font-serif text-xl text-foreground mb-10 leading-tight italic font-light">
                "I wanted to build a bridge between the wandering soul and the silent mountains."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-px bg-accent"></div>
                <div>
                  <p className="font-sans text-[10px] text-foreground/50 uppercase tracking-[0.3em] font-bold">The Visionary</p>
                  <p className="font-serif font-bold text-foreground">Founder, Ruh Musafir</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px w-16 bg-accent/30"></div>
              <span className="font-sans text-[11px] tracking-[0.6em] uppercase font-bold text-accent">Our Ethos</span>
            </div>
            <h2 className="font-serif text-4xl md:text-6xl mb-6 text-foreground tracking-tighter leading-[0.85]">
              The Soul of <br /><span className="italic font-light text-accent">Shangarh.</span>
            </h2>
            <p className="font-serif text-foreground/70 text-xl leading-relaxed mb-6 font-light italic">
              Ruh Musafir is not just a destination; it's a return to the essential.
            </p>
            <div className="space-y-8 font-serif text-base text-foreground/60 leading-relaxed font-light mb-12">
              <p>
                Born from a deep reverence for the Himachali way of life, our homestay was built stone by stone, dream by dream. We sought to create a sanctuary where the modern traveler could find the luxury of silence.
              </p>
              <p>
                We believe in the power of slow travel—where a conversation over a bonfire is more valuable than a checklist of sights, and where the mountain air does the healing.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { icon: Users, title: "Community First", desc: "We employ local artisans and source our soul-food from neighboring organic farms." },
                { icon: Heart, title: "Pure Hospitality", desc: "You are not a guest; you are family. Every detail is crafted with personal care." }
              ].map((item, idx) => (
                <div key={idx} className="group">
                  <div className="w-14 h-14 bg-foreground/5 rounded-2xl flex items-center justify-center text-foreground mb-6 border border-foreground/5 group-hover:bg-accent group-hover:text-white transition-all duration-700 shadow-sm">
                    <item.icon size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-xl text-foreground mb-3 tracking-tight">{item.title}</h3>
                  <p className="font-sans text-foreground/60 text-sm font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
          
        </div>
      </section>

      {/* Sustainability - Immersive Section */}
      <section className="py-24 lg:py-32 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" 
            alt="Mountains"
            className="w-full h-full object-cover opacity-10 grayscale" 
          />
        </div>
        <div className="container relative z-10">
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-10 border border-white/10 backdrop-blur-xl"
            >
              <Leaf size={32} className="text-accent" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-4xl md:text-6xl mb-6 tracking-tighter leading-[0.9] text-white"
            >
              Earth <br /><span className="italic font-light text-accent">Conscious.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-serif text-white/70 text-lg md:text-xl leading-relaxed mb-12 font-light max-w-3xl mx-auto italic"
            >
              "The mountains are our guardians; we are but their humble guests. Our commitment is to leave no trace but footprints of gratitude."
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Zero Plastic", desc: "We provide filtered mountain spring water in glass carafes. A strict no-plastic policy protects our meadows.", icon: Shield },
              { title: "Organic Table", desc: "From farm to fork. Our kitchen celebrates the seasonal bounty of the Kullu valley.", icon: Compass },
              { title: "Heritage Build", desc: "Constructed using Kath-Kuni architecture, utilizing local cedar wood and river stone.", icon: Map }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="bg-white/5 backdrop-blur-sm p-8 md:p-10 rounded-4xl border border-white/10 group hover:bg-white/10 transition-all duration-700"
              >
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:bg-accent group-hover:border-accent transition-all duration-500">
                  <item.icon size={28} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl mb-4 tracking-tight text-white">{item.title}</h3>
                <p className="font-sans text-white/60 text-sm font-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <h2 className="font-serif text-5xl md:text-6xl text-foreground mb-10 tracking-tighter leading-tight">
              Become Part of <br /><span className="italic font-light text-accent">Our Story.</span>
            </h2>
            <Link 
              href="/rooms" 
              className="inline-flex items-center px-10 py-4 rounded-full bg-accent text-white text-sm font-bold tracking-widest uppercase hover:bg-[#8A6853] transition-colors shadow-lg group"
            >
              Book Your Sanctuary
              <ArrowRight size={18} className="ml-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
}