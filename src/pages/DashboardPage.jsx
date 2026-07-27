import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Power, Save } from 'lucide-react'
import { fetchClient } from '@/api/fetchClient'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { TopStats, QuickLinks, NotificationsList, LiveCafePipeline, RoomReadinessMonitor } from '@/components/dashboard/DashboardWidgets' 
import { FootfallTrendChart, RoomPopularityChart, BookingStatusChart } from '@/components/dashboard/DashboardCharts'

import useDocumentMeta from '@/hooks/useDocumentMeta';

const frontendMocks = {
  trend: {
    '7d': [
      { date: 'Mon', footfall: 12 }, { date: 'Tue', footfall: 8 },
      { date: 'Wed', footfall: 15 }, { date: 'Thu', footfall: 22 },
      { date: 'Fri', footfall: 35 }, { date: 'Sat', footfall: 42 }, { date: 'Sun', footfall: 28 },
    ],
    '1m': [
      { date: 'Week 1', footfall: 85 }, { date: 'Week 2', footfall: 110 },
      { date: 'Week 3', footfall: 95 }, { date: 'Week 4', footfall: 130 },
    ],
    '6m': [
      { date: 'Dec 25', footfall: 320 }, { date: 'Jan 26', footfall: 410 },
      { date: 'Feb 26', footfall: 280 }, { date: 'Mar 26', footfall: 520 },
      { date: 'Apr 26', footfall: 610 }, { date: 'May 26', footfall: 580 },
    ]
  },
  popularity: [
    { name: 'The Cedar Room', value: 35 }, { name: 'The Cloud Suite', value: 25 },
    { name: 'The Valley Suite', value: 20 }, { name: 'The Community Bunk', value: 20 },
  ],
  status: [
    { status: 'pending', count: 6 }, { status: 'confirmed', count: 12 }, { status: 'checked in', count: 4 },
  ],
  notifications: [
    { title: 'New Web Booking', message: 'Sarah Connor booked The Cloud Suite', time: new Date(Date.now() - 600000).toISOString(), type: 'info' },
    { title: 'POS Alert', message: 'Table 4 requested Room Service', time: new Date(Date.now() - 3600000).toISOString(), type: 'order' },
  ],
  activeOrders: [],
  roomStatuses: []
}

