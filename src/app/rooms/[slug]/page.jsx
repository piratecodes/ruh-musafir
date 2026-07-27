"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams, useRouter, notFound } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Mountain, Wifi, BedDouble, Star, X, ChevronLeft, ChevronRight, 
  ArrowLeft, Users, Wind, Bath, Layout, ChevronDown, Minus, Plus, Loader2
} from 'lucide-react';
import { format, parseISO, differenceInDays, startOfToday, addDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast'; // <-- ADDED MISSING IMPORT

// IMPORT REDUX HOOK
import { useGetRoomBySlugQuery } from '@/store/api/roomsApi';

// --- Lightbox Component ---
const Lightbox = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIndex(initialIndex);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialIndex]);

  if (!isOpen || !mounted || !images.length) return null;

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-white/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} tabIndex={0} ref={(el) => el?.focus()}>
      <button onClick={onClose} className="absolute top-8 right-8 z-[10000] w-12 h-12 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground transition-colors"><X size={24} /></button>
      <div className="relative w-full max-w-6xl aspect-[16/10] flex items-center justify-center">
        <AnimatePresence mode="wait"><motion.img key={currentIndex} src={images[currentIndex]} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="w-full h-full object-contain rounded-2xl" /></AnimatePresence>
        <button onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-0 w-12 h-12 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground transition-all"><ChevronLeft size={24} /></button>
        <button onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)} className="absolute right-0 w-12 h-12 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground transition-all"><ChevronRight size={24} /></button>
      </div>
    </motion.div>, document.body
  );
};

