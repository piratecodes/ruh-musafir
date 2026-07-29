"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { format, addDays, startOfToday } from 'date-fns';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import 'react-day-picker/dist/style.css';

export default function Header() {
  const router = useRouter();
  
  const [checkIn, setCheckIn] = useState(startOfToday());
  const [checkOut, setCheckOut] = useState(addDays(startOfToday(), 1));
  const [guestCounts, setGuestCounts] = useState({ adults: 1, children: 0 });
  const [roomType, setRoomType] = useState('all');
  
  const [activePicker, setActivePicker] = useState(null); 
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckAvailability = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      checkin: checkIn ? format(checkIn, 'yyyy-MM-dd') : '',
      checkout: checkOut ? format(checkOut, 'yyyy-MM-dd') : '',
      guests: (guestCounts.adults + guestCounts.children).toString(),
      type: roomType
    });
    // THE FIX: Changed from /search to /rooms
    router.push(`/rooms?${params.toString()}`); 
  };

  return (
    <header className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
          alt="Shangarh Mountains"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/30 to-black/70"></div>
      </div>

      <div className="container py-24 relative z-10 flex flex-col items-center text-center">
        
        <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
          <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">
            The Soul of Shangarh
          </span>
        </div>

        <h1 className="font-serif text-5xl md:text-7xl text-white mb-4 leading-tight drop-shadow-lg">
          Arrive as a Guest,<br />
          <span className="italic font-light">Stay as a Local.</span>
        </h1>
        
        <p className="max-w-2xl text-base md:text-lg text-white/90 font-light tracking-wide mb-12 drop-shadow-md">
          Experience the "Slow Life" in the heart of the Himalayas. A soulful sanctuary offering warmth, comfort, and breathtaking views.
        </p>

        {/* Normal Flow Booking Bar */}
        <div className="w-full max-w-5xl" ref={pickerRef}>
          <form 
            onSubmit={handleCheckAvailability}
            className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 rounded-4xl md:rounded-full border border-white/30 bg-white/10 p-4 md:p-3 backdrop-blur-md shadow-2xl relative transition-all duration-300"
          >
            
            {/* Check-In Layout */}
            <div className="flex-1 w-full px-4 py-2 border-b md:border-b-0 md:border-r border-white/20 relative">
              <label className="block text-[10px] font-bold tracking-widest text-white/70 uppercase mb-1 text-left">
                Check-in
              </label>
              <div 
                onClick={() => setActivePicker(activePicker === 'checkin' ? null : 'checkin')}
                className="text-white text-sm cursor-pointer flex items-center justify-between"
              >
                <span>{checkIn ? format(checkIn, 'dd MMM yyyy') : 'Select'}</span>
                <ChevronDown size={14} className={`text-white/50 transition-transform ${activePicker === 'checkin' ? 'rotate-180' : ''}`} />
              </div>

              {/* Popup floating ABOVE (bottom-full) */}
              <AnimatePresence>
                {activePicker === 'checkin' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-4 bg-white p-4 rounded-3xl shadow-xl border border-gray-100 text-foreground z-50 origin-bottom"
                  >
                    <DayPicker 
                      mode="single" 
                      selected={checkIn} 
                      onSelect={(date) => { 
                        if(date) { setCheckIn(date); setActivePicker('checkout'); } 
                      }} 
                      disabled={{ before: startOfToday() }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Check-Out Layout */}
            <div className="flex-1 w-full px-4 py-2 border-b md:border-b-0 md:border-r border-white/20 relative">
              <label className="block text-[10px] font-bold tracking-widest text-white/70 uppercase mb-1 text-left">
                Check-out
              </label>
              <div 
                onClick={() => setActivePicker(activePicker === 'checkout' ? null : 'checkout')}
                className="text-white text-sm cursor-pointer flex items-center justify-between"
              >
                <span>{checkOut ? format(checkOut, 'dd MMM yyyy') : 'Select'}</span>
                <ChevronDown size={14} className={`text-white/50 transition-transform ${activePicker === 'checkout' ? 'rotate-180' : ''}`} />
              </div>

              {/* Popup floating ABOVE (bottom-full) */}
              <AnimatePresence>
                {activePicker === 'checkout' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-4 bg-white p-4 rounded-3xl shadow-xl border border-gray-100 text-foreground z-50 origin-bottom"
                  >
                    <DayPicker 
                      mode="single" 
                      selected={checkOut} 
                      onSelect={(date) => { 
                        if(date) { setCheckOut(date); setActivePicker(null); } 
                      }} 
                      disabled={{ before: checkIn || startOfToday() }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Guests Layout */}
            <div className="flex-[0.8] w-full px-4 py-2 border-b md:border-b-0 md:border-r border-white/20 relative">
              <label className="block text-[10px] font-bold tracking-widest text-white/70 uppercase mb-1 text-left">
                Guests
              </label>
              <div 
                onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')}
                className="text-white text-sm cursor-pointer flex items-center justify-between"
              >
                <span>{guestCounts.adults + guestCounts.children}</span>
                <ChevronDown size={14} className={`text-white/50 transition-transform ${activePicker === 'guests' ? 'rotate-180' : ''}`} />
              </div>

              {/* Popup floating ABOVE (bottom-full) */}
              <AnimatePresence>
                {activePicker === 'guests' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-4 w-64 bg-white p-5 rounded-3xl shadow-xl border border-gray-100 text-foreground z-50 origin-bottom"
                  >
                     <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">Adults</span>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setGuestCounts(p => ({...p, adults: Math.max(1, p.adults - 1)}))} className="p-1.5 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"><Minus size={14} /></button>
                            <span className="w-4 text-center text-sm font-medium">{guestCounts.adults}</span>
                            <button type="button" onClick={() => setGuestCounts(p => ({...p, adults: p.adults + 1}))} className="p-1.5 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"><Plus size={14} /></button>
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Room Type Layout */}
            <div className="flex-1 w-full px-4 py-2 relative">
              <label className="block text-[10px] font-bold tracking-widest text-white/70 uppercase mb-1 text-left">
                Room
              </label>
              <div 
                onClick={() => setActivePicker(activePicker === 'rooms' ? null : 'rooms')}
                className="text-white text-sm cursor-pointer flex items-center justify-between"
              >
                <span className="capitalize">{roomType === 'all' ? 'All Rooms' : roomType === 'private' ? 'Private Room' : 'Dorm Bunk'}</span>
                <ChevronDown size={14} className={`text-white/50 transition-transform ${activePicker === 'rooms' ? 'rotate-180' : ''}`} />
              </div>

               {/* Popup floating ABOVE (bottom-full right-0 to prevent screen overflow) */}
               <AnimatePresence>
                {activePicker === 'rooms' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-4 w-full md:w-48 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 text-foreground z-50 origin-bottom"
                  >
                    {['all', 'private', 'dorm'].map(type => (
                        <div 
                            key={type} 
                            onClick={() => { setRoomType(type); setActivePicker(null); }}
                            className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium capitalize text-left transition-colors"
                        >
                            {type === 'all' ? 'All Rooms' : type === 'private' ? 'Private Room' : 'Dorm Bunk'}
                        </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA Button */}
            <div className="w-full md:w-auto mt-2 md:mt-0 md:pl-2">
              <button type="submit" className="w-full md:w-auto rounded-full bg-primary hover:bg-[#4A5A46] px-8 py-4 text-sm font-bold tracking-widest text-white transition-all shadow-lg">
                CHECK AVAILABILITY
              </button>
            </div>

          </form>
        </div>
      </div>
    </header>
  );
}