import { Wallet, CreditCard, Landmark, Banknote, TrendingDown } from 'lucide-react' // THE FIX: Added TrendingDown for Expenses

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  const cards = [
    { title: 'Gross Revenue', value: kpis.totalRevenue, icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'Cash in Drawer', value: kpis.cashTotal, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Digital / Bank', value: kpis.digitalTotal, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    // THE FIX: Added the Total Expenses KPI Card
    { title: 'Total Expenses', value: kpis.totalExpenses, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { title: 'Pending Dues', value: kpis.pendingDues, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ]

  return (
    // THE FIX: Changed to lg:grid-cols-5 so all 5 cards sit in one perfect row on large screens
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white/80 backdrop-blur-xl p-6 rounded-4xl border border-primary/5 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/50 mb-1">{card.title}</p>
            <p className="text-3xl font-black text-[#4c554c]">₹{card.value?.toLocaleString() || 0}</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${card.bg} ${card.color} ${card.border}`}>
            <card.icon size={24} strokeWidth={2.5} />
          </div>
        </div>
      ))}
    </div>
  )
}