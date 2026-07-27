import { useState, useEffect } from 'react'
import { Users, Layers, Power, Image as ImageIcon, Hotel, Crown } from 'lucide-react' // Added new icons
import { getImageUrl } from '@/pages/SettingsPage' 

export default function RoomCard({ room, onEdit, onToggleActive }) {
  const [currentImg, setCurrentImg] = useState(0)

  // Auto-play Slideshow
  useEffect(() => {
    if (room.images && room.images.length > 1 && room.isActive) {
      const timer = setInterval(() => {
        setCurrentImg((prev) => (prev + 1) % room.images.length)
      }, 4000)
      return () => clearInterval(timer)
    }
  }, [room.images, room.isActive])

  // --- NEW: THEME MAPPING ---
  const typeTheme = {
    PRIVATE: {
      label: 'Private Suite',
      icon: Crown,
      color: 'text-primary', // Your deep teal/primary
      bg: 'bg-primary/10'
    },
    DORM: {
      label: 'Dormitory',
      icon: Layers,
      color: 'text-accent', // Your copper/accent
      bg: 'bg-accent/10'
    }
  }

  const currentTheme = typeTheme[room.type] || typeTheme.PRIVATE
  const Icon = currentTheme.icon

  const getStatusStyle = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-500 text-white border-emerald-400/50'
      case 'OCCUPIED': return 'bg-amber-500 text-white border-amber-400/50'
      case 'MAINTENANCE': return 'bg-red-500 text-white border-red-400/50'
      case 'PARTIAL': return 'bg-blue-500 text-white border-blue-400/50'
      default: return 'bg-gray-500 text-white border-gray-400/50'
    }
  }

  let displayStatus = room.status || 'AVAILABLE'
  let availableBeds = 0
  
  if (room.type === 'DORM' && room.beds) {
    availableBeds = room.beds.filter(b => b.status === 'AVAILABLE').length
    if (availableBeds === 0) displayStatus = 'OCCUPIED'
    else if (availableBeds === room.capacity) displayStatus = 'AVAILABLE'
    else displayStatus = 'PARTIAL'
  }

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-3xl border border-primary/10 shadow-lg overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${!room.isActive ? 'opacity-60 grayscale-[0.3]' : ''}`}>
      
      {/* Header Slideshow Section */}
      <div className="h-40 bg-secondary/80 relative overflow-hidden flex flex-col justify-between p-4">
        {room.images && room.images.length > 0 ? (
          room.images.map((img, idx) => (
            <img 
              key={idx}
              src={getImageUrl(img)} 
              alt={room.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`}
            />
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-primary/20">
            <ImageIcon size={48} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        <div className="relative z-10 flex justify-between items-start w-full">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-[9px] uppercase tracking-widest font-bold text-primary shadow-lg">
            #{room.roomNumber}
          </span>
          <span className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-bold border shadow-lg backdrop-blur-md ${getStatusStyle(displayStatus)}`}>
            {room.type === 'DORM' && displayStatus === 'PARTIAL' ? `${availableBeds} BEDS LEFT` : displayStatus}
          </span>
        </div>
        
        {room.images && room.images.length > 1 && (
          <div className="relative z-10 flex gap-1.5 justify-center mt-auto pb-1">
            {room.images.map((_, idx) => (
              <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-primary mb-1 line-clamp-1">
          {room.name}
        </h3>
        
        {/* NEW: DYNAMIC THEMED TYPE BADGE */}
        <div className={`flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold mb-5 self-start px-3 py-1 rounded-full border border-primary/5 ${currentTheme.bg} ${currentTheme.color}`}>
          <Icon size={12} strokeWidth={2.5} />
          {currentTheme.label}
        </div>
        
        {room.type === 'DORM' && (
          <div className="mb-5">
            <div className="w-full bg-secondary rounded-full h-1.5 mb-2 overflow-hidden">
              <div 
                className="bg-accent h-1.5 rounded-full" 
                style={{ width: `${((room.capacity - availableBeds) / room.capacity) * 100}%` }}
              ></div>
            </div>
            <p className="text-[9px] uppercase tracking-widest text-foreground/40 font-bold text-right">
              {room.capacity - availableBeds} of {room.capacity} beds occupied
            </p>
          </div>
        )}

        <div className="mt-auto pt-5 border-t border-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-foreground/60 text-xs font-bold bg-secondary/30 px-3 py-2 rounded-lg">
            <Users size={14} className="text-primary/60" /> {room.type === 'DORM' ? `${room.capacity} Beds` : `Max ${room.capacity}`}
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-foreground/40 font-bold mb-0.5">
              {room.type === 'DORM' ? 'Per Bed' : 'Base Price'}
            </p>
            <p className="text-sm font-bold text-primary">₹{room.basePrice.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 mt-auto flex gap-3">
        <button onClick={() => onToggleActive(room.id)} className={`p-3.5 rounded-xl border flex items-center justify-center transition-colors shadow-sm shrink-0 ${ room.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'}`}>
          <Power size={18} strokeWidth={2.5} />
        </button>
        <button onClick={() => onEdit(room)} className="flex-1 py-3.5 bg-secondary/30 hover:bg-secondary text-primary rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-colors border border-primary/5 shadow-sm">
          Manage Inventory
        </button>
      </div>
    </div>
  )
}