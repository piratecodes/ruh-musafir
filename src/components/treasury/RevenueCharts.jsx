import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// const PIE_COLORS = {
//   'CASH': '#10b981', // Emerald
//   'UPI': '#3b82f6',  // Blue
//   'CARD': '#8b5cf6', // Purple
//   'NETBANKING': '#f59e0b' // Amber
// }
const PIE_COLORS = {
  'Revenue': '#3b82f6', // Emerald
  'Expenses': '#ef4444',  // Red
  'Dues': '#f59e0b', // Amber
}

export default function RevenueCharts({ timeline = [], distribution = [] }) {
  
  // THE FIX: Bulletproof tooltip that verifies payload exists and is an array before trying to read it
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && Array.isArray(payload) && payload.length > 0) {
      const val = payload[0]?.value || 0;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-primary/10 shadow-xl">
          <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">{label}</p>
          <p className="text-lg font-black text-primary">₹{val.toLocaleString()}</p>
        </div>
      )
    }
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT: 30-DAY REVENUE TREND */}
      <div className="lg:col-span-2 bg-white/50 backdrop-blur-xl p-6 rounded-4xl border border-primary/5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Revenue Trend (30 Days)</h3>
        <div className="flex-1 min-h-75 w-full">
          {timeline.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-foreground/40 uppercase tracking-widest">Loading Timeline...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c885" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00c885" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#00c885" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* RIGHT: PAYMENT DISTRIBUTION */}
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-4xl border border-primary/5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Payment Distribution</h3>
        
        {distribution.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs font-bold text-foreground/40 uppercase tracking-widest">No Transactions Yet</div>
        ) : (
          <>
            <div className="flex-1 min-h-50 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Net Balance</span>
                <span className="text-xl font-black text-primary">
                  {/* ₹{distribution.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()} */}
                  ₹{( (distribution.find(d => d.name === 'Revenue')?.value || 0) - (distribution.find(d => d.name === 'Expenses')?.value || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {distribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[entry.name] || '#9ca3af' }}></div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-foreground/50">{entry.name}</p>
                    <p className="text-xs font-bold text-primary">₹{entry.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}