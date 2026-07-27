"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; 
import { useSelector } from 'react-redux';
import { 
  Calendar as CalendarIcon, Users, X, Info, 
  ArrowRight, ArrowLeft, CreditCard, Mountain, Sparkles, 
  Check, Banknote, Loader2, BedDouble, AlertTriangle // <-- THE FIX: Added AlertTriangle here!
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseISO, format, addDays, startOfToday } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast'; 

// IMPORT REDUX HOOKS
import { useGetRoomsQuery } from '@/store/api/roomsApi';
import { useGetExperiencesQuery } from '@/store/api/experiencesApi';
import { useCheckAvailabilityQuery, useCreateBookingMutation } from '@/store/api/bookingsApi';

const fadeInUp = {
  initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 },
  transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
};

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params?.slug;

  const [isMaintenanceLocked, setIsMaintenanceLocked] = useState({ locked: false, message: '' });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/settings/maintenance`)
      .then(res => res.json())
      .then(data => {
        if (data.isMaintenanceMode) setIsMaintenanceLocked({ locked: true, message: data.maintenanceMessage });
      }).catch(err => console.error("Failed to fetch maintenance status"));
  }, []);
  
  const urlCheckin = searchParams.get('checkin');
  const urlCheckout = searchParams.get('checkout');
  const urlGuests = searchParams.get('guests') || '1';

  useEffect(() => {
    if (!urlCheckin || !urlCheckout) {
      toast.error("Please select your check-in and check-out dates before proceeding.");
      router.replace(`/rooms/${slug}`);
    }
  }, [urlCheckin, urlCheckout, router, slug]);

  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (urlCheckin && urlCheckout) {
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          router.push(`/login?returnUrl=${returnUrl}`);
        } else {
          setIsAuthChecking(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router, urlCheckin, urlCheckout]);

  const { data: roomsRes, isLoading: isRoomsLoading } = useGetRoomsQuery();
  const { data: expRes } = useGetExperiencesQuery();
  const [createBooking, { isLoading: isBookingSubmitting }] = useCreateBookingMutation();

  const liveRooms = roomsRes?.data || [];
  const liveExperiences = expRes?.data || [];
  const selectedRoomData = liveRooms.find(r => r.slug === slug);
  const selectedRoom = selectedRoomData?.id; 

  const [selectedExperiences, setSelectedExperiences] = useState(searchParams.get('experience') ? [searchParams.get('experience')] : []);
  const [guests, setGuests] = useState(parseInt(urlGuests) || 1);
  const [checkIn, setCheckIn] = useState(urlCheckin || '');
  const [checkOut, setCheckOut] = useState(urlCheckout || '');
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('property'); 
  const [activePicker, setActivePicker] = useState(null);
  
  // State for "BookMyShow" Interactive Bed Map
  const [selectedBeds, setSelectedBeds] = useState([]);

  const [personalDetails, setPersonalDetails] = useState({ 
    name: user ? `${user.firstName} ${user.lastName}` : '', 
    email: user?.email || '', 
    phone: user?.phone || '', 
    requests: '' 
  });

  const { data: availRes, isFetching: isCheckingAvailability } = useCheckAvailabilityQuery(
    { checkin: checkIn, checkout: checkOut, guests: guests.toString() },
    { skip: !checkIn || !checkOut || !selectedRoom }
  );

  const isAvailable = availRes?.data ? availRes.data.some(r => r.id === selectedRoom) : true;

  // Dynamic Guest Cap based on exact Bed Availability
  const availableRoomInfo = availRes?.data?.find(r => r.id === selectedRoom);
  const availableBeds = availableRoomInfo?.availableBeds || [];
  const allRoomBeds = availableRoomInfo?.beds || []; 
  
  const maxCapacity = selectedRoomData?.type === 'DORM' && checkIn && checkOut
    ? availableBeds.length 
    : (selectedRoomData?.capacity || 1);

  // Auto-reduce guests if they exceed max real availability
  useEffect(() => {
    if (guests > maxCapacity && maxCapacity > 0) {
      setGuests(maxCapacity);
    }
  }, [maxCapacity, guests]);

  // Keep selected beds strictly bound to the guest count
  useEffect(() => {
    if (selectedBeds.length > guests) {
      setSelectedBeds(prev => prev.slice(0, guests));
    }
  }, [guests]);

  const getNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateTotal = () => {
    const nights = getNights();
    let total = 0;
    if (selectedRoomData) {
      const basePrice = selectedRoomData.type === 'DORM' ? selectedRoomData.basePrice * guests : selectedRoomData.basePrice;
      total += basePrice * (nights || 1);
    }
    selectedExperiences.forEach(expId => {
      const exp = liveExperiences.find(e => e.id === expId);
      if (exp) total += exp.price * guests; 
    });
    return Math.round(total);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (getNights() <= 0) return toast.error("Check-out date must be after check-in.");
    if (!isAvailable) return toast.error("Sorry, this room is no longer available for these dates.");

    // Block progression if Dorm beds aren't mapped
    if (step === 1) {
      if (selectedRoomData?.type === 'DORM' && selectedBeds.length !== guests) {
        return toast.error(`Please select exactly ${guests} bed(s) from the layout map.`);
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      try {
        const total = calculateTotal();
        const isPayNow = paymentMethod === 'online';

        const payload = {
          roomId: selectedRoom,
          bedIds: selectedRoomData?.type === 'DORM' ? selectedBeds : [], // Sends Array of Beds
          checkIn: new Date(checkIn).toISOString(),   
          checkOut: new Date(checkOut).toISOString(), 
          adults: guests,
          children: 0, 
          specialNotes: personalDetails.requests,
          totalAmount: total,
          amountPaid: isPayNow ? total : 0, 
          dueAmount: isPayNow ? 0 : total, 
          paymentStatus: isPayNow ? 'PAID' : 'PENDING',
          paymentMode: isPayNow ? 'UPI' : 'CASH',  
          experiences: selectedExperiences,
          guestFirstName: personalDetails.name.split(' ')[0] || 'Guest',
          guestLastName: personalDetails.name.split(' ').slice(1).join(' ') || '',
          guestEmail: personalDetails.email,
          guestPhone: personalDetails.phone,
        };

        await createBooking(payload).unwrap();
        
        if (isPayNow) toast.success("Payment Successful! Booking Confirmed.");
        else toast.success("Booking Requested! An admin will confirm shortly.");
        
        router.push('/bookings'); 
      } catch (err) {
        console.error("Booking failed:", err);
        toast.error(err?.data?.message || "Failed to confirm booking. Please try again.");
      }
    }
  };

  if (!urlCheckin || !urlCheckout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">Redirecting to room details...</p>
      </div>
    );
  }

  if (isAuthChecking || isRoomsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">Securing Environment...</p>
      </div>
    );
  }

  if (!selectedRoom || !selectedRoomData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center text-foreground/40 mb-6 shadow-sm"><Mountain size={40} /></div>
        <h2 className="font-serif text-4xl text-foreground mb-4">No Room Selected</h2>
        <p className="font-sans text-foreground/60 max-w-md mb-10 leading-relaxed">Your sanctuary awaits. Please explore our spaces and select a room to proceed with your reservation.</p>
        <button onClick={() => router.push('/rooms')} className="px-10 py-4 rounded-full bg-primary text-white font-bold tracking-widest uppercase text-sm hover:bg-primary/90 transition-all shadow-lg flex items-center gap-3">Browse Sanctuary Rooms <ArrowRight size={16} /></button>
      </div>
    );
  }

  // ==========================================
  // DYNAMIC STEP NUMBERING LOGIC
  // ==========================================
  const hasBedsSection = selectedRoomData?.type === 'DORM' && checkIn && checkOut && allRoomBeds.length > 0;
  const hasExpSection = liveExperiences.length > 0;

  const numDates = 1;
  const numBeds = hasBedsSection ? numDates + 1 : numDates;
  const numExp = hasExpSection ? numBeds + 1 : numBeds;
  const numDetails = numExp + 1;
  const numPayment = numDetails + 1;

  return (
    <div className="container relative z-10">
      
      <div className="mb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-foreground/5 border border-foreground/10 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
          <span className="font-sans text-[10px] tracking-[0.4em] uppercase font-bold text-foreground">Reservation</span>
        </motion.div>
        <h1 className="font-serif text-5xl md:text-7xl text-foreground mb-6 tracking-tight leading-tight">
          Book Your <br /><span className="italic font-light text-foreground/60">Sanctuary</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
        
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-4xl border border-foreground/10 shadow-sm mb-8 flex items-center gap-6">
            <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${selectedRoomData.images[0]}`} alt="Room" className="w-20 h-20 rounded-2xl object-cover shrink-0" />
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-1">You're booking</p>
              <h3 className="font-serif text-2xl text-foreground">{selectedRoomData.name}</h3>
              <p className="font-sans text-xs text-foreground/60 mt-1 font-medium">
                {checkIn && checkOut ? `${format(parseISO(checkIn), 'dd MMM')} → ${format(parseISO(checkOut), 'dd MMM')} · ${guests} Guests` : `${selectedRoomData.capacity} Capacity`}
              </p>
            </div>
            <button onClick={() => router.push(`/rooms/${slug}`)} className="ml-auto font-sans text-xs text-accent font-bold tracking-widest uppercase hover:underline shrink-0">Change Dates</button>
          </div>
          
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-12">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" variants={fadeInUp} initial="initial" animate="animate" exit="exit" className="space-y-10">
                  
                  {/* Dates & Guests */}
                  <section className={`bg-white p-6 md:p-10 rounded-4xl border border-foreground/10 shadow-sm relative transition-all duration-300 ${activePicker ? 'z-30' : 'z-10'}`}>
                    <div className="font-sans text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-8 flex items-center gap-4">
                      <div className="w-6 h-px bg-accent/30"></div> 0{numDates}. Dates & Guests
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      {/* Check-in */}
                      <div className="space-y-3 relative">
                        <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-foreground/50 font-bold ml-2">Check-in</label>
                        <div onClick={() => setActivePicker(activePicker === 'check-in' ? null : 'check-in')} className="relative group cursor-pointer">
                          <CalendarIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/40 group-hover:text-foreground transition-colors" />
                          <div className="w-full pl-14 pr-6 py-4 rounded-full bg-background border border-foreground/10 group-hover:border-foreground/30 transition-all text-foreground font-serif text-base">
                            {checkIn ? format(parseISO(checkIn), 'dd-MMM-yyyy') : 'Select Date'}
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {activePicker === 'check-in' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-4 z-50 bg-white p-4 rounded-3xl shadow-2xl border border-foreground/10">
                              <DayPicker
                                mode="single" selected={checkIn ? parseISO(checkIn) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setCheckIn(format(date, 'yyyy-MM-dd'));
                                    if (checkOut && date >= parseISO(checkOut)) setCheckOut('');
                                    setActivePicker('check-out');
                                  }
                                }}
                                disabled={{ before: startOfToday() }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Check-out */}
                      <div className="space-y-3 relative">
                        <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-foreground/50 font-bold ml-2">Check-out</label>
                        <div onClick={() => setActivePicker(activePicker === 'check-out' ? null : 'check-out')} className="relative group cursor-pointer">
                          <CalendarIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/40 group-hover:text-foreground transition-colors" />
                          <div className="w-full pl-14 pr-6 py-4 rounded-full bg-background border border-foreground/10 group-hover:border-foreground/30 transition-all text-foreground font-serif text-base">
                            {checkOut ? format(parseISO(checkOut), 'dd-MMM-yyyy') : 'Select Date'}
                          </div>
                        </div>

                        <AnimatePresence>
                          {activePicker === 'check-out' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-4 z-50 bg-white p-4 rounded-3xl shadow-2xl border border-foreground/10">
                              <DayPicker
                                mode="single" defaultMonth={checkIn ? parseISO(checkIn) : undefined} selected={checkOut ? parseISO(checkOut) : undefined}
                                onSelect={(date) => {
                                  if (date) { setCheckOut(format(date, 'yyyy-MM-dd')); setActivePicker(null); }
                                }}
                                disabled={{ before: checkIn ? addDays(parseISO(checkIn), 1) : startOfToday() }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Guests Dropdown */}
                      <div className="space-y-3 relative">
                        <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-foreground/50 font-bold ml-2">Guests</label>
                        <div onClick={() => setActivePicker(activePicker === 'guests' ? null : 'guests')} className="relative group cursor-pointer">
                          <Users size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/40 transition-colors" />
                          <div className="w-full pl-14 pr-6 py-4 rounded-full bg-background border border-foreground/10 text-foreground font-serif text-base flex justify-between items-center">
                            <span>{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {activePicker === 'guests' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 w-full mt-4 z-50 bg-white overflow-hidden rounded-3xl shadow-2xl border border-foreground/10 max-h-64 overflow-y-auto">
                              {[...Array(maxCapacity)].map((_, idx) => {
                                const num = idx + 1;
                                return (
                                  <div key={num} onClick={() => { setGuests(num); setActivePicker(null); }} className={`px-8 py-4 cursor-pointer font-serif text-lg transition-colors flex justify-between items-center ${guests === num ? 'bg-accent text-white' : 'hover:bg-background text-foreground'}`}>
                                    <span>{num} {num === 1 ? 'Guest' : 'Guests'}</span>
                                    {guests === num && <Check size={16} />}
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </section>

                  {/* THE INTERACTIVE BED MAP ("BookMyShow" Style) */}
                  {hasBedsSection && (
                    <section className="bg-white p-6 md:p-10 rounded-4xl border border-foreground/10 shadow-sm relative z-10">
                       <div className="flex justify-between items-end mb-8">
                         <div className="font-sans text-[10px] uppercase tracking-[0.4em] text-accent font-bold flex items-center gap-4">
                            <div className="w-6 h-px bg-accent/30"></div> 0{numBeds}. Select Your Beds
                         </div>
                         <div className="font-serif text-foreground/60 text-sm">
                           Selected: <span className="text-foreground font-bold">{selectedBeds.length}</span> / {guests}
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {allRoomBeds.map(bed => {
                              const isAvail = availableBeds.some(b => b.id === bed.id);
                              const isSelected = selectedBeds.includes(bed.id);

                              return (
                                  <div 
                                    key={bed.id}
                                    onClick={() => {
                                        if (!isAvail) return;
                                        if (isSelected) {
                                            setSelectedBeds(prev => prev.filter(id => id !== bed.id));
                                        } else {
                                            if (selectedBeds.length < guests) {
                                                setSelectedBeds(prev => [...prev, bed.id]);
                                            } else {
                                                toast.error(`You requested ${guests} guest(s). Please increase guest count to select more beds.`);
                                            }
                                        }
                                    }}
                                    className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 text-center
                                        ${!isAvail ? 'border-primary/5 bg-foreground/5 opacity-40 cursor-not-allowed' : 
                                          isSelected ? 'border-accent bg-accent/10 shadow-lg scale-[1.02]' : 'border-primary/10 bg-white hover:border-primary/30 shadow-sm'}
                                    `}
                                  >
                                      <BedDouble size={28} className={isSelected ? 'text-accent' : 'text-primary/40'} />
                                      <span className="font-bold text-xs uppercase tracking-widest text-foreground">{bed.name}</span>
                                      {!isAvail && <span className="absolute top-2 right-2 text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Booked</span>}
                                  </div>
                              )
                          })}
                       </div>
                    </section>
                  )}

                  {/* Experiences Selection */}
                  {hasExpSection && (
                    <section className="bg-white p-6 md:p-10 rounded-4xl border border-foreground/10 shadow-sm relative z-10">
                      <div className="font-sans text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-8 flex items-center gap-4">
                        <div className="w-6 h-px bg-accent/30"></div> 0{numExp}. Experiences
                      </div>
                      <div className="space-y-4">
                        {liveExperiences.map(exp => (
                          <div key={exp.id} onClick={() => {
                            setSelectedExperiences(prev => prev.includes(exp.id) ? prev.filter(e => e !== exp.id) : [...prev, exp.id]);
                          }}
                            className={`cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 flex items-center gap-6 group ${selectedExperiences.includes(exp.id) ? 'border-accent bg-accent/5' : 'border-foreground/5 bg-background hover:border-foreground/20'}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${selectedExperiences.includes(exp.id) ? 'bg-accent text-white' : 'bg-white border border-foreground/10 text-foreground/40'}`}>
                              {selectedExperiences.includes(exp.id) ? <Check size={20} /> : <Sparkles size={18} />}
                            </div>
                            <div className="grow">
                              <h3 className="font-serif text-xl text-foreground mb-1">{exp.name}</h3>
                              <p className="font-sans text-xs text-foreground/50 uppercase tracking-widest font-bold">{exp.timePeriod}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-foreground block">₹{exp.price}</span>
                              <p className="font-sans text-[9px] text-foreground/50 uppercase tracking-widest">per person</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Personal Details */}
                  <section className="bg-white p-6 md:p-10 rounded-4xl border border-foreground/10 shadow-sm relative z-10">
                    <div className="font-sans text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-8 flex items-center gap-4">
                      <div className="w-6 h-px bg-accent/30"></div> 0{numDetails}. Your Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-3">
                        <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-foreground/50 font-bold ml-2">Full Name</label>
                        <input type="text" required value={personalDetails.name} onChange={e => setPersonalDetails(p => ({ ...p, name: e.target.value }))} className="w-full px-6 py-4 rounded-full bg-background border border-foreground/10 focus:border-accent outline-none text-foreground font-serif text-base" />
                      </div>
                      <div className="space-y-3">
                        <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-foreground/50 font-bold ml-2">Email</label>
                        <input type="email" required value={personalDetails.email} onChange={e => setPersonalDetails(p => ({ ...p, email: e.target.value }))} className="w-full px-6 py-4 rounded-full bg-background border border-foreground/10 focus:border-accent outline-none text-foreground font-serif text-base" />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-foreground/50 font-bold ml-2">Phone</label>
                        <input type="tel" required value={personalDetails.phone} onChange={e => setPersonalDetails(p => ({ ...p, phone: e.target.value }))} className="w-full px-6 py-4 rounded-full bg-background border border-foreground/10 focus:border-accent outline-none text-foreground font-serif text-base" />
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-foreground/50 font-bold ml-2">Special Requests</label>
                        <textarea placeholder="Anything we should know?" rows={3} value={personalDetails.requests} onChange={e => setPersonalDetails(p => ({ ...p, requests: e.target.value }))} className="w-full px-6 py-4 rounded-3xl bg-background border border-foreground/10 focus:border-accent outline-none text-foreground font-serif text-base resize-none" />
                      </div>
                    </div>
                  </section>
                </motion.div>
              ) : (
                <motion.div key="step2" variants={fadeInUp} initial="initial" animate="animate" exit="exit" className="space-y-12">
                  <section className="bg-white p-6 md:p-10 rounded-4xl border border-foreground/10 shadow-sm">
                    <div className="font-sans text-[10px] uppercase tracking-[0.4em] text-accent font-bold mb-8 flex items-center gap-4">
                      <div className="w-6 h-px bg-accent/30"></div> 0{numPayment}. Payment
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div onClick={() => setPaymentMethod('online')} className={`cursor-pointer p-8 rounded-4xl border-2 transition-all duration-300 ${paymentMethod === 'online' ? 'border-accent bg-accent/5' : 'border-foreground/5 bg-background hover:border-foreground/20'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'online' ? 'bg-accent text-white' : 'bg-white text-foreground border border-foreground/10'}`}>
                            <CreditCard size={24} />
                          </div>
                        </div>
                        <h3 className="font-serif text-2xl text-foreground mb-2">Test mode (Pay Now)</h3>
                        <p className="font-sans text-xs text-foreground/60 leading-relaxed">Simulates a completed Razorpay transaction.</p>
                      </div>

                      <div onClick={() => setPaymentMethod('property')} className={`cursor-pointer p-8 rounded-4xl border-2 transition-all duration-300 ${paymentMethod === 'property' ? 'border-accent bg-accent/5' : 'border-foreground/5 bg-background hover:border-foreground/20'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === 'property' ? 'bg-accent text-white' : 'bg-white text-foreground border border-foreground/10'}`}>
                            <Banknote size={24} />
                          </div>
                          <span className="px-3 py-1 bg-primary text-white rounded-full text-[8px] font-bold uppercase tracking-widest">Recommended</span>
                        </div>
                        <h3 className="font-serif text-2xl text-foreground mb-2">Pay at Property</h3>
                        <p className="font-sans text-xs text-foreground/60 leading-relaxed">Request booking. Pay the full amount when you arrive.</p>
                      </div>

                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1 mt-12 lg:mt-0">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary p-8 rounded-4xl lg:sticky lg:top-32 shadow-2xl text-white overflow-hidden relative">
            <h2 className="font-serif text-3xl mb-8 text-white leading-tight">Booking <br /><span className="italic font-light text-white/80">Summary</span></h2>
            
            <div className="space-y-8 mb-10 relative z-10">
              <div className="space-y-6">
                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">Room Name</span>
                  <h3 className="font-serif text-xl text-white mb-4">{selectedRoomData.name}</h3>
                  <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                    <div>
                      <span className="font-sans text-[9px] uppercase tracking-widest text-white/50 font-bold block mb-1">Guests</span>
                      <span className="text-sm text-white font-bold">{guests}</span>
                    </div>
                    {getNights() > 0 && (
                      <div className="text-right">
                        <span className="font-sans text-[9px] uppercase tracking-widest text-white/50 font-bold block mb-1">Nights</span>
                        <span className="text-sm text-white font-bold">{getNights()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {checkIn && checkOut && (
                  <div className={`flex items-center gap-2 font-sans text-[10px] uppercase tracking-widest font-bold ${
                    isCheckingAvailability ? 'text-white/40' : isAvailable ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${isCheckingAvailability ? 'bg-white/20 animate-pulse' : isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
                    {isCheckingAvailability ? 'Checking Dates...' : isAvailable ? 'Dates Available' : 'Sold Out for Dates'}
                  </div>
                )}

                {selectedExperiences.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <h4 className="font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold">Experiences</h4>
                    {selectedExperiences.map(expId => {
                      const exp = liveExperiences.find(e => e.id === expId);
                      if (!exp) return null;
                      return (
                        <div key={exp.id} className="flex justify-between items-center text-sm">
                          <span className="font-serif text-white/90">{exp.name}</span>
                          <span className="font-bold text-white">₹{exp.price * guests}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mb-8 relative z-10">
              <div className="flex justify-between items-end">
                <div>
                  <span className="block font-sans text-[10px] uppercase tracking-widest text-white/50 font-bold mb-1">Total Amount</span>
                </div>
                <span className="font-serif text-4xl text-white">₹{calculateTotal()}</span>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {isMaintenanceLocked.locked ? (
                <div className="w-full py-5 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-500 flex flex-col items-center justify-center gap-2 text-center p-4">
                  <AlertTriangle size={24} />
                  <p className="font-sans text-[10px] uppercase tracking-widest font-bold leading-relaxed">
                    Booking Disabled <br/> {isMaintenanceLocked.message}
                  </p>
                </div>
              ) : (
                <button 
                  form="booking-form" type="submit"
                  disabled={!selectedRoom || isBookingSubmitting || isCheckingAvailability || !isAvailable}
                  className={`w-full py-5 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed ${
                    !isAvailable && selectedRoom ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-accent text-white hover:bg-[#8A6853] shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isBookingSubmitting || isCheckingAvailability ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : !isAvailable && selectedRoom ? (
                    <span>Unavailable</span>
                  ) : (
                    <>
                      {step === 1 ? 'Proceed to Payment' : 'Confirm Booking'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}
              
              {step === 2 && !isMaintenanceLocked.locked && (
                <button type="button" onClick={() => setStep(1)} className="w-full py-4 rounded-full border border-white/20 text-white font-sans text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft size={14} /> Back to Details
                </button>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="relative min-h-screen pt-32 pb-24">
      <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>}>
        <BookingContent />
      </Suspense>
    </main>
  );
}