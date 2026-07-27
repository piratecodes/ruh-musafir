import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function GuestGuard() {
  const user = useAuthStore((state) => state.user);
  
  // If they are already logged in, they shouldn't see the Login page. 
  // Send them straight to the Dashboard.
  
  // THE FIX: Only send them to Dashboard if they are an ADMIN or STAFF!
  if (user && user.role !== 'GUEST') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}