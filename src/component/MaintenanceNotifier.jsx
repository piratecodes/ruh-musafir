"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function MaintenanceNotifier() {
  const [maintenance, setMaintenance] = useState({ isMaintenanceMode: false, message: '' });
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchMaintenanceState = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/settings/maintenance`);
        const data = await res.json();
        
        if (data.isMaintenanceMode) {
          setMaintenance({ isMaintenanceMode: true, message: data.maintenanceMessage });
          
          if (!sessionStorage.getItem('maintenance_seen')) {
            setShowPopup(true);
            sessionStorage.setItem('maintenance_seen', 'true');
          }
        }
      } catch (err) {
        console.error("Could not fetch maintenance state");
      }
    };
    fetchMaintenanceState();
  }, []);

  if (!maintenance.isMaintenanceMode) return null;

  return (
    <>
      <div className="w-full bg-red-600 text-white py-2 px-4 text-center z-[9999] relative flex items-center justify-center gap-3 shadow-md">
        <AlertTriangle size={14} className="animate-pulse" />
        <p className="font-sans text-[10px] md:text-xs font-bold uppercase tracking-widest">
          {maintenance.message}
        </p>
      </div>

      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPopup(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative z-10 border-4 border-red-500/20 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-serif text-primary mb-3">Notice to Guests</h2>
              <p className="text-sm font-sans text-primary/70 leading-relaxed mb-8">
                {maintenance.message} <br/><br/>
                While you are welcome to explore our website and view our rooms, <strong>we are currently unable to accept new bookings.</strong> We apologize for any inconvenience.
              </p>
              <button 
                onClick={() => setShowPopup(false)}
                className="w-full py-4 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg"
              >
                Acknowledge & Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}