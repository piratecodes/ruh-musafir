import { useState, useEffect, Fragment } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { X, User, LogIn, LogOut, CheckCircle2, AlertCircle, Receipt, CreditCard, Loader2, ChevronDown, PlusCircle, Lock, Mail, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'

const toastStyle = { background: '#ffffff', color: '#112440', border: '1px solid rgba(17, 36, 64, 0.1)', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }

export default function GuestFolioModal({ isOpen, onClose, booking, onRefresh }) {
  const [ledger, setLedger] = useState(null)
  const [isLoadingLedger, setIsLoadingLedger] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  const [chargeReason, setChargeReason] = useState('')
  const [chargeAmount, setChargeAmount] = useState('')
  const [isAddingCharge, setIsAddingCharge] = useState(false)

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isEmailingPdf, setIsEmailingPdf] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null)

  const isClosed = booking?.status === 'CHECKED_OUT' || booking?.status === 'CANCELLED'

  useEffect(() => {
    if (isOpen && booking) {
      loadLedger()
      setPaymentMethod('CASH') 
    }
  }, [isOpen, booking])

  const loadLedger = async () => {
    setIsLoadingLedger(true)
    try {
      const res = await fetchClient(`/bookings/${booking.id}/ledger`)
      if (res?.data) setLedger(res.data)
    } catch (e) {
      toast.error('Failed to load guest folio ledger', { style: toastStyle })
    } finally {
      setIsLoadingLedger(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setIsProcessing(true)
    try {
      await fetchClient(`/bookings/${booking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      toast.success(`Guest marked as ${newStatus.replace('_', ' ')}`, { style: toastStyle })
      if (onRefresh) onRefresh() 
      onClose()   
    } catch (e) {
      toast.error(e.message || 'Failed to update status', { style: toastStyle })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddCustomCharge = async () => {
    if (isClosed) return toast.error('Folio is closed and audited.');
    if (!chargeReason || !chargeAmount || Number(chargeAmount) <= 0) {
      return toast.error('Please enter a valid reason and amount.', { style: toastStyle });
    }
    setIsAddingCharge(true);
    try {
      await fetchClient(`/bookings/${booking.id}/adjustments`, {
        method: 'POST',
        body: JSON.stringify({ reason: chargeReason, amount: Number(chargeAmount) })
      });
      toast.success('Custom charge added to folio.', { style: toastStyle });
      setChargeReason(''); setChargeAmount('');
      loadLedger(); 
      if (onRefresh) onRefresh();  
    } catch (e) {
      toast.error('Failed to add charge.', { style: toastStyle });
    } finally {
      setIsAddingCharge(false);
    }
  }

  const handleSettlePayment = async () => {
    if (isClosed) return toast.error('Folio is closed and audited.');
    if (!window.confirm(`Collect ₹${ledger?.grandTotalDue} via ${paymentMethod}?`)) return;
    setIsProcessing(true)
    try {
      await fetchClient(`/bookings/${booking.id}/settle`, { 
        method: 'POST',
        body: JSON.stringify({ method: paymentMethod }) 
      })
      toast.success('Payment Collected Successfully!', { style: toastStyle })
      loadLedger()
      if (onRefresh) onRefresh()
    } catch (e) {
      toast.error('Settlement Failed', { style: toastStyle })
    } finally {
      setIsProcessing(false)
    }
  }

  // --- PRINT PREVIEW ENGINE ---
  const handlePreviewPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetchClient(`/bookings/${booking.id}/download-receipt`);
      // Convert Base64 back to a visual PDF Blob
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
    downloadLink.download = `Invoice_${booking.id.slice(-6).toUpperCase()}.pdf`;
    downloadLink.click();
    toast.success("Invoice Downloaded!", { style: toastStyle });
  };

  const handleResendEmail = async () => {
    setIsEmailingPdf(true);
    try {
      await fetchClient(`/bookings/${booking.id}/email-receipt`, { method: 'POST' });
      toast.success("Invoice Emailed to Guest!", { style: toastStyle });
    } catch (e) {
      toast.error(e.message || "Failed to send email.", { style: toastStyle });
    } finally {
      setIsEmailingPdf(false);
    }
  };

  if (!booking) return null;

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[150]" onClose={onClose}>
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm transition-opacity" />
          
          <div className="fixed inset-0 flex justify-end">
            <DialogPanel className="w-full max-w-md h-full bg-[#f8f5f2] shadow-2xl flex flex-col transform transition-all duration-300">
              
              {/* HEADER */}
              <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-primary/5 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-primary"><User size={20}/></div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-primary leading-tight">{booking.guestFirstName} {booking.guestLastName}</DialogTitle>
                    <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold">{booking.roomName} {booking.bedName ? `• ${booking.bedName}` : ''}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 p-6 space-y-6">
                
                {/* LOCKED FOLIO ALERT */}
                {isClosed && (
                  <div className="p-4 bg-white rounded-2xl border border-primary/5 shadow-sm flex flex-col gap-4">
                    <div className="flex gap-3 text-primary/60">
                      <Lock size={20} className="shrink-0"/>
                      <p className="text-[10px] font-bold leading-relaxed">This folio has been audited and permanently closed. No further financial changes can be made.</p>
                    </div>
                    
                    <div className="flex gap-3 pt-3 border-t border-primary/5">
                       <button onClick={handlePreviewPdf} disabled={isDownloadingPdf || isEmailingPdf} className="flex-1 py-2.5 bg-white rounded-xl text-primary text-[10px] uppercase font-bold tracking-widest border border-primary/10 shadow-sm hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
                         {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14}/>} View Bill
                       </button>
                       <button onClick={handleResendEmail} disabled={isDownloadingPdf || isEmailingPdf} className="flex-1 py-2.5 bg-white rounded-xl text-primary text-[10px] uppercase font-bold tracking-widest border border-primary/10 shadow-sm hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
                         {isEmailingPdf ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14}/>} Email
                       </button>
                    </div>
                  </div>
                )}

                {/* QUICK ACTIONS (Hidden if closed) */}
                {!isClosed && (
                  <div className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm space-y-3">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mb-2">Guest Actions</h4>
                    
                    {booking.status === 'PENDING' && (
                      <button onClick={() => handleStatusChange('CONFIRMED')} disabled={isProcessing} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"><CheckCircle2 size={16}/> Confirm Booking</button>
                    )}
                    
                    {booking.status === 'CONFIRMED' && (
                      <button onClick={() => handleStatusChange('CHECKED_IN')} disabled={isProcessing} className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors flex justify-center items-center gap-2"><LogIn size={16}/> Check-In Guest</button>
                    )}

                    {booking.status === 'CHECKED_IN' && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 flex gap-3">
                        <AlertCircle size={20} className="shrink-0"/>
                        <p className="text-[10px] font-bold leading-relaxed">Guest is in-house. To check them out, settle the ledger below.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* THE ITEMIZED LEDGER STATEMENT */}
                <div className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mb-4 flex items-center gap-2"><Receipt size={14}/> Statement of Account</h4>
                  
                  {isLoadingLedger ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary w-6 h-6" /></div>
                  ) : ledger ? (
                    <div className="space-y-4">
                      
                      {/* Check-in / Check-out Meta */}
                      <div className="flex justify-between text-[10px] font-bold text-foreground/60 border-b border-primary/5 pb-3">
                        <div>
                          <p className="uppercase tracking-widest text-primary/40 text-[8px] mb-0.5">Check In</p>
                          <p>{new Date(booking.checkIn || booking.checkInDate).toLocaleDateString('en-GB')} • 12:00 PM</p>
                        </div>
                        <div className="text-right">
                          <p className="uppercase tracking-widest text-primary/40 text-[8px] mb-0.5">Check Out</p>
                          <p>{new Date(booking.checkOut || booking.checkOutDate).toLocaleDateString('en-GB')} • 11:00 AM</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* 1. ROOM */}
                        <div className="space-y-1">
                           <div className="flex justify-between text-xs font-bold text-primary">
                               <span>Accommodation</span>
                               <span>₹{ledger.roomTotal}</span>
                           </div>
                           <div className="flex justify-between text-[10px] text-foreground/50">
                               <span>{ledger.nights || 1} Nights @ ₹{ledger.roomDailyRate?.toFixed(2) || ledger.roomTotal}</span>
                           </div>
                        </div>
                        
                        {/* 2. EXPERIENCES */}
                        {ledger.experiences?.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-primary/5">
                             <span className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Experiences</span>
                             {ledger.experiences.map(exp => (
                                 <div key={exp.id} className="flex justify-between text-[11px] text-foreground/70">
                                     <span>{booking.adults}x {exp.name} (@ ₹{exp.price})</span>
                                     <span className="font-medium">₹{exp.price * booking.adults}</span>
                                 </div>
                             ))}
                          </div>
                        )}

                        {/* 3. CAFE ITEMS DETAILED WITH SUBTOTAL */}
                        {ledger.allCafeOrders?.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-primary/5">
                            <span className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Cafe & Dining</span>
                            {ledger.allCafeOrders.map(order => 
                               order.items.map(item => (
                                 <div key={item.id} className="flex justify-between text-[11px] text-foreground/70 mt-1">
                                   <span>{item.quantity}x {item.menuItem?.name || 'Item'} (Tkt #{order.id.slice(-6).toUpperCase()})</span>
                                   <span className="font-medium">₹{item.unitPrice * item.quantity}</span>
                                 </div>
                               ))
                            )}
                            <div className="flex justify-between items-center text-[10px] font-bold text-primary border-t border-dashed border-primary/10 pt-1.5 mt-2">
                              <span>Cafe Subtotal</span>
                              <span>₹{ledger.historicalCafeTotal}</span>
                            </div>
                          </div>
                        )}

                        {/* 4. ADJUSTMENTS WITH SUBTOTAL */}
                        {ledger.allAdjustments?.length > 0 && (
                          <div className="space-y-1 pt-2 border-t border-primary/5">
                            <span className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">Adjustments</span>
                            {ledger.allAdjustments.map(adj => (
                              <div key={adj.id} className="flex justify-between text-[11px] text-amber-700 mt-1">
                                <span>1x {adj.reason}</span>
                                <span className="font-medium">₹{adj.amount}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center text-[10px] font-bold text-amber-700 border-t border-dashed border-amber-200 pt-1.5 mt-2">
                              <span>Adjustments Subtotal</span>
                              <span>₹{ledger.historicalAdjTotal}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-primary/10 pt-4 mt-2">
                        <div className="flex justify-between text-xs font-bold text-foreground/60 mb-1.5">
                          <span>Total Stay Cost</span>
                          <span>₹{ledger.grandTotalHistory}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-emerald-600 mb-4">
                          <span>Total Paid ({booking.paymentMode || 'N/A'})</span>
                          <span>- ₹{ledger.grandTotalHistory - ledger.grandTotalDue}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-dashed border-primary/20 pt-4">
                          <span className="text-sm font-black uppercase tracking-widest text-[#a08875]">Balance Due</span>
                          <span className="text-2xl font-black text-[#4c554c]">₹{ledger.grandTotalDue}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-foreground/40 text-center italic py-4">Unable to load ledger data.</p>
                  )}
                </div>

                {/* ADD INCIDENTALS (Hidden if Closed) */}
                {!isClosed && booking.status === 'CHECKED_IN' && ledger && ledger.grandTotalDue >= 0 && (
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

              {/* BOTTOM CHECKOUT / SETTLEMENT BAR (Hidden if Closed) */}
              {!isClosed && booking.status === 'CHECKED_IN' && ledger && (
                <div className="bg-white p-6 border-t border-primary/5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] shrink-0 z-10 flex flex-col gap-3">
                  {ledger.grandTotalDue > 0 ? (
                    <>
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-primary/5 relative">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Mode of Payment</span>
                        
                        <Listbox value={paymentMethod} onChange={setPaymentMethod}>
                          {({ open }) => (
                            <div className="relative">
                              <ListboxButton className={`flex items-center justify-between gap-3 bg-white border outline-none rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-primary shadow-sm transition-all w-36 ${open ? 'border-primary/30 ring-2 ring-primary/5' : 'border-primary/10 hover:border-primary/20'}`}>
                                <span className="truncate">{paymentMethod === 'UPI' ? 'UPI / CARDS' : 'CASH'}</span>
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
                        onClick={handleSettlePayment} 
                        disabled={isProcessing}
                        className="w-full py-4 bg-[#ecfdf3] text-[#00c885] border border-[#bbf7d0] hover:bg-[#dcfce7] rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm flex justify-center items-center gap-2 transition-colors"
                      >
                        <CreditCard size={16}/> Settle ₹{ledger.grandTotalDue} Now
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange('CHECKED_OUT')} 
                      disabled={isProcessing}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg flex justify-center items-center gap-2 hover:bg-primary-hover transition-colors"
                    >
                      <LogOut size={16}/> Complete Check-Out & Generate Bill
                    </button>
                  )}
                </div>
              )}

            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      {/* --- PRINT PREVIEW IFRAME MODAL --- */}
      <Transition show={!!previewPdfUrl} as={Fragment}>
        <Dialog as="div" className="relative z-[300]" onClose={() => setPreviewPdfUrl(null)}>
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
             <div className="flex min-h-full items-center justify-center p-4">
                <DialogPanel className="w-full max-w-4xl h-[85vh] bg-[#525659] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                   <div className="bg-[#323639] px-4 py-3 flex items-center justify-between shrink-0">
                      <DialogTitle className="text-white text-sm font-bold tracking-widest uppercase">Print Preview: Invoice</DialogTitle>
                      <div className="flex items-center gap-4">
                         <button onClick={handleDownloadFromPreview} className="text-white hover:text-accent flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Download size={14}/> Download PDF</button>
                         <button onClick={() => setPreviewPdfUrl(null)} className="text-white/50 hover:text-white"><X size={20}/></button>
                      </div>
                   </div>
                   <iframe src={previewPdfUrl} className="w-full flex-1 bg-white border-none" title="PDF Preview" />
                </DialogPanel>
             </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}