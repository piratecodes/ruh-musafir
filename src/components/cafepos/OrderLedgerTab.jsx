import { useState, useMemo, Fragment } from 'react'
import { Receipt, TrendingUp, ChevronDown, Loader2, Eye, Edit3, Trash2, Ban, Search, Calendar as CalendarIcon, Filter, X, CheckCircle2, Clock } from 'lucide-react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { format, parseISO, isToday, isThisMonth } from 'date-fns'

// Assuming you have your custom DatePicker from the Bookings page
import DatePicker from '@/components/common/DatePicker'

export default function OrderLedgerTab({ state, handlers }) {
  // --- ADVANCED FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('TODAY') // 'TODAY', 'MONTH', 'ALL', 'CUSTOM'
  const [customDate, setCustomDate] = useState('')

  // --- FILTERING ENGINE ---
  const filteredOrders = useMemo(() => {
    let safe = Array.isArray(state.safeOrders) ? state.safeOrders : []

    // Sort newest first
    safe.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return safe.filter(order => {
      // 1. Search Filter (ID, Name, Phone)
      const searchLower = searchQuery.toLowerCase()
      const searchMatch = 
        order.id.toLowerCase().includes(searchLower) ||
        (order.walkInFirstName && order.walkInFirstName.toLowerCase().includes(searchLower)) ||
        (order.walkInPhone && order.walkInPhone.includes(searchLower))
      
      // 2. Status Filter
      const statusMatch = statusFilter === 'ALL' || order.status === statusFilter

      // 3. Date Filter
      let dateMatch = true
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt)
        if (dateFilter === 'TODAY') dateMatch = isToday(orderDate)
        else if (dateFilter === 'MONTH') dateMatch = isThisMonth(orderDate)
        else if (dateFilter === 'CUSTOM' && customDate) {
          const targetDateStr = typeof customDate === 'string' ? customDate.substring(0, 10) : format(customDate, 'yyyy-MM-dd')
          const orderDateStr = format(orderDate, 'yyyy-MM-dd')
          dateMatch = orderDateStr === targetDateStr
        }
      }

      return searchMatch && statusMatch && dateMatch
    })
  }, [state.safeOrders, searchQuery, statusFilter, dateFilter, customDate])

  // --- FINANCIAL METRICS ---
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0)
    const pendingOrders = filteredOrders.filter(o => ['PENDING', 'PREPARING', 'SERVED'].includes(o.status)).length
    return { totalRevenue, pendingOrders }
  }, [filteredOrders])

  // --- BADGE RENDERER ---
  const getStatusBadge = (status) => {
    switch(status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      case 'SERVED': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'PREPARING': return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200' // PENDING
    }
  }

  const getFilterLabel = () => {
    if (dateFilter === 'TODAY') return 'Today\'s Sales'
    if (dateFilter === 'MONTH') return 'This Month'
    if (dateFilter === 'ALL') return 'All Historical'
    return 'Custom Date'
  }

  return (
    <div className="absolute inset-0 flex flex-col gap-6 animate-in fade-in duration-300 overflow-hidden">
      
      {/* --- LEDGER STATS HEADER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-4xl border border-primary/5 shadow-sm flex items-center justify-between">
          <div><p className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">Total Orders</p><p className="text-3xl font-bold text-primary">{filteredOrders.length}</p></div>
          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><Receipt size={24} /></div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-4xl border border-primary/5 shadow-sm flex items-center justify-between">
          <div><p className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">Collected Revenue</p><p className="text-3xl font-bold text-emerald-600">₹{metrics.totalRevenue.toLocaleString()}</p></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><TrendingUp size={24} /></div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-4xl border border-primary/5 shadow-sm flex items-center justify-between">
          <div><p className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">Active / Pending</p><p className="text-3xl font-bold text-amber-600">{metrics.pendingOrders}</p></div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Clock size={24} /></div>
        </div>
      </div>

      {/* --- ENTERPRISE FILTER BAR --- */}
      <div className="flex flex-col md:flex-row gap-3 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-primary/10 shadow-sm shrink-0 relative z-50">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
          <input type="text" placeholder="Search Order ID, Name, or Phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-primary/5 focus:border-primary/20 outline-none text-xs transition-all shadow-sm font-bold text-primary" />
        </div>
        
        <div className="flex items-center gap-3">
          
          {/* Headless UI: Status Filter */}
          <Menu as="div" className="relative z-50">
            <MenuButton className="px-5 py-3 bg-white rounded-xl border border-primary/5 text-[9px] font-bold text-primary shadow-sm flex items-center gap-2 uppercase tracking-widest transition-colors hover:border-primary/20">
              {statusFilter === 'ALL' ? 'All Statuses' : statusFilter} <ChevronDown size={14} className="opacity-50" />
            </MenuButton>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <MenuItems className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl p-1 border border-primary/5 z-[9999]">
                {['ALL', 'PENDING', 'PREPARING', 'SERVED', 'PAID', 'CANCELLED'].map(s => (
                  <MenuItem key={s}>
                    <button onClick={() => setStatusFilter(s)} className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary text-primary rounded-lg transition-colors">{s === 'ALL' ? 'All Statuses' : s}</button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Transition>
          </Menu>

          {/* Headless UI: Date Filter */}
          <Menu as="div" className="relative z-50">
            <MenuButton className="px-5 py-3 bg-white rounded-xl border border-primary/5 text-[9px] font-bold text-primary shadow-sm flex items-center gap-2 uppercase tracking-widest transition-colors hover:border-primary/20">
              <CalendarIcon size={14} className="text-primary/40"/> {getFilterLabel()} <ChevronDown size={14} className="opacity-50" />
            </MenuButton>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <MenuItems className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl p-1 border border-primary/5 z-[9999]">
                <MenuItem><button onClick={() => setDateFilter('TODAY')} className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary text-primary rounded-lg transition-colors">Today's Sales</button></MenuItem>
                <MenuItem><button onClick={() => setDateFilter('MONTH')} className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary text-primary rounded-lg transition-colors">This Month</button></MenuItem>
                <MenuItem><button onClick={() => setDateFilter('ALL')} className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary text-primary rounded-lg transition-colors">All Historical</button></MenuItem>
                <MenuItem><button onClick={() => setDateFilter('CUSTOM')} className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary text-primary rounded-lg transition-colors">Custom Date</button></MenuItem>
              </MenuItems>
            </Transition>
          </Menu>

          {/* Custom Date Picker (Only shows if CUSTOM is selected) */}
          {dateFilter === 'CUSTOM' && (
            <div className="relative w-40 z-40 animate-in slide-in-from-right-4">
              <DatePicker 
                value={customDate} 
                onChange={(val) => setCustomDate(val?.target?.value ?? val)} 
                className="w-full px-4 py-3 rounded-xl bg-white border border-primary/10 text-[9px] font-bold text-primary shadow-sm uppercase tracking-widest cursor-pointer outline-none focus:border-accent"
              />
            </div>
          )}

        </div>
      </div>

      {/* --- HISTORICAL DATA TABLE --- */}
      <div className="flex-1 min-h-0 bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg relative z-0 flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-secondary/90 backdrop-blur-md z-10 border-b border-primary/5">
              <tr className="text-[9px] uppercase tracking-widest font-bold text-foreground/40">
                <th className="p-5 pl-6">Order Details</th>
                <th className="p-5">Items Summary</th>
                <th className="p-5">Total</th>
                <th className="p-5">Status & Type</th>
                <th className="p-5 text-center pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-xs font-bold text-primary">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <Receipt className="mx-auto text-primary/20 mb-3" size={32} />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary/40">No records found for these filters.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white transition-colors group">
                    
                    <td className="p-5 pl-6">
                      <p className="text-xs font-black">{order.id.split('-')[0].toUpperCase()}</p>
                      <p className="text-[9px] text-foreground/50 uppercase tracking-widest mt-1">
                        {order.createdAt ? format(parseISO(order.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                      </p>
                      {order.walkInFirstName && <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">{order.walkInFirstName} {order.walkInLastName}</p>}
                    </td>
                    
                    <td className="p-5">
                      <p className="text-xs text-foreground/80 font-serif italic line-clamp-1 max-w-[200px]">
                        {order.items?.map(i => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ') || 'No Items'}
                      </p>
                    </td>
                    
                    <td className="p-5">
                      <p className="text-sm font-black text-emerald-600">₹{order.totalAmount}</p>
                      <p className="text-[8px] uppercase tracking-widest text-foreground/40 mt-0.5">{order.paymentMethod || 'CASH'}</p>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-2.5 py-1 rounded-md border text-[8px] font-black uppercase tracking-[0.15em] ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${order.booking ? 'bg-primary text-secondary' : 'bg-amber-100 text-amber-700'}`}>
                          {order.booking ? `ROOM ${order.booking.room?.roomNumber || ''}` : 'WALK-IN'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-5 text-center pr-6">
                      <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handlers.setSelectedTicket(order)} className="p-2 bg-white text-primary rounded-lg hover:bg-gray-50 transition-colors border border-primary/10 shadow-sm" title="View/Print Ticket"><Eye size={14} /></button>
                        
                        {/* Only allow editing if the order is not finalized */}
                        {!['PAID', 'CANCELLED'].includes(order.status) && (
                           <button onClick={() => handlers.handleEditTicket(order)} className="p-2 bg-white text-primary rounded-lg hover:bg-gray-50 transition-colors border border-primary/10 shadow-sm" title="Edit Order"><Edit3 size={14} /></button>
                        )}
                        
                        {!['CANCELLED'].includes(order.status) && (
                          <button onClick={() => handlers.handleCancelTicket(order.id)} className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm" title="Soft Cancel Ticket"><Ban size={14} /></button>
                        )}
                        
                        <button onClick={() => handlers.handleDeleteOrder(order.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-red-100 shadow-sm" title="Hard Delete from Database"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}