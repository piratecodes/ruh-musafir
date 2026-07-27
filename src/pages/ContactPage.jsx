"use client";

import { useState, useEffect, Fragment } from 'react'
import { Loader2, Search, Calendar, Mail, Phone, MessageSquare, CheckCircle, Clock, Eye, Filter, ChevronDown } from 'lucide-react'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'
import { format, parseISO } from 'date-fns';
import useDocumentMeta from '@/hooks/useDocumentMeta';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

import DatePicker from '@/components/common/DatePicker' 

const toastStyle = { background: '#ffffff', color: '#112440', border: '1px solid rgba(17, 36, 64, 0.1)', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }

export default function ContactPage() {
  useDocumentMeta("Inquiries | Ruh Musafir", "Manage guest inquiries and contact requests.");

  const [inquiries, setInquiries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  
  // Filters
  const [searchName, setSearchName] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') 

  const loadInquiries = async () => {
    setIsLoading(true)
    try {
      const res = await fetchClient('/inquiries')
      setInquiries(Array.isArray(res?.data) ? res.data : [])
    } catch (error) {
      toast.error('Failed to load inquiries', { style: toastStyle })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadInquiries() }, [])

  const handleStatusChange = async (id, newStatus) => {
    try {
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq))
      await fetchClient(`/inquiries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      toast.success(`Marked as ${newStatus}`, { style: toastStyle })
      
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(prev => ({ ...prev, status: newStatus }))
      }
    } catch (error) {
      toast.error('Failed to update status', { style: toastStyle })
      loadInquiries() 
    }
  }

  // --- FILTER ENGINE (Timezone-Safe & Crash-Proof) ---
  const filteredInquiries = inquiries.filter(inq => {
    const searchLower = searchName.toLowerCase()
    
    // Safely fallback to empty strings
    const fullName = `${inq.firstName || ''} ${inq.lastName || ''}`.toLowerCase()
    const email = (inq.email || '').toLowerCase()
    const phone = (inq.phone || '').toLowerCase()
    
    const matchesName = fullName.includes(searchLower) || phone.includes(searchLower) || email.includes(searchLower)
    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter
    
    let matchesDate = true;
    if (filterDate) {
      try {
        const dateVal = filterDate?.target?.value ?? filterDate;
        let targetDateStr = '';
        
        if (typeof dateVal === 'string') {
          targetDateStr = dateVal.substring(0, 10); 
        } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
          targetDateStr = format(dateVal, 'yyyy-MM-dd'); 
        }

        if (targetDateStr && inq.createdAt) {
          const inqDateStr = format(parseISO(inq.createdAt), 'yyyy-MM-dd');
          matchesDate = inqDateStr === targetDateStr;
        }
      } catch (err) {
        console.error("Date filter processing error:", err);
      }
    }
    
    return matchesName && matchesDate && matchesStatus
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONTACTED': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      default: return 'bg-amber-50 text-amber-600 border-amber-200'
    }
  }

  // THE FIX: Removed the <Listbox.Portal> wrapper which caused the React crash.
  const StatusDropdown = ({ inquiry, align = "bottom" }) => (
    <Listbox value={inquiry.status} onChange={(val) => handleStatusChange(inquiry.id, val)}>
      <div className="relative">
        <ListboxButton className={`relative flex items-center justify-between cursor-pointer px-4 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-colors shadow-sm outline-none ${getStatusColor(inquiry.status)}`}>
          <span className="flex items-center gap-2">
            {inquiry.status === 'PENDING' ? <Clock size={12}/> : <CheckCircle size={12}/>}
            {inquiry.status}
          </span>
          <ChevronDown size={10} className="ml-2"/>
        </ListboxButton>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <ListboxOptions className={`absolute ${align === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'} right-0 w-32 bg-white p-1 shadow-2xl ring-1 ring-primary/10 rounded-xl z-[9999]`}>
            {['PENDING', 'CONTACTED', 'RESOLVED'].map((status) => (
              <ListboxOption key={status} value={status} className={({ active }) => `cursor-pointer py-2 px-3 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                {status}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-350 mx-auto pb-12">
      
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-white/40 p-8 rounded-4xl border border-primary/5 shadow-sm">
        <div>
          <h2 className="text-3xl lg:text-5xl text-primary font-bold tracking-tight leading-none">
            Guest <span className="italic font-light text-foreground/60">Inquiries</span>
          </h2>
          <p className="text-sm text-foreground/60 font-serif italic mt-2">Professional inquiry management portal.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
            <input 
              type="text" 
              placeholder="Search Name, Email, Phone..." 
              value={searchName} 
              onChange={e => setSearchName(e.target.value)} 
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-primary/10 text-xs font-bold text-primary shadow-sm outline-none uppercase tracking-widest transition-colors focus:border-primary/30" 
            />
          </div>
          
          <Menu as="div" className="relative z-50">
            <MenuButton className="px-6 py-3.5 bg-white/50 rounded-xl border border-primary/10 text-xs font-bold text-primary shadow-sm flex items-center gap-2 uppercase tracking-widest transition-colors hover:bg-white">
              {statusFilter} <ChevronDown size={14} />
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl p-1 border border-primary/5 z-[9999]">
              {['ALL', 'PENDING', 'CONTACTED', 'RESOLVED'].map(s => (
                <MenuItem key={s}><button onClick={() => setStatusFilter(s)} className="w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-secondary rounded-lg">{s}</button></MenuItem>
              ))}
            </MenuItems>
          </Menu>

          <div className="relative w-full sm:w-48">
            <DatePicker 
              value={filterDate} 
              onChange={(val) => setFilterDate(val?.target?.value ?? val)} 
              className="w-full px-4 py-3.5 bg-white rounded-xl border border-primary/10 text-xs font-bold text-primary shadow-sm uppercase tracking-widest cursor-pointer"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-widest font-bold text-red-400 hover:text-red-600 transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative z-10 flex flex-col h-[calc(100vh-18rem)]">
        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1 bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg">
          <table className="w-full text-left border-collapse min-w-250">
            <thead className="">
              <tr className="border-b border-primary/5 text-[9px] uppercase tracking-widest font-bold text-foreground/40 bg-secondary/10 sticky top-0 backdrop-blur-md z-10">
                <th className="p-5 pl-6">Date</th>
                <th className="p-5 pl-6">Name</th>
                <th className="p-5 pl-6">Email</th>
                <th className="p-5 pl-6">Contact</th>
                <th className="p-5 pl-6">Status</th>
                <th className="p-5 pl-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-xs font-bold text-primary">
              {isLoading ? <tr><td colSpan="6" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr> : 
              filteredInquiries.length === 0 ? (
                <tr><td colSpan="6" className="p-10 text-center text-[10px] uppercase font-bold tracking-widest text-primary/40">No inquiries found for your search.</td></tr>
              ) : (
                filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="text-xs text-primary font-medium hover:bg-white/50 transition-colors">
                    <td className="p-4">{format(parseISO(inq.createdAt), 'dd MMM, yy')}</td>
                    <td className="p-4 font-bold">{inq.firstName} {inq.lastName}</td>
                    <td className="p-4">{inq.email}</td>
                    <td className="p-4">{inq.phone}</td>
                    <td className="p-4 w-40"><StatusDropdown inquiry={inq} align="bottom" /></td>
                    <td className="p-4 text-right"><button onClick={() => setSelectedInquiry(inq)} className="p-2 hover:bg-primary/10 rounded-full transition-colors"><Eye size={16}/></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Transition show={!!selectedInquiry} as={Fragment}>
        <Dialog onClose={() => setSelectedInquiry(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            
            <DialogPanel className="bg-white rounded-[2rem] max-w-2xl w-full shadow-2xl overflow-hidden transform transition-all">
              
              <div className="bg-primary px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-2xl font-serif text-white mb-1">
                    {selectedInquiry?.firstName} {selectedInquiry?.lastName}
                  </DialogTitle>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={12} /> Received: {selectedInquiry ? format(parseISO(selectedInquiry.createdAt), 'dd MMM yyyy, hh:mm a') : ''}
                  </p>
                </div>
                <StatusDropdown inquiry={selectedInquiry || {}} align="bottom" />
              </div>

              <div className="p-8 space-y-6">
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-secondary/30 p-5 rounded-2xl border border-primary/5 flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-primary/40"><Mail size={14} /><span className="text-[9px] uppercase font-bold tracking-widest">Email Address</span></span>
                    <a href={`mailto:${selectedInquiry?.email}`} className="text-sm font-bold text-primary hover:text-accent transition-colors">{selectedInquiry?.email}</a>
                  </div>
                  <div className="flex-1 bg-secondary/30 p-5 rounded-2xl border border-primary/5 flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5 text-primary/40"><Phone size={14} /><span className="text-[9px] uppercase font-bold tracking-widest">Phone Number</span></span>
                    <a href={`tel:${selectedInquiry?.phone}`} className="text-sm font-bold text-primary hover:text-accent transition-colors">{selectedInquiry?.phone || 'N/A'}</a>
                  </div>
                </div>

                <div>
                  <span className="flex items-center gap-1.5 text-primary/40 mb-3 ml-2"><MessageSquare size={14} /><span className="text-[9px] uppercase font-bold tracking-widest">Guest Message</span></span>
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-sm text-primary/80 leading-relaxed font-serif italic shadow-inner">
                    "{selectedInquiry?.message}"
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-gray-50 border-t border-primary/5 flex items-center justify-end gap-4">
                <button onClick={() => setSelectedInquiry(null)} className="px-6 py-2.5 bg-white border border-primary/10 text-primary hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
                  Close Window
                </button>
                {selectedInquiry?.status !== 'RESOLVED' && (
                  <button onClick={() => handleStatusChange(selectedInquiry.id, 'RESOLVED')} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2">
                    <CheckCircle size={14} /> Mark Resolved
                  </button>
                )}
              </div>
            </DialogPanel>
            
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}