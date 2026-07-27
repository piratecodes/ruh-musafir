import { useState, useEffect } from 'react'
import { Loader2, Lock, Unlock, ReceiptText } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'

// Components
import KpiCards from '@/components/treasury/KpiCards'
import RevenueCharts from '@/components/treasury/RevenueCharts'
import { ShiftModal, ExpenseModal } from '@/components/treasury/TreasuryModals'
import AuditTrail from '@/components/treasury/AuditTrail' // <-- NEW IMPORT ADDED HERE

const toastStyle = { background: '#ffffff', color: '#112440', border: '1px solid rgba(17, 36, 64, 0.1)', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }

export default function TreasuryPage() {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Modals State
  const [shiftModalConfig, setShiftModalConfig] = useState({ isOpen: false, type: 'OPEN' })
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)
  const [auditData, setAuditData] = useState(null)

  const loadMetrics = async () => {
    setIsLoading(true)
    try {
        const resMetrics = await fetchClient('/treasury/metrics')
        const resAudit = await fetchClient('/treasury/audit-logs') // FETCH NEW LOGS
        
        if (resMetrics?.data) setMetrics(resMetrics.data)
        if (resAudit?.data) setAuditData(resAudit.data)
    } catch (error) {
        // Fixed the shorthand syntax here to prevent crashes
        toast.error('Failed to load financial metrics', { style: toastStyle })
    } finally {
        setIsLoading(false)
    }
  }

  useEffect(() => { loadMetrics() }, [])

  // --- API HANDLERS ---
  const handleShiftSubmit = async (amount) => {
    setIsProcessing(true)
    try {
      const endpoint = shiftModalConfig.type === 'OPEN' ? '/treasury/shift/open' : '/treasury/shift/close'
      const payload = shiftModalConfig.type === 'OPEN' ? { startingCash: amount } : { actualCash: amount }
      
      const res = await fetchClient(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      toast.success(res.message, { style: toastStyle })
      setShiftModalConfig({ ...shiftModalConfig, isOpen: false })
      loadMetrics() // Refresh dashboard
    } catch (e) {
      toast.error(e.message || 'Shift operation failed', { style: toastStyle })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExpenseSubmit = async (data) => {
    setIsProcessing(true)
    try {
      await fetchClient('/treasury/expenses', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Petty cash logged successfully', { style: toastStyle })
      setIsExpenseOpen(false)
      loadMetrics() // Refresh cash drawer total
    } catch (e) {
      toast.error('Failed to log expense', { style: toastStyle })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-350 mx-auto pb-12 h-full">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white/40 p-6 rounded-4xl border border-primary/5 shadow-sm shrink-0">
        <div>
          <h2 className="text-3xl lg:text-4xl text-primary font-bold tracking-tight leading-none">Treasury <span className="italic font-light text-foreground/60">& Billing</span></h2>
          <p className="text-sm text-foreground/60 font-serif italic mt-2">Financial command center, analytics, and shift reconciliation.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShiftModalConfig({ isOpen: true, type: 'OPEN' })} className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] uppercase tracking-widest font-bold transition-colors shadow-sm">
            <Unlock size={14}/> Open Shift
          </button>
          <button onClick={() => setShiftModalConfig({ isOpen: true, type: 'CLOSED' })} className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl text-[9px] uppercase tracking-widest font-bold transition-colors shadow-sm">
            <Lock size={14}/> Close (EOD)
          </button>
          <button onClick={() => setIsExpenseOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-[9px] uppercase tracking-widest font-bold shadow-lg shadow-primary/20 transition-colors ml-2">
            <ReceiptText size={14}/> Log Expense
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : metrics ? (
        <div className="space-y-6">
          <KpiCards kpis={metrics.kpis} />
          <RevenueCharts timeline={metrics.timeline} distribution={metrics.distribution} />
          
          {/* THE FIX: Replaced Placeholder with the actual AuditTrail component */}
          <AuditTrail auditData={auditData} />
          
        </div>
      ) : (
        <div className="text-center py-20 text-sm font-bold text-foreground/50 uppercase tracking-widest">Failed to load data.</div>
      )}

      {/* MODALS */}
      <ShiftModal 
        isOpen={shiftModalConfig.isOpen} 
        type={shiftModalConfig.type}
        onClose={() => setShiftModalConfig({ ...shiftModalConfig, isOpen: false })} 
        onSubmit={handleShiftSubmit}
        isProcessing={isProcessing}
      />

      <ExpenseModal 
        isOpen={isExpenseOpen} 
        onClose={() => setIsExpenseOpen(false)} 
        onSubmit={handleExpenseSubmit}
        isProcessing={isProcessing}
      />

    </div>
  )
}