import { Montserrat } from "next/font/google";
import Script from 'next/script';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'react-hot-toast';
import "@/styles/globals.css";
// import { Partytown } from "@qwik.dev/partytown/react";

import { StoreProvider } from '@/store/StoreProvider';
//Header & footer Files to add in layout.jsx
import Nav from "@/component/nav";
import Floating from "@/component/FloatingContact";
import MaintenanceNotifier from "@/component/MaintenanceNotifier";
import Footer from "@/component/footer";


const montserrat = Montserrat({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata = {
  charSet: 'UTF-8',
  title: {
    template: " %s | Ruh Musafir.",
    default: "Best Homestay at Shangarh | Ruh Musafir.",
  },
  description: "Experience the best homestay in Shangarh with Ruh Musafir. Enjoy comfortable accommodation and exceptional hospitality. Book your stay now for an unforgettable getaway.",
  manifest: '/manifest.webmanifest',
  canonical: "https://www.ruhmusafir.com/",
  sitename: "Ruh Musafir.",
  keywords: ["packers and movers kolkata", "Ruh Musafir"],
  openGraph: {
    url: 'https://www.ruhmusafir.com',
    title: "Ruh Musafir",
    type: 'website',
    siteName: "Ruh Musafir.",
    description: "Trusted packers and movers company in Kolkata offering shifting, storage solutions, and car transport services with safe, reliable handling.",
    images: [
      {url: "https://www.ruhmusafir.com/icon.png", alt: "ruhmusafir | Logo", type: 'image/png', sizes:"192x192", fetchPriority: "auto"},
    ],
  },
  twitter:{
    card: "Ruh Musafir.",
    title: "Home - Ruh Musafir.",
    creator: "Ruh Musafir.",
    description: "Trusted packers and movers company in Kolkata offering shifting, storage solutions, and car transport services with safe, reliable handling.",
    images: [
      {url: "https://www.ruhmusafir.com/icon.png", alt: "ruhmusafir | Logo", type: 'image/png', sizes:"192x192", fetchPriority: "auto"},
    ],
  },
  icons:{
    icon:[
      {url: '/icon.png', type: "image/png", sizes:"192x192", rel:"icon", fetchPriority: "auto"},
    ],
    shortcut: {url: '/icon.png', type: "image/png", fetchPriority: "auto"},
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: true,
  // Also supported but less commonly used
  // 
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Pradhan Packers and Movers Private Limited",
  "url": "https://pradhanservice.com/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://pradhanservice.com/logo.png"
  },
  "description": "Pradhan Packers and Movers Private Limited is a trusted relocation service provider company in Kolkata with over 45 years of experience in packing and moving services.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "P-61, Bijan Kanan",
    "addressLocality": "Brahmapur, Kolkata",
    "addressRegion": "West Bengal",
    "postalCode": "700096"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+91 9830070983",
      "contactType": "customer service",
      "email": "support@pradhanservice.com",
      "areaServed": "IN",
      "availableLanguage": "English, Hindi"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/pradhanpackersandmovers",
    "https://www.instagram.com/pradhan_packers_and_movers",
    "https://in.linkedin.com/company/pradhanpackersandmovers-kolkata",
    "https://www.youtube.com/@pradhanpackersandmovers"
  ],
  "foundingDate": "2025-02-25",
  "founder": {
    "@type": "Person",
    "name": "Mr. Sourav Biswas"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* <Partytown debug={false} forward={["dataLayer.push"]} lib="/~pradhanpackersandmovers/" />  */}
        {/* <!-- Google Tag Manager (noscript) --> */}
        {/* <Script id="tag_manager_index" async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_MeasurementId_ga}`} type="text/partytown" /> */}
        {/* <Script id="tag_manager" strategy="afterInteractive" type="text/partytown" dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f); })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTMId}');`}} /> */}

        {/* Browser Update */}
        <Script id="browser-update" dangerouslySetInnerHTML={{ __html: `var $buoop = {required:{e:-4,f:-3,o:-3,s:-1,c:-3},insecure:true,api:2025.06 }; function $buo_f(){ var e = document.createElement("script"); e.src = "https://browser-update.org/update.min.js"; document.body.appendChild(e); }; try {document.addEventListener("DOMContentLoaded", $buo_f,false)} catch(e){window.attachEvent("onload", $buo_f)}` }} />
      </head>
      <body className={`${montserrat.variable} antialiased overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25`}>
        {/* Google Tag Manager (noscript) */}
        {/* <noscript><iframe loading="lazy" src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTMId}`} className='hidden invisible' height="0" width="0"></iframe></noscript> */}

        {/* Google Analitics */}
        {/* <Script strategy='afterInteractive' type="text/partytown" src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_MeasurementId_ga}`} /> */}
        <StoreProvider>
          <NextTopLoader   color="#c5a059"   initialPosition={0.08}   crawlSpeed={200}   height={3}   crawl={true}   showSpinner={false}   easing="ease"   speed={200}   shadow="0 0 10px #f1a4c7,0 0 5px #f1a4c7" />
          <MaintenanceNotifier />
          <Nav />
          {/* Add JSON-LD to your page */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
          {children}
          <Toaster position="top-right" />
          <Floating />
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
