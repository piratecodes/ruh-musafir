import { Fragment, useState, useEffect } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { X, User, ChevronDown, CheckSquare, Square, Trash2, Clock, Download, Mail, Loader2, Receipt, CheckCircle2, LogIn, LogOut, CreditCard, MessageSquare, MessageCircle, FileText, Lock, PlusCircle, AlertCircle, BriefcaseBusiness } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'

import DatePicker from '@/components/common/DatePicker'

const toastStyle = { background: '#ffffff', color: '#112440', border: '1px solid rgba(17, 36, 64, 0.1)', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }

export default function BookingModal({ isOpen, mode = 'EDIT', onClose, selectedSlot, existingBooking, onSave, onDelete, onRefresh, availableExperiences = [], rooms = [] }) {
  const [formData, setFormData] = useState({
    id: null, guestFirstName: '', guestLastName: '', guestEmail: '', guestPhone: '', specialNotes: '',
    roomId: '', bedId: '', checkIn: '', checkOut: '',
    adults: 1, children: 0,
    experiences: [], 
    paymentStatus: 'PENDING', paymentMode: 'CASH', 
    baseRoomTotal: 0, amountPaid: 0,
    holdDuration: 'NO_HOLD',
    status: 'PENDING',
    // --- THE FIX: NEW MANAGER FEATURES ---
    bookingSource: 'DIRECT', otaRef: '', internalNotes: ''
  })

  const [detailedLedger, setDetailedLedger] = useState(null)
  const [isLoadingLedger, setIsLoadingLedger] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isEmailingPdf, setIsEmailingPdf] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null)

  const [chargeReason, setChargeReason] = useState('')
  const [chargeAmount, setChargeAmount] = useState('')
  const [isAddingCharge, setIsAddingCharge] = useState(false)

  useEffect(() => {
    if (!isOpen) return;

    if (existingBooking) {
      setFormData({ 
        ...existingBooking, 
        holdDuration: 'NO_HOLD',
        bookingSource: existingBooking.bookingSource || 'DIRECT',
        otaRef: existingBooking.otaRef || '',
        internalNotes: existingBooking.internalNotes || ''
      })
      fetchDetailedLedger(existingBooking.id)
    } else {
      setDetailedLedger(null) 
      let initialCheckIn = '';
      let initialCheckOut = '';
      let initialRoomId = '';
      let initialBedId = '';
      let initialBasePrice = 0;

      if (selectedSlot) {
        const nextDay = new Date(selectedSlot.date)
        nextDay.setDate(nextDay.getDate() + 1)
        initialCheckIn = selectedSlot.date;
        initialCheckOut = nextDay.toISOString().split('T')[0];
        initialRoomId = selectedSlot.room.id;
        initialBedId = selectedSlot.bed?.id || '';
        initialBasePrice = selectedSlot.room.basePrice;
      } else {
        const today = new Date();
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        initialCheckIn = today.toISOString().split('T')[0];
        initialCheckOut = tmrw.toISOString().split('T')[0];
        
        if (rooms && rooms.length > 0) {
          initialRoomId = rooms[0].id;
          initialBasePrice = rooms[0].basePrice;
        }
      }

      setFormData({
        id: null, guestFirstName: '', guestLastName: '', guestEmail: '', guestPhone: '', specialNotes: '',
        roomId: initialRoomId, bedId: initialBedId, checkIn: initialCheckIn, checkOut: initialCheckOut,
        adults: 1, children: 0, experiences: [],
        paymentStatus: 'PENDING', paymentMode: 'CASH',
        baseRoomTotal: initialBasePrice, amountPaid: 0,
        holdDuration: 'NO_HOLD',
        status: 'PENDING',
        bookingSource: 'DIRECT', otaRef: '', internalNotes: ''
      })
    }
  }, [selectedSlot, existingBooking, isOpen, rooms])

  const fetchDetailedLedger = async (bookingId) => {
    setIsLoadingLedger(true)
    try {
      const res = await fetchClient(`/bookings/${bookingId}/ledger`)
      if (res?.data) setDetailedLedger(res.data)
    } catch (e) {
      // Fail silently
    } finally {
      setIsLoadingLedger(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setIsProcessingAction(true)
    try {
      await fetchClient(`/bookings/${existingBooking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      toast.success(`Guest marked as ${newStatus.replace('_', ' ')}`, { style: toastStyle })
      setFormData(prev => ({ ...prev, status: newStatus }))
      fetchDetailedLedger(existingBooking.id)
      if (onRefresh) onRefresh() 
    } catch (e) {
      toast.error(e.message || 'Failed to update status', { style: toastStyle })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleSettleDue = async () => {
    if (!window.confirm(`Collect ₹${detailedLedger?.grandTotalDue} via ${formData.paymentMode}?`)) return;
    setIsProcessingAction(true)
    try {
      await fetchClient(`/bookings/${existingBooking.id}/settle`, { 
        method: 'POST',
        body: JSON.stringify({ method: formData.paymentMode }) 
      })
      toast.success('Payment Collected Successfully!', { style: toastStyle })
      fetchDetailedLedger(existingBooking.id)
      if (onRefresh) onRefresh()
    } catch (e) {
      toast.error('Settlement Failed', { style: toastStyle })
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleAddCustomCharge = async () => {
    if (isClosed) return toast.error('Folio is closed and audited.');
    if (!chargeReason || !chargeAmount || Number(chargeAmount) <= 0) {
      return toast.error('Please enter a valid reason and amount.', { style: toastStyle });
    }
    setIsAddingCharge(true);
    try {
      await fetchClient(`/bookings/${existingBooking.id}/adjustments`, {
        method: 'POST',
        body: JSON.stringify({ reason: chargeReason, amount: Number(chargeAmount) })
      });
      toast.success('Custom charge added to folio.', { style: toastStyle });
      setChargeReason(''); setChargeAmount('');
      fetchDetailedLedger(existingBooking.id); 
      if (onRefresh) onRefresh();  
    } catch (e) {
      toast.error('Failed to add charge.', { style: toastStyle });
    } finally {
      setIsAddingCharge(false);
    }
  }

  const handlePreviewPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetchClient(`/bookings/${existingBooking.id}/download-receipt`);
      const byteCharacters = atob(res.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url); 
    } catch (e) {
      toast.error("Failed to generate PDF Preview.", { style: toastStyle });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewPdfUrl) return;
    const downloadLink = document.createElement("a");
    downloadLink.href = previewPdfUrl;
    downloadLink.download = `Invoice_${existingBooking.id.slice(-6).toUpperCase()}.pdf`;
    downloadLink.click();
    toast.success("Invoice Downloaded!", { style: toastStyle });
  };

  const handleResendEmail = async () => {
    setIsEmailingPdf(true);
    try {
      await fetchClient(`/bookings/${existingBooking.id}/email-receipt`, { method: 'POST' });
      toast.success("Email sent instantly!", { style: toastStyle });
    } catch (e) {
      toast.error(e.message || "Failed to send email.", { style: toastStyle });
    } finally {
      setIsEmailingPdf(false);
    }
  };

  const handleFutureComms = (platform) => {
    toast(`API Config required to enable ${platform}.`, { icon: '🚧', style: toastStyle })
  }

  const handleRoomChange = (roomId) => {
    const r = rooms.find(x => x.id === roomId)
    setFormData(prev => ({ ...prev, roomId, bedId: '', baseRoomTotal: r ? r.basePrice : 0 }))
  }

  const selectedRoomObj = rooms.find(r => r.id === formData.roomId)
  const getDays = (inDate, outDate) => {
    if (!inDate || !outDate) return 1;
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }

  const nights = getDays(formData.checkIn, formData.checkOut);
  const roomDailyPrice = selectedRoomObj?.basePrice || 0;
  const baseRoomTotal = nights * roomDailyPrice;
  const totalGuests = parseInt(formData.adults || 0) + parseInt(formData.children || 0)
  const safeAvailableExperiences = Array.isArray(availableExperiences) ? availableExperiences : []

  const experiencesTotal = formData.experiences.reduce((sum, expId) => {
    const exp = safeAvailableExperiences.find(e => e.id === expId)
    return sum + (exp ? exp.price * totalGuests : 0)
  }, 0)

  const grandTotal = parseInt(baseRoomTotal || 0) + experiencesTotal

  let amountDue = grandTotal
  let displayPaid = formData.amountPaid

  if (formData.paymentStatus === 'PAID') {
    amountDue = 0
    displayPaid = grandTotal
  } else if (formData.paymentStatus === 'PENDING') {
    amountDue = grandTotal
    displayPaid = 0
  } else if (formData.paymentStatus === 'PARTIAL') {
    amountDue = Math.max(0, grandTotal - formData.amountPaid)
    displayPaid = formData.amountPaid
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    let holdExpiresAt = null;
    const now = new Date();

    if (formData.holdDuration === '15_MINS') {
      holdExpiresAt = new Date(now.getTime() + 15 * 60000).toISOString();
    } else if (formData.holdDuration === 'EOD') {
      const eod = new Date();
      eod.setHours(23, 59, 59, 999);
      holdExpiresAt = eod.toISOString();
    } else if (formData.holdDuration === '24_HOURS') {
      holdExpiresAt = new Date(now.getTime() + 24 * 60 * 60000).toISOString();
    } else if (formData.holdDuration === '48_HOURS') {
      holdExpiresAt = new Date(now.getTime() + 48 * 60 * 60000).toISOString();
    } else if (formData.holdDuration === 'NO_HOLD') {
      holdExpiresAt = 'NO_HOLD'; 
    }

    onSave({ 
      ...formData, 
      totalAmount: grandTotal, 
      amountPaid: displayPaid, 
      dueAmount: amountDue,
      holdExpiresAt 
    })
  }

  const toggleExperience = (expId) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.includes(expId) 
        ? prev.experiences.filter(id => id !== expId)
        : [...prev.experiences, expId]
    }))
  }

  const getStatusTheme = (status) => {
    if (status === 'PAID') return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    if (status === 'PARTIAL') return 'bg-blue-50 text-blue-600 border-blue-200'
    return 'bg-amber-50 text-amber-600 border-amber-200'
  }

  const getBookingStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'CHECKED_IN': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'CHECKED_OUT': return 'bg-gray-200 text-gray-700 border-gray-300'
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const isClosed = formData.status === 'CHECKED_OUT' || formData.status === 'CANCELLED';

  const renderDetailedLedger = () => (
    <>
      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary border-b border-primary/10 pb-2 flex items-center justify-between mb-4">
        <span className="flex items-center gap-2"><Receipt size={14}/> Statement of Account</span>
      </h4>
      
      {isLoadingLedger ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
      ) : detailedLedger ? (
        <div className="space-y-5">
          
          <div className="flex justify-between text-[10px] font-bold text-foreground/60 border-b border-primary/5 pb-3">
            <div>
              <p className="uppercase tracking-widest text-primary/40 text-[8px] mb-0.5">Check In</p>
              <p>{new Date(formData.checkIn).toLocaleDateString('en-GB')} • 12:00 PM</p>
            </div>
            <div className="text-right">
              <p className="uppercase tracking-widest text-primary/40 text-[8px] mb-0.5">Check Out</p>
              <p>{new Date(formData.checkOut).toLocaleDateString('en-GB')} • 11:00 AM</p>
            </div>
          </div>

          <div className="py-2 border-b border-primary/5 flex justify-between items-center">
            <span className="text-[9px] uppercase tracking-widest text-primary/40">Mode of Payment</span>
            <span className="text-[10px] font-bold text-primary">{formData.paymentMode || 'N/A'}</span>
          </div>

          <div className="space-y-3 border-b border-primary/5 pb-4">
            
            <div className="space-y-1">
               <div className="flex justify-between text-xs font-bold text-primary">
                   <span>Accommodation</span>
                   <span>₹{detailedLedger.roomTotal}</span>
               </div>
               <div className="flex justify-between text-[10px] text-foreground/50">
                   <span>{nights} Nights @ ₹{detailedLedger.roomDailyRate?.toFixed(2)}</span>
               </div>
            </div>
            
            {detailedLedger.experiences?.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-primary/5">
                 <span className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Experiences</span>
                 {detailedLedger.experiences.map(exp => (
                     <div key={exp.id} className="flex justify-between text-[11px] text-foreground/70 mt-0.5">
                         <span>{formData.adults}x {exp.name} (@ ₹{exp.price})</span>
                         <span className="font-medium">₹{exp.price * formData.adults}</span>
                     </div>
                 ))}
              </div>
            )}

            {/* THE FIX: ADDED SUBTOTAL TO CAFE ITEMS */}
            {detailedLedger.allCafeOrders?.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-primary/5">
                <span className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Cafe & Dining</span>
                {detailedLedger.allCafeOrders.map(order => 
                   order.items.map(item => (
                     <div key={item.id} className="flex justify-between text-[11px] text-foreground/70 mt-0.5">
                       <span>{item.quantity}x {item.menuItem?.name || 'Item'} (Tkt #{order.id.slice(-6).toUpperCase()})</span>
                       <span className="font-medium">₹{item.unitPrice * item.quantity}</span>
                     </div>
                   ))
                )}
                <div className="flex justify-between items-center text-[10px] font-bold text-primary border-t border-dashed border-primary/10 pt-1.5 mt-2">
                  <span>Cafe Subtotal</span>
                  <span>₹{detailedLedger.historicalCafeTotal}</span>
                </div>
              </div>
            )}

            {/* THE FIX: ADDED SUBTOTAL TO INCIDENTALS */}
            {detailedLedger.allAdjustments?.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-primary/5">
                <span className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Adjustments</span>
                {detailedLedger.allAdjustments.map(adj => (
                  <div key={adj.id} className="flex justify-between text-[11px] text-amber-700 mt-0.5">
                    <span>1x {adj.reason}</span>
                    <span className="font-medium">₹{adj.amount}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-[10px] font-bold text-amber-700 border-t border-dashed border-amber-200 pt-1.5 mt-2">
                  <span>Adjustments Subtotal</span>
                  <span>₹{detailedLedger.historicalAdjTotal}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-foreground/50">
              <span>Total Cost</span>
              <span>₹{detailedLedger.grandTotalHistory}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-emerald-600">
              <span>Total Paid</span>
              <span>- ₹{detailedLedger.grandTotalHistory - detailedLedger.grandTotalDue}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-primary/20 pt-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#a08875]">Balance Due</span>
              <span className="text-xl font-black text-[#4c554c]">₹{detailedLedger.grandTotalDue}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-foreground/40 italic text-center py-2">No ledger data available.</p>
      )}
    </>
  )

  const renderPrintPreviewIframe = () => (
    <Transition show={!!previewPdfUrl} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={() => setPreviewPdfUrl(null)}>
        <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
           <div className="flex min-h-full items-center justify-center p-4">
              <DialogPanel className="w-full max-w-4xl h-[85vh] bg-[#525659] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                 <div className="bg-[#323639] px-4 py-3 flex items-center justify-between shrink-0">
                    <DialogTitle className="text-white text-sm font-bold tracking-widest uppercase">Print Preview: Invoice</DialogTitle>
                    <div className="flex items-center gap-4">
                       <button onClick={handleDownloadFromPreview} className="text-white hover:text-accent flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Download size={14}/> Download File</button>
                       <button onClick={() => setPreviewPdfUrl(null)} className="text-white/50 hover:text-white"><X size={20}/></button>
                    </div>
                 </div>
                 <iframe src={previewPdfUrl} className="w-full flex-1 bg-white border-none" title="PDF Preview" />
              </DialogPanel>
           </div>
        </div>
      </Dialog>
    </Transition>
  )

  if (mode === 'VIEW' && existingBooking) {
    return (
      <>
        <Transition show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-[100]" onClose={onClose}>
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm" />
            </TransitionChild>
            <div className="fixed inset-0 flex justify-end">
              <TransitionChild as={Fragment} enter="transform transition ease-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in duration-200" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                <DialogPanel className="w-full max-w-md h-full bg-[#f8f5f2] shadow-2xl flex flex-col">
                  
                  <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-primary/5 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-primary"><User size={20}/></div>
                      <div>
                        <DialogTitle className="text-lg font-bold text-primary leading-tight">{formData.guestFirstName} {formData.guestLastName}</DialogTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                           <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold">{selectedRoomObj?.name}</p>
                           <span className={`px-1.5 py-0.5 rounded border text-[7px] uppercase tracking-widest font-bold ${getBookingStatusBadge(formData.status)}`}>
                             {formData.status.replace('_', ' ')}
                           </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 p-6 space-y-6">
                    
                    {isClosed && (
                      <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm flex flex-col gap-4">
                        <div className="flex gap-3 text-primary/60">
                          <Lock size={20} className="shrink-0"/>
                          <p className="text-[10px] font-bold leading-relaxed">This folio has been audited and permanently closed. No further financial changes can be made.</p>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t border-primary/5">
                           <button onClick={handlePreviewPdf} disabled={isDownloadingPdf || isEmailingPdf} className="flex-1 py-2.5 bg-gray-50 rounded-xl text-primary text-[10px] uppercase font-bold tracking-widest border border-primary/10 shadow-sm hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
                             {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14}/>} View Bill
                           </button>
                           <button onClick={handleResendEmail} disabled={isDownloadingPdf || isEmailingPdf} className="flex-1 py-2.5 bg-gray-50 rounded-xl text-primary text-[10px] uppercase font-bold tracking-widest border border-primary/10 shadow-sm hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
                             {isEmailingPdf ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14}/>} Email
                           </button>
                        </div>
                      </div>
                    )}

                    {!isClosed && (
                      <div className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm space-y-3">
                        <h4 className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mb-2">Guest Actions</h4>
                        
                        {formData.status === 'PENDING' && (
                          <button onClick={() => handleStatusChange('CONFIRMED')} disabled={isProcessingAction} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"><CheckCircle2 size={16}/> Confirm Booking</button>
                        )}
                        {formData.status === 'CONFIRMED' && (
                          <button onClick={() => handleStatusChange('CHECKED_IN')} disabled={isProcessingAction} className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors flex justify-center items-center gap-2"><LogIn size={16}/> Check-In Guest</button>
                        )}
                        {formData.status === 'CHECKED_IN' && (
                          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 flex gap-3">
                            <AlertCircle size={20} className="shrink-0"/>
                            <p className="text-[10px] font-bold leading-relaxed">Guest is in-house. To check them out, settle the ledger below.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm">
                       {renderDetailedLedger()}
                    </div>

                    {!isClosed && formData.status === 'CHECKED_IN' && detailedLedger && detailedLedger.grandTotalDue >= 0 && (
                      <div className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm space-y-4">
                        <h4 className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center gap-2"><PlusCircle size={14}/> Add Incidental Charge</h4>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="e.g. Damages..." 
                            value={chargeReason} 
                            onChange={e => setChargeReason(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs font-bold text-primary bg-gray-50 border border-primary/10 rounded-xl outline-none focus:border-primary/30 transition-all"
                          />
                          <input 
                            type="number" 
                            placeholder="₹0" 
                            value={chargeAmount} 
                            onChange={e => setChargeAmount(e.target.value)}
                            className="w-20 px-3 py-2 text-xs font-bold text-primary bg-gray-50 border border-primary/10 rounded-xl outline-none focus:border-primary/30 transition-all"
                          />
                        </div>
                        <button 
                          onClick={handleAddCustomCharge} 
                          disabled={isAddingCharge}
                          className="w-full py-2.5 bg-secondary text-primary rounded-xl font-bold text-[9px] uppercase tracking-widest border border-primary/5 hover:bg-primary hover:text-white transition-colors flex justify-center items-center gap-2"
                        >
                          {isAddingCharge ? <Loader2 size={14} className="animate-spin" /> : 'Apply Charge'}
                        </button>
                      </div>
                    )}
                  </div>

                  {!isClosed && formData.status === 'CHECKED_IN' && detailedLedger && (
                    <div className="bg-white p-6 border-t border-primary/5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0 z-10 flex flex-col gap-3">
                      {detailedLedger.grandTotalDue > 0 ? (
                        <>
                          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-primary/5 relative">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Mode of Payment</span>
                            <Listbox value={formData.paymentMode} onChange={val => setFormData({...formData, paymentMode: val})}>
                              {({ open }) => (
                                <div className="relative">
                                  <ListboxButton className={`flex items-center justify-between gap-3 bg-white border outline-none rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-primary shadow-sm transition-all w-36 ${open ? 'border-primary/30 ring-2 ring-primary/5' : 'border-primary/10 hover:border-primary/20'}`}>
                                    <span className="truncate">{formData.paymentMode === 'UPI' ? 'UPI / CARDS' : 'CASH'}</span>
                                    <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                                  </ListboxButton>
                                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <ListboxOptions className="absolute z-50 bottom-full mb-2 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl border border-primary/10 focus:outline-none">
                                      {[ { label: 'CASH', value: 'CASH' }, { label: 'UPI / CARDS', value: 'UPI' } ].map((option) => (
                                        <ListboxOption
                                          key={option.value}
                                          value={option.value}
                                          className={({ active }) => `relative cursor-pointer select-none py-2.5 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-between ${active ? 'bg-secondary/50 text-primary' : 'text-foreground/70 hover:bg-gray-50'}`}
                                        >
                                          {({ selected }) => (
                                            <>
                                              <span className={selected ? 'text-primary' : ''}>{option.label}</span>
                                              {selected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                            </>
                                          )}
                                        </ListboxOption>
                                      ))}
                                    </ListboxOptions>
                                  </Transition>
                                </div>
                              )}
                            </Listbox>
                          </div>
                          <button 
                            onClick={handleSettleDue} 
                            disabled={isProcessingAction}
                            className="w-full py-4 bg-[#ecfdf3] text-[#00c885] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm flex justify-center items-center gap-2 transition-colors"
                          >
                            <CreditCard size={16}/> Settle ₹{detailedLedger.grandTotalDue} Now
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleStatusChange('CHECKED_OUT')} 
                          disabled={isProcessingAction}
                          className="w-full py-4 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg flex justify-center items-center gap-2 hover:bg-primary-hover transition-colors"
                        >
                          <LogOut size={16}/> Complete Check-Out & Generate Bill
                        </button>
                      )}
                    </div>
                  )}

                </DialogPanel>
              </TransitionChild>
            </div>
          </Dialog>
        </Transition>
        {renderPrintPreviewIframe()}
      </>
    )
  }

  // --- EDIT MODE (Massive 2-column layout) ---
  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={onClose}>
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-hidden">
            <div className="flex h-full items-center justify-center p-4 sm:p-6 text-center">
              <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                
                <DialogPanel className="w-full max-w-6xl h-[95vh] transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 flex flex-col">
                  
                  {/* HEADER */}
                  <div className="bg-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-b-primary/5">
                    <DialogTitle className="text-base font-bold tracking-tight flex items-center gap-3 text-primary uppercase">
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-primary shrink-0">
                        <User size={16} />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span>{existingBooking ? 'Admin Master Booking View' : 'New Walk-In Booking'}</span>
                        {existingBooking && (
                          <span className={`px-2 py-0.5 rounded border text-[9px] uppercase tracking-widest font-bold ${getBookingStatusBadge(formData.status)}`}>
                            {formData.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </DialogTitle>
                    <button onClick={onClose} className="text-foreground/40 hover:text-primary transition-colors p-1.5 bg-secondary/20 hover:bg-secondary rounded-full shrink-0"><X size={16} /></button>
                  </div>

                  <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
                    
                    {/* LEFT COLUMN: SCROLLABLE FORMS */}
                    <div className="flex-1 lg:overflow-y-auto overflow-visible scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 p-6 sm:p-8 bg-gray-50/50">
                      <form id="booking-form" onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto lg:mx-0">
                        
                        <div className={`bg-white p-6 rounded-2xl border shadow-sm space-y-5 ${isClosed ? 'opacity-70 pointer-events-none border-gray-200' : 'border-primary/5'}`}>
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2">01. Accommodation</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Room / Suite Allocation</label>
                                <Listbox value={formData.roomId} onChange={handleRoomChange}>
                                  <div className="relative z-60">
                                    <ListboxButton className="relative w-full flex items-center justify-between cursor-pointer px-4 py-3.5 rounded-xl border border-primary/10 bg-gray-50 text-primary hover:border-primary text-xs font-bold uppercase tracking-widest transition-colors outline-none shadow-sm">
                                      <span className="block truncate">{selectedRoomObj ? selectedRoomObj.name : 'Select Room'}</span>
                                      <ChevronDown size={14} className="opacity-50" />
                                    </ListboxButton>
                                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                      <ListboxOptions className="absolute mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                                        {rooms.map((r) => (
                                          <ListboxOption key={r.id} value={r.id} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                                            {r.name}
                                          </ListboxOption>
                                        ))}
                                      </ListboxOptions>
                                    </Transition>
                                  </div>
                                </Listbox>
                              </div>

                              {selectedRoomObj?.type === 'DORM' && (
                                <div>
                                  <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Select Bed</label>
                                  <Listbox value={formData.bedId} onChange={(val) => setFormData({...formData, bedId: val})}>
                                    <div className="relative z-50">
                                      <ListboxButton className="relative w-full flex items-center justify-between cursor-pointer px-4 py-3.5 rounded-xl border border-primary/10 bg-gray-50 text-primary hover:border-primary text-xs font-bold uppercase tracking-widest transition-colors outline-none shadow-sm">
                                        <span className="block truncate">{selectedRoomObj.beds?.find(b => b.id === formData.bedId)?.name || 'Assign Bed'}</span>
                                        <ChevronDown size={14} className="opacity-50" />
                                      </ListboxButton>
                                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                        <ListboxOptions className="absolute mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                                          {selectedRoomObj.beds?.map((b) => (
                                            <ListboxOption key={b.id} value={b.id} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                                              {b.name}
                                            </ListboxOption>
                                          ))}
                                        </ListboxOptions>
                                      </Transition>
                                    </div>
                                  </Listbox>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Check In</label>
                                <DatePicker 
                                    value={formData.checkIn} 
                                    onChange={(val) => setFormData({...formData, checkIn: val})} 
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-white border border-primary/10 hover:border-primary focus:border-primary outline-none transition-all cursor-pointer"
                                />
                                </div>
                                <div>
                                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Check Out</label>
                                <DatePicker 
                                    value={formData.checkOut} 
                                    onChange={(val) => setFormData({...formData, checkOut: val})} 
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-white border border-primary/10 hover:border-primary focus:border-primary outline-none transition-all cursor-pointer"
                                />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Adults Count</label>
                                <input type="number" min="1" required value={formData.adults} onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary focus:bg-white outline-none text-xs font-bold text-primary transition-all shadow-sm" />
                                </div>
                                <div>
                                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Children Count</label>
                                <input type="number" min="0" required value={formData.children} onChange={(e) => setFormData({...formData, children: parseInt(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary focus:bg-white outline-none text-xs font-bold text-primary transition-all shadow-sm" />
                                </div>
                            </div>
                        </div>

                        <div className={`bg-white p-6 rounded-2xl border shadow-sm space-y-5 ${isClosed ? 'opacity-70 pointer-events-none border-gray-200' : 'border-primary/5'}`}>
                          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2">02. Guest Identity</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">First Name</label>
                              <input type="text" required value={formData.guestFirstName} onChange={(e) => setFormData({...formData, guestFirstName: e.target.value})} placeholder="John" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold text-primary shadow-sm" />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Last Name</label>
                              <input type="text" required value={formData.guestLastName} onChange={(e) => setFormData({...formData, guestLastName: e.target.value})} placeholder="Doe" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold text-primary shadow-sm" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Contact Email</label>
                              <input type="email" value={formData.guestEmail} onChange={(e) => setFormData({...formData, guestEmail: e.target.value})} placeholder="john@example.com" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold text-primary shadow-sm" />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Phone Number</label>
                              <input type="text" required value={formData.guestPhone} onChange={(e) => setFormData({...formData, guestPhone: e.target.value})} placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold text-primary shadow-sm" />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Special Notes / Requests</label>
                            <textarea rows="2" value={formData.specialNotes} onChange={(e) => setFormData({...formData, specialNotes: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-xs font-bold text-primary shadow-sm" placeholder="Late check-in, dietary restrictions..." />
                          </div>
                        </div>

                        <div className={`bg-white p-6 rounded-2xl border shadow-sm space-y-4 ${isClosed ? 'opacity-70 pointer-events-none border-gray-200' : 'border-primary/5'}`}>
                          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2">03. Experiences</h4>
                          
                          {safeAvailableExperiences.length === 0 ? (
                            <p className="text-xs font-medium text-foreground/40 italic py-2">No active experiences available in inventory.</p>
                          ) : (
                            <div className="space-y-3">
                              {safeAvailableExperiences.map((exp) => {
                                const isSelected = formData.experiences.includes(exp.id)
                                return (
                                  <div 
                                    key={exp.id} 
                                    onClick={() => toggleExperience(exp.id)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-accent bg-accent/5' : 'border-primary/5 hover:border-primary/20'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {isSelected ? <CheckSquare className="text-accent" size={18} /> : <Square className="text-foreground/30" size={18} />}
                                      <div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-accent' : 'text-primary'}`}>{exp.name}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-foreground/50 mt-0.5">{exp.timePeriod}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-primary">₹{exp.price}</p>
                                      <p className="text-[8px] uppercase tracking-widest text-foreground/40">Per Person</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* --- THE FIX: NEW INTERNAL MANAGER SETTINGS --- */}
                        <div className={`bg-white p-6 rounded-2xl border shadow-sm space-y-5 ${isClosed ? 'opacity-70 pointer-events-none border-gray-200' : 'border-blue-100 bg-blue-50/10'}`}>
                          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 border-b border-blue-100 pb-2 flex items-center gap-2">
                             <BriefcaseBusiness size={14}/> 04. Manager & OTA Settings (Internal)
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-blue-700/60 font-bold mb-1.5 ml-1">Booking Source / OTA</label>
                              <Listbox value={formData.bookingSource} onChange={(val) => setFormData({...formData, bookingSource: val})}>
                                <div className="relative">
                                  <ListboxButton className="relative w-full flex items-center justify-between cursor-pointer px-4 py-3.5 rounded-xl border border-blue-200 bg-white text-blue-700 hover:border-blue-300 text-xs font-bold uppercase tracking-widest transition-colors outline-none shadow-sm">
                                    <span className="block truncate">{formData.bookingSource}</span>
                                    <ChevronDown size={14} className="opacity-50" />
                                  </ListboxButton>
                                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-blue-200 focus:outline-none">
                                      {['DIRECT', 'BOOKING.COM', 'MAKEMYTRIP', 'AGODA', 'AIRBNB'].map((source) => (
                                        <ListboxOption key={source} value={source} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-foreground/70'}`}>
                                          {source}
                                        </ListboxOption>
                                      ))}
                                    </ListboxOptions>
                                  </Transition>
                                </div>
                              </Listbox>
                            </div>
                            
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-blue-700/60 font-bold mb-1.5 ml-1">OTA Reference ID</label>
                              <input 
                                type="text" 
                                value={formData.otaRef} 
                                onChange={(e) => setFormData({...formData, otaRef: e.target.value})} 
                                placeholder="e.g. MMT-123456" 
                                className="w-full px-4 py-3.5 rounded-xl bg-white border border-blue-200 focus:border-blue-400 outline-none transition-all text-xs font-bold text-blue-700 shadow-sm" 
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-blue-700/60 font-bold mb-1.5 ml-1">Internal Management Notes</label>
                            <textarea 
                              rows="2" 
                              value={formData.internalNotes} 
                              onChange={(e) => setFormData({...formData, internalNotes: e.target.value})} 
                              className="w-full px-4 py-3.5 rounded-xl bg-white border border-blue-200 focus:border-blue-400 outline-none transition-all text-xs font-bold text-blue-700 shadow-sm placeholder:text-blue-300" 
                              placeholder="Private notes (e.g. Approved 10% discount due to AC failure)..." 
                            />
                            <p className="text-[8px] text-blue-400/80 uppercase tracking-widest font-bold mt-1 ml-1">This will never print on the guest invoice.</p>
                          </div>
                        </div>

                        <div className={`bg-white p-6 rounded-2xl border shadow-sm space-y-5 ${isClosed ? 'opacity-70 pointer-events-none border-gray-200' : 'border-primary/5'}`}>
                          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2 flex justify-between">
                            <span>05. Ledger Settlement</span>
                            <span className="text-primary tracking-normal">Grand Total: <span className="text-sm">₹{grandTotal}</span></span>
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Payment Status</label>
                              <Listbox value={formData.paymentStatus} onChange={(val) => setFormData({...formData, paymentStatus: val})}>
                                <div className="relative">
                                  <ListboxButton className={`relative w-full flex items-center justify-between cursor-pointer px-4 py-3.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-colors ${getStatusTheme(formData.paymentStatus)}`}>
                                    <span className="block truncate">{formData.paymentStatus}</span>
                                    <ChevronDown size={14} className="opacity-50" />
                                  </ListboxButton>
                                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                                      {['PENDING', 'PARTIAL', 'PAID'].map((status) => (
                                        <ListboxOption key={status} value={status} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                                          {status}
                                        </ListboxOption>
                                      ))}
                                    </ListboxOptions>
                                  </Transition>
                                </div>
                              </Listbox>
                            </div>
                            
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Mode of Settlement</label>
                              <Listbox value={formData.paymentMode} onChange={(val) => setFormData({...formData, paymentMode: val})}>
                                <div className="relative">
                                  <ListboxButton className="relative w-full flex items-center justify-between cursor-pointer px-4 py-3.5 rounded-xl border border-primary/10 bg-gray-50 text-primary focus:border-primary text-xs font-bold uppercase tracking-widest transition-colors outline-none shadow-sm">
                                    <span className="block truncate">{formData.paymentMode}</span>
                                    <ChevronDown size={14} className="opacity-50" />
                                  </ListboxButton>
                                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                                      {['CASH', 'UPI', 'CARD', 'NETBANKING'].map((mode) => (
                                        <ListboxOption key={mode} value={mode} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                                          {mode}
                                        </ListboxOption>
                                      ))}
                                    </ListboxOptions>
                                  </Transition>
                                </div>
                              </Listbox>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-widest text-amber-600 font-bold mb-1.5 ml-1 flex items-center gap-1"><Clock size={10}/> Room Hold Expiry</label>
                              <Listbox value={formData.holdDuration} onChange={(val) => setFormData({...formData, holdDuration: val})}>
                                <div className="relative">
                                  <ListboxButton className="relative w-full flex items-center justify-between cursor-pointer px-4 py-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 text-xs font-bold uppercase tracking-widest transition-colors outline-none shadow-sm">
                                    <span className="block truncate">
                                      {formData.holdDuration === 'NO_HOLD' && 'No Hold (Instant Confirm)'}
                                      {formData.holdDuration === '15_MINS' && '15 Minutes'}
                                      {formData.holdDuration === 'EOD' && 'End of Day'}
                                      {formData.holdDuration === '24_HOURS' && '24 Hours'}
                                      {formData.holdDuration === '48_HOURS' && '48 Hours'}
                                    </span>
                                    <ChevronDown size={14} className="opacity-50" />
                                  </ListboxButton>
                                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-amber-200 focus:outline-none">
                                      {[
                                        { val: 'NO_HOLD', label: 'No Hold (Instant Confirm)' },
                                        { val: '15_MINS', label: '15 Minutes' },
                                        { val: 'EOD', label: 'End of Day (11:59 PM)' },
                                        { val: '24_HOURS', label: '24 Hours' },
                                        { val: '48_HOURS', label: '48 Hours' }
                                      ].map((mode) => (
                                        <ListboxOption key={mode.val} value={mode.val} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-colors ${active ? 'bg-amber-100 text-amber-800' : 'text-foreground/70'}`}>
                                          {mode.label}
                                        </ListboxOption>
                                      ))}
                                    </ListboxOptions>
                                  </Transition>
                                </div>
                              </Listbox>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-primary/5">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Amount Paid (₹)</label>
                              <input 
                                type="number" 
                                min="0" max={grandTotal}
                                disabled={formData.paymentStatus !== 'PARTIAL'}
                                value={displayPaid} 
                                onChange={(e) => setFormData({...formData, amountPaid: parseFloat(e.target.value) || 0})} 
                                className="w-full px-4 py-3 rounded-xl bg-white border border-primary/10 focus:border-primary outline-none text-sm font-bold text-primary disabled:opacity-60 disabled:bg-transparent transition-all" 
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-red-500">Amount Due (₹)</label>
                              <input 
                                type="number" 
                                readOnly
                                value={amountDue} 
                                className="w-full px-4 py-3 rounded-xl bg-white border border-red-200 outline-none text-sm font-bold text-red-500" 
                              />
                            </div>
                          </div>
                        </div>

                      </form>
                    </div>

                    {/* RIGHT COLUMN: ACTIVE OPERATIONS & TREASURY COMMAND CENTER */}
                    <div className="w-full lg:w-[420px] bg-white border-l border-primary/10 overflow-y-auto scrollbar-thin flex flex-col p-6 sm:p-8 shrink-0 space-y-6">
                       
                       {/* SECTION A: QUICK STATUS CONTROLS */}
                       {existingBooking ? (
                         <div className="bg-[#fdfdfc] p-5 rounded-2xl border border-primary/10 shadow-sm space-y-3">
                           <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary border-b border-primary/5 pb-2">Status Operations</h4>
                           
                           {formData.status === 'PENDING' && (
                             <button onClick={() => handleStatusChange('CONFIRMED')} disabled={isProcessingAction} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-colors flex justify-center items-center gap-2 shadow-sm"><CheckCircle2 size={16}/> Confirm Booking</button>
                           )}
                           {formData.status === 'CONFIRMED' && (
                             <button onClick={() => handleStatusChange('CHECKED_IN')} disabled={isProcessingAction} className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors flex justify-center items-center gap-2 shadow-sm"><LogIn size={16}/> Check-In Guest</button>
                           )}
                           {formData.status === 'CHECKED_IN' && (
                             <button onClick={() => handleStatusChange('CHECKED_OUT')} disabled={isProcessingAction} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-gray-200 hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 shadow-sm"><LogOut size={16}/> Check-Out & Audit</button>
                           )}
                           {isClosed && (
                             <p className="text-[10px] text-foreground/40 text-center font-bold tracking-widest uppercase">Folio Locked</p>
                           )}

                           {!isClosed && detailedLedger?.grandTotalDue > 0 && (
                              <button onClick={handleSettleDue} disabled={isProcessingAction} className="w-full mt-2 py-3 bg-[#ecfdf3] text-[#00c885] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm flex justify-center items-center gap-2 transition-colors">
                                <CreditCard size={14}/> Settle Dues (₹{detailedLedger.grandTotalDue})
                              </button>
                           )}
                         </div>
                       ) : (
                         <div className="bg-gray-50 p-5 rounded-2xl border border-primary/5 border-dashed text-center">
                           <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Save booking to unlock operations.</p>
                         </div>
                       )}

                       {existingBooking && (
                         <div className="bg-[#fdfdfc] p-5 rounded-2xl border border-primary/10 shadow-inner space-y-4">
                           {renderDetailedLedger()}
                         </div>
                       )}

                       {existingBooking && (
                         <div className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm space-y-3">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary border-b border-primary/5 pb-2">Export & Share</h4>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={handlePreviewPdf} disabled={isDownloadingPdf || isEmailingPdf} className="py-2.5 bg-gray-50 rounded-xl text-primary text-[9px] uppercase font-bold tracking-[0.1em] border border-primary/10 hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-1.5 shadow-sm">
                                {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14}/>} View Bill
                              </button>
                              <button type="button" onClick={handleResendEmail} disabled={isDownloadingPdf || isEmailingPdf} className="py-2.5 bg-gray-50 rounded-xl text-primary text-[9px] uppercase font-bold tracking-[0.1em] border border-primary/10 hover:border-primary/30 transition-colors flex flex-col items-center justify-center gap-1.5 shadow-sm">
                                {isEmailingPdf ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14}/>} Email
                              </button>
                              
                              <button type="button" onClick={() => handleFutureComms('SMS')} className="py-2.5 bg-gray-50 rounded-xl text-primary/40 text-[9px] uppercase font-bold tracking-[0.1em] border border-primary/5 hover:border-primary/20 transition-colors flex flex-col items-center justify-center gap-1.5 border-dashed">
                                <MessageSquare size={14}/> SMS
                              </button>
                              <button type="button" onClick={() => handleFutureComms('WhatsApp')} className="py-2.5 bg-gray-50 rounded-xl text-primary/40 text-[9px] uppercase font-bold tracking-[0.1em] border border-primary/5 hover:border-primary/20 transition-colors flex flex-col items-center justify-center gap-1.5 border-dashed">
                                <MessageCircle size={14}/> W-App
                              </button>
                            </div>
                         </div>
                       )}

                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="px-6 py-5 bg-white border-t border-primary/5 shrink-0 flex justify-between items-center rounded-b-4xl">
                    {existingBooking && !isClosed ? (
                      <button type="button" onClick={() => onDelete && onDelete(existingBooking.id)} className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-red-500 hover:text-red-600 transition-colors">
                        <Trash2 size={14} /> Cancel Booking
                      </button>
                    ) : <div/>}

                    <div className="flex gap-2">
                      <button type="button" onClick={onClose} className="px-5 py-3.5 bg-white hover:bg-gray-50 text-primary text-[9px] uppercase tracking-[0.2em] font-bold rounded-xl transition-colors border border-primary/10 shadow-sm">
                        Close
                      </button>
                      {!isClosed && (
                        <button type="submit" form="booking-form" className="px-6 py-3.5 bg-primary hover:bg-primary-hover text-white text-[9px] uppercase tracking-[0.2em] font-bold rounded-xl transition-colors shadow-lg shadow-primary/30">
                          {existingBooking ? 'Save Admin Changes' : 'Confirm Allocation'}
                        </button>
                      )}
                    </div>
                  </div>

                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {renderPrintPreviewIframe()}
    </>
  )
}