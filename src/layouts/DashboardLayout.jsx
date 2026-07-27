import { Outlet } from 'react-router-dom'
import Sidebar from '@/layouts/Sidebar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex">
      {/* The sticky sidebar on the left */}
      <Sidebar />

      {/* The main content area on the right */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-secondary scrollbar-corner-accent scrollbar-track-primary/75">
        {/* Background Texture from your CSS */}
        {/* <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay"></div> */}
        
        {/* Render the current page (Dashboard, Rooms, etc.) */}
        <div className="p-8 lg:p-12 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}