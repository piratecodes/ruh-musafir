"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-20 pb-10 border-t border-white/10 rounded-t-[5.5rem] z-50">
      <div className="container">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <h2 className="font-serif text-3xl mb-4">Ruh Musafir</h2>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
              Experience the "Slow Life" in the heart of the Himalayas. A soulful sanctuary offering warmth, comfort, and breathtaking views.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase mb-6 text-secondary">Explore</h3>
            <ul className="space-y-4 text-sm text-white/80">
              <li><a href="#stay" className="hover:text-white transition-colors">Our Homestays</a></li>
              <li><a href="#cafe" className="hover:text-white transition-colors">The Café Menu</a></li>
              <li><a href="#experiences" className="hover:text-white transition-colors">Guided Experiences</a></li>
              <li><a href="/gallery" className="hover:text-white transition-colors">Gallery</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase mb-6 text-secondary">Legal</h3>
            <ul className="space-y-4 text-sm text-white/80">
              <li><Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cancellation" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-sm font-semibold tracking-widest uppercase mb-6 text-secondary">Reach Us</h3>
            <ul className="space-y-4 text-sm text-white/80">
              <li>Shangarh, Himachal Pradesh</li>
              <li>hello@ruhmusafir.com</li>
              <li>+91 98765 43210</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between text-xs text-white/50">
          <p>&copy; {new Date().getFullYear()} Ruh Musafir. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
          </div>
        </div>

      </div>
    </footer>
  );
}