"use client";

import { useState, useEffect, Fragment, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Phone, Calendar, Edit2, Shield, LogOut, Home, Compass, BookOpen, ArrowRight, Settings, Camera, X, Crop, Check, Lock, AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import toast from 'react-hot-toast';

// --- NEW CROPPER IMPORTS ---
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// API & State Imports
import { useAuthGuard } from '@/hooks/useAuthGuards';
import { logout as clearLocalAuth } from '@/store/slices/authSlice';
import { useLogoutMutation, useUpdatePasswordMutation, useDeleteAccountMutation } from '@/store/api/authApi';
import { useUpdateProfileMutation } from '@/store/api/userApi';
import { useGetMyBookingsQuery } from '@/store/api/bookingsApi'; 
import getCroppedImg from '@/utils/cropImage';

export default function ProfilePage() {
  useAuthGuard();
  
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');

  // --- FIXED IMAGE & CROPPER STATES ---
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [aspect, setAspect] = useState(1); // 1 = square, undefined = free style
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // Delete Account States
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  // API Hooks
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [logoutApi] = useLogoutMutation();
  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdatePasswordMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();
  
  // Fetch user bookings to check for active ones
  const { data: bookingsResponse } = useGetMyBookingsQuery();
  const activeBookings = bookingsResponse?.data?.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING') || [];

  // Password component states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' }); 

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLocalError('');

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      if (phone) formData.append('phone', phone);
      
      if (photoFile) {
        formData.append('photo', photoFile, 'profile-pic.jpg');
      }

      await updateProfile(formData).unwrap();
      setIsEditing(false);
      setPhotoFile(null); 
    } catch (err) {
      setLocalError(err?.data?.message || 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (e) {
      console.error("Backend logout failed");
    } finally {
      dispatch(clearLocalAuth());
      router.push('/login');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match. Please try again.' });
      return;
    }

    try {
      await updatePassword({ currentPassword, newPassword }).unwrap();
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword(''); 
      setTimeout(() => setPasswordMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err?.data?.message || 'Failed to update password.' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      dispatch(clearLocalAuth());
      toast.success("Your account has been successfully deleted.");
      router.push('/');
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete account. Please try again.");
    }
  };

  // --- NEW CROPPER LOGIC ---
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      setImageToCrop(imageDataUrl);
      setIsEditing(true); 
    }
    e.target.value = ''; 
  };

  const onImageLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    imgRef.current = e.currentTarget;
    
    // Auto-center the initial crop box when the image loads
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 50 }, aspect || 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleApplyCrop = async () => {
    if (!completedCrop || !completedCrop.width || !completedCrop.height || !imgRef.current) {
      return toast.error("Please select a valid crop area.");
    }
    
    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Map on-screen crop box to the original image pixels perfectly
      const pixelCrop = {
        x: Math.round(completedCrop.x * scaleX),
        y: Math.round(completedCrop.y * scaleY),
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY),
      };

      const croppedBlob = await getCroppedImg(imageToCrop, pixelCrop);
      const file = new File([croppedBlob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold animate-pulse">
          Loading Sanctuary...
        </p>
      </div>
    );
  }

  const displayImage = previewUrl || (user.profilePic ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/uploads/${user.profilePic}` : null);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-40 pb-24">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b border-foreground/5 pb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="font-sans text-[10px] tracking-widest uppercase font-bold text-accent mb-4">Account Settings</div>
            <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-4 tracking-tight">My Profile</h1>
            <p className="font-serif text-foreground/70 text-lg font-light">Manage your personal sanctuary settings.</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-foreground font-serif text-2xl border border-foreground/10 shadow-sm overflow-hidden">
                {displayImage ? (
                  <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.firstName?.[0]?.toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                <Camera size={20} />
                <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </label>
            </div>
            <div>
              <div className="font-sans text-xs font-bold text-foreground uppercase tracking-widest mb-1">{user.firstName} {user.lastName}</div>
              <div className="font-serif text-foreground/60 text-sm">{user.email}</div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Actions */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-4xl border border-foreground/5 shadow-xl">
              <h3 className="font-sans text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-6 ml-2">Quick Access</h3>
              <div className="space-y-3">
                {[
                  { icon: BookOpen, label: "My Bookings", path: "/bookings" },
                  { icon: Home, label: "Browse Stays", path: "/rooms" },
                  { icon: Compass, label: "Experiences", path: "/experiences" }
                ].map((item, i) => (
                  <Link key={i} href={item.path} className="flex items-center justify-between p-4 rounded-2xl bg-background hover:bg-accent hover:text-white transition-all duration-300 group border border-foreground/5 hover:border-accent">
                    <div className="flex items-center gap-4">
                      <item.icon size={18} className="text-accent group-hover:text-white transition-colors" />
                      <span className="font-sans text-sm font-bold">{item.label}</span>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.button onClick={handleLogout} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full flex items-center justify-center gap-3 p-5 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all font-sans text-xs font-bold uppercase tracking-widest border border-red-500/20 shadow-sm">
              <LogOut size={16} /> Sign Out
            </motion.button>
          </div>

          {/* Main Content (Profile Form) */}
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-8 md:p-12 rounded-4xl border border-foreground/5 shadow-xl">
              <div className="flex justify-between items-center mb-10 border-b border-foreground/5 pb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-foreground/5 rounded-2xl text-foreground"><Settings size={20} /></div>
                  <h2 className="font-serif text-3xl text-foreground">Profile Details</h2>
                </div>
                
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-accent hover:opacity-70 transition-opacity font-sans text-[10px] uppercase tracking-widest font-bold px-4 py-2 bg-accent/10 rounded-full">
                    <Edit2 size={12} /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { 
                        setIsEditing(false); 
                        setFirstName(user.firstName); 
                        setLastName(user.lastName);
                        setPhone(user.phone); 
                        setPhotoFile(null);
                        setPreviewUrl(null);
                        setLocalError('');
                      }}
                      className="px-5 py-2.5 rounded-full text-foreground/50 hover:bg-foreground/5 transition-colors font-sans text-[10px] uppercase tracking-widest font-bold"
                    >
                      Cancel
                    </button>
                    <button onClick={handleSaveProfile} disabled={isUpdating} className="px-5 py-2.5 rounded-full bg-accent text-white hover:bg-[#8A6853] transition-colors font-sans text-[10px] uppercase tracking-widest font-bold shadow-md disabled:opacity-50">
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-8">
                {localError && <p className="text-red-500 text-sm font-semibold">{localError}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">First Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!isEditing} className={`w-full pl-14 pr-6 py-4 rounded-2xl border outline-none transition-all font-sans text-sm font-semibold ${!isEditing ? 'bg-background border-foreground/5 text-foreground/70 cursor-not-allowed' : 'bg-white border-foreground/20 focus:border-accent text-foreground shadow-sm'}`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!isEditing} className={`w-full pl-14 pr-6 py-4 rounded-2xl border outline-none transition-all font-sans text-sm font-semibold ${!isEditing ? 'bg-background border-foreground/5 text-foreground/70 cursor-not-allowed' : 'bg-white border-foreground/20 focus:border-accent text-foreground shadow-sm'}`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input type="email" value={user.email} disabled className="w-full pl-14 pr-6 py-4 rounded-2xl bg-background border border-foreground/5 outline-none font-sans text-sm font-semibold text-foreground/50 cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} placeholder="+91 00000 00000" className={`w-full pl-14 pr-6 py-4 rounded-2xl border outline-none transition-all font-sans text-sm font-semibold ${!isEditing ? 'bg-background border-foreground/5 text-foreground/70 cursor-not-allowed' : 'bg-white border-foreground/20 focus:border-accent text-foreground shadow-sm'}`} />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Member Since</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <div className="w-full pl-14 pr-6 py-4 rounded-2xl bg-background border border-foreground/5 font-sans text-sm font-semibold text-foreground/70">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {/* --- PASSWORD UPDATE SECTION --- */}
              <div className="mt-12 pt-12 border-t border-foreground/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-foreground/5 rounded-2xl text-foreground">
                    <Lock size={20} />
                  </div>
                  <h2 className="font-serif text-2xl text-foreground">Security</h2>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {passwordMsg.text && (
                    <p className={`text-sm font-semibold ${passwordMsg.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                      {passwordMsg.text}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                        <input 
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-foreground/20 focus:border-accent outline-none transition-all font-sans text-sm font-semibold text-foreground shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-foreground/20 focus:border-accent outline-none transition-all font-sans text-sm font-semibold text-foreground shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block font-sans text-[10px] uppercase tracking-widest text-foreground/50 font-bold ml-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                        <input 
                          type="password" 
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-foreground/20 focus:border-accent outline-none transition-all font-sans text-sm font-semibold text-foreground shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                      className="px-6 py-3 rounded-full bg-foreground text-white hover:bg-foreground/80 transition-colors font-sans text-[10px] uppercase tracking-widest font-bold shadow-md disabled:opacity-50"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* --- DANGER ZONE (DELETE ACCOUNT) --- */}
              <div className="mt-12 pt-12 border-t border-foreground/5">
                <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-red-500 w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-foreground mb-1">Danger Zone</h3>
                        <p className="font-sans text-xs text-foreground/60 leading-relaxed max-w-md">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                    </div>

                    {!isDeleteConfirming ? (
                      <button 
                        onClick={() => setIsDeleteConfirming(true)}
                        className="px-6 py-3 shrink-0 rounded-full border border-red-500/30 text-red-500 font-bold tracking-widest uppercase text-[10px] hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Delete Account
                      </button>
                    ) : null}
                  </div>

                  {/* Confirmation Expansion */}
                  {isDeleteConfirming && (
                    <div className="mt-6 pt-6 border-t border-red-500/10 animate-in fade-in slide-in-from-top-2">
                      {activeBookings.length > 0 && (
                        <div className="mb-4 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                          <p className="text-sm font-bold text-red-600 mb-1">Wait! You have {activeBookings.length} active booking(s).</p>
                          <p className="text-xs text-red-500/80">Deleting your account will forfeit these bookings. Please cancel them first if you require a refund.</p>
                        </div>
                      )}
                      
                      <p className="text-sm font-bold text-foreground mb-4">Are you absolutely sure you want to delete your account?</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button 
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="px-6 py-3 rounded-full bg-red-500 text-white font-bold tracking-widest uppercase text-[10px] hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Yes, Delete Everything'}
                        </button>
                        <button 
                          onClick={() => setIsDeleteConfirming(false)}
                          disabled={isDeleting}
                          className="px-6 py-3 rounded-full bg-background border border-foreground/10 text-foreground font-bold tracking-widest uppercase text-[10px] hover:bg-foreground/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* --- REBUILT IMAGE CROPPER MODAL --- */}
      <Transition show={!!imageToCrop} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setImageToCrop(null)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl border border-foreground/5 flex flex-col">
                <div className="bg-foreground px-6 py-4 flex items-center justify-between">
                  <DialogTitle className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-3">
                    <Crop size={16} className="text-accent" /> Adjust Profile Picture
                  </DialogTitle>
                  <button onClick={() => setImageToCrop(null)} className="text-white/70 hover:text-white p-2"><X size={18} /></button>
                </div>
                
                <div className="p-6">
                  
                  {/* React Image Crop Container */}
                  <div className="relative max-h-[50vh] w-full bg-background rounded-2xl overflow-auto mb-6 flex justify-center">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspect}
                    >
                      <img 
                        src={imageToCrop} 
                        onLoad={onImageLoad} 
                        alt="Crop preview" 
                        className="max-h-[50vh] w-auto object-contain" 
                      />
                    </ReactCrop>
                  </div>
                  
                  {/* Aspect Ratio Controls */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {[
                      { label: 'Free', val: undefined },
                      { label: '1:1', val: 1 },
                      { label: '4:3', val: 4/3 },
                      { label: '16:9', val: 16/9 }
                    ].map(ratio => (
                      <button 
                        key={ratio.label} type="button" onClick={() => setAspect(ratio.val)} 
                        className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold border transition-all ${ aspect === ratio.val ? 'bg-foreground text-white border-foreground' : 'bg-background text-foreground/60 hover:text-foreground border-foreground/10' }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>

                  <button type="button" onClick={handleApplyCrop} className="w-full py-4 bg-accent text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-2xl flex justify-center items-center gap-2 shadow-lg shadow-accent/20 hover:bg-[#8A6853] transition-colors">
                    <Check size={16} /> Confirm Crop
                  </button>
                </div>

              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </motion.main>
  );
}