import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from '@/layouts/Sidebar'
import logo from '@/assets/ruh_musafir.jpeg'

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-primary/10 shadow-sm sticky top-0 z-30">
        <div className='flex flex-row items-center space-x-2'>
          <img src={logo} alt="Ruh Musafir Logo" className="w-8 h-auto" />
          <h1 className="text-xl text-primary font-bold tracking-tight leading-none"> Ruh <span className="italic font-light text-foreground/60">Musafir</span> </h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* The sticky sidebar on the left */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* The main content area on the right */}
      <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-72px)] lg:h-screen overflow-y-auto relative scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-secondary scrollbar-corner-accent scrollbar-track-primary/75">
        {/* Background Texture from your CSS */}
        {/* <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay"></div> */}
        
        {/* Render the current page (Dashboard, Rooms, etc.) */}
        <div className="p-4 sm:p-6 lg:p-12 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}