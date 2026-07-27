import { useState, useEffect, useMemo, Fragment } from 'react'
import { Plus, Calendar, List, Loader2, Edit3, Trash2, Search, Filter, ChevronDown, X, FileText } from 'lucide-react'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'

import useDocumentMeta from '@/hooks/useDocumentMeta';

import AvailabilityGrid from '@/components/bookings/AvailabilityGrid'
import BookingModal from '@/components/bookings/BookingModal'
import DatePicker from '@/components/common/DatePicker'

const toastStyle = {
  background: '#ffffff', color: '#112440',
  border: '1px solid rgba(17, 36, 64, 0.1)',
  borderRadius: '1rem', fontSize: '11px',
  fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BookingsPage() {
  useDocumentMeta(" Bookings | Ruh Musafir ", "Visual booking matrix and ledger management for Ruh Musafir hotel reservations.");

  const [activeTab, setActiveTab] = useState('LEDGER') 
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [availableExperiences, setAvailableExperiences] = useState([])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterPayment, setFilterPayment] = useState('ALL') 
  const [filterStatus, setFilterStatus] = useState('ALL')
  
  const [dateMode, setDateMode] = useState('ALL')
  const [exactDate, setExactDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth())
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  const [currentOffset, setCurrentOffset] = useState(0)
  const [timelineDates, setTimelineDates] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('EDIT') // 'EDIT' | 'VIEW'
  const [selectedSlot, setSelectedSlot] = useState(null)     
  const [editingBooking, setEditingBooking] = useState(null) 

  // DYNAMICALLY EXTRACT YEARS FROM DATABASE BOOKINGS
  const dynamicYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    if (Array.isArray(bookings)) {
      bookings.forEach(b => {
        if (b.checkIn) years.add(parseInt(b.checkIn.split('-')[0], 10));
        if (b.checkOut) years.add(parseInt(b.checkOut.split('-')[0], 10));
      });
    }
    return Array.from(years).sort((a, b) => a - b);
  }, [bookings]);

  useEffect(() => {
    const arr = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + currentOffset + i)
      arr.push(d.toISOString().split('T')[0])
    }
    setTimelineDates(arr)
  }, [currentOffset])

  const loadPipeline = async () => {
    setIsLoading(true)
    try {
      const roomsRes = await fetchClient('/rooms').catch(() => [])
      const bookingsRes = await fetchClient('/bookings').catch(() => null)
      const expsRes = await fetchClient('/experiences/public').catch(() => null) 

      setRooms(Array.isArray(roomsRes) ? roomsRes : (roomsRes?.data || []))
      const parsedBookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.data || [])
      setBookings(parsedBookings)
      const parsedExps = Array.isArray(expsRes) ? expsRes : (expsRes?.data || [])
      setAvailableExperiences(parsedExps) 
    } catch (e) {
      toast.error('Failed to load live data', { style: toastStyle })
      setBookings([]) 
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadPipeline() }, [])

  const handleSaveBooking = async (payload) => {
    try {
      const method = payload.id ? 'PATCH' : 'POST'
      const url = payload.id ? `/bookings/${payload.id}` : '/bookings'
      await fetchClient(url, { method: method, body: JSON.stringify(payload) })
      toast.success(payload.id ? 'Booking Modified' : 'Room Allocated Securely', { style: toastStyle })
      setIsModalOpen(false)
      loadPipeline()
    } catch (error) {
      toast.error(error.message || 'Action Rejected', { style: toastStyle })
    }
  }

  const handleDeleteBooking = async (id) => {
    if(!window.confirm("Cancel this booking? This will free up the inventory.")) return;
    try {
      await fetchClient(`/bookings/${id}`, { method: 'DELETE' })
      toast.success('Booking Cancelled', { style: toastStyle })
      setIsModalOpen(false)
      loadPipeline()
    } catch (error) {
      toast.error('Failed to cancel booking', { style: toastStyle })
    }
  }

  const handleSelectEmptySlot = (room, bed, date) => {
    setEditingBooking(null)
    setSelectedSlot({ room, bed, date })
    setModalMode('EDIT')
    setIsModalOpen(true)
  }

  // --- THE FIX: SMART ROW CLICK OPENS VIEW SIDEBAR ---
  const handleRowClick = (booking) => {
    setSelectedSlot(null)
    setEditingBooking(booking)
    setModalMode('VIEW')
    setIsModalOpen(true)
  }

  const handleEditBookingClick = (e, booking) => {
    e.stopPropagation();
    if(window.confirm("Do you want to edit the primary form details of this booking?")) {
      setSelectedSlot(null)
      setEditingBooking(booking)
      setModalMode('EDIT')
      setIsModalOpen(true) 
    }
  }

  const getBookingStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-amber-100 text-amber-700">Pending</span>
      case 'CONFIRMED': return <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-blue-100 text-blue-700">Confirmed</span>
      case 'CHECKED_IN': return <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-indigo-100 text-indigo-700">In House</span>
      case 'CHECKED_OUT': return <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-gray-200 text-gray-700">Checked Out</span>
      case 'CANCELLED': return <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-red-100 text-red-700">Cancelled</span>
      default: return null
    }
  }

  const getLedgerBadge = (status, total, due) => {
    if (due > 0) return <span className="px-2.5 py-1.5 rounded-lg border text-[8px] uppercase tracking-widest bg-amber-50 text-amber-600 border-amber-100">DUE: ₹{due}</span>
    if (status === 'PAID' || due === 0) return <span className="px-2.5 py-1.5 rounded-lg border text-[8px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100">₹{total} • PAID</span>
    return <span className="px-2.5 py-1.5 rounded-lg border text-[8px] uppercase tracking-widest bg-blue-50 text-blue-600 border-blue-100">₹{total} • PARTIAL</span>
  }

  const safeBookingsArray = Array.isArray(bookings) ? bookings : []

  const filteredBookings = safeBookingsArray.filter(b => {
    const searchString = `${b.guestFirstName} ${b.guestLastName} ${b.roomName}`.toLowerCase();
    const matchSearch = searchString.includes(searchQuery.toLowerCase());
    const matchPayment = filterPayment === 'ALL' || b.paymentStatus === filterPayment;
    const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
    
    let matchDate = true;
    if (dateMode === 'EXACT' && exactDate) {
      matchDate = b.checkIn <= exactDate && b.checkOut >= exactDate;
    } else if (dateMode === 'RANGE' && startDate && endDate) {
      matchDate = b.checkOut >= startDate && b.checkIn <= endDate;
    } else if (dateMode === 'MONTH') {
      const startOfMonth = new Date(filterYear, filterMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(filterYear, filterMonth + 1, 0).toISOString().split('T')[0];
      matchDate = b.checkOut >= startOfMonth && b.checkIn <= endOfMonth;
    }

    return matchSearch && matchPayment && matchStatus && matchDate
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white/40 p-8 rounded-4xl border border-primary/5 shadow-sm">
        <div>
          <h2 className="text-3xl lg:text-5xl text-primary font-bold tracking-tight leading-none">
            Reservations <span className="italic font-light text-foreground/60">Hub</span>
          </h2>
          <p className="text-sm text-foreground/60 font-serif italic mt-3">
            Track walk-ins, OTA synchronizations, and ledger states.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary/40 p-1 rounded-xl border border-primary/5 shadow-sm">
            {[
              { id: 'MATRIX', label: 'Availability Grid', icon: Calendar },
              { id: 'LEDGER', label: 'Bookings Ledger', icon: List }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[9px] uppercase tracking-[0.15em] font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-foreground/50 hover:text-primary'
                }`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => { setEditingBooking(null); setSelectedSlot(null); setModalMode('EDIT'); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 text-[9px] uppercase tracking-[0.2em] font-bold"
          >
            <Plus size={14} /> Book Desk WalkIn
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : activeTab === 'MATRIX' ? (
        rooms.length > 0 ? (
          <AvailabilityGrid 
            rooms={rooms} 
            bookings={safeBookingsArray} 
            dates={timelineDates} 
            onSelectEmptySlot={handleSelectEmptySlot}
            onEditBooking={(b) => handleEditBookingClick({stopPropagation: ()=>{}}, b)}
            currentOffset={currentOffset}
            setCurrentOffset={setCurrentOffset}
          />
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg overflow-hidden text-center py-24 animate-in fade-in duration-300">
            <Calendar className="text-primary/20 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold text-primary">No Inventory Available</h3>
            <p className="text-xs text-foreground/50 mt-1 max-w-sm mx-auto">
              The visual matrix requires physical rooms to draw the timeline. Please add rooms in your Inventory dashboard first.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          <div className="flex flex-col xl:flex-row gap-3 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-primary/10 shadow-sm relative z-50">
            
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
              <input type="text" placeholder="Search guest or room..." className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-primary/5 focus:border-primary/20 outline-none text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm text-primary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
              <div className="hidden lg:flex items-center justify-center w-10 h-10 bg-primary/5 rounded-xl text-primary/40 shrink-0">
                <Filter size={14} />
              </div>

              <div className="w-full sm:w-40 shrink-0">
                <Listbox value={dateMode} onChange={setDateMode}>
                  <div className="relative z-40">
                    <ListboxButton className="relative w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm">
                      <span className="block truncate">
                        {dateMode === 'ALL' && 'All Dates'}
                        {dateMode === 'EXACT' && 'Specific Date'}
                        {dateMode === 'RANGE' && 'Date Range'}
                        {dateMode === 'MONTH' && 'Month Wise'}
                      </span>
                      <ChevronDown size={14} className="opacity-50" />
                    </ListboxButton>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute mt-1 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none z-50">
                        {[{val: 'ALL', lab: 'All Dates'}, {val: 'EXACT', lab: 'Specific Date'}, {val: 'RANGE', lab: 'Date Range'}, {val: 'MONTH', lab: 'Month Wise'}].map((opt) => (
                          <ListboxOption key={opt.val} value={opt.val} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                            {opt.lab}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto z-30 shrink-0">
                {dateMode === 'EXACT' && (
                   <DatePicker value={exactDate} onChange={setExactDate} placeholder="Select Date" className="w-full sm:w-36 px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm" />
                )}
                {dateMode === 'RANGE' && (
                  <>
                    <DatePicker value={startDate} onChange={setStartDate} placeholder="Start" className="w-full sm:w-32 px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm" />
                    <span className="text-foreground/40 text-[9px] font-bold">TO</span>
                    <DatePicker value={endDate} onChange={setEndDate} placeholder="End" className="w-full sm:w-32 px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm" />
                  </>
                )}
                {dateMode === 'MONTH' && (
                  <>
                    <div className="relative">
                       <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="appearance-none w-full sm:w-32 px-4 py-3 pr-8 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm cursor-pointer">
                         {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                    </div>
                    <div className="w-full sm:w-28 shrink-0">
                      <Listbox value={filterYear} onChange={setFilterYear}>
                        <div className="relative z-40">
                          <ListboxButton className="relative w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm cursor-pointer">
                            <span className="block truncate">{filterYear}</span>
                            <ChevronDown size={14} className="opacity-50" />
                          </ListboxButton>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <ListboxOptions className="absolute mt-1 w-full max-h-48 overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none z-50 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
                              {dynamicYears.map((y) => (
                                <ListboxOption key={y} value={y} className={({ active }) => `relative cursor-pointer select-none py-2.5 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                                  {y}
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  </>
                )}
              </div>

              <div className="w-full sm:w-40 z-20 shrink-0">
                <Listbox value={filterStatus} onChange={setFilterStatus}>
                  <div className="relative">
                    <ListboxButton className="relative w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm">
                      <span className="block truncate">{filterStatus === 'ALL' ? 'All Statuses' : filterStatus.replace('_', ' ')}</span>
                      <ChevronDown size={14} className="opacity-50" />
                    </ListboxButton>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute right-0 mt-1 w-full sm:w-48 overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none">
                        {['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((st) => (
                          <ListboxOption key={st} value={st} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                            {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div className="w-full sm:w-40 z-10 shrink-0">
                <Listbox value={filterPayment} onChange={setFilterPayment}>
                  <div className="relative">
                    <ListboxButton className="relative w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm">
                      <span className="block truncate">{filterPayment === 'ALL' ? 'All Payments' : filterPayment}</span>
                      <ChevronDown size={14} className="opacity-50" />
                    </ListboxButton>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions className="absolute right-0 mt-1 w-full sm:w-48 overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none">
                        {['ALL', 'PAID', 'PARTIAL', 'PENDING'].map((status) => (
                          <ListboxOption key={status} value={status} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                            {status === 'ALL' ? 'All Payments' : status}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg overflow-hidden relative z-10">
            {filteredBookings.length > 0 ? (
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
                <table className="w-full text-left border-collapse min-w-200">
                  <thead>
                    <tr className="border-b border-primary/5 text-[9px] uppercase tracking-widest font-bold text-foreground/40 bg-secondary/10">
                      <th className="p-4 pl-6">Guest Details</th>
                      <th className="p-4">Allocation</th>
                      <th className="p-4">Timeline</th>
                      <th className="p-4 text-right">Ledger Status</th>
                      <th className="p-4 text-center pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5 text-xs font-bold text-primary">
                    {filteredBookings.map(b => (
                      <tr 
                        key={b.id} 
                        onClick={() => handleRowClick(b)} 
                        className="hover:bg-secondary/20 transition-colors cursor-pointer group"
                        title="Click to view Admin Ledger Statement"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold">{b.guestName}</p>
                            {getBookingStatusBadge(b.status)}
                          </div>
                          <p className="text-[9px] text-foreground/40 font-medium tracking-wide mt-0.5">{b.guestPhone} • {b.guestEmail}</p>
                        </td>
                        <td className="p-4 uppercase tracking-wider text-[10px]">
                          {b.roomName} {b.bedName ? `• ${b.bedName}` : '• Full Room'}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-foreground/60">
                          {b.checkIn} → {b.checkOut}
                        </td>
                        <td className="p-4 text-right">
                          {getLedgerBadge(b.paymentStatus, b.totalAmount, b.dueAmount)}
                        </td>
                        <td className="p-4 text-center pr-6">
                            <div className="flex items-center justify-center gap-4">
                                <button 
                                onClick={(e) => handleEditBookingClick(e, b)} 
                                className="text-primary/40 hover:text-primary transition-colors"
                                title="Edit Form Details"
                                >
                                <Edit3 size={16} />
                                </button>
                                <button 
                                onClick={(e) => { e.stopPropagation(); handleRowClick(b); }} 
                                className="text-primary/40 hover:text-accent transition-colors"
                                title="View Detailed Statement"
                                >
                                <FileText size={16} />
                                </button>
                                <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleDeleteBooking(b.id); 
                                }} 
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Cancel Booking"
                                >
                                <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20">
                <Calendar className="text-primary/20 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-bold text-primary">No Bookings Found</h3>
                <p className="text-xs text-foreground/50 mt-1">Adjust your filters or click 'Book WalkIn' to create a reservation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SINGLE COMPONENT CONTROLS BOTH VIEW SIDEBAR AND EDIT MODAL */}
      <BookingModal 
        isOpen={isModalOpen} 
        mode={modalMode} 
        onClose={() => setIsModalOpen(false)} 
        selectedSlot={selectedSlot}
        existingBooking={editingBooking}
        onSave={handleSaveBooking}
        onDelete={handleDeleteBooking}
        onRefresh={loadPipeline}
        rooms={rooms}
        availableExperiences={availableExperiences}
      />
    </div>
  )
}