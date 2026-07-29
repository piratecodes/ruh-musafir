import { useState, useEffect, Fragment } from 'react'
import { Search, Loader2, ChevronDown, Filter, X } from 'lucide-react'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'

import useDocumentMeta from '@/hooks/useDocumentMeta';

import BookingsTable from '@/components/frontdesk/BookingsTable'
import GuestFolioModal from '@/components/frontdesk/GuestFolioModal'
import DatePicker from '@/components/common/DatePicker'

const toastStyle = { background: '#ffffff', color: '#112440', border: '1px solid rgba(17, 36, 64, 0.1)', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 + i); 

export default function FrontDeskPage() {
  useDocumentMeta(" Front Desk | Ruh Musafir ", "Manage arrivals, folios, and unified ledger settlements for Ruh Musafir hotel management.");

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE') 
  
  // --- DYNAMIC ADVANCED DATE FILTER LOGIC ---
  const [dateMode, setDateMode] = useState('ALL') // 'ALL', 'EXACT', 'RANGE', 'MONTH'
  const [exactDate, setExactDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth())
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isFolioOpen, setIsFolioOpen] = useState(false)

  const loadBookings = async () => {
    setIsLoading(true)
    try {
      const res = await fetchClient('/bookings')
      const data = Array.isArray(res) ? res : (res?.data || [])
      setBookings(data)
    } catch (e) {
      toast.error('Failed to load bookings', { style: toastStyle })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadBookings() }, [])

  const openFolio = (booking) => {
    setSelectedBooking(booking)
    setIsFolioOpen(true)
  }

  const closeFolio = () => {
    setIsFolioOpen(false)
    setTimeout(() => setSelectedBooking(null), 300) 
  }

  const filteredBookings = bookings.filter(b => {
    // 1. Status Filter
    const matchesStatus = statusFilter === 'ALL'
      ? true
      : statusFilter === 'ACTIVE'
        ? ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)
        : b.status === statusFilter;
        
    // 2. Search String
    const searchString = `${b.guestFirstName} ${b.guestLastName} ${b.roomName}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    
    // 3. Dynamic Date Logic
    let matchesDate = true;
    if (dateMode === 'EXACT' && exactDate) {
      matchesDate = b.checkIn <= exactDate && b.checkOut >= exactDate;
    } else if (dateMode === 'RANGE' && startDate && endDate) {
      matchesDate = b.checkOut >= startDate && b.checkIn <= endDate;
    } else if (dateMode === 'MONTH') {
      const startOfMonth = new Date(filterYear, filterMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(filterYear, filterMonth + 1, 0).toISOString().split('T')[0];
      matchesDate = b.checkOut >= startOfMonth && b.checkIn <= endOfMonth;
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-350 mx-auto pb-12 min-h-[calc(100vh-4rem)] flex flex-col">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 p-6 rounded-4xl border border-primary/5 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl lg:text-4xl text-primary font-bold tracking-tight leading-none">Front <span className="italic font-light text-foreground/60">Desk</span></h2>
          <p className="text-sm text-foreground/60 font-serif italic mt-2">Manage arrivals, folios, and unified ledger settlements.</p>
        </div>
      </div>

      {/* --- DYNAMIC ADVANCED FILTER BAR --- */}
      <div className="flex flex-col xl:flex-row gap-3 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-primary/5 shadow-sm relative z-50 shrink-0 mx-6">
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
          <input type="text" placeholder="Search guests..." className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-primary/5 focus:border-primary/20 outline-none text-[10px] uppercase font-bold tracking-widest transition-all shadow-sm text-primary" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
          <div className="hidden lg:flex items-center justify-center w-10 h-10 bg-primary/5 rounded-xl text-primary/40 shrink-0">
            <Filter size={14} />
          </div>

          {/* Date Mode Selector */}
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

          {/* Dynamic Inputs based on Date Mode */}
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

            {/* --- THE FIX: Headless UI Dropdowns for Month and Year --- */}
            {dateMode === 'MONTH' && (
              <>
                <div className="w-full sm:w-32 shrink-0">
                  <Listbox value={filterMonth} onChange={setFilterMonth}>
                    <div className="relative z-40">
                      <ListboxButton className="relative w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm cursor-pointer">
                        <span className="block truncate">{MONTHS[filterMonth]}</span>
                        <ChevronDown size={14} className="opacity-50" />
                      </ListboxButton>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions className="absolute mt-1 w-full max-h-48 overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none z-50 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
                          {MONTHS.map((m, i) => (
                            <ListboxOption key={m} value={i} className={({ active }) => `relative cursor-pointer select-none py-2.5 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                              {m}
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  </Listbox>
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
                          {YEARS.map((y) => (
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

          {/* Operational Status Filter */}
          <div className="w-full sm:w-48 z-20 shrink-0">
            <Listbox value={statusFilter} onChange={setStatusFilter}>
              <div className="relative">
                <ListboxButton className="relative w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-primary/5 hover:border-primary/20 transition-colors text-[9px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm">
                  <span className="block truncate">
                     {statusFilter === 'ACTIVE' ? 'Active Operations' : statusFilter === 'ALL' ? 'All Operations' : statusFilter.replace('_', ' ')}
                  </span>
                  <ChevronDown size={14} className="opacity-50" />
                </ListboxButton>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <ListboxOptions className="absolute right-0 mt-1 w-full sm:w-56 overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none">
                    {['ACTIVE', 'ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].map((st) => (
                      <ListboxOption key={st} value={st} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                        {st === 'ACTIVE' ? 'Active Operations' : st === 'ALL' ? 'All Operations' : st.replace('_', ' ')}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] md:min-h-0 relative z-10 flex flex-col mx-6">
        <BookingsTable 
          bookings={filteredBookings} 
          isLoading={isLoading} 
          onSelectBooking={openFolio} 
        />
      </div>

      <GuestFolioModal 
        isOpen={isFolioOpen} 
        onClose={closeFolio} 
        booking={selectedBooking} 
        onRefresh={loadBookings} 
      />

    </div>
  )
}