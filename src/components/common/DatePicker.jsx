import { useState, useEffect, Fragment } from 'react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

const toLocalISOString = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DatePicker({ value, onChange, placeholder = "Select Date", className = "" }) {
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
  const [mode, setMode] = useState('DATE') 

  useEffect(() => { if (value) setViewDate(new Date(value)) }, [value])

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const currentYear = viewDate.getFullYear()
  const decadeStart = Math.floor(currentYear / 10) * 10
  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i)

  const handlePrev = (e) => {
    e.stopPropagation()
    if (mode === 'DATE') setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    else if (mode === 'MONTH') setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))
    else if (mode === 'YEAR') setViewDate(new Date(viewDate.getFullYear() - 10, viewDate.getMonth(), 1))
  }

  const handleNext = (e) => {
    e.stopPropagation()
    if (mode === 'DATE') setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
    else if (mode === 'MONTH') setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))
    else if (mode === 'YEAR') setViewDate(new Date(viewDate.getFullYear() + 10, viewDate.getMonth(), 1))
  }

  const toggleMode = (e) => {
    e.stopPropagation()
    if (mode === 'DATE') setMode('MONTH')
    else if (mode === 'MONTH') setMode('YEAR')
  }

  const handleSelectDate = (day, close) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    onChange(toLocalISOString(selected))
    close()
  }

  const handleSelectMonth = (monthIndex) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1))
    setMode('DATE')
  }

  const handleSelectYear = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1))
    setMode('MONTH')
  }

  const displayDate = value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : placeholder

  return (
    <Popover className="relative w-full">
      {({ close }) => (
        <>
          {/* THE FIX: Clean flex layout so text and icon never overlap */}
          <PopoverButton className={`outline-none flex items-center justify-between gap-3 w-full ${className}`}>
            <span className="block truncate font-bold text-primary flex-1 text-left">{displayDate}</span>
            <CalendarIcon size={14} className="text-primary/40 shrink-0" />
          </PopoverButton>

          <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
            <PopoverPanel className="absolute z-100 mt-2 w-72 rounded-3xl bg-white/95 backdrop-blur-xl p-5 shadow-2xl ring-1 ring-primary/10 right-0">
              
              {/* HEADER */}
              <div className="flex items-center justify-between mb-5">
                <button type="button" onClick={handlePrev} className="p-1.5 hover:bg-secondary rounded-xl text-primary transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={toggleMode} className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:bg-secondary/50 px-3 py-1.5 rounded-lg transition-colors">
                  {mode === 'DATE' && `${fullMonths[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
                  {mode === 'MONTH' && `${viewDate.getFullYear()}`}
                  {mode === 'YEAR' && `${years[1]} - ${years[10]}`}
                </button>
                <button type="button" onClick={handleNext} className="p-1.5 hover:bg-secondary rounded-xl text-primary transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* DATE SELECTION GRID */}
              {mode === 'DATE' && (
                <>
                  <div className="grid grid-cols-7 mb-3 text-center">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {blanks.map(blank => <div key={`blank-${blank}`} className="w-full aspect-square" />)}
                    {days.map(day => {
                      const currentDateStr = toLocalISOString(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
                      const isSelected = value === currentDateStr
                      const isToday = toLocalISOString(new Date()) === currentDateStr

                      return (
                        <button key={day} type="button" onClick={() => handleSelectDate(day, close)} className={`w-full aspect-square flex items-center justify-center rounded-xl text-[10px] font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-md' : isToday ? 'border border-primary text-primary hover:bg-secondary/50' : 'text-foreground/70 hover:bg-secondary hover:text-primary'}`}>
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* MONTH SELECTION GRID */}
              {mode === 'MONTH' && (
                <div className="grid grid-cols-3 gap-2">
                  {shortMonths.map((month, idx) => (
                    <button key={month} type="button" onClick={() => handleSelectMonth(idx)} className={`py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewDate.getMonth() === idx ? 'bg-primary text-white shadow-md' : 'text-foreground/70 hover:bg-secondary hover:text-primary'}`}>
                      {month}
                    </button>
                  ))}
                </div>
              )}

              {/* YEAR SELECTION GRID */}
              {mode === 'YEAR' && (
                <div className="grid grid-cols-3 gap-2">
                  {years.map((year, idx) => {
                    const isEdge = idx === 0 || idx === 11
                    return (
                      <button key={year} type="button" onClick={() => handleSelectYear(year)} className={`py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewDate.getFullYear() === year ? 'bg-primary text-white shadow-md' : isEdge ? 'text-foreground/30 hover:bg-secondary' : 'text-foreground/70 hover:bg-secondary hover:text-primary'}`}>
                        {year}
                      </button>
                    )
                  })}
                </div>
              )}

            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  )
}