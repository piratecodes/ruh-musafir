import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../slices/authSlice'; 

// 1. Define your standard base query
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  credentials: 'include', 
});

// 2. Create the Interceptor Wrapper
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // 3. Catch the 401 Unauthorized error globally
  if (result.error && result.error.status === 401) {
    console.warn('Session expired or invalid. Auto-logging out...');
    
    // A. Clear the Redux auth state instantly
    api.dispatch(logout()); 

    // B. Ping the backend to forcefully destroy the HttpOnly cookie
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Failed to clear cookie on backend', e);
    }

    // C. THE FIX: Only redirect if we aren't already on the login page!
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      // Slight delay to guarantee Redux state settles before browser navigates
      setTimeout(() => {
        window.location.href = '/login?session_expired=true';
      }, 100);
    }
  }

  return result;
};

// 4. Use the wrapped query in your API creation
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth, // <-- Attach the interceptor here!
  tagTypes: ['User', 'Bookings', 'Order', 'Menu', 'Inquiry', 'Room', 'Experience'],
  endpoints: () => ({}),
});