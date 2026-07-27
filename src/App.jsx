import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Mountain } from 'lucide-react'

// Guards
import AuthGuard from '@/components/common/AuthGuard'
import GuestGuard from '@/components/common/GuestGuard'

// Layouts & Pages
import DashboardLayout from '@/layouts/DashboardLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import RoomsPage from '@/pages/RoomsPage' 
import BookingsPage from '@/pages/BookingsPage'
import FrontDeskPage from '@/pages/FrontDeskPage'
import ExperiencesPage from '@/pages/ExperiencesPage'
import CafePosPage from '@/pages/CafePosPage'
import ContactPage from '@/pages/ContactPage'
import TreasuryPage from '@/pages/TreasuryPage'
import SettingsPage from '@/pages/SettingsPage' 

// Error Boundary
import ErrorPage from '@/components/common/ErrorBoundary'

const router = createBrowserRouter([
  {
    // THE GUEST ZONE
    element: <GuestGuard />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      }
    ]
  },
  {
    // THE PROTECTED ZONE
    element: <AuthGuard />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <DashboardLayout />, 
        children: [
          { 
            path: '/', 
            element: <DashboardPage /> 
          },
          {
            path: '/front-desk',
            element: <FrontDeskPage />
          },
          {
            path: '/rooms',            // <-- NEW ROUTE
            element: <RoomsPage />
          },
          {
            path: '/bookings',         // <-- NEW ROUTE
            element: <BookingsPage />
          },
          {
            path: '/experiences',
            element: <ExperiencesPage />
          },
          {
            path: '/cafe-pos',            // <-- NEW ROUTE
            element: <CafePosPage />
          },
          {
            path: '/treasury',         // <-- NEW ROUTE
            element: <TreasuryPage />
          },
          {
            path: '/contact',         // <-- NEW ROUTE
            element: <ContactPage />
          },
          {
            path: '/settings',         // <-- NEW ROUTE
            element: <SettingsPage />
          },
          // We will add /rooms, /bookings, /pos here later!
        ]
      }
    ]
  },
  // Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])

export default function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Mountain size={48} className="text-accent animate-pulse" />
        <p className="text-primary font-sans text-[10px] uppercase tracking-[0.2em] font-bold">
          Verifying Secure Session...
        </p>
      </div>
    )
  }

  
  return <RouterProvider router={router} />
}