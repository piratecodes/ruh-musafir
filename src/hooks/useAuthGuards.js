import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';

/**
 * GUEST GUARD: Use this on Login & Signup pages.
 * If a logged-in user tries to visit them, it kicks them to the dashboard.
 */
export const useGuestGuard = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/'); // Redirect to home/dashboard if already logged in
    }
  }, [isAuthenticated, router]);
  
  return { isAuthenticated };
};

/**
 * AUTH GUARD: Use this on protected pages (like /dashboard or /profile).
 * If an unauthenticated user tries to visit, it kicks them to login.
 */
export const useAuthGuard = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      // Phase 2 Prep: We pass the current URL they were trying to visit
      // so we can send them back there after they log in!
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, router, pathname]);

  return { isAuthenticated };
};