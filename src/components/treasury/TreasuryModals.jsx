import { Fragment, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { X, Lock, Unlock, ReceiptText, ChevronDown } from 'lucide-react'

export function ShiftModal({ isOpen, onClose, type, onSubmit, isProcessing }) {
  const [amount, setAmount] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(parseFloat(amount) || 0)
    setAmount('')
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-200" onClose={onClose}>
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-4xl bg-white shadow-2xl border border-primary/10">
            <div className="px-6 py-4 flex items-center justify-between border-b border-primary/5">
              <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                {type === 'OPEN' ? <Unlock size={16} className="text-emerald-500"/> : <Lock size={16} className="text-red-500"/>}
                {type === 'OPEN' ? 'Open Register' : 'Close Register (EOD)'}
              </DialogTitle>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={16}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-[10px] text-foreground/60 uppercase tracking-widest font-bold leading-relaxed mb-4">
                {type === 'OPEN' ? 'Enter the starting physical cash amount in the drawer to begin the shift.' : 'Count the physical cash currently in the drawer and enter it below to reconcile.'}
              </p>
              
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">
                  {type === 'OPEN' ? 'Starting Cash (₹)' : 'Counted Actual Cash (₹)'}
                </label>
                <input 
                  type="number" required min="0" value={amount} onChange={e => setAmount(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-sm font-bold text-primary transition-all" 
                />
              </div>

              <button disabled={isProcessing} type="submit" className={`w-full py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white shadow-lg transition-colors flex justify-center ${type === 'OPEN' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {isProcessing ? 'Processing...' : type === 'OPEN' ? 'Start Shift' : 'Reconcile & Close'}
              </button>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  )
}

export function ExpenseModal({ isOpen, onClose, onSubmit, isProcessing }) {
  // THE FIX: Added method field to initial state, defaults to CASH
  const [formData, setFormData] = useState({ amount: '', reason: '', paidTo: '', method: 'CASH' })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ 
      amount: parseFloat(formData.amount), 
      reason: formData.reason, 
      paidTo: formData.paidTo, 
      method: formData.method // Passes the method securely to backend
    })
    setFormData({ amount: '', reason: '', paidTo: '', method: 'CASH' })
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-200" onClose={onClose}>
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-4xl bg-white shadow-2xl border border-primary/10">
            <div className="px-6 py-4 flex items-center justify-between border-b border-primary/5">
              <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                <ReceiptText size={16} className="text-blue-500"/> Record Petty Cash
              </DialogTitle>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={16}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Expense Amount (₹)</label>
                <input type="number" required min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-sm font-bold text-primary transition-all" />
              </div>
              
              {/* THE FIX: Headless UI Dropdown for Payment Mode */}
              <div className="relative">
                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Paid Via</label>
                <Listbox value={formData.method} onChange={val => setFormData({...formData, method: val})}>
                  {({ open }) => (
                    <div className="relative">
                      <ListboxButton className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border outline-none text-xs font-bold text-primary transition-all ${open ? 'border-primary/30 ring-2 ring-primary/5' : 'border-primary/10 hover:border-primary/20'}`}>
                        <span className="truncate">{formData.method === 'UPI' ? 'UPI / CARDS' : 'CASH'}</span>
                        <ChevronDown size={14} className={`opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                      </ListboxButton>
                      
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions className="absolute z-50 mt-1 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl border border-primary/10 focus:outline-none">
                          {[
                            { label: 'CASH', value: 'CASH' }, 
                            { label: 'UPI / CARDS', value: 'UPI' }
                          ].map((option) => (
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

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Reason / Description</label>
                <input type="text" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Milk, Cleaning Supplies" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-xs font-bold text-primary transition-all" />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Paid To (Vendor Name)</label>
                <input type="text" value={formData.paidTo} onChange={e => setFormData({...formData, paidTo: e.target.value})} placeholder="e.g. Raju Dairy" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-xs font-bold text-primary transition-all" />
              </div>

              <button disabled={isProcessing} type="submit" className="w-full py-3.5 mt-2 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white shadow-lg shadow-blue-500/30 transition-colors flex justify-center">
                {isProcessing ? 'Logging...' : 'Log Expense'}
              </button>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  )
}