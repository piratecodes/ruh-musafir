import { createSlice } from '@reduxjs/toolkit';

// --- Pure JS Cookie Helpers ---
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name, value, days = 7) => {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  // THE FIX: 'Lax' ensures the cookie survives when you navigate between pages
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  // THE FIX: The path and SameSite must match exactly to destroy the cookie
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
};

// Initial state must be completely clean for Next.js Server-Side Rendering
const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // Save data strictly to Cookies for 7 Days
      if (typeof window !== 'undefined') {
        setCookie('ruh_token', action.payload.token, 7);
        setCookie('ruh_user', JSON.stringify(action.payload.user), 7);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      if (typeof window !== 'undefined') {
        deleteCookie('ruh_token');
        deleteCookie('ruh_user');
      }
    },
    // THE FIX: The Client-Side Syncer. Runs once the browser takes over!
    restoreSession: (state) => {
      if (typeof window !== 'undefined') {
        const token = getCookie('ruh_token');
        const userStr = getCookie('ruh_user');
        
        if (token && userStr) {
          state.token = token;
          state.user = JSON.parse(userStr);
          state.isAuthenticated = true;
        } else {
          state.token = null;
          state.user = null;
          state.isAuthenticated = false;
        }
      }
    }
  },
});

export const { setCredentials, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;