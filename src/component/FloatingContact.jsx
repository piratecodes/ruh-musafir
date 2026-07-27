"use client";

import React, { useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="fixed bottom-6 right-6 z-100 flex flex-col items-end"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* --- EXPANDABLE MENU --- */}
      <div 
        className={`flex flex-col gap-4 mb-4 transition-all duration-300 origin-bottom ${
          isOpen 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'opacity-0 translate-y-8 scale-50 pointer-events-none'
        }`}
      >
        {/* WhatsApp Button */}
        <a 
          href="https://wa.me/+919830070983" // <-- REPLACE WITH YOUR WHATSAPP NUMBER (include country code, no +)
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-end gap-3 group outline-none"
        >
          <span className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
            WhatsApp Us
          </span>
          <div className="bg-[#25D366]/50 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.484-1.459-1.657-1.756-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </div>
        </a>

        {/* Phone Button */}
        <a 
          href="tel:+919830070983" // <-- REPLACE WITH YOUR PHONE NUMBER
          className="flex items-center justify-end gap-3 group outline-none"
        >
          <span className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
            Call Us
          </span>
          <div className="bg-secondary/50 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all">
            <Phone size={24} fill="currentColor" />
          </div>
        </a>
      </div>

      {/* --- MAIN TRIGGER BUTTON --- */}
      <button aria-label="Quick Connect"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-secondary/50 text-white p-3 rounded-full shadow-2xl hover:scale-105 hover:shadow-[#c5a059]/40 transition-all duration-300 flex items-center justify-center relative outline-none"
      >
        {/* Chat Icon (Fades out when open) */}
        <div className={`transition-all duration-300 ${isOpen ? 'rotate-180 scale-0 opacity-0 absolute' : 'rotate-0 scale-100 opacity-100'}`}>
          <MessageCircle size={24} strokeWidth={2.5} />
        </div>
        {/* X Icon (Fades in when open) */}
        <div className={`transition-all duration-300 ${isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0 absolute'}`}>
          <X size={24} strokeWidth={2.5} />
        </div>
      </button>
      
    </div>
  );
}