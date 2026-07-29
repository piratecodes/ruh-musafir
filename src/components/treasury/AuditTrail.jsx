import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, X, ArrowDownCircle } from 'lucide-react'
import DatePicker from '@/components/common/DatePicker'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react' // THE FIX: Headless UI Tabs

export default function AuditTrail({ auditData }) {
  const [filterDate, setFilterDate] = useState('')

  if (!auditData) return null;

  // --- DYNAMIC FILTERING LOGIC ---
  const filteredShifts = filterDate 
    ? auditData.shifts?.filter(s => new Date(s.openedAt).toISOString().split('T')[0] === filterDate)
    : auditData.shifts;

  const filteredPayments = filterDate
    ? auditData.payments?.filter(p => new Date(p.createdAt).toISOString().split('T')[0] === filterDate)
    : auditData.payments;

  // THE FIX: Added filtering for the new expenses
  const filteredExpenses = filterDate
    ? auditData.expenses?.filter(e => new Date(e.createdAt).toISOString().split('T')[0] === filterDate)
    : auditData.expenses;

  return (
    <TabGroup>
      <div className="space-y-6">
        
        {/* THE FIX: PERFECTED LAYOUT - Title on left, Tabs + DatePicker grouped on the right */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-primary/10 shadow-sm relative z-50">
          
          <div className="shrink-0">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Audit & Reconciliation</h3>
            <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider mt-0.5">Filter records by specific dates</p>
          </div>

          {/* This inner flex container forces the Tabs and DatePicker to stay next to each other */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            
            <TabList className="flex gap-2 p-1.5 bg-white/50 backdrop-blur-md rounded-2xl w-full sm:w-max border border-primary/5 shadow-sm overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 shrink-0">
              <Tab className="px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-xl outline-none transition-all data-selected:bg-emerald-50 data-selected:text-emerald-600 data-selected:shadow-sm text-foreground/50 hover:text-primary whitespace-nowrap">
                Income (Credits)
              </Tab>
              <Tab className="px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-xl outline-none transition-all data-selected:bg-red-50 data-selected:text-red-600 data-selected:shadow-sm text-foreground/50 hover:text-primary whitespace-nowrap">
                Expenses (Debits)
              </Tab>
              <Tab className="px-5 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-xl outline-none transition-all data-selected:bg-white data-selected:text-primary data-selected:shadow-sm text-foreground/50 hover:text-primary whitespace-nowrap">
                Shift Logs
              </Tab>
            </TabList>
            
            <div className="relative w-full sm:w-56 shrink-0 z-50">
              <DatePicker 
                value={filterDate} 
                onChange={setFilterDate} 
                placeholder="All Time History"
                className="w-full px-4 py-3 rounded-xl bg-white border border-primary/10 hover:border-primary/30 transition-colors text-[10px] font-bold text-primary uppercase tracking-widest outline-none shadow-sm"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')} 
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 p-1 bg-white rounded-full transition-colors"
                  title="Clear Filter"
                >
                  <X size={14}/>
                </button>
              )}
            </div>
          </div>
        </div>

        <TabPanels>
          {/* TAB 1: INCOME (CREDITS) */}
          <TabPanel className="bg-white/80 backdrop-blur-xl rounded-2xl border border-primary/5 shadow-sm overflow-hidden flex flex-col h-125 outline-none">
            <div className="p-5 border-b border-primary/5 bg-emerald-50/50 shrink-0 flex justify-between items-center">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Treasury Income</h3>
              <span className="text-[9px] font-bold text-emerald-600 bg-white px-2 py-1 rounded-md border border-emerald-100 shadow-sm">{filteredPayments?.length || 0} Records</span>
            </div>
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1 p-2">
              {filteredPayments?.length === 0 && (
                 <div className="p-4 text-center text-xs font-bold text-foreground/40 uppercase tracking-widest mt-10">No income found for this date.</div>
              )}
              {filteredPayments?.map((payment) => (
                <div key={payment.id} className="p-4 flex items-start sm:items-center justify-between gap-3 border-b border-primary/5 last:border-0 hover:bg-emerald-50/30 transition-colors">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${payment.method === 'CASH' ? 'bg-emerald-100 text-emerald-600' : payment.method === 'UPI' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      <ArrowUpRight size={14}/>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-primary flex flex-wrap items-center gap-1.5 leading-tight">
                        <span className="truncate">{payment.booking ? `${payment.booking.guestFirstName} ${payment.booking.guestLastName} (Room ${payment.booking.room?.roomNumber})` : (payment.cafeOrder?.walkInFirstName || 'Cafe Walk-In')}</span>
                        <span className={`shrink-0 px-1.5 py-0.5 text-[7px] font-black rounded-sm tracking-widest ${payment.booking ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                          {payment.booking ? 'ROOM TAB' : 'CAFE POS'}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mt-1.5">
                        {new Date(payment.createdAt).toLocaleTimeString()} • <span className="text-primary border border-primary/10 bg-white px-1 py-0.5 rounded-sm">{payment.method}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-600 shrink-0 self-start sm:self-center mt-1 sm:mt-0">+ ₹{payment.amount}</span>
                </div>
              ))}
            </div>
          </TabPanel>

          {/* TAB 2: EXPENSES (DEBITS) */}
          <TabPanel className="bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/5 shadow-sm overflow-hidden flex flex-col h-125 outline-none">
            <div className="p-5 border-b border-primary/5 bg-red-50/50 shrink-0 flex justify-between items-center">
              <h3 className="text-xs font-bold text-red-700 uppercase tracking-widest">Petty Cash & Expenses</h3>
              <span className="text-[9px] font-bold text-red-600 bg-white px-2 py-1 rounded-md border border-red-100 shadow-sm">{filteredExpenses?.length || 0} Records</span>
            </div>
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1 p-2">
              {filteredExpenses?.length === 0 && (
                 <div className="p-4 text-center text-xs font-bold text-foreground/40 uppercase tracking-widest mt-10">No expenses found for this date.</div>
              )}
              {filteredExpenses?.map((expense) => (
                <div key={expense.id} className="p-4 flex items-start sm:items-center justify-between gap-3 border-b border-primary/5 last:border-0 hover:bg-red-50/30 transition-colors">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${expense.method === 'CASH' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      <ArrowDownRight size={14}/>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-primary flex flex-wrap items-center gap-1.5 leading-tight">
                        <span className="truncate">{expense.reason}</span>
                        <span className="shrink-0 px-1.5 py-0.5 text-[7px] font-black rounded-sm tracking-widest bg-gray-100 text-gray-500">
                          {expense.paidTo || 'GENERAL'}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mt-1.5">
                        {new Date(expense.createdAt).toLocaleTimeString()} • <span className="text-primary border border-primary/10 bg-white px-1 py-0.5 rounded-sm">{expense.method}</span> • Logged By: {expense.loggedBy?.firstName}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-red-500 shrink-0 self-start sm:self-center mt-1 sm:mt-0">- ₹{expense.amount}</span>
                </div>
              ))}
            </div>
          </TabPanel>

          {/* TAB 3: SHIFT LOGS */}
          <TabPanel className="bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/5 shadow-sm overflow-hidden flex flex-col h-125 outline-none">
            <div className="p-5 border-b border-primary/5 bg-secondary/10 shrink-0 flex justify-between items-center">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Shift History</h3>
              <span className="text-[9px] font-bold text-foreground/40 bg-white px-2 py-1 rounded-md border border-primary/5 shadow-sm">{filteredShifts?.length || 0} Records</span>
            </div>
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1 p-2">
              {filteredShifts?.length === 0 && (
                 <div className="p-4 text-center text-xs font-bold text-foreground/40 uppercase tracking-widest mt-10">No shift records found for this date.</div>
              )}
              {filteredShifts?.map((shift) => (
                <div key={shift.id} className="p-4 border-b border-primary/5 last:border-0 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-[8px] font-bold uppercase tracking-widest rounded-md ${shift.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        {shift.status}
                      </span>
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                        By: {shift.openedBy?.firstName} {shift.openedBy?.lastName}
                      </span>
                    </div>
                    <span className="text-[10px] text-foreground/50 font-bold">{new Date(shift.openedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div>
                      <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Opened: <span className="font-bold text-primary">₹{shift.startingCash}</span></p>
                      {shift.status === 'CLOSED' && (
                        <div className="mt-1">
                          <p className="text-[10px] text-foreground/50 uppercase tracking-widest">Closed: <span className="font-bold text-primary">₹{shift.actualCash}</span></p>
                          <p className="text-[8px] text-foreground/40 uppercase tracking-widest mt-0.5">Closed By: {shift.closedBy?.firstName} {shift.closedBy?.lastName}</p>
                        </div>
                      )}
                    </div>
                    {shift.status === 'CLOSED' && (
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest text-foreground/40 mb-0.5">Discrepancy</p>
                        <p className={`text-sm font-black ${shift.discrepancy < 0 ? 'text-red-500' : shift.discrepancy > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {shift.discrepancy > 0 ? '+' : ''}₹{shift.discrepancy}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>
        </TabPanels>
      </div>
    </TabGroup>
  )
}