"use client";

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
  ShoppingBag, X, Plus, Minus, Clock, User, Calendar, 
  Home, CheckCircle2, ArrowRight, Phone, Loader2, Info
} from 'lucide-react';

// IMPORT THE NEW MENU API HOOK
import { useGetMenuQuery } from '@/store/api/menuApi';

export default function CafePage() {
  // --- AUTH & PERMISSION LOGIC ---
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // NOTE: We need to refine this based on your backend! 
  // Does your user object return their active bookings? 
  // For now, we allow ordering if they are logged in and have bookings.
  const canOrder = isAuthenticated && user && user.bookings && user.bookings.length > 0;

  // --- API DATA ---
  const { data: menuResponse, isLoading: isMenuLoading } = useGetMenuQuery();
  const liveMenu = menuResponse?.data || [];

  // Extract unique categories dynamically from the live data
  const categories = useMemo(() => {
    if (!liveMenu.length) return [];
    return [...new Set(liveMenu.map(item => item.category))];
  }, [liveMenu]);

  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    date: new Date().toISOString().split('T')[0],
    timePreference: 'As soon as possible',
    roomNumber: '' // Ideally, we auto-fill this from their active booking later
  });

  const menuRefs = useRef({});

  // ... (Keep your existing addToCart, removeFromCart, subtotal, and scrollToCategory functions exactly the same) ...
  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const scrollToCategory = (category) => {
    const element = menuRefs.current[category];
    if (element) {
      const offset = 120; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    // We will replace this with a real API mutation later
    const order = { items: cartItems, total: subtotal, customer: formData, timestamp: new Date().toISOString(), status: 'Pending' };
    const existingOrders = JSON.parse(localStorage.getItem('cafe_orders') || '[]');
    localStorage.setItem('cafe_orders', JSON.stringify([...existingOrders, order]));
    setIsOrderConfirmed(true);
    setCartItems([]);
  };

  if (isMenuLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">
          Preparing the Menu...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen font-sans selection:bg-accent selection:text-white pb-24">
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2047" 
            alt="Cozy Cafe" 
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 mt-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-7xl text-white mb-6 tracking-tight leading-tight"
          >
            Ruh Ka <span className="italic font-light text-accent">Khana</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-sm md:text-base font-bold tracking-[0.3em] uppercase"
          >
            Fresh • Local • Crafted
          </motion.p>
        </div>
      </section>

      {/* Permission Banner for Non-Guests */}
      {!canOrder && (
        <div className="bg-accent/10 border-b border-accent/20">
          <div className="container py-4 flex items-center justify-center gap-3 text-center">
            <Info size={16} className="text-accent" />
            <p className="font-sans text-[10px] uppercase tracking-widest font-bold text-foreground/70">
              {isAuthenticated 
                ? "You currently have no active stays to place an order." 
                : "Log in with an active stay to place room service orders."}
            </p>
          </div>
        </div>
      )}

      {/* Sticky Category Bar */}
      <div className="sticky top-[72px] z-30 bg-background/90 backdrop-blur-xl border-b border-foreground/10 overflow-x-auto no-scrollbar shadow-sm">
        <div className="container py-4 flex gap-8 whitespace-nowrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/60 hover:text-accent transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      <div className="container py-16">
        {categories.map((category) => {
          const categoryItems = liveMenu.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} ref={el => menuRefs.current[category] = el} className="mb-20 last:mb-0 pt-8">
              <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-4">
                {category}
                <div className="h-px flex-grow bg-foreground/10"></div>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl p-4 shadow-sm border border-foreground/5 flex flex-col justify-between group transition-all hover:shadow-lg overflow-hidden"
                  >
                    <div>
                      {/* Image Container */}
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-foreground/5">
                        {item.image ? (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${item.image}`} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/30 font-serif italic text-sm">
                            Freshly Prepared
                          </div>
                        )}
                        
                        {/* Veg/Non-Veg Badge */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
                          <div className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm ${item.diet === "VEG" ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.diet === "VEG" ? 'bg-green-600' : 'bg-red-600'}`}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Text Content */}
                      <div className="px-2">
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <h3 className="font-serif font-bold text-xl text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                            {item.name}
                          </h3>
                          <span className="font-sans font-bold text-foreground mt-1 shrink-0">₹{item.price}</span>
                        </div>
                        <p className="text-foreground/60 text-sm leading-relaxed mb-6 line-clamp-2">
                          {item.description || "A mountain specialty prepared in our local kitchen."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Add to Cart Button */}
                    {canOrder && (
                      <div className="px-2 pb-2 mt-auto">
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full py-3.5 rounded-xl border border-foreground/10 font-bold text-[10px] uppercase tracking-widest text-foreground hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Plus size={14} />
                          Add to Cart
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Button (Only renders if cart has items, which requires canOrder to be true) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 z-40 bg-accent text-white p-4 rounded-full shadow-2xl flex items-center gap-3 group hover:bg-[#8A6853] transition-all"
          >
            <div className="relative">
              <ShoppingBag size={24} />
              <span className="absolute -top-2 -right-2 bg-white text-accent text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <span className="font-bold text-sm pr-2">₹{subtotal}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-foreground/10 flex justify-between items-center bg-white">
                <h2 className="font-serif text-2xl text-foreground">Your Order</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                  <X size={24} className="text-foreground" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-grow">
                      <h4 className="font-bold text-foreground">{item.name}</h4>
                      <p className="text-xs text-foreground/60">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white rounded-lg p-1 border border-foreground/10">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-foreground/5 rounded transition-colors"
                      >
                        <Minus size={14} className="text-foreground" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="p-1 hover:bg-foreground/5 rounded transition-colors"
                      >
                        <Plus size={14} className="text-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-foreground/10 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60 font-medium">Subtotal</span>
                  <span className="text-xl font-bold text-foreground">₹{subtotal}</span>
                </div>
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-4 bg-accent text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#8A6853] transition-all flex items-center justify-center gap-3 shadow-md"
                >
                  {isAuthenticated ? 'Place Order' : 'Login to Order'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order Form Modal */}
      <AnimatePresence>
        {isOrderFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background w-full max-w-4xl rounded-4xl overflow-hidden shadow-2xl relative"
              >
                {!isOrderConfirmed ? (
                  <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Form Side */}
                    <div className="flex-grow p-6 md:p-10 overflow-y-auto">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="font-serif text-3xl text-foreground">Order Details</h2>
                        <button onClick={() => setIsOrderFormOpen(false)} className="md:hidden p-2 bg-foreground/5 rounded-full">
                          <X size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleSubmitOrder} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                            <User size={12} /> Full Name
                          </label>
                          <input
                            required
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            disabled={!!user} // Disable if auto-filled from auth
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:opacity-60"
                            placeholder="Your Name"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                              <Phone size={12} /> Phone Number
                            </label>
                            <input
                              required
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              disabled={!!user?.phone} // Disable if auto-filled from auth
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:opacity-60"
                              placeholder="+91"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                              <Calendar size={12} /> Date
                            </label>
                            <input
                              required
                              type="date"
                              name="date"
                              value={formData.date}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                              <Clock size={12} /> Time Preference
                            </label>
                            <select
                              name="timePreference"
                              value={formData.timePreference}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none"
                            >
                              <option>As soon as possible</option>
                              <option>Within 30 mins</option>
                              <option>Within 1 hour</option>
                              <option>Specific time (mention in notes)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                              <Home size={12} /> Room Number (Optional)
                            </label>
                            <input
                              type="text"
                              name="roomNumber"
                              value={formData.roomNumber}
                              onChange={handleInputChange}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                              placeholder="e.g. 102"
                            />
                          </div>
                        </div>

                        <div className="pt-6">
                          <button
                            type="submit"
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg"
                          >
                            Confirm Order — Pay on Arrival
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Summary Side */}
                    <div className="w-full md:w-80 bg-primary p-8 text-white flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="font-serif text-2xl">Summary</h3>
                          <button onClick={() => setIsOrderFormOpen(false)} className="hidden md:block hover:bg-white/10 p-2 rounded-full transition-colors">
                            <X size={20} />
                          </button>
                        </div>
                        <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20">
                          {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="opacity-80">{item.quantity}x {item.name}</span>
                              <span className="font-bold">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-8 border-t border-white/10 mt-8">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs uppercase tracking-widest opacity-60">Total Amount</span>
                          <span className="text-2xl font-bold">₹{subtotal}</span>
                        </div>
                        <p className="text-[10px] opacity-60 italic">Taxes included. Pay at the café.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 size={48} />
                    </motion.div>
                    <h2 className="font-serif text-4xl text-foreground">Order Received!</h2>
                    <p className="text-foreground/70 max-w-md mx-auto text-lg">
                      Thank you, {formData.fullName.split(' ')[0]}! Your homemade meal is being prepared with love. 
                      Please pay at the café when you arrive.
                    </p>
                    <button
                      onClick={() => {
                        setIsOrderFormOpen(false);
                        setIsOrderConfirmed(false);
                      }}
                      className="mt-8 px-10 py-4 rounded-full bg-primary text-white font-bold tracking-widest uppercase hover:bg-primary/90 transition-all"
                    >
                      Back to Menu
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}