import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

const COLORS = ['#1f3d33', '#a5734d', '#4a5568', '#e0e0d6', '#718096']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-primary/10">
        <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold mb-1">{label}</p>
        {/* Removed the ₹ symbol, added "Guests" */}
        <p className="text-primary font-bold text-xl">{payload[0].value.toLocaleString()} Guests</p>
      </div>
    )
  }
  return null
}

export function FootfallTrendChart({ data, timeRange, setTimeRange }) {
  return (
    <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 col-span-1 lg:col-span-3 hover:shadow-2xl hover:shadow-primary/10 transition-shadow duration-500 flex flex-col">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold text-primary">Occupancy <span className="italic font-light">Trends</span></h3>
          <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold mt-1.5">Guest Footfall Trajectory</p>
        </div>
        
        <div className="flex bg-secondary/30 p-1 rounded-xl border border-primary/5">
          {[
            { id: '7d', label: '7 Days' },
            { id: '1m', label: '1 Month' },
            { id: '6m', label: '6 Months' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id)}
              className={`px-4 py-2 rounded-lg text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                timeRange === tab.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-foreground/50 hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="w-full flex-1" style={{ height: '320px', minHeight: '320px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFootfall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a5734d" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#a5734d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(31, 61, 51, 0.08)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718096', fontWeight: 600 }} dy={15} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#718096', fontWeight: 600 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="footfall" 
              stroke="#a5734d" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorFootfall)" 
              activeDot={{ r: 6, fill: '#1f3d33', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function RoomPopularityChart({ data }) {
  return (
    // THE FIX: Hard-capped height to h-[280px]
    <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-shadow duration-500 flex flex-col h-[280px]">
      <h3 className="text-[13px] font-bold text-primary uppercase tracking-widest mb-1">Room Popularity</h3>
      <p className="text-[8px] uppercase tracking-widest text-foreground/50 font-bold mb-4">Historical Booking Distribution</p>
      
      {data?.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-foreground/30 uppercase tracking-widest">No Bookings Yet</div>
      ) : (
        <>
          <div className="flex-1 w-full relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4 shrink-0">
            {data?.slice(0,4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest font-bold text-foreground/70">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function BookingStatusChart({ data }) {
  return (
    // THE FIX: Hard-capped height to h-[280px]
    <div className="bg-white/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-primary/5 shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-shadow duration-500 flex flex-col h-[280px]">
      <h3 className="text-[13px] font-bold text-primary uppercase tracking-widest mb-1">Booking Status</h3>
      <p className="text-[8px] uppercase tracking-widest text-foreground/50 font-bold mb-4">Current Active Pipeline</p>
      
      <div className="flex-1 w-full min-h-0">
        {data?.length === 0 ? (
           <div className="flex-1 h-full flex items-center justify-center text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Pipeline Empty</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(31, 61, 51, 0.08)" />
              <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#718096', fontWeight: 600 }} />
              <Tooltip cursor={{fill: 'rgba(31, 61, 51, 0.03)'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={40}>
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}