export default function DashboardPage() {
  useDocumentMeta('Dashboard | Ruh Musafir', 'Overview of key metrics, operational trends, and notifications for Ruh Musafir hotel management.')

  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [timeRange, setTimeRange] = useState('6m')

  // --- MAINTENANCE SWITCH STATE ---
  const [maintenance, setMaintenance] = useState({ isMaintenanceMode: false, maintenanceMessage: '' })
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        const [dashRes, maintenanceRes] = await Promise.all([
          fetchClient(`/dashboard/overview?range=${timeRange}`),
          fetchClient('/settings/maintenance')
        ])
        
        if (dashRes.success) {
          const apiData = dashRes.data
          setData({
            stats: apiData.stats,
            trend: apiData.trend?.length > 0 ? apiData.trend : frontendMocks.trend[timeRange],
            roomPopularity: apiData.roomPopularity?.length > 0 ? apiData.roomPopularity : frontendMocks.popularity,
            bookingStatus: apiData.bookingStatus?.some(s => s.count > 0) ? apiData.bookingStatus : frontendMocks.status,
            notifications: apiData.notifications?.length > 0 ? apiData.notifications : frontendMocks.notifications,
            activeOrders: apiData.activeOrders || frontendMocks.activeOrders,
            roomStatuses: apiData.roomStatuses || frontendMocks.roomStatuses
          })
        }

        if (maintenanceRes) {
            setMaintenance({
              isMaintenanceMode: maintenanceRes.isMaintenanceMode || false,
              maintenanceMessage: maintenanceRes.maintenanceMessage || 'Operations halted due to unforeseen weather conditions.'
            })
        }
      } catch (error) {
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [timeRange]) 

  const saveMaintenanceState = async (newState) => {
    setIsSavingMaintenance(true)
    try {
      await fetchClient('/settings/maintenance', {
        method: 'PATCH',
        body: JSON.stringify(newState)
      })
      setMaintenance(newState)
      toast.success(newState.isMaintenanceMode ? 'MAINTENANCE MODE ACTIVATED' : 'Operations Normalized', {
        style: { background: newState.isMaintenanceMode ? '#ef4444' : '#10b981', color: '#fff', fontWeight: 'bold' }
      })
    } catch (err) {
      toast.error('Failed to update system state')
    } finally {
      setIsSavingMaintenance(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="h-[80vh] flex flex-col gap-4 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] uppercase tracking-widest font-bold text-primary/50 animate-pulse">Syncing Mission Control...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-350 mx-auto pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white/40 p-8 rounded-4xl border border-primary/5 shadow-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-2">
            Welcome back, {user?.firstName || 'Admin'}
          </p>
          <h2 className="text-3xl lg:text-5xl text-primary font-bold tracking-tight leading-none">
            Mission <span className="italic font-light text-foreground/60">Control</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-foreground/50 bg-white px-4 py-2 rounded-full border border-primary/5 shadow-sm">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          )}
          {isLoading ? 'SYNCING...' : 'LIVE SYSTEM SYNC'}
        </div>
      </div>

      {/* --- MAINTENANCE OVERRIDE PANEL --- */}
      {/* <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${maintenance.isMaintenanceMode ? 'bg-red-50 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-white border-primary/10 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${maintenance.isMaintenanceMode ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/5 text-primary/40'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold uppercase tracking-widest ${maintenance.isMaintenanceMode ? 'text-red-600' : 'text-primary'}`}>
                Global Booking Kill-Switch
              </h3>
              <p className="text-xs text-foreground/60 mt-1 font-medium">Halt all frontend reservations during severe weather or emergencies.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <input 
              type="text" 
              value={maintenance.maintenanceMessage}
              onChange={(e) => setMaintenance({ ...maintenance, maintenanceMessage: e.target.value })}
              placeholder="Public emergency message..."
              className={`flex-1 md:w-80 px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-colors ${maintenance.isMaintenanceMode ? 'border-red-300 bg-white text-red-900 focus:border-red-500' : 'border-primary/10 focus:border-accent'}`}
            />
            <button 
              onClick={() => saveMaintenanceState({ ...maintenance, isMaintenanceMode: !maintenance.isMaintenanceMode })}
              disabled={isSavingMaintenance}
              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md ${maintenance.isMaintenanceMode ? 'bg-foreground text-white hover:bg-black' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
              {isSavingMaintenance ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
              {maintenance.isMaintenanceMode ? 'Deactivate' : 'Trigger Lockdown'}
            </button>
          </div>
        </div>
      </div> */}

      <TopStats stats={data?.stats} />

      {/* CHARTS & OPERATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Footfall Trend (Full Width) */}
        <FootfallTrendChart 
          data={data?.trend} 
          timeRange={timeRange} 
          setTimeRange={setTimeRange} 
        />

        {/* Mid-Section Split */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RoomPopularityChart data={data?.roomPopularity} />
            <BookingStatusChart data={data?.bookingStatus} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <LiveCafePipeline orders={data?.activeOrders} />
            <RoomReadinessMonitor rooms={data?.roomStatuses} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-1 flex flex-col gap-8 h-full">
          <div className="h-70 w-full shrink-0">
            <QuickLinks />
          </div>
          <div className="h-70 w-full shrink-0 ">
            <NotificationsList notifications={data?.notifications} />
          </div>
        </div>
      </div>


      {/* --- MAINTENANCE OVERRIDE PANEL --- */}
      <div className={`p-6 rounded-3xl border-2 transition-all duration-500 ${maintenance.isMaintenanceMode ? 'bg-red-50 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-white border-primary/10 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${maintenance.isMaintenanceMode ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/5 text-primary/40'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold uppercase tracking-widest ${maintenance.isMaintenanceMode ? 'text-red-600' : 'text-primary'}`}>
                Global Booking Kill-Switch
              </h3>
              <p className="text-xs text-foreground/60 mt-1 font-medium">Halt all frontend reservations during severe weather or emergencies.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <input 
              type="text" 
              value={maintenance.maintenanceMessage}
              onChange={(e) => setMaintenance({ ...maintenance, maintenanceMessage: e.target.value })}
              placeholder="Public emergency message..."
              className={`flex-1 md:w-80 px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-colors ${maintenance.isMaintenanceMode ? 'border-red-300 bg-white text-red-900 focus:border-red-500' : 'border-primary/10 focus:border-accent'}`}
            />
            <button 
              onClick={() => saveMaintenanceState({ ...maintenance, isMaintenanceMode: !maintenance.isMaintenanceMode })}
              disabled={isSavingMaintenance}
              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md ${maintenance.isMaintenanceMode ? 'bg-foreground text-white hover:bg-black' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
              {isSavingMaintenance ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
              {maintenance.isMaintenanceMode ? 'Deactivate' : 'Trigger Lockdown'}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  )
}