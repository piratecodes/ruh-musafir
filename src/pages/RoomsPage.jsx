import { useState, useEffect, Fragment } from 'react'
import { Plus, Search, BedDouble, Users, Wrench, CheckCircle, Loader2, ChevronDown, Activity, Layers } from 'lucide-react'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'

import useDocumentMeta from '@/hooks/useDocumentMeta';

import RoomCard from '@/components/rooms/RoomCard'
import RoomModal from '@/components/rooms/RoomModal'

const toastStyle = {
  background: '#ffffff', color: '#112440',
  border: '1px solid rgba(17, 36, 64, 0.1)',
  borderRadius: '1rem', fontSize: '11px',
  fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em',
}

export default function RoomsPage() {
  useDocumentMeta(" Room Inventory | Ruh Musafir ", "Manage your hotel's room inventory, including availability, types, and maintenance status for Ruh Musafir hotel management.");

  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([]) // THE FIX: State to hold live bookings
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ACTIVE') 
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)

  // --- API CALLS ---
  // THE FIX: Fetch Rooms AND Bookings simultaneously for Real-Time Math
  const fetchInventoryData = async () => {
    setIsLoading(true)
    try {
      const [roomsData, bookingsData] = await Promise.all([
        fetchClient('/rooms'),
        fetchClient('/bookings').catch(() => []) // Safely catch if bookings are empty
      ])
      
      setRooms(roomsData || [])
      setBookings(Array.isArray(bookingsData) ? bookingsData : (bookingsData?.data || []))
    } catch (error) {
      toast.error('Failed to load inventory', { style: toastStyle })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchInventoryData() }, [])

  const handleSaveRoom = async (payloadFormData) => {
    try {
      await fetchClient('/rooms', {
        method: 'POST',
        body: payloadFormData 
      })
      toast.success('Inventory Updated Successfully', { style: toastStyle })
      setIsModalOpen(false)
      fetchInventoryData()
    } catch (error) {
      toast.error(error.message || 'Failed to save room', { style: toastStyle })
    }
  }
  
  const handleDeactivate = async (id) => {
    try {
      await fetchClient(`/rooms/${id}/toggle-active`, { method: 'PATCH' })
      toast.success('Room status toggled', { style: toastStyle })
      setIsModalOpen(false)
      fetchInventoryData()
    } catch (error) {
      toast.error('Failed to toggle status', { style: toastStyle })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return
    try {
      await fetchClient(`/rooms/${id}`, { method: 'DELETE' })
      toast.success('Room deleted permanently', { style: toastStyle })
      setIsModalOpen(false)
      fetchInventoryData()
    } catch (error) {
      toast.error(error.message || 'Failed to delete room', { style: toastStyle })
    }
  }

  // =======================================================================
  // THE FIX: REAL-TIME OCCUPANCY CALCULATION ENGINE
  // =======================================================================
  const todayStr = new Date().toISOString().split('T')[0];

  let totalSpaces = 0;
  let occupiedSpaces = 0;
  let maintenanceSpaces = 0;

  // 1. Map through rooms and dynamically inject the 'status' for the RoomCards
  const mappedRooms = rooms.map(room => {
      // Calculate units: Private = 1 Space. Dorm = 'N' Beds.
      const units = room.type === 'PRIVATE' ? 1 : (room.beds?.length || 0);
      totalSpaces += units;

      if (!room.isActive) {
          maintenanceSpaces += units;
          return { ...room, status: 'MAINTENANCE' };
      }

      if (room.type === 'PRIVATE') {
          // Check if there is an active booking for this private room today
          const isOccupied = bookings.some(b => 
              b.roomId === room.id && 
              b.checkIn <= todayStr && 
              b.checkOut > todayStr && 
              !['CANCELLED', 'NO_SHOW', 'CHECKED_OUT'].includes(b.status)
          );
          
          if (isOccupied) occupiedSpaces += 1;
          
          return { ...room, status: isOccupied ? 'OCCUPIED' : 'AVAILABLE' };
          
      } else if (room.type === 'DORM') {
          const beds = room.beds || [];
          let availableBedsCount = 0;

          beds.forEach(bed => {
              if (bed.status === 'MAINTENANCE') {
                  maintenanceSpaces += 1;
              } else {
                  // Check if THIS specific bed has a booking today
                  const isOccupied = bookings.some(b => 
                      b.roomId === room.id && 
                      b.bedIds?.includes(bed.id) && 
                      b.checkIn <= todayStr && 
                      b.checkOut > todayStr && 
                      !['CANCELLED', 'NO_SHOW', 'CHECKED_OUT'].includes(b.status)
                  );
                  
                  if (isOccupied || bed.status === 'OCCUPIED') {
                      occupiedSpaces += 1;
                  } else {
                      availableBedsCount += 1;
                  }
              }
          });

          return { 
              ...room, 
              status: availableBedsCount > 0 ? 'AVAILABLE' : 'OCCUPIED', 
              availableBedsCount 
          };
      }
      return room;
  });

  const availableSpaces = totalSpaces - occupiedSpaces - maintenanceSpaces;

  const stats = {
      total: totalSpaces,
      available: availableSpaces,
      occupied: occupiedSpaces,
      maintenance: maintenanceSpaces
  };

  // --- DYNAMIC COMPUTATIONS FOR DISPLAY ---
  const filteredRooms = mappedRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.roomNumber.includes(searchQuery)
    const matchesType = filterType === 'ALL' || room.type === filterType
    const matchesStatus = filterStatus === 'ALL' || 
                          (filterStatus === 'ACTIVE' && room.isActive) || 
                          (filterStatus === 'DEACTIVATED' && !room.isActive)

    return matchesSearch && matchesType && matchesStatus
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white/40 p-8 rounded-4xl border border-primary/5 shadow-sm">
        <div>
          <h2 className="text-3xl lg:text-5xl text-primary font-bold tracking-tight leading-none">
            Room <span className="italic font-light text-foreground/60">Inventory</span>
          </h2>
          <p className="text-sm text-foreground/60 font-serif italic mt-3">
            Manage your property's spaces and pricing.
          </p>
        </div>
        <button 
          onClick={() => { setSelectedRoom(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 text-[10px] uppercase tracking-[0.2em] font-bold shrink-0"
        >
          <Plus size={18} /> Add New Room
        </button>
      </div>

      {/* THE FIX: Re-labeled 'Active Rooms' to 'Total Spaces' since Private = 1 and Dorm = Beds */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spaces', value: stats.total, icon: BedDouble, color: 'text-primary' },
          { label: 'Available', value: stats.available, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Occupied', value: stats.occupied, icon: Users, color: 'text-amber-600' },
          { label: 'Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-red-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-xl p-6 rounded-4xl border border-primary/10 shadow-lg flex flex-col gap-4">
            <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{isLoading ? '-' : stat.value}</p>
              <p className="text-[9px] uppercase tracking-widest text-foreground/50 font-bold mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- REDESIGNED CONTROL BAR --- */}
      <div className="flex flex-col md:flex-row gap-3 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-primary/10 shadow-sm relative z-50">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
          <input 
            type="text" 
            placeholder="Search room name or number..." 
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-primary/5 focus:border-primary/20 outline-none text-xs transition-all shadow-sm font-bold text-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* HEADLESS UI: Status Filter (with internal icon) */}
          <Listbox value={filterStatus} onChange={setFilterStatus}>
            <div className="relative w-full md:w-44 z-20">
              <ListboxButton className="relative w-full flex items-center justify-between cursor-pointer px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm group">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-primary/40 group-hover:text-primary transition-colors" />
                  <span className="block truncate">
                    {filterStatus === 'ACTIVE' ? 'Active Rooms' : filterStatus === 'DEACTIVATED' ? 'Deactivated' : 'All Inventory'}
                  </span>
                </div>
                <ChevronDown size={14} className="opacity-50" aria-hidden="true" />
              </ListboxButton>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 text-base shadow-xl ring-1 ring-primary/5 focus:outline-none z-[9999]">
                  {['ACTIVE', 'DEACTIVATED', 'ALL'].map((status) => (
                    <ListboxOption key={status} value={status} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                      {status === 'ACTIVE' ? 'Active Rooms' : status === 'DEACTIVATED' ? 'Deactivated' : 'All Inventory'}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          </Listbox>

          {/* HEADLESS UI: Type Filter (with internal icon) */}
          <Listbox value={filterType} onChange={setFilterType}>
            <div className="relative w-full md:w-40 z-10">
              <ListboxButton className="relative w-full flex items-center justify-between cursor-pointer px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm group">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-primary/40 group-hover:text-primary transition-colors" />
                  <span className="block truncate">
                    {filterType === 'ALL' ? 'All Types' : filterType === 'PRIVATE' ? 'Private' : 'Dorms'}
                  </span>
                </div>
                <ChevronDown size={14} className="opacity-50" aria-hidden="true" />
              </ListboxButton>
              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 text-base shadow-xl ring-1 ring-primary/5 focus:outline-none right-0 z-[9999]">
                  {['ALL', 'PRIVATE', 'DORM'].map((type) => (
                    <ListboxOption key={type} value={type} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                      {type === 'ALL' ? 'All Types' : type === 'PRIVATE' ? 'Private Only' : 'Dorms Only'}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard 
              key={room.id} 
              room={room} 
              onEdit={() => { setSelectedRoom(room); setIsModalOpen(true); }} 
              onToggleActive={handleDeactivate} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/40 rounded-4xl border border-primary/5 shadow-sm">
          <BedDouble size={48} className="text-primary/20 mx-auto mb-5" />
          <h3 className="text-xl font-bold text-primary">No inventory found</h3>
          <p className="text-sm text-foreground/50 mt-2">
            {filterStatus === 'DEACTIVATED' ? 'You have no deactivated rooms.' : 'Try adjusting your search filters or add a new room.'}
          </p>
        </div>
      )}

      <RoomModal
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        roomData={selectedRoom}
        onSave={handleSaveRoom}
        onDelete={handleDelete}
      />
    </div>
  )
}