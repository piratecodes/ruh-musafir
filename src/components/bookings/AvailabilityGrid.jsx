import { Fragment } from 'react'
import { Crown, Layers, ChevronLeft, ChevronRight } from 'lucide-react'
import DatePicker from '@/components/common/DatePicker' 

export default function AvailabilityGrid({ rooms = [], bookings = [], dates = [], onSelectEmptySlot, onEditBooking, currentOffset, setCurrentOffset }) {
  
  const getSlotStatus = (roomId, bedId, dateStr) => {
    const safeBookings = Array.isArray(bookings) ? bookings : []
    
    const match = safeBookings.find(b => {
      const isSameRoom = b.roomId === roomId
      
      // THE FIX: Check if the bed on the grid exists inside the booking's new 'bedIds' array!
      const isSameBed = bedId ? (b.bedIds && b.bedIds.includes(bedId)) : true
      
      const isWithinDates = dateStr >= b.checkIn && dateStr < b.checkOut
      
      return isSameRoom && isSameBed && isWithinDates
    })
    
    return match ? { status: 'OCCUPIED', booking: match } : { status: 'AVAILABLE' }
  }

  const getSeatColor = (status) => {
    if (status === 'OCCUPIED') return 'bg-primary text-secondary border-primary/20 shadow-inner'
    return 'bg-white hover:bg-secondary text-primary/40 hover:text-primary border-primary/10 hover:scale-110 cursor-pointer shadow-sm'
  }

  const formatHeaderDate = (dateStr) => {
    const d = new Date(dateStr)
    return { dayNum: d.getDate(), dayName: d.toLocaleDateString('en-US', { weekday: 'short' }) }
  }

  const handleJumpToDate = (newDateStr) => {
    if (!newDateStr) return
    const [year, month, day] = newDateStr.split('-')
    const selectedDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0,0,0,0)
    const diffDays = Math.round((selectedDate - today) / (1000 * 60 * 60 * 24))
    setCurrentOffset(diffDays)
  }

  const centerDateObj = new Date()
  centerDateObj.setDate(centerDateObj.getDate() + currentOffset)
  const currentViewDate = centerDateObj.toISOString().split('T')[0]

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg p-6 flex flex-col">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Visual Booking Chart</h3>
          <p className="text-[10px] text-foreground/50 font-medium uppercase tracking-wider mt-0.5">Click empty to book, click occupied to modify</p>
        </div>
        
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-primary/10 shadow-sm">
          <button onClick={() => setCurrentOffset(currentOffset - 7)} className="p-2 hover:bg-secondary rounded-xl text-primary transition-colors">
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center bg-secondary/30 rounded-lg border border-primary/5 hover:border-primary/20 transition-colors z-20">
            <DatePicker 
              value={currentViewDate}
              onChange={handleJumpToDate}
              className="py-1.5 px-3 text-[10px] uppercase tracking-widest cursor-pointer w-32 outline-none bg-transparent"
            />
          </div>

          <button onClick={() => setCurrentOffset(currentOffset + 7)} className="p-2 hover:bg-secondary rounded-xl text-primary transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 rounded-xl border border-primary/5">
        <table className="w-full border-collapse min-w-200 bg-white/40">
          <thead>
            <tr>
              <th className="p-3 text-left text-[9px] uppercase tracking-widest font-bold text-foreground/40 min-w-55">Spaces & Inventory</th>
              {dates.map(date => {
                const meta = formatHeaderDate(date)
                return (
                  <th key={date} className="p-2 text-center min-w-12.5 border-l border-primary/5">
                    <p className="text-[10px] font-bold text-primary">{meta.dayNum}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/40 mt-0.5">{meta.dayName}</p>
                  </th>
                )
              })}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-primary/5">
            {rooms.map(room => (
              <Fragment key={room.id}>
                {room.type === 'PRIVATE' ? (
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                        <Crown size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary line-clamp-1">{room.name}</p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-accent">Room {room.roomNumber}</p>
                      </div>
                    </td>
                    {dates.map(date => {
                      const { status, booking } = getSlotStatus(room.id, null, date)
                      return (
                        <td key={date} className="p-1 border-l border-primary/5 text-center">
                          <button onClick={() => status === 'OCCUPIED' ? onEditBooking(booking) : onSelectEmptySlot(room, null, date)} title={status === 'OCCUPIED' ? `Modify booking for ${booking.guestName}` : 'Available'} className={`w-9 h-9 mx-auto rounded-xl border font-mono text-[9px] font-bold flex items-center justify-center transition-all ${getSeatColor(status)}`}>
                            {status === 'OCCUPIED' ? '●' : '○'}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ) : (
                  <Fragment>
                    <tr className="bg-secondary/10 border-t border-primary/10">
                      <td className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 border border-accent/20">
                          <Layers size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary line-clamp-1">{room.name}</p>
                          <p className="text-[9px] uppercase tracking-widest font-bold text-accent">Dorm {room.roomNumber}</p>
                        </div>
                      </td>
                      <td colSpan={dates.length} className="bg-secondary/10 border-l border-primary/5 text-center px-4">
                         <div className="w-full border-t border-dashed border-primary/10 rounded-full"></div>
                      </td>
                    </tr>
                    {room.beds?.map((bed, idx) => {
                      const isLast = idx === room.beds.length - 1;
                      return (
                        <tr key={bed.id} className="hover:bg-secondary/10 transition-colors h-12">
                          <td className="relative p-0 pl-14 flex items-center h-full">
                            <div className={`absolute left-[1.6rem] -top-px w-px bg-primary/20 ${isLast ? 'h-[calc(50%+1px)]' : 'h-[calc(100%+2px)]'}`} />
                            <div className="absolute left-[1.6rem] top-1/2 w-4 h-px bg-primary/20" />
                            <p className="text-[10px] uppercase tracking-widest font-bold text-primary/70">{bed.name}</p>
                          </td>
                          {dates.map(date => {
                            const { status, booking } = getSlotStatus(room.id, bed.id, date)
                            return (
                              <td key={date} className="p-1 border-l border-primary/5 text-center">
                                <button onClick={() => status === 'OCCUPIED' ? onEditBooking(booking) : onSelectEmptySlot(room, bed, date)} title={status === 'OCCUPIED' ? `Modify booking for ${booking.guestName}` : 'Available'} className={`w-9 h-9 mx-auto rounded-xl border font-mono text-[9px] font-bold flex items-center justify-center transition-all ${getSeatColor(status)}`}>
                                  {status === 'OCCUPIED' ? '●' : '○'}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </Fragment>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}