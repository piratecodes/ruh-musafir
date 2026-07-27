import { Loader2, Eye } from 'lucide-react'

export default function BookingsTable({ bookings, isLoading, onSelectBooking }) {
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200'
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'CHECKED_IN': return 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
      case 'CHECKED_OUT': return 'bg-gray-100 text-gray-500 border-gray-200'
      case 'CANCELLED': return 'bg-red-50 text-red-500 border-red-200'
      default: return 'bg-gray-50 text-gray-500 border-gray-200'
    }
  }

  if (isLoading) {
    return <div className="flex-1 flex justify-center items-center py-20"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
  }

  if (bookings.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 text-center py-20">
        <p className="text-sm font-bold uppercase tracking-widest">No Bookings Found</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1 bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg">
      <table className="w-full text-left border-collapse min-w-250">
        <thead>
          <tr className="border-b border-primary/5 text-[9px] uppercase tracking-widest font-bold text-foreground/40 bg-secondary/10 sticky top-0 backdrop-blur-md z-10">
            <th className="p-5 pl-6">Guest Profile</th>
            <th className="p-5">Room / Bed</th>
            <th className="p-5">Dates</th>
            <th className="p-5">Status</th>
            <th className="p-5 text-right">Balance</th>
            <th className="p-5 text-center pr-6">Manage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/5 text-xs font-bold text-primary">
          {bookings.map(b => (
            <tr key={b.id} className="hover:bg-secondary/10 transition-colors group">
              <td className="p-5 pl-6">
                <p className="text-sm">{b.guestFirstName} {b.guestLastName}</p>
                <p className="text-[9px] uppercase tracking-widest text-foreground/40 mt-1">{b.guestPhone || 'No Phone'}</p>
              </td>
              <td className="p-5">
                <p className="text-primary">{b.roomName}</p>
                {b.bedName && <p className="text-[9px] text-foreground/50 uppercase tracking-widest mt-1">Bed: {b.bedName}</p>}
              </td>
              <td className="p-5">
                <p className="text-xs">{new Date(b.checkIn).toLocaleDateString()} <span className="text-foreground/40 font-normal mx-1">to</span> {new Date(b.checkOut).toLocaleDateString()}</p>
              </td>
              <td className="p-5">
                <span className={`px-2.5 py-1.5 rounded-lg border text-[8px] uppercase tracking-widest ${getStatusBadge(b.status)}`}>
                  {b.status.replace('_', ' ')}
                </span>
              </td>
              <td className="p-5 text-right">
                <p className="text-sm text-primary mb-1">₹{b.totalAmount}</p>
                {b.dueAmount > 0 ? (
                  <span className="px-2 py-1 rounded border text-[8px] uppercase tracking-widest bg-red-50 text-red-500 border-red-200">DUE: ₹{b.dueAmount}</span>
                ) : (
                  <span className="px-2 py-1 rounded border text-[8px] uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-200">PAID IN FULL</span>
                )}
              </td>
              <td className="p-5 text-center pr-6">
                <button onClick={() => onSelectBooking(b)} className="px-4 py-2 bg-white text-primary text-[9px] uppercase tracking-widest font-bold rounded-lg hover:bg-gray-50 transition-colors border border-primary/10 shadow-sm flex items-center gap-2 mx-auto">
                  <Eye size={14} /> Open Folio
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}