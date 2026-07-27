"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu as MenuIcon, X, User, Calendar, LogOut, 
  LogIn, UserPlus, BookOpen, HelpCircle 
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { logout, restoreSession } from "@/store/slices/authSlice"; 
import { useLogoutMutation } from "@/store/api/authApi";

export default function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isMaintenance, setIsMaintenance] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  const [logoutUser] = useLogoutMutation();
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
    dispatch(restoreSession());

    const handleFocus = () => dispatch(restoreSession());
    window.addEventListener('focus', handleFocus);

    const fetchMaintenanceState = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/settings/maintenance`);
        const data = await res.json();
        if (data.isMaintenanceMode) {
          setIsMaintenance(true);
        }
      } catch (err) {
        console.error("Could not fetch maintenance state for Navbar");
      }
    };
    fetchMaintenanceState();
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [dispatch]);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileMenuOpen]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch (error) {
      console.error("Backend logout failed, clearing local state", error);
    } finally {
      dispatch(logout());
      setIsMobileMenuOpen(false); 
      router.push('/');
    }
  };

  const navLinks = [
    { name: "Café", path: "/cafe" },
    { name: "Experiences", path: "/experiences" },
    { name: "Our Stories", path: "/our-stories" },
  ];

  const renderAvatar = () => {
    if (!mounted) return <User size={14} />; 
    if (isAuthenticated && user) {
      if (user.profilePic) {
        const imageUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${user.profilePic}`;
        return <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />;
      }
      return <span className="font-sans text-[10px] font-bold uppercase">{user.firstName?.[0] || 'U'}</span>;
    }
    return <User size={14} />;
  };

  return (
    <nav
      // THE FIX: The nav only drops down 32px if Maintenance is ON AND you haven't scrolled yet!
      className={`fixed left-0 z-50 w-full transition-all duration-500 ${
        isMaintenance && !isScrolled ? 'top-[32px]' : 'top-0'
      } ${
        isScrolled || isMobileMenuOpen
          ? "bg-background text-foreground shadow-sm py-4"
          : "bg-transparent text-white py-6"
      }`}
    >
      {!isScrolled && !isMobileMenuOpen && (
        <div className="absolute inset-0 bg-linear-to-b from-black/50 to-transparent pointer-events-none -z-10 h-32"></div>
      )}

      <div className="container flex items-center justify-between relative z-20">
        
        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
          <span className="font-serif text-2xl font-medium tracking-wide">
            Ruh Musafir
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-10 text-[11px] font-bold tracking-widest uppercase">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.path} className="relative group py-2">
              <span className="hover:opacity-70 transition-opacity">{link.name}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <Menu as="div" className="relative">
            <MenuButton className={`flex items-center space-x-2 rounded-full px-4 py-2 transition-all duration-300 ${
              isScrolled ? "bg-white border border-gray-200 hover:shadow-md" : "bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30"
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden ${isScrolled ? 'bg-gray-100 text-gray-500' : 'bg-white/20 text-white'}`}>
                {renderAvatar()}
              </div>
              <label className="cursor-pointer">{ mounted && isAuthenticated && user?.firstName || 'Guest' }</label>
            </MenuButton>

            <MenuItems 
              transition 
              className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none overflow-hidden text-foreground transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 z-50"
            >
              <div className="py-2">
                {mounted && isAuthenticated ? (
                  <>
                    <MenuItem>
                      {({ focus }) => (
                        <Link href="/profile" className={`flex items-center gap-3 px-5 py-3 text-sm font-medium ${focus ? "bg-gray-50 text-primary" : ""}`}>
                          <User size={16} className="text-gray-400" /> My Profile
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <Link href="/bookings" className={`flex items-center gap-3 px-5 py-3 text-sm font-medium ${focus ? "bg-gray-50 text-primary" : ""}`}>
                          <Calendar size={16} className="text-gray-400" /> My Bookings
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-left transition-colors ${focus ? "bg-red-50 text-red-600" : "text-red-500"}`}>
                          <LogOut size={16} /> Log Out
                        </button>
                      )}
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem>
                      {({ focus }) => (
                        <Link href="/login" className={`flex items-center gap-3 px-5 py-3 text-sm font-medium ${focus ? "bg-gray-50 text-primary" : ""}`}>
                          <LogIn size={16} className="text-gray-400" /> Guest Login
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <Link href="/signup" className={`flex items-center gap-3 px-5 py-3 text-sm font-medium ${focus ? "bg-gray-50 text-primary" : ""}`}>
                          <UserPlus size={16} className="text-gray-400" /> Create Account
                        </Link>
                      )}
                    </MenuItem>
                  </>
                )}
              </div>
              <div className="border-t border-gray-100 py-2">
                <MenuItem>
                  {({ focus }) => (
                    <Link href="/our-legacy" className={`flex items-center gap-3 px-5 py-3 text-sm ${focus ? "bg-gray-50" : "text-gray-600"}`}>
                      <BookOpen size={16} className="text-gray-400" /> Our Legacy
                    </Link>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <Link href="/contact" className={`flex items-center gap-3 px-5 py-3 text-sm ${focus ? "bg-gray-50" : "text-gray-600"}`}>
                      <HelpCircle size={16} className="text-gray-400" /> Help & Contact
                    </Link>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>

          <Link href="/rooms" className={`px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-300 shadow-lg ${
            isScrolled ? "bg-primary text-white hover:bg-primary-hover" : "bg-accent text-white hover:bg-[#8A6853]"
          }`}>
            Book Now
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-full transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>

      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: '100vh' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute top-full left-0 w-full bg-background border-t border-gray-100 overflow-y-auto md:hidden"
          >
            <div className="container py-8 flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div key={link.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <Link href={link.path} onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif tracking-wide border-b border-gray-100 pb-4 block text-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 space-y-4">
                <div className="flex flex-col gap-5 border-b border-gray-100 pb-6">
                  {mounted && isAuthenticated ? (
                    <>
                      <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
                        <User size={18} /> My Profile
                      </Link>
                      <Link href="/bookings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground">
                        <Calendar size={18} className="text-gray-400" /> My Bookings
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-red-500 text-left">
                        <LogOut size={18} /> Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground">
                        <LogIn size={18} className="text-gray-400" /> Guest Login
                      </Link>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-primary">
                        <UserPlus size={18} /> Create Account
                      </Link>
                    </>
                  )}
                </div>

                <Link href="/rooms" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-primary text-white rounded-full py-4 mt-6 font-bold tracking-widest text-[11px] uppercase shadow-lg">
                  Check Availability
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}