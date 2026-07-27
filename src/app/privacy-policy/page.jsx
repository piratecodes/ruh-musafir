"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Database, Eye, Lock, UserCheck, HelpCircle, Info } from 'lucide-react';

const sections = [
  { id: 'overview', title: 'Overview', icon: Info },
  { id: 'collection', title: 'Data Collection', icon: Database },
  { id: 'usage', title: 'Data Usage', icon: Eye },
  { id: 'protection', title: 'Data Protection', icon: Lock },
  { id: 'rights', title: 'Your Rights', icon: UserCheck },
  { id: 'contact', title: 'Contact Us', icon: HelpCircle },
];

const IconWrapper = ({ icon: Icon }) => (
  <Icon className="text-accent/60" />
);

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('overview');

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
    <main className="relative min-h-screen bg-background pt-32 pb-24">
      
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
              <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4 tracking-tight">Privacy Policy</h1>
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
              
              {/* Overview */}
              <section id="overview" className="scroll-mt-32">
                <h2 className="font-serif text-3xl text-foreground mb-6 flex items-center gap-3">
                  <IconWrapper icon={Info} />
                  Overview
                </h2>
                <div className="bg-background p-8 rounded-3xl border border-foreground/5">
                  <p className="font-serif text-foreground/80 leading-relaxed mb-6 text-lg font-light">
                    We are committed to protecting your privacy and ensuring the security of your personal information. This policy outlines how we collect, use, and protect your data.
                  </p>
                  <div className="bg-white p-6 rounded-2xl border border-foreground/5 shadow-sm">
                    <h4 className="font-sans text-xs font-bold text-foreground mb-4 uppercase tracking-widest">Our Commitment</h4>
                    <ul className="font-serif space-y-3 text-foreground/70">
                      <li className="flex gap-3 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                        We collect only necessary information required by law or for operational purposes.
                      </li>
                      <li className="flex gap-3 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                        Your data is secured and used only for transaction and booking purposes.
                      </li>
                      <li className="flex gap-3 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                        We respect your privacy and will not share your information without consent.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Collection */}
              <section id="collection" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-6 flex items-center gap-3">
                  <IconWrapper icon={Database} />
                  Data Collection
                </h2>
                <div className="space-y-6">
                  <div className="p-8 bg-white rounded-3xl border border-foreground/5 shadow-sm">
                    <h4 className="font-sans font-bold text-foreground mb-4 uppercase tracking-widest text-xs">Information We Collect</h4>
                    <ul className="font-serif space-y-4 text-foreground/70">
                      <li className="leading-relaxed"><strong className="text-foreground">Guest Information:</strong> Name, contact details, ID proof (required by law).</li>
                      <li className="leading-relaxed"><strong className="text-foreground">Booking Details:</strong> Check-in/out dates, number of guests, special requests.</li>
                      <li className="leading-relaxed"><strong className="text-foreground">Payment Information:</strong> Processed securely through our payment partners.</li>
                      <li className="leading-relaxed"><strong className="text-foreground">Communication:</strong> Email and phone for booking confirmations and updates.</li>
                    </ul>
                  </div>
                  <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10">
                    <h4 className="font-sans font-bold text-primary mb-3 uppercase tracking-widest text-xs">Legal Requirements</h4>
                    <p className="font-serif text-foreground/70 leading-relaxed">
                      ID proof collection is required by law for all accommodation bookings in India. This information is stored securely and shared only with authorized government agencies if requested.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Usage */}
              <section id="usage" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-8 flex items-center gap-3">
                  <IconWrapper icon={Eye} />
                  Data Usage
                </h2>
                <div className="font-serif space-y-4 text-foreground/80 leading-relaxed text-lg font-light bg-background p-8 rounded-3xl border border-foreground/5">
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    To process and manage your room bookings and provide requested services.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    To communicate important stay-related information and updates.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    To improve our website and guest experience through internal analytics.
                  </p>
                  <p className="flex gap-4 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-3 shrink-0"></span>
                    We do not use your personal data for third-party marketing without your explicit consent.
                  </p>
                </div>
              </section>

              {/* Data Protection */}
              <section id="protection" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-6 flex items-center gap-3">
                  <IconWrapper icon={Lock} />
                  Data Protection
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-white rounded-3xl border border-foreground/5 shadow-sm">
                    <h4 className="font-sans font-bold text-foreground mb-3 uppercase tracking-widest text-xs">Security Measures</h4>
                    <p className="font-serif text-foreground/70 leading-relaxed">All payment data handled via secure gateways is encrypted. Personal information is stored in secure, access-restricted environments.</p>
                  </div>
                  <div className="p-8 bg-white rounded-3xl border border-foreground/5 shadow-sm">
                    <h4 className="font-sans font-bold text-foreground mb-3 uppercase tracking-widest text-xs">Data Sharing</h4>
                    <p className="font-serif text-foreground/70 leading-relaxed">We do not sell or rent your personal information. Data may be shared only with authorized service providers or if required by law.</p>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section id="rights" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-6 flex items-center gap-3">
                  <IconWrapper icon={UserCheck} />
                  Your Rights
                </h2>
                <div className="p-8 bg-background rounded-3xl border border-foreground/5 space-y-6">
                  <p className="font-serif text-foreground/70 text-lg">You have full control over your personal information:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4 text-sm font-bold text-foreground font-sans uppercase tracking-widest bg-white p-4 rounded-xl shadow-sm border border-foreground/5">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      Access your data
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-foreground font-sans uppercase tracking-widest bg-white p-4 rounded-xl shadow-sm border border-foreground/5">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      Correct inaccuracies
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-foreground font-sans uppercase tracking-widest bg-white p-4 rounded-xl shadow-sm border border-foreground/5">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      Request deletion
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-foreground font-sans uppercase tracking-widest bg-white p-4 rounded-xl shadow-sm border border-foreground/5">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      Opt-out of emails
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Us */}
              <section id="contact" className="scroll-mt-32 border-t border-foreground/10 pt-16">
                <h2 className="font-serif text-3xl text-foreground mb-6 flex items-center gap-3">
                  <IconWrapper icon={HelpCircle} />
                  Contact Us
                </h2>
                <div className="p-10 bg-primary text-white rounded-4xl shadow-xl">
                  <p className="font-serif text-lg mb-8 font-light">For any privacy-related questions or to exercise your rights, please contact our data protection team.</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="mailto:hello@ruhmusafir.com" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-primary font-bold uppercase tracking-widest text-xs hover:bg-accent hover:text-white transition-colors shadow-md">
                      Email Privacy Team
                    </a>
                  </div>
                  <p className="font-sans mt-8 text-[10px] uppercase tracking-widest opacity-60">Response Time: Within 48 Hours</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}