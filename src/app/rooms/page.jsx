"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Check, Minus, Plus, ChevronDown, 
  Home as HomeIcon, Heart, ArrowRight, Loader2, Sparkles
} from 'lucide-react';
import { format, parseISO, startOfToday, addDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast'; 

// IMPORT REDUX HOOKS
import { useGetRoomsQuery } from '@/store/api/roomsApi';
// THE FIX: Imported the bookings API so we can check real availability
import { useCheckAvailabilityQuery } from '@/store/api/bookingsApi';

// --- Sub-Components ---
const AvailabilityBar = ({ initialCheckin = '', initialCheckout = '', initialType = 'all' }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [checkIn, setCheckIn] = useState(initialCheckin ? parseISO(initialCheckin) : undefined);
  const [checkOut, setCheckOut] = useState(initialCheckout ? parseISO(initialCheckout) : undefined);
  
  const [guestCounts, setGuestCounts] = useState({ 
    adults: parseInt(searchParams.get('guests')) || 1, 
    children: 0 
  });
  const totalGuests = guestCounts.adults + guestCounts.children;
  
  const [roomType, setRoomType] = useState(initialType);
  const [activePicker, setActivePicker] = useState(null);
  const pickerRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setActivePicker(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- AUTO-UPDATE URL ON ANY CHANGE ---
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (checkIn) params.set('checkin', format(checkIn, 'yyyy-MM-dd'));
    else params.delete('checkin');
    
    if (checkOut) params.set('checkout', format(checkOut, 'yyyy-MM-dd'));
    else params.delete('checkout');
    
    params.set('guests', totalGuests.toString());
    params.set('type', roomType);

    // scroll: false prevents the page from jumping to the top on every click
    router.push(`/rooms?${params.toString()}`, { scroll: false });
  }, [checkIn, checkOut, totalGuests, roomType, router]);

  return (
    <div className="w-full relative z-30 pt-32 pb-8">
      <div className="container">
        
        <div ref={pickerRef} className="bg-white rounded-3xl shadow-md border border-foreground/5 overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch md:items-center">
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-foreground/5">
              
              {/* Check-in */}
              <div onClick={() => setActivePicker(activePicker === 'checkin' ? null : 'checkin')} className="px-6 py-4 hover:bg-foreground/5 transition-colors cursor-pointer">
                <label className="font-sans text-[9px] uppercase tracking-widest text-foreground/50 font-bold mb-1 block">Check-in</label>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-accent" />
                  <span className="font-serif text-sm font-semibold text-foreground">{checkIn ? format(checkIn, 'dd MMM yyyy') : 'Select Dates'}</span>
                </div>
              </div>

              {/* Check-out */}
              <div onClick={() => setActivePicker(activePicker === 'checkout' ? null : 'checkout')} className="px-6 py-4 hover:bg-foreground/5 transition-colors cursor-pointer">
                <label className="font-sans text-[9px] uppercase tracking-widest text-foreground/50 font-bold mb-1 block">Check-out</label>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-accent" />
                  <span className="font-serif text-sm font-semibold text-foreground">{checkOut ? format(checkOut, 'dd MMM yyyy') : 'Select Dates'}</span>
                </div>
              </div>

              {/* Guests */}
              <div onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')} className="px-6 py-4 hover:bg-foreground/5 transition-colors cursor-pointer">
                <label className="font-sans text-[9px] uppercase tracking-widest text-foreground/50 font-bold mb-1 block">Guests</label>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-serif text-sm font-semibold text-foreground">
                    <span className="text-accent font-sans font-bold mr-1">{totalGuests}</span>
                    {totalGuests === 1 ? 'Guest' : 'Guests'}
                  </div>
                  <ChevronDown size={14} className={`text-foreground/40 transition-transform ${activePicker === 'guests' ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Room Type */}
              <div onClick={() => setActivePicker(activePicker === 'type' ? null : 'type')} className="px-6 py-4 hover:bg-foreground/5 transition-colors cursor-pointer">
                <label className="font-sans text-[9px] uppercase tracking-widest text-foreground/50 font-bold mb-1 block">Room Type</label>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-serif text-sm font-semibold text-foreground capitalize">
                    <HomeIcon size={14} className="text-accent" />
                    {roomType === 'all' ? 'All Rooms' : roomType === 'dorm' ? 'Dorm Bunk' : 'Private Room'}
                  </div>
                  <ChevronDown size={14} className={`text-foreground/40 transition-transform ${activePicker === 'type' ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>
            
            {/* Search Button visually completes the bar */}
            <div className="p-2">
              <button 
                onClick={() => setActivePicker(null)} 
                className="w-full h-full min-h-14 px-8 bg-primary text-white rounded-2xl md:rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors shadow-sm shrink-0"
              >
                Search
              </button>
            </div>
          </div>

          <AnimatePresence>
            {(activePicker === 'checkin' || activePicker === 'checkout') && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-foreground/5 bg-white">
                <div className="p-6 flex justify-center">
                  <DayPicker 
                    mode="single" 
                    selected={activePicker === 'checkin' ? checkIn : checkOut} 
                    onSelect={(date) => { 
                      if (date) {
                        if (activePicker === 'checkin') {
                          setCheckIn(date); 
                          // THE FIX: Enterprise UX Auto-open checkout if missing or invalid
                          if (checkOut && date >= checkOut) setCheckOut(undefined); 
                          setActivePicker('checkout');
                        } else {
                          setCheckOut(date);
                          // THE FIX: Auto-close picker when completed
                          setActivePicker(null);
                        }
                      }
                    }} 
                    disabled={{ before: activePicker === 'checkin' ? startOfToday() : (checkIn ? addDays(checkIn, 1) : startOfToday()) }} 
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </div>
              </motion.div>
            )}
            
            {activePicker === 'guests' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-foreground/5 bg-white">
                <div className="p-8 max-w-md mx-auto space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-foreground">Adults</p>
                      <p className="text-[10px] text-foreground/50">Ages 13+</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); setGuestCounts(p => ({...p, adults: Math.max(1, p.adults - 1)})); }} className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors"><Minus size={14}/></button>
                      <span className="w-4 text-center font-bold text-sm text-foreground">{guestCounts.adults}</span>
                      <button disabled={totalGuests >= 8} onClick={(e) => { e.stopPropagation(); setGuestCounts(p => ({...p, adults: p.adults + 1})); }} className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors disabled:opacity-30"><Plus size={14}/></button>
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
                      <button disabled={totalGuests >= 8} onClick={(e) => { e.stopPropagation(); setGuestCounts(p => ({...p, children: p.children + 1})); }} className="p-2 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors disabled:opacity-30"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activePicker === 'type' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-foreground/5 bg-white">
                <div className="p-4 flex justify-center gap-4">
                  {[{ id: 'all', label: 'All Rooms' }, { id: 'private', label: 'Private Room' }, { id: 'dorm', label: 'Dorm Bunk' }].map(type => (
                    <div 
                      key={type.id} onClick={() => { setRoomType(type.id); setActivePicker(null); }}
                      className={`px-6 py-3 rounded-full cursor-pointer font-sans text-xs font-bold uppercase tracking-widest transition-colors ${roomType === type.id ? 'bg-accent text-white' : 'text-foreground border border-foreground/10 hover:bg-foreground/5'}`}
                    >
                      {type.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {totalGuests > 4 && (
             <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center text-xs mt-4 text-accent font-bold tracking-widest uppercase">
               * For groups larger than 4, please select multiple rooms or bunks.
             </motion.p>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// THE FIX: Upgraded RoomGridCard for Professional "BookMyShow" Dorm UX
const RoomGridCard = ({ room, searchParams }) => {
  const displayImg = room.images && room.images.length > 0 
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${room.images[0]}`
    : "https://dummyimage.com/800x600/5C6E58/E8E1D9&text=Room";

  const isDorm = room.type === 'DORM';
  
  // Calculate availability context
  const hasDates = !!(searchParams.get('checkin') && searchParams.get('checkout'));
  const availableBedsCount = room.availableBeds?.length; // Provided by backend if dates are selected
  
  const handleBookClick = (e) => {
    const checkin = searchParams.get('checkin');
    const checkout = searchParams.get('checkout');
    
    if (!checkin || !checkout) {
      e.preventDefault(); 
      toast.error("Please select your check-in and check-out dates first!");
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-4xl overflow-hidden border border-foreground/5 transition-all duration-300 shadow-sm hover:shadow-xl group flex flex-col">
      <Link href={`/rooms/${room.slug}?${searchParams.toString()}`} className="relative aspect-4/3 overflow-hidden block">
        <img src={displayImg} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold text-white shadow-md ${!isDorm ? 'bg-primary' : 'bg-accent'}`}>
          {!isDorm ? 'Private Suite' : 'Shared Dormitory'}
        </div>
      </Link>
      
      <div className="p-6 flex flex-col grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-2xl text-foreground line-clamp-1">{room.name}</h3>
          <p className="font-sans font-bold text-accent text-lg shrink-0">
            ₹{room.basePrice} 
            {/* Contextual Pricing Label */}
            <span className="font-normal text-[10px] text-foreground/50">
              {isDorm ? ' / bed / night' : ' / night'}
            </span>
          </p>
        </div>
        
        <div className="flex gap-2 mb-4 font-sans text-xs text-foreground/60 font-medium uppercase tracking-widest">
          {/* Contextual Capacity & Bed Size Label */}
          {isDorm ? (
            <>
              {hasDates && availableBedsCount !== undefined ? (
                <span className={availableBedsCount <= 2 ? 'text-orange-500 font-bold' : ''}>
                  {availableBedsCount} {availableBedsCount === 1 ? 'Bed Left' : 'Beds Left'}
                </span>
              ) : (
                <span>{room.capacity} Total Beds</span>
              )}
              <span>•</span>
              <span>{room.bedSize || 'Bunk Beds'}</span>
            </>
          ) : (
            <>
              <span>Up to {room.capacity} {room.capacity > 1 ? 'Guests' : 'Guest'}</span>
              <span>•</span>
              <span>{room.bedSize || 'Private Suite'}</span>
            </>
          )}
        </div>
        
        <p className="font-serif text-sm text-foreground/70 line-clamp-2 mb-8 grow">{room.description}</p>
        
        <div className="flex items-center gap-3 pt-4 border-t border-foreground/5 mt-auto">
          <Link href={`/rooms/${room.slug}?${searchParams.toString()}`} className="flex-1 text-center py-3 rounded-full border border-foreground/20 text-foreground font-bold text-xs uppercase tracking-widest hover:bg-foreground/5 transition-colors">
            Details
          </Link>
          
          <Link 
            href={`/rooms/${room.slug}/checkout?${searchParams.toString()}`} 
            onClick={handleBookClick} 
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-md"
          >
            {/* Contextual Call To Action */}
            {isDorm ? 'Select Beds' : 'Book Room'} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

function RoomsContent() {
  const searchParams = useSearchParams();
  
  const checkin = searchParams.get('checkin');
  const checkout = searchParams.get('checkout');
  const guests = searchParams.get('guests') || '1';
  const urlType = searchParams.get('type') || 'all';
  
  // THE FIX: Advanced Sync Logic - Use check availability if dates exist, otherwise get static rooms
  const hasDates = checkin && checkout;
  
  const { data: availRes, isLoading: isAvailLoading } = useCheckAvailabilityQuery(
    { checkin, checkout, guests, type: urlType },
    { skip: !hasDates }
  );
  
  const { data: allRes, isLoading: isAllLoading } = useGetRoomsQuery(undefined, { skip: hasDates });

  const isLoading = hasDates ? isAvailLoading : isAllLoading;
  
  let filteredRooms = hasDates ? (availRes?.data || []) : (allRes?.data || []);

  // If we don't have dates, we must manually filter the static list by capacity and type
  if (!hasDates) {
    filteredRooms = filteredRooms.filter(r => r.capacity >= parseInt(guests));
    if (urlType !== 'all') {
      filteredRooms = filteredRooms.filter(r => r.type.toLowerCase() === urlType.toLowerCase());
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 pt-32">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">Scanning Availability...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <AvailabilityBar initialCheckin={searchParams.get('checkin')} initialCheckout={searchParams.get('checkout')} initialType={urlType} />
      <div className="container mt-8">
        
        <div className="py-4 flex justify-between items-center border-b border-foreground/5 mb-8">
          <p className="font-serif text-lg text-foreground/70"><span className="font-bold text-foreground">{filteredRooms.length} rooms</span> available</p>
        </div>
        
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room) => <RoomGridCard key={room.id} room={room} searchParams={searchParams} />)}
          </div>
        ) : (
          <div className="py-20 text-center bg-foreground/5 rounded-4xl border border-foreground/10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-accent shadow-sm">
              <Sparkles size={24} />
            </div>
            <h3 className="font-serif text-2xl text-foreground mb-2">No Rooms Found</h3>
            <p className="font-sans text-sm text-foreground/60 max-w-md mx-auto">
              We couldn't find any rooms matching your exact criteria. Try selecting "All Rooms" or adjusting your dates.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
        <RoomsContent />
      </Suspense>
    </main>
  );
}