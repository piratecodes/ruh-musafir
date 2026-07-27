"use client";

import { useState, Fragment, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, CreditCard, Eye, 
  X, Wallet, Clock, CheckCircle2, Loader2, Compass, Sparkles, Filter, ChevronDown, Download
} from 'lucide-react';
// IMPORT HEADLESS UI COMPONENTS FOR MODERN DROPDOWNS & MODALS
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast'; 

// IMPORT SPLIDE FOR CAROUSEL
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

// IMPORT REDUX HOOKS
import { useGetMyBookingsQuery, useSettleBookingMutation } from '@/store/api/bookingsApi';

export default function MyBookingsPage() {
  // ==========================================
  // 1. COMPONENT STATES
  // ==========================================
  
  // Controls which booking is currently open in the details modal for payment/info
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Hydration fix state (prevents Next.js server/client mismatch)
  const [mounted, setMounted] = useState(false);
  
  // Tracks the currently selected date filter (default is 'all' for All Time)
  const [dateFilter, setDateFilter] = useState('all');
  
  // NEW: State for Partial Payment vs Full Payment logic
  const [paymentType, setPaymentType] = useState('full'); 
  const [partialAmount, setPartialAmount] = useState('');

  // Mark component as mounted on client side to prevent hydration errors
  useEffect(() => setMounted(true), []);

  // ==========================================
  // 2. REDUX API INTEGRATION (REAL-TIME POLLING)
  // ==========================================
  
  // THE FIX: Added pollingInterval to make updates appear "Real-Time" without refreshing!
  const { data: response, isLoading, error } = useGetMyBookingsQuery(undefined, {
    pollingInterval: 5000, // Invisibly fetches fresh data every 5 seconds
    refetchOnFocus: true,
  });
  
  // Safely extract the bookings array, defaulting to an empty array if undefined
  const bookings = response?.data || [];
  
  // Mutation hook to process payments/settlements
  const [settleBooking, { isLoading: isSettling }] = useSettleBookingMutation();

  // ==========================================
  // 3. FILTERING LOGIC
  // ==========================================
  
  // Dynamically extract all unique years from the user's booking history
  // This allows the dropdown to automatically show "2026", "2025", etc., if data exists.
  const availableYears = useMemo(() => {
    if (!bookings || !bookings.length) return [];
    // Safely filters out null or invalid years
    const years = bookings.map(b => new Date(b.createdAt).getFullYear()).filter(y => !isNaN(y));
    return [...new Set(years)].sort((a, b) => b - a);
  }, [bookings]);

  // Apply the selected filter to the bookings array
  const filteredBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];

    // 1. Create a safe copy of the array and ONLY include records that have a valid date
    let safeBookings = [...bookings].filter(b => b && b.createdAt && !isNaN(new Date(b.createdAt).getTime()));
    
    // 2. Sort by newest first
    let sorted = safeBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    try {
      if (dateFilter === 'all') {
        return sorted; 
      } 
      
      const now = new Date();

      if (dateFilter === '1m') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return sorted.filter(b => new Date(b.createdAt) >= oneMonthAgo);
      } else if (dateFilter === '2m') {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(now.getMonth() - 2);
        return sorted.filter(b => new Date(b.createdAt) >= twoMonthsAgo);
      } else if (dateFilter === '6m') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return sorted.filter(b => new Date(b.createdAt) >= sixMonthsAgo);
      } else if (dateFilter.startsWith('year_')) {
        const targetYear = parseInt(dateFilter.split('_')[1]);
        return sorted.filter(b => new Date(b.createdAt).getFullYear() === targetYear);
      }
    } catch (err) {
      console.error("Filter logic error:", err);
      // Fallback: If filter crashes, return the full sorted list
      return sorted;
    }
    
    return sorted;
  }, [bookings, dateFilter]);

  // Helper function to map the filter state to a readable label for the Dropdown UI
  const getFilterLabel = (val) => {
    if (val === 'all') return 'All Time';
    if (val === '1m') return 'Last 1 Month';
    if (val === '2m') return 'Last 2 Months';
    if (val === '6m') return 'Last 6 Months';
    if (val.startsWith('year_')) return val.split('_')[1];
    return 'Filter';
  };

  // ==========================================
  // 4. HELPER COMPONENTS
  // ==========================================
  
  // Reusable component to render the beautiful payment status tags
  const PaymentBadge = ({ status }) => {
    const currentStatus = status?.toUpperCase() || 'UNPAID';
    const config = {
      PAID: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2, text: 'Fully Paid' },
      PARTIAL: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Wallet, text: 'Partial Due' },
      UNPAID: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: Clock, text: 'Payment Pending' },
      PENDING: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Clock, text: 'Payment Pending' }
    };
    const { color, icon: Icon, text } = config[currentStatus] || config.UNPAID;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest font-bold ${color}`}>
        <Icon size={12} /> {text}
      </div>
    );
  };

  // ==========================================
  // 5. ACTION HANDLERS
  // ==========================================
  
  // Triggers the payment settlement API logic
  const handlePayment = async (balanceDue) => {
    if (!selectedBooking) return;
    
    // Determine the exact amount we are sending to the backend based on paymentType
    const amountToPay = paymentType === 'full' ? balanceDue : Number(partialAmount);
    
    try {
      // Send the specific amount to the settlement endpoint
      await settleBooking({ 
        id: selectedBooking.id, 
        method: 'UPI', 
        amount: amountToPay 
      }).unwrap();
      
      toast.success("Payment Successful! Your ledger has been updated.");
      
      // Reset payment states and close modal
      setSelectedBooking(null); 
      setPaymentType('full');
      setPartialAmount('');
    } catch (err) {
      console.error("Payment settlement error:", err);
      toast.error(err?.data?.message || "Payment failed. Please try again.");
    }
  };

  // Action handler to trigger backend PDF generation and file download
  const handleDownloadReceipt = async (bookingId) => {
    try {
      const toastId = toast.loading('Generating receipt...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '/api/v1')}/bookings/${bookingId}/receipt`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to generate receipt');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully', { id: toastId });
    } catch (error) {
      toast.error('Could not download receipt');
    }
  };

  // Prevent rendering until client hydration is complete
  if (!mounted) return null;

  // Render Loader if data is fetching
  if (isLoading) {
    return (
      <main className="min-h-screen pt-40 pb-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">Retrieving Ledger...</p>
      </main>
    );
  }

  // Render Error if fetching failed
  if (error) {
    return (
      <main className="min-h-screen pt-40 pb-24 flex flex-col items-center justify-center">
        <p className="text-red-500 font-bold">Failed to load bookings. Please try again later.</p>
      </main>
    );
  }

  // ==========================================
  // 6. MAIN RENDER
  // ==========================================
  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-32 pb-24 relative">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-background">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-secondary/40 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* --- HEADER & FILTERS SECTION --- */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="font-sans text-[10px] tracking-widest uppercase font-bold text-accent mb-3">Your Ledger</div>
            <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight">My Bookings</h1>
          </div>

          {/* HEADLESS UI DROPDOWN FILTER */}
          <Menu as="div" className="relative inline-block text-left z-20">
            <MenuButton className="flex items-center gap-3 bg-white border border-foreground/10 px-5 py-3 rounded-full shadow-sm font-sans text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-foreground hover:border-foreground/20 transition-all focus:outline-none">
              <Filter size={16} className="text-accent" />
              {getFilterLabel(dateFilter)}
              <ChevronDown size={14} className="opacity-50 ml-2" />
            </MenuButton>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <MenuItems className="absolute right-0 mt-3 w-48 origin-top-right bg-white border border-foreground/10 rounded-2xl shadow-xl focus:outline-none overflow-hidden flex flex-col divide-y divide-foreground/5">
                
                {/* Static Options */}
                <div className="p-1">
                  <MenuItem>
                    {({ active }) => (
                      <button onClick={() => setDateFilter('all')} className={`${active ? 'bg-foreground/5 text-foreground' : 'text-foreground/70'} flex w-full items-center rounded-xl px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-widest transition-colors`}>
                        All Time
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button onClick={() => setDateFilter('1m')} className={`${active ? 'bg-foreground/5 text-foreground' : 'text-foreground/70'} flex w-full items-center rounded-xl px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-widest transition-colors`}>
                        Last 1 Month
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button onClick={() => setDateFilter('2m')} className={`${active ? 'bg-foreground/5 text-foreground' : 'text-foreground/70'} flex w-full items-center rounded-xl px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-widest transition-colors`}>
                        Last 2 Months
                      </button>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {({ active }) => (
                      <button onClick={() => setDateFilter('6m')} className={`${active ? 'bg-foreground/5 text-foreground' : 'text-foreground/70'} flex w-full items-center rounded-xl px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-widest transition-colors`}>
                        Last 6 Months
                      </button>
                    )}
                  </MenuItem>
                </div>

                {/* Dynamic Year Options */}
                {availableYears.length > 0 && (
                  <div className="p-1 bg-foreground/5">
                    {availableYears.map((year) => (
                      <MenuItem key={year}>
                        {({ active }) => (
                          <button onClick={() => setDateFilter(`year_${year}`)} className={`${active ? 'bg-white text-foreground shadow-sm' : 'text-foreground/70'} flex w-full items-center rounded-xl px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-widest transition-all`}>
                            {year}
                          </button>
                        )}
                      </MenuItem>
                    ))}
                  </div>
                )}
              </MenuItems>
            </Transition>
          </Menu>
        </div>

        {/* --- MAIN LIST AREA --- */}
        {bookings.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center bg-white/60 backdrop-blur-xl rounded-4xl border border-white shadow-sm">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-accent shadow-sm"><Compass size={32} strokeWidth={1.5} /></div>
            <h3 className="font-serif text-3xl text-foreground mb-3">No Journeys Planned Yet</h3>
            <p className="font-sans text-sm text-foreground/60 max-w-md mx-auto mb-10 leading-relaxed">Your ledger is currently empty. Discover our private suites and dormitories to begin your next adventure.</p>
            <Link href="/rooms" className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-accent text-white font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-[#8A6853] transition-colors shadow-lg"><Sparkles size={16} /> Explore Rooms</Link>
          </motion.div>
        ) : (
          
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-4xl p-4 md:p-8 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full pr-2 md:pr-4">
            {filteredBookings.length === 0 ? (
              <div className="py-16 text-center text-foreground/50 font-sans text-sm font-bold uppercase tracking-widest">No transactions found for this selected period.</div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => {
                  const totalGuests = (booking.adults || 1) + (booking.children || 0);
                  const totalAmount = booking.totalAmount || 0;
                  const images = booking.room?.images?.length > 0 
                    ? booking.room.images.map(img => `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${img}`)
                    : ["https://dummyimage.com/800x600/5C6E58/E8E1D9&text=Room"];

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                      key={booking.id} 
                      className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-white shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col md:flex-row"
                    >
                      {/* Carousel Container */}
                      <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0 overflow-hidden bg-foreground/5">
                        <Splide 
                          options={{ type: 'fade', rewind: true, arrows: false, pagination: images.length > 1, drag: images.length > 1, type: 'loop', autoplay: true, interval: 4000, pauseOnHover: true, speed: 1000, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
                          className="h-full w-full [&_.splide\_\_track]:h-full [&_.splide\_\_list]:h-full [&_.splide\_\_arrow]:bg-white/50 [&_.splide\_\_arrow]:backdrop-blur-sm"
                        >
                          {images.map((img, i) => (
                            <SplideSlide key={i} className="h-full">
                              <img src={img} alt="Room" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            </SplideSlide>
                          ))}
                        </Splide>
                        
                        <div className="absolute top-3 left-3 z-10">
                          <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[8px] uppercase tracking-widest font-bold border border-white/20">
                            {booking.room?.type || 'Room'}
                          </div>
                        </div>
                      </div>

                      {/* Details Area */}
                      <div className="p-5 md:p-6 flex flex-col grow">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <h3 className="font-serif text-xl text-foreground mb-1 leading-tight">{booking.room?.name || 'Sanctuary Stay'}</h3>
                            <p className="font-sans text-[10px] text-foreground/50 font-bold uppercase tracking-widest">ID: {booking.id.split('-')[0]}</p>
                          </div>
                          <PaymentBadge status={booking.paymentStatus} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 border-y border-foreground/5 py-4">
                          <div><p className="font-sans text-[9px] text-foreground/40 uppercase tracking-widest font-bold mb-1">Check-in</p><div className="flex items-center gap-1.5 text-foreground font-serif text-sm"><Calendar size={12} className="text-accent" />{booking.checkInDate ? format(parseISO(booking.checkInDate), 'MMM dd, yy') : 'N/A'}</div></div>
                          <div><p className="font-sans text-[9px] text-foreground/40 uppercase tracking-widest font-bold mb-1">Check-out</p><div className="flex items-center gap-1.5 text-foreground font-serif text-sm"><Calendar size={12} className="text-accent" />{booking.checkOutDate ? format(parseISO(booking.checkOutDate), 'MMM dd, yy') : 'N/A'}</div></div>
                          <div><p className="font-sans text-[9px] text-foreground/40 uppercase tracking-widest font-bold mb-1">Guests</p><div className="flex items-center gap-1.5 text-foreground font-serif text-sm"><Users size={12} className="text-accent" />{totalGuests}</div></div>
                          <div><p className="font-sans text-[9px] text-foreground/40 uppercase tracking-widest font-bold mb-1">Total</p><div className="flex items-center gap-1.5 text-foreground font-serif text-sm font-bold">₹{totalAmount.toLocaleString()}</div></div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm"><span className="font-sans text-[9px] uppercase tracking-widest font-bold text-foreground/40">Status:</span><span className="font-serif text-foreground font-medium uppercase text-xs">{booking.status}</span></div>
                          <button onClick={() => { setSelectedBooking(booking); setPaymentType('full'); setPartialAmount(''); }} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-white hover:bg-accent transition-colors font-sans text-[10px] uppercase tracking-widest font-bold shadow-md"><Eye size={12} /> Details</button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 7. MODAL DIALOG (Details & Payment) */}
      {/* ========================================== */}
      <Transition show={!!selectedBooking} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { setSelectedBooking(null); setPaymentType('full'); setPartialAmount(''); }}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4">
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl border border-foreground/5 flex flex-col max-h-[90vh]">
                
                <div className="bg-foreground px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                  <div>
                    <DialogTitle className="text-lg font-serif text-white">Booking Details</DialogTitle>
                    <p className="text-white/50 text-[10px] font-sans uppercase tracking-widest font-bold mt-1">{selectedBooking?.id}</p>
                  </div>
                  <button onClick={() => { setSelectedBooking(null); setPaymentType('full'); setPartialAmount(''); }} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
                </div>
                
                {selectedBooking && (
                  <div className="p-8 overflow-y-auto">
                    <div className="flex gap-6 items-center mb-8 bg-foreground/5 p-4 rounded-2xl border border-foreground/10">
                      <img src={selectedBooking.room?.images?.[0] ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${selectedBooking.room.images[0]}` : "https://dummyimage.com/200x200"} alt="Room" className="w-24 h-24 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-serif text-xl text-foreground mb-1">{selectedBooking.room?.name}</h4>
                        <p className="text-xs font-sans text-foreground/60 uppercase tracking-widest font-bold mb-3">{selectedBooking.room?.type}</p>
                        <PaymentBadge status={selectedBooking.paymentStatus} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-foreground/10 pb-2 mb-4">
                      <h5 className="font-sans text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Financial Summary</h5>
                      {/* THE FIX: Download Receipt button shown only if some amount has been paid */}
                      {(selectedBooking.amountPaid || 0) > 0 && (
                        <button 
                          onClick={() => handleDownloadReceipt(selectedBooking.id)}
                          className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-accent hover:text-foreground transition-colors"
                        >
                          <Download size={12} /> Receipt
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4 mb-8 bg-white rounded-2xl border border-foreground/10 p-6 shadow-sm">
                      <div className="flex justify-between items-center text-sm font-serif">
                        <span className="text-foreground/70">Total Booking Amount</span>
                        <span className="text-foreground">₹{selectedBooking.totalAmount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-serif">
                        <span className="text-foreground/70">Amount Paid</span>
                        <span className="text-green-600">₹{selectedBooking.amountPaid?.toLocaleString() || 0}</span>
                      </div>
                      
                      <div className="border-t border-foreground/10 pt-4 mt-4 flex justify-between items-center">
                        <span className="font-sans text-xs uppercase tracking-widest font-bold text-foreground">Balance Due</span>
                        <span className={`font-serif text-2xl ${Math.max(0, (selectedBooking.totalAmount || 0) - (selectedBooking.amountPaid || 0)) > 0 ? 'text-red-500' : 'text-foreground'}`}>
                          ₹{Math.max(0, (selectedBooking.totalAmount || 0) - (selectedBooking.amountPaid || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* PAYMENT ACTION BLOCK */}
                    {Math.max(0, (selectedBooking.totalAmount || 0) - (selectedBooking.amountPaid || 0)) > 0 ? (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                        <p className="font-sans text-xs text-red-600 mb-4 leading-relaxed text-center">
                          Your booking requires action. Please settle the remaining balance.
                        </p>
                        
                        <div className="flex gap-4 mb-4">
                          <label className="flex-1 flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-foreground/10 hover:border-accent transition-colors">
                            <input type="radio" checked={paymentType === 'full'} onChange={() => setPaymentType('full')} className="accent-accent w-4 h-4" />
                            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-foreground">Full Pay (₹{Math.max(0, selectedBooking.totalAmount - selectedBooking.amountPaid).toLocaleString()})</span>
                          </label>
                          <label className="flex-1 flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-foreground/10 hover:border-accent transition-colors">
                            <input type="radio" checked={paymentType === 'partial'} onChange={() => setPaymentType('partial')} className="accent-accent w-4 h-4" />
                            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-foreground">Partial Pay</span>
                          </label>
                        </div>

                        <AnimatePresence>
                          {paymentType === 'partial' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 overflow-hidden">
                              <input 
                                type="number" 
                                placeholder="Enter custom amount" 
                                value={partialAmount}
                                onChange={(e) => setPartialAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-foreground/10 focus:border-accent outline-none font-sans text-sm font-bold text-foreground"
                                min="1"
                                max={Math.max(0, selectedBooking.totalAmount - selectedBooking.amountPaid)}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button 
                          onClick={() => handlePayment(Math.max(0, selectedBooking.totalAmount - selectedBooking.amountPaid))}
                          disabled={isSettling || (paymentType === 'partial' && (!partialAmount || Number(partialAmount) <= 0 || Number(partialAmount) > Math.max(0, selectedBooking.totalAmount - selectedBooking.amountPaid)))}
                          className="w-full py-4 rounded-full bg-accent text-white font-sans text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#8A6853] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                          {isSettling ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <><CreditCard size={16} /> Pay ₹{paymentType === 'full' ? Math.max(0, selectedBooking.totalAmount - selectedBooking.amountPaid).toLocaleString() : (partialAmount || 0)} Now</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center flex flex-col items-center">
                        <CheckCircle2 size={32} className="text-green-500 mb-3" />
                        <p className="font-sans text-xs text-green-700 uppercase tracking-widest font-bold">
                          All settled. We await your arrival.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </motion.main>
  );
}