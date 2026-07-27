import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function AuthGuard() {
  const user = useAuthStore((state) => state.user);
  
  // If no user is in memory, kick them to the login screen
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // THE FIX: Double Security. If a guest somehow gets past the store, kick them out.
  if (user.role === 'GUEST') {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, let them see the protected dashboard!
  return <Outlet />;
}