// --- Page Content Wrapper ---
function RoomDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params?.slug;

  // FETCH LIVE DATA
  const { data: response, isLoading, isError } = useGetRoomBySlugQuery(slug);
  const room = response?.data;

  // URL States
  const urlCheckin = searchParams.get('checkin') || '';
  const urlCheckout = searchParams.get('checkout') || '';
  const [checkIn, setCheckIn] = useState(urlCheckin ? parseISO(urlCheckin) : undefined);
  const [checkOut, setCheckOut] = useState(urlCheckout ? parseISO(urlCheckout) : undefined);
  
  const [guestCounts, setGuestCounts] = useState({ adults: 1, children: 0 });
  const totalGuests = guestCounts.adults + guestCounts.children;
  
  const [activePicker, setActivePicker] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Format images for Lightbox & Grid (Ensures we always have 5 slots filled for the grid layout)
  const galleryImages = useMemo(() => {
    if (!room || !room.images || room.images.length === 0) {
      return Array(5).fill("https://dummyimage.com/1200x800/2A2C26/E8E1D9&text=Sanctuary");
    }
    const fullUrls = room.images.map(img => `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${img}`);
    const imgs = [...fullUrls];
    while (imgs.length < 5) imgs.push(fullUrls[imgs.length % fullUrls.length]);
    return imgs;
  }, [room]);

  // Handle 404 Redirects
  if (isError) {
    return notFound(); 
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">
          Unlocking Sanctuary...
        </p>
      </div>
    );
  }

  if (!room) return notFound();

  // Price Math
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const basePrice = room.basePrice * (nights > 0 ? nights : 1);
  const gst = Math.round(basePrice * 0.12);
  const grandTotal = basePrice + gst;

  // --- THE FIX: ADDED VALIDATION AND CLEANED URL PARAMS ---
  const handleReserve = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select your check-in and check-out dates first!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActivePicker('checkin'); // Auto-open the picker for them
      return;
    }

    const queryParams = new URLSearchParams({
      checkin: format(checkIn, 'yyyy-MM-dd'),
      checkout: format(checkOut, 'yyyy-MM-dd'),
      guests: totalGuests.toString()
    });
    
    // Uses the slug directly, no longer injecting the room ID
    router.push(`/rooms/${slug}/checkout?${queryParams.toString()}`);
  };

  return (
    <main className="container pb-24 md:pb-12 pt-24">

      {/* Gallery Grid */}
      <div className="my-12">
        <div className="hidden md:grid grid-cols-10 gap-4 h-125 rounded-4xl overflow-hidden relative group bg-foreground/5">
          <div className="col-span-6 h-full cursor-pointer overflow-hidden" onClick={() => { setLightboxIndex(0); setIsLightboxOpen(true); }}>
            <img src={galleryImages[0]} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="col-span-4 grid grid-cols-2 grid-rows-2 gap-4 h-full">
            {galleryImages.slice(1, 5).map((img, i) => (
              <div key={i} className="cursor-pointer overflow-hidden rounded-xl" onClick={() => { setLightboxIndex(i + 1); setIsLightboxOpen(true); }}>
                <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile Single Image Fallback */}
        <div className="md:hidden w-full aspect-square rounded-3xl overflow-hidden cursor-pointer" onClick={() => { setLightboxIndex(0); setIsLightboxOpen(true); }}>
           <img src={galleryImages[0]} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column (Details) */}
        <div className="lg:col-span-7">
          <section className="mb-12 border-b border-foreground/10 pb-8">
            <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4 tracking-tight">{room.name}</h1>
            <div className="flex items-center gap-4 text-foreground/60 font-sans text-sm">
              <span className="flex items-center gap-1.5"><Users size={16} /> Up to {room.capacity} Guests</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><BedDouble size={16} /> {room.type === 'PRIVATE' ? 'Private Suite' : 'Shared Dorm'}</span>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="font-serif text-2xl text-foreground mb-6 italic">The Experience</h2>
            <p className="font-serif text-lg text-foreground/70 leading-relaxed font-light whitespace-pre-wrap">
              {room.description || "A serene space designed for rest and wonder in the heart of the mountains."}
            </p>
          </section>

          {/* Highlights Grid */}
          <section className="mb-12">
            <h2 className="font-sans text-xs uppercase tracking-widest font-bold text-foreground/50 mb-6">Room Highlights</h2>
            <div className="grid grid-cols-2 gap-4">
              {console.log(room)}
              {[
                { label: 'Bed Type', value: room.bedSize || 'Standard', icon: BedDouble },
                { label: 'Max Capacity', value: `${room.capacity} Guests`, icon: Users },
                { label: 'WiFi', value: 'High-Speed', icon: Wifi },
                { label: 'View', value: 'Valley / Forest', icon: Mountain },
              ].map((detail, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-foreground/5 flex flex-col gap-2 shadow-sm">
                  <detail.icon size={18} className="text-accent mb-2" />
                  <span className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold">{detail.label}</span>
                  <span className="font-sans text-sm font-bold text-foreground">{detail.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* House Rules */}
          <section className="mb-12 border-t border-foreground/10 pt-12">
            <h2 className="font-sans text-xs uppercase tracking-widest font-bold text-foreground/50 mb-6">House Rules</h2>
            <ul className="space-y-4">
              {[
                'Check-in: After 12:00 PM',
                'Check-out: Before 11:00 AM',
                'No smoking indoors',
                'Pets not allowed',
                `Max capacity: ${room.capacity} Guests`
              ].map((rule, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground/70 font-serif">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/60"></div>
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column - Sticky Widget */}
        <div className="lg:col-span-5 hidden lg:block">
          <div className="sticky top-32 bg-white rounded-4xl shadow-xl border border-foreground/5 p-8">
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-3xl font-serif text-foreground">₹{room.basePrice}</span>
              <span className="font-sans text-sm text-foreground/50">/ night</span>
            </div>

            {/* Form Widget - INLINE ACCORDION STYLE */}
            <div className="border border-foreground/10 rounded-2xl mb-6 overflow-hidden bg-white">
              
              {/* Date Triggers Row */}
              <div className="grid grid-cols-2 border-b border-foreground/10">
                <div 
                  onClick={() => setActivePicker(activePicker === 'checkin' ? null : 'checkin')}
                  className="p-4 border-r border-foreground/10 hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">Check-in</label>
                  <span className="text-sm font-sans font-bold text-foreground">
                    {checkIn ? format(checkIn, 'dd MMM yyyy') : 'Add date'}
                  </span>
                </div>
                <div 
                  onClick={() => setActivePicker(activePicker === 'checkout' ? null : 'checkout')}
                  className="p-4 hover:bg-foreground/5 transition-colors cursor-pointer"
                >
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">Check-out</label>
                  <span className="text-sm font-sans font-bold text-foreground">
                    {checkOut ? format(checkOut, 'dd MMM yyyy') : 'Add date'}
                  </span>
                </div>
              </div>

              {/* Inline Dates Expansion */}
              <AnimatePresence>
                {(activePicker === 'checkin' || activePicker === 'checkout') && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-foreground/10 bg-white">
                    <div className="p-4 flex justify-center">
                      <DayPicker 
                        mode="single" 
                        selected={activePicker === 'checkin' ? checkIn : checkOut} 
                        onSelect={(date) => { 
                          if (date) {
                            if (activePicker === 'checkin') {
                              setCheckIn(date); 
                              if (checkOut && date >= checkOut) setCheckOut(undefined); 
                              setActivePicker('checkout');
                            } else {
                              setCheckOut(date);
                              setActivePicker(null);
                            }
                          }
                        }} 
                        disabled={{ before: activePicker === 'checkin' ? startOfToday() : (checkIn ? addDays(checkIn, 1) : startOfToday()) }} 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Guests Trigger */}
              <div 
                onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')}
                className="p-4 hover:bg-foreground/5 transition-colors cursor-pointer flex justify-between items-center"
              >
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">Guests</label>
                  <span className="text-sm font-sans font-bold text-foreground">
                    {totalGuests} {totalGuests === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                <ChevronDown size={16} className={`text-foreground/40 transition-transform ${activePicker === 'guests' ? 'rotate-180' : ''}`} />
              </div>

              {/* Inline Guests Expansion */}
              <AnimatePresence>
                {activePicker === 'guests' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white border-t border-foreground/10">
                    <div className="p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-foreground">Adults</p>
                          <p className="text-[10px] text-foreground/50">Ages 13+</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setGuestCounts(p => ({...p, adults: Math.max(1, p.adults - 1)})); }} className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors"><Minus size={14}/></button>
                          <span className="w-4 text-center font-bold text-sm text-foreground">{guestCounts.adults}</span>
                          <button disabled={totalGuests >= room.capacity} onClick={(e) => { e.stopPropagation(); setGuestCounts(p => ({...p, adults: p.adults + 1})); }} className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors disabled:opacity-30"><Plus size={14}/></button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-foreground">Children</p>
                          <p className="text-[10px] text-foreground/50">Ages 2-12</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setGuestCounts(p => ({...p, children: Math.max(0, p.children - 1)})); }} className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors"><Minus size={14}/></button>
                          <span className="w-4 text-center font-bold text-sm text-foreground">{guestCounts.children}</span>
                          <button disabled={totalGuests >= room.capacity} onClick={(e) => { e.stopPropagation(); setGuestCounts(p => ({...p, children: p.children + 1})); }} className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors disabled:opacity-30"><Plus size={14}/></button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {nights > 0 && (
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-foreground/70 font-serif">
                  <span>₹{room.basePrice} × {nights} nights</span>
                  <span>₹{basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-foreground/70 font-serif border-b border-foreground/10 pb-4">
                  <span>Taxes & fees (12% GST)</span>
                  <span>₹{gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-sans font-bold text-lg text-foreground">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button onClick={handleReserve} className="w-full py-4 rounded-full bg-accent text-white font-bold tracking-widest uppercase text-sm hover:opacity-90 transition-opacity shadow-lg">
              Reserve Now
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-foreground/10 p-4 z-40 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-serif text-foreground font-bold">₹{room.basePrice}</span>
            <span className="text-xs text-foreground/50">/ night</span>
          </div>
          <button 
            onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setActivePicker('checkin'); }}
            className="text-[10px] uppercase tracking-widest font-bold text-accent underline mt-1"
          >
            {checkIn && checkOut ? `${format(checkIn, 'dd MMM')} - ${format(checkOut, 'dd MMM')}` : 'Select dates'}
          </button>
        </div>
        <button 
          onClick={handleReserve}
          className="px-8 py-3 rounded-full bg-accent text-white font-bold tracking-widest uppercase text-xs hover:opacity-90 transition-opacity shadow-lg"
        >
          Reserve
        </button>
      </div>

      <Lightbox images={galleryImages} isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} initialIndex={lightboxIndex} />
    </main>
  );
}

export default function RoomDetailPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>}>
        <RoomDetailContent />
      </Suspense>
    </main>
  );
}