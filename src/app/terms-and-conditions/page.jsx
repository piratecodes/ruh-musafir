"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, ShieldAlert, AlertTriangle, Scale, FileText, HelpCircle } from 'lucide-react';

const sections = [
  { id: 'booking', title: '1. Booking & Payment', icon: BookOpen },
  { id: 'checkin', title: '2. Check-in & Check-out', icon: Clock },
  { id: 'conduct', title: '3. Guest Conduct & Rules', icon: ShieldAlert },
  { id: 'damages', title: '4. Damages & Fines', icon: AlertTriangle },
  { id: 'liability', title: '5. Health & Liability', icon: Scale },
  { id: 'disputes', title: '6. Disputes & Refunds', icon: FileText },
  { id: 'miscellaneous', title: '7. Miscellaneous', icon: HelpCircle },
];

const IconWrapper = ({ icon: Icon }) => (
  <Icon className="text-accent/60" />
);

export default function TermsConditionsPage() {
  const [activeSection, setActiveSection] = useState('booking');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 120,
        behavior: 'smooth',
      });
    }
  };

  return (
    <main className="relative min-h-screen pt-32 pb-24">
      <div className="container relative z-10">
        
        {/* Header Section */}
        <div className="mb-16 border-b border-foreground/5 pb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-foreground/60 hover:text-accent hover:gap-3 transition-all mb-8 group"
          >
            <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/10 shadow-sm group-hover:bg-accent group-hover:text-white transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold">Back to Home</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4 tracking-tight">Terms & Conditions</h1>
              <p className="text-accent font-bold uppercase tracking-widest text-sm">Homestay Guest Policies</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-foreground font-bold text-lg">Ruh Musafir Homestay</p>
              <p className="text-foreground/40 text-xs uppercase tracking-widest mt-1">Effective Date: 01/03/2026</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 hidden md:block">
            <div className="sticky top-32 space-y-4">
              <div className="bg-white p-6 rounded-4xl shadow-xl border border-foreground/5">
                <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] font-bold text-foreground/40 mb-6 ml-2">Quick Navigation</h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-left group ${
                          activeSection === section.id
                            ? 'bg-primary text-white shadow-lg scale-[1.02]'
                            : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
                        }`}
                      >
                        <div className={`p-2 rounded-xl transition-colors ${
                          activeSection === section.id ? 'bg-white/20' : 'bg-foreground/5 group-hover:bg-foreground/10'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <span className="font-sans text-sm font-bold tracking-tight">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <div className="bg-white p-8 md:p-12 rounded-4xl shadow-md border border-foreground/5 space-y-16">
              
              <section id="booking" className="scroll-mt-32">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={BookOpen} />
                  1. Booking & Payment
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-foreground/5 p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    All bookings must be made through our official website, authorized booking partners, or direct communication with our management.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Full payment or a minimum 50% deposit is required at the time of booking to confirm your reservation.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Payments can be made via UPI, Credit/Debit Cards, or Net Banking through our secure payment gateway.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    In case of cancellation by the guest, refunds (if any) will be subject to our Cancellation Policy (see Section 6).
                  </p>
                </div>
              </section>

              <section id="checkin" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={Clock} />
                  2. Check-in & Check-out
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-foreground/5 p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Standard Check-in time: 1:00 PM onwards.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Standard Check-out time: By 11:00 AM.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Early check-in or late check-out is subject to availability and may incur additional charges.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Guests must provide a valid government photo ID (Aadhar, Passport, etc.) at the time of check-in as per local law.
                  </p>
                </div>
              </section>

              <section id="conduct" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={ShieldAlert} />
                  3. Guest Conduct & House Rules
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-foreground/5 p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Ruh Musafir is a peaceful sanctuary. Loud music, disruptive behavior, or any activity that disturbs the peace of the village is strictly prohibited.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Smoking is strictly prohibited inside the rooms. Designated outdoor smoking areas are available.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    We are an eco-conscious homestay. Please minimize plastic use and conserve water and electricity.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Consumption of illegal substances is strictly forbidden and will result in immediate eviction without refund.
                  </p>
                </div>
              </section>

              <section id="damages" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={AlertTriangle} />
                  4. Damages & Fines
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-foreground/5 p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Guests are responsible for any damage caused to the property, furniture, or equipment during their stay.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Lost keys will incur a replacement charge of ₹500.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    A deep cleaning fee of ₹2,000 will be charged if smoking is detected inside the rooms.
                  </p>
                </div>
              </section>

              <section id="liability" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={Scale} />
                  5. Health, Safety & Liability
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-foreground/5 p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Guests must follow all safety and hygiene rules of the property.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    The host is not responsible for accidents, injury, or loss of personal items unless caused by gross negligence on the part of the host.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    In case of an emergency, guests must follow instructions given by the host or staff immediately.
                  </p>
                </div>
              </section>

              <section id="disputes" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={FileText} />
                  6. Payment Disputes & Refunds
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-foreground/5 p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Any payment disputes should be raised within 24 hours of the transaction.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    Refunds will be processed to the original mode of payment within 7-10 working days.
                  </p>
                </div>
              </section>

              <section id="miscellaneous" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={HelpCircle} />
                  7. Miscellaneous
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-foreground/5 p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    We reserve the right to amend or cancel bookings if necessary (property maintenance, legal requirements, unforeseen events).
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    For questions or concerns, please reach out to us at hello@ruhmusafir.com or +91 86971 25852.
                  </p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}