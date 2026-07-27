import { create } from 'zustand'
import { fetchClient } from '@/api/fetchClient'

export const useAuthStore = create((set) => ({
  user: null, 
  isCheckingAuth: true, // We start as 'true' so the screen loads before guessing!
  
  setAuth: (userData) => set({ user: userData }),
  
  // The magic function that runs on page refresh
  checkAuth: async () => {
    try {
      // Hit the new '/me' endpoint. The browser sends the cookie automatically!
      const response = await fetchClient('/auth/me', { method: 'GET' });
      if (response.success) {
        
        // THE FIX: Strict Security Bouncer! Reject Guests attempting to enter Admin.
        if (response.data.role === 'GUEST') {
          console.warn("Security Alert: Guest token detected in Admin Panel. Access Denied.");
          set({ user: null });
        } else {
          set({ user: response.data });
        }

      }
    } catch (error) {
      // If it fails (cookie expired/missing), wipe the user
      set({ user: null });
    } finally {
      // We are done checking!
      set({ isCheckingAuth: false });
    }
  },

  logout: async () => {
    try {
      await fetchClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error("Logout failed:", e);
    }
    set({ user: null });
    window.location.href = '/login';
  }
}))