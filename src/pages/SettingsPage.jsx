import { useState, useRef, useEffect } from 'react'
import { User, Lock, Save, Camera, RotateCcw, Check, X, MonitorSmartphone, ShieldAlert, XCircle } from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { Fragment } from 'react'
import toast from 'react-hot-toast'
import Cropper from 'react-easy-crop' 
import { useAuthStore } from '@/store/authStore'
import { fetchClient } from '@/api/fetchClient'

import useDocumentMeta from '@/hooks/useDocumentMeta';

// --- CUSTOM TOAST THEME ---
const toastStyle = {
  background: '#ffffff',
  color: '#112440', // primary text color
  border: '1px solid rgba(17, 36, 64, 0.1)',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  borderRadius: '1rem',
  fontSize: '11px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}

// --- CANVAS API UTILITIES FOR CROPPING ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95)
  })
}

// --- HELPER TO GET IMAGE URL ---
export const getImageUrl = (pic) => {
  if (!pic) return null;
  if (pic.startsWith('http')) return pic;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  return `${baseUrl.replace('/api/v1', '')}/uploads/${pic}`;
};

export default function SettingsPage() {
  // Title & Description for SEO (and nice browser tab titles!)
  useDocumentMeta(" Account Settings | Ruh Musafir ", "Update your account settings and preferences for Ruh Musafir hotel management.");

  const { user, setAuth } = useAuthStore()
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    bio: '',
    profilePic: ''
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // FIX: Sync state when 'user' finishes loading from Zustand
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        designation: user.designation || '',
        bio: user.bio || '',
        profilePic: user.profilePic || ''
      })
    }
  }, [user])

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Sessions State
  const [sessions, setSessions] = useState([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  // Cropper States
  const fileInputRef = useRef(null)
  const [imageToCrop, setImageToCrop] = useState(null) 
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  
  // Final Image States
  const [finalCroppedBlob, setFinalCroppedBlob] = useState(null) 
  const [previewUrl, setPreviewUrl] = useState(null) 

  // --- FETCH SESSIONS ---
  const fetchSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const response = await fetchClient('/auth/sessions')
      if (response.success) setSessions(response.data)
    } catch (error) {
      toast.error('Failed to load active sessions', { style: toastStyle })
    } finally {
      setIsLoadingSessions(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  // --- IMAGE HANDLING LOGIC ---
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File is too large! Max 5MB.", { style: toastStyle })
    }
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result)
      setIsCropModalOpen(true)
    })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleApplyCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      setFinalCroppedBlob(croppedBlob)
      setPreviewUrl(URL.createObjectURL(croppedBlob))
      setIsCropModalOpen(false)
      setImageToCrop(null) 
    } catch (e) {
      toast.error("Failed to crop image.", { style: toastStyle })
    }
  }

  // --- FORM SUBMISSION ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const payload = new FormData()
      payload.append('name', `${profileData.firstName} ${profileData.lastName}`.trim())
      payload.append('email', profileData.email)
      payload.append('phone', profileData.phone)
      payload.append('designation', profileData.designation)
      payload.append('bio', profileData.bio)
      
      if (finalCroppedBlob) {
        payload.append('photo', finalCroppedBlob, 'profile.jpg') 
      }

      const response = await fetchClient('/users/me/profile', {
        method: 'PATCH',
        body: payload 
      })
      
      if (response.success) {
        setAuth({ ...user, ...response.data })
        toast.success('Profile updated successfully!', { style: toastStyle })
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile', { style: toastStyle })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match!', { style: toastStyle })
    }
    
    setIsSavingPassword(true)
    try {
      const response = await fetchClient('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      if (response.success) {
        toast.success('Password changed successfully!', { style: toastStyle })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      toast.error(error.message || 'Failed to change password', { style: toastStyle })
    } finally {
      setIsSavingPassword(false)
    }
  }

  // --- SESSION REVOCATION ---
  const handleRevokeSession = async (id) => {
    try {
      const response = await fetchClient(`/auth/sessions/${id}`, { method: 'DELETE' })
      if (response.success) {
        toast.success('Session revoked', { style: toastStyle })
        setSessions(sessions.filter(s => s.id !== id))
      }
    } catch (error) {
      toast.error('Failed to revoke session', { style: toastStyle })
    }
  }

  const handleRevokeAllOther = async () => {
    try {
      const response = await fetchClient('/auth/sessions', { method: 'DELETE' })
      if (response.success) {
        toast.success('All other sessions revoked', { style: toastStyle })
        fetchSessions()
      }
    } catch (error) {
      toast.error('Failed to revoke sessions', { style: toastStyle })
    }
  }

  const displayImage = previewUrl ? previewUrl : getImageUrl(profileData.profilePic)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-white/40 p-8 rounded-4xl border border-primary/5 shadow-sm">
        <h2 className="text-3xl lg:text-4xl text-primary font-bold tracking-tight">
          Account <span className="italic font-light text-foreground/60">Settings</span>
        </h2>
        <p className="text-sm text-foreground/60 font-serif italic mt-2">
          Manage your personal details and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Card */}
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-4xl border border-primary/10 shadow-lg">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-primary/5">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">Personal Details</h3>
              <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold">Update your identity</p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-5">
            
            {/* Avatar Upload UI */}
            <div className="flex flex-col items-center mb-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative h-28 w-28 rounded-full bg-secondary/50 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden cursor-pointer group"
              >
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="h-full w-full object-cover group-hover:opacity-50 transition-opacity" />
                ) : (
                  <User size={48} className="text-primary/30 group-hover:opacity-50 transition-opacity" />
                )}
                <div className="absolute inset-0 bg-primary/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-bold mt-3">Click to upload (Max 5MB)</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">First Name</label>
                <input type="text" value={profileData.firstName} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">Last Name</label>
                <input type="text" value={profileData.lastName} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">Email Address</label>
                <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm opacity-50 cursor-not-allowed" disabled />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">Phone</label>
                <input type="text" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">Job Title / Designation</label>
              <input type="text" value={profileData.designation} onChange={(e) => setProfileData({...profileData, designation: e.target.value})} placeholder="e.g. Mastermind" className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm" />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">Short Bio</label>
              <textarea rows="3" value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} placeholder="A little bit about yourself..." className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm resize-none" />
            </div>

            <button type="submit" disabled={isSavingProfile} className="w-full flex items-center justify-center gap-2 py-4 mt-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white bg-primary rounded-2xl hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-50">
              <Save size={16} />
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* --- RIGHT COLUMN (Password & Sessions) --- */}
        <div className="space-y-6 h-fit lg:sticky lg:top-8">
          
          {/* Password Card */}
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-4xl border border-primary/10 shadow-lg">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-primary/5">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">Security</h3>
                <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold">Change your password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">Current Password</label>
                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">New Password</label>
                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-foreground/70 font-bold ml-2">Confirm New Password</label>
                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-sm" required />
              </div>
              <button type="submit" disabled={isSavingPassword} className="w-full flex items-center justify-center gap-2 py-4 mt-4 text-[10px] uppercase tracking-[0.2em] font-bold text-white bg-accent rounded-2xl hover:bg-accent/80 transition-colors shadow-lg disabled:opacity-50">
                <Lock size={16} />
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Active Sessions Card */}
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-4xl border border-primary/10 shadow-lg">
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-primary/5 gap-4 flex-col sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <MonitorSmartphone size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Active Sessions</h3>
                  <p className="text-[10px] uppercase tracking-widest text-foreground/50 font-bold">Manage logged-in devices</p>
                </div>
              </div>
              <button 
                onClick={handleRevokeAllOther}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[9px] uppercase tracking-widest font-bold transition-colors border border-red-100 w-full sm:w-auto justify-center"
              >
                <ShieldAlert size={14} /> Revoke Others
              </button>
            </div>

            <div className="space-y-3 h-32 pr-2.5 overflow-y-scroll scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
              {isLoadingSessions ? (
                <p className="text-sm text-foreground/60 text-center py-4">Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-foreground/60 text-center py-4">No active sessions found.</p>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-primary/5 hover:border-primary/20 transition-colors">
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-primary flex items-center gap-2 truncate">
                        {session.device}
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[8px] uppercase tracking-widest border border-emerald-200">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-foreground/60 mt-1 truncate">
                        IP: {session.ipAddress} • {new Date(session.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <button 
                        onClick={() => handleRevokeSession(session.id)} 
                        className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors shrink-0 ml-2" 
                        title="Revoke Session"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- CROPPER DIALOG MODAL --- */}
      <Transition show={isCropModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setIsCropModalOpen(false)}>
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl transition-all border border-primary/10">
                  
                  <div className="bg-primary px-6 py-5 text-white flex items-center justify-between">
                    <DialogTitle className="text-lg font-display tracking-tight flex items-center gap-2">
                      <Camera size={20} className="text-secondary" /> Adjust Photo
                    </DialogTitle>
                    <button onClick={() => { setIsCropModalOpen(false); setImageToCrop(null); }} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
                  </div>

                  <div className="p-6">
                    <div className="relative h-72 w-full bg-foreground rounded-2xl overflow-hidden mb-6 border border-primary/10">
                      <Cropper
                        image={imageToCrop}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} 
                        cropShape="round" 
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                    
                    <div className="mb-8 px-4">
                      <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mb-3 block text-center">Zoom</label>
                      <input 
                        type="range" 
                        value={zoom} 
                        min={1} 
                        max={3} 
                        step={0.1} 
                        onChange={(e) => setZoom(e.target.value)} 
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" 
                      />
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setIsCropModalOpen(false); setImageToCrop(null); }} className="flex-1 py-4 bg-secondary/50 hover:bg-secondary text-primary text-[10px] uppercase tracking-[0.2em] font-bold rounded-2xl flex justify-center items-center gap-2 transition-colors">
                        <RotateCcw size={16} /> Cancel
                      </button>
                      <button type="button" onClick={handleApplyCrop} className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-2xl flex justify-center items-center gap-2 transition-colors shadow-lg shadow-primary/30">
                        <Check size={16} strokeWidth={3} /> Apply Crop
                      </button>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}