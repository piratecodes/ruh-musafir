import { Calendar, Users, Clock, PlusCircle, BedDouble, Coffee, ArrowRight, Bell, ChefHat, DoorOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TopStats({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-primary/10 shadow-lg flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-14 h-14 bg-secondary text-primary rounded-xl flex items-center justify-center shrink-0 shadow-inner">
          <Calendar size={24} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/50 font-bold mb-1">Today's Activity</p>
          <p className="text-2xl font-bold text-primary">{stats?.activity || '0 In / 0 Out'}</p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-primary/10 shadow-lg flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 shadow-inner">
          <Users size={24} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/50 font-bold mb-1">Occupancy</p>
          <p className="text-3xl font-bold text-primary">{stats?.occupancy || '0%'}</p>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] border border-primary/10 shadow-lg flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
        <div className="w-14 h-14 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0 shadow-inner">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/50 font-bold mb-1">Pending Actions</p>
          <p className="text-3xl font-bold text-primary">{stats?.pending || 0}</p>
        </div>
      </div>
    </div>
  )
}

export function QuickLinks() {
  const links = [
    { name: 'New Booking', icon: PlusCircle, path: '/front-desk', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { name: 'Room Service', icon: BedDouble, path: '/front-desk', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { name: 'New Cafe Order', icon: Coffee, path: '/cafe-pos', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { name: 'New Cafe Order', icon: Coffee, path: '/cafe-pos', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  ]

  return (
    <div className="bg-white/60 backdrop-blur-xl py-8 rounded-[2rem] border border-primary/10 shadow-lg h-full flex flex-col">
      <h3 className="text-xl font-bold text-primary mb-6 px-6">Quick <span className="italic font-light">Actions</span></h3>
      <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden px-3.5 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
        {links.map((link) => (
          <Link key={link.name} to={link.path} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md ${link.color}`}>
            <div className="flex items-center gap-3">
              <link.icon size={18} />
              <span className="text-xs uppercase tracking-widest font-bold">{link.name}</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </div>
  )
}

export function NotificationsList({ notifications }) {
  
  // Helper to format timestamps into "10 mins ago"
  const timeAgo = (dateInput) => {
    if (!dateInput) return '';
    const seconds = Math.floor((new Date() - new Date(dateInput)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl py-8 rounded-[2rem] border border-primary/10 shadow-lg h-full flex flex-col">
      <div className="px-8 flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-primary">Recent <span className="italic font-light">Updates</span></h3>
        <div className="relative">
          <Bell size={18} className="text-primary/50" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        </div>
      </div>
      <div className="px-8 space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
        {notifications?.length > 0 ? notifications.map((notif, i) => (
          <div key={i} className="flex gap-4 items-start border-b border-primary/5 pb-4 last:border-0 last:pb-0">
            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.type === 'order' ? 'bg-amber-500' : 'bg-primary'}`} />
            <div>
              <p className="text-sm font-bold text-primary leading-tight">{notif.title}</p>
              <p className="text-[11px] font-medium text-foreground/60 line-clamp-2 mt-1">{notif.message}</p>
              <p className="text-[9px] uppercase tracking-widest text-foreground/40 font-bold mt-2">{timeAgo(notif.time)}</p>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40">
            <Bell size={24} className="mb-2 opacity-20"/>
            <p className="text-[10px] uppercase tracking-widest font-bold">No recent updates.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- THE FIX: NEW OPERATIONAL WIDGET A ---
export function LiveCafePipeline({ orders }) {
  return (
    <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-primary/5 shadow-lg flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <ChefHat size={16} className="text-amber-500" /> Active Cafe Orders
        </h3>
        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 shadow-sm">{orders?.length || 0} Tickets</span>
      </div>
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1 space-y-3 pr-2">
        {orders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground/30">
            <p className="text-[10px] uppercase tracking-widest font-bold">Kitchen is clear</p>
          </div>
        ) : (
          orders?.map(order => (
            <div key={order.id} className="p-3 bg-gray-50 rounded-xl border border-primary/5 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-primary">Ticket #{order.id.slice(-5).toUpperCase()}</p>
                <p className="text-[9px] uppercase tracking-widest text-foreground/50 mt-1">{order.items?.length || 0} Items</p>
              </div>
              <span className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest rounded-md ${order.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>
                {order.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// --- THE FIX: NEW OPERATIONAL WIDGET B ---
export function RoomReadinessMonitor({ rooms }) {
  const getStatusColor = (state) => {
    switch(state) {
      case 'OCCUPIED': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'RESERVED': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'MAINTENANCE': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-primary/5 shadow-lg flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
          <DoorOpen size={16} className="text-emerald-500" /> Room Readiness
        </h3>
      </div>
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1">
        <div className="grid grid-cols-2 gap-3 pr-2">
          {rooms?.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-10 text-foreground/30">
              <p className="text-[10px] uppercase tracking-widest font-bold">No Rooms configured</p>
            </div>
          ) : (
            rooms?.map(room => (
              <div key={room.id} className="p-3 bg-white rounded-xl border border-primary/10 shadow-sm flex flex-col items-center text-center gap-1.5">
                <span className="text-[11px] font-black text-primary uppercase tracking-widest">{room.roomNumber}</span>
                <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-md border ${getStatusColor(room.state)}`}>
                  {room.state}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}