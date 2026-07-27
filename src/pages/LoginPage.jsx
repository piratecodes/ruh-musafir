import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mountain } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient' 
import { useAuthStore } from '@/store/authStore'

import useDocumentMeta from '@/hooks/useDocumentMeta';

export default function LoginPage() {
  // Title & Description for SEO (and nice browser tab titles!)
  useDocumentMeta(" Admin Login | Ruh Musafir ", "Secure login portal for Ruh Musafir hotel management dashboard access");

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  
  const setAuth = useAuthStore((state) => state.setAuth)
  const checkAuth = useAuthStore((state) => state.checkAuth)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetchClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (response.success) {
        
        // 🚨 1. THE STRICT BOUNCER 🚨
        // If the database says this is a GUEST, reject them instantly!
        if (response.data.role === 'GUEST') {
          toast.error('Access Denied: You do not have Admin privileges.', { duration: 4000 });
          
          // Silently destroy the cookie the backend just tried to set
          await fetchClient('/auth/logout', { method: 'POST' }).catch(() => {});
          
          setLoading(false);
          return; // <-- This STOPS the code. The "Welcome" toast will never fire.
        }

        // ✅ 2. SUCCESSFUL ADMIN / STAFF LOGIN
        sessionStorage.setItem('ruh_token', response.data.access_token)
        
        // Extract token and pass the ENTIRE user data object to Zustand
        const { access_token, ...fullUserData } = response.data;
        setAuth(fullUserData);

        // Fetch the full profile in the background so the Sidebar updates instantly
        checkAuth();

        // 📢 3. THE DYNAMIC TOAST (FIXED)
        // THE FIX: We now pull the exact firstName from the database. 
        // If it's missing, it gracefully falls back to their role.
        const greetingName = response.data.firstName || response.data.role.replace('_', ' ');
        toast.success(`Welcome back, ${greetingName}!`)
        
        navigate('/')
        
      } else {
        toast.error(response.message || 'Invalid credentials')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">

    {/* Center Area */}
    <div className="flex-1 flex items-center justify-center relative z-10">
      <div className="p-10 md:p-12 rounded-[2.5rem] max-w-md w-full border border-primary/10 shadow-2xl bg-white/70 backdrop-blur-xl">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-accent text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mountain size={40} />
          </div>

          <h1 className="text-4xl text-primary font-bold tracking-tight mb-2">
            Admin Access
          </h1>

          <p className="text-foreground/60 text-base font-light italic">
            Mission Control for Ruh Musafir
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-4">
              Admin Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm text-foreground"
              placeholder="admin@ruhmusafir.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-4">
              Security Key
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm text-foreground"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 mt-4 text-sm uppercase tracking-[0.2em] font-bold text-white bg-primary rounded-2xl hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </button>
        </form>

      </div>
    </div>

    {/* Footer */}
    <footer className="w-full text-sm text-center py-1 text-muted bg-secondary relative z-10">
      <p className='py-1'><b className='font-medium'>Developed By:</b>{" "}<a href="https://www.linkedin.com/in/subhamsarkar99/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" >Subham Sarkar</a></p>
      <p>&copy; {new Date().getFullYear()} Ruh Musafir. All rights reserved.</p>
    </footer>

  </main>
  )
}