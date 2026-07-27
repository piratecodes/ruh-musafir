import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BedDouble, CalendarDays, Coffee, Wallet, LogOut, Settings, Compass, ConciergeBell, MessageSquareText } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getImageUrl } from '@/pages/SettingsPage' 

import logo from '@/assets/ruh_musafir.jpeg'

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Front Desk', path: '/front-desk', icon: ConciergeBell },
    { name: 'Room Inventory', path: '/rooms', icon: BedDouble },
    { name: 'Guest Bookings', path: '/bookings', icon: CalendarDays },
    { name: 'Experiences', path: '/experiences', icon: Compass }, // <-- NEW ROUTE
    { name: 'Cafe POS', path: '/cafe-pos', icon: Coffee },
    { name: 'Contact', path: '/contact', icon: MessageSquareText },
    { name: 'Treasury & Billing', path: '/treasury', icon: Wallet },
    // { name: 'Roles & Users', path: '/roles', icon: Settings },
  ]

  const profilePicUrl = getImageUrl(user?.profilePic)

  return (
    <aside className="w-72 hidden lg:flex flex-col h-screen sticky top-0 bg-background/75 border-r border-primary/10 shadow-lg z-20 rounded-r-xl overflow-hidden">
      {/* Branding */}
      <div className="px-8 py-3.5 border-b border-primary/5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="px-2.5 py-0.5 bg-accent/10 text-accent rounded-full text-[9px] uppercase tracking-[0.2em] font-bold border border-accent/20">
            Admin Portal
          </div>
        </div>
        <div className='flex flex-row items-center space-x-1.5'>
          <img src={logo} alt="Ruh Musafir Logo" className="w-10 h-auto" />
          <h1 className="text-3xl text-primary font-bold tracking-tight leading-none"> Ruh <span className="italic font-light text-foreground/60">Musafir</span> </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-2.5 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 p-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] font-bold transition-all duration-300 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white text-foreground/60 border-primary/5 hover:border-primary/20 hover:text-primary shadow-sm'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'bg-secondary/50 text-primary'
                }`}>
                  <item.icon size={16} />
                </div>
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="px-6 py-4 border-t border-primary/5 bg-secondary/20 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-display text-lg shadow-md shrink-0 overflow-hidden">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.email?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          
          <div className="overflow-hidden flex-1">
            <p className="font-bold text-primary text-sm truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0]}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-accent font-bold mt-0.5 truncate">
              {user?.designation || user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <NavLink to="/settings" className={({ isActive }) => `w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm text-[9px] uppercase tracking-[0.2em] font-bold border ${ isActive ? 'bg-primary text-white border-primary' : 'bg-white border-primary/10 text-primary hover:bg-primary/5 hover:border-primary/30' }`}>
          <Settings size={14} /> Account Settings
        </NavLink>

        <button onClick={logout} className="w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-primary/10 text-primary hover:bg-accent hover:text-white hover:border-accent transition-all duration-300 shadow-sm text-[9px] uppercase tracking-[0.2em] font-bold">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
      <footer className='text-center bg-secondary py-1.5'>
          <p className='text-xs text-muted'><b>Developed By:</b> <a className='text-shadow-initial' href="https://www.linkedin.com/in/subhamsarkar99/" target="_blank" rel="noopener noreferrer">Subham Sarkar</a></p>
          <p className='text-xs text-muted'>&copy; {new Date().getFullYear()} Ruh Musafir. All rights reserved.</p>
      </footer>
    </aside>
  )
}