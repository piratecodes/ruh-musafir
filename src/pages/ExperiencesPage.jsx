import { useState, useEffect, Fragment } from 'react'
import { Plus, Compass, Loader2, Image as ImageIcon, Power, Edit3, Trash2, X, Crop, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'
import { getImageUrl } from '@/pages/SettingsPage'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import Cropper from 'react-easy-crop'

import useDocumentMeta from '@/hooks/useDocumentMeta';

const toastStyle = { background: '#ffffff', color: '#112440', border: '1px solid rgba(17, 36, 64, 0.1)', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }

// --- CANVAS CROP UTILITY ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file)
    }, 'image/jpeg')
  })
}
// ---------------------------

// --- NEW: SLIDESHOW CARD COMPONENT ---
function ExperienceCard({ exp, onToggleActive, onEdit, onDelete }) {
  const [currentImg, setCurrentImg] = useState(0)

  useEffect(() => {
    if (exp.images && exp.images.length > 1 && exp.isActive) {
      const timer = setInterval(() => {
        setCurrentImg((prev) => (prev + 1) % exp.images.length)
      }, 4000)
      return () => clearInterval(timer)
    }
  }, [exp.images, exp.isActive])

  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300 ${!exp.isActive ? 'opacity-60 grayscale-[0.3]' : ''}`}>
      <div className="h-48 bg-secondary/80 relative overflow-hidden flex flex-col justify-between p-4">
        {exp.images && exp.images.length > 0 ? (
          exp.images.map((img, idx) => (
            <img 
              key={idx}
              src={getImageUrl(img)} 
              alt={exp.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`}
            />
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-primary/20">
            <ImageIcon size={32} />
          </div>
        )}
        
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        <div className="relative z-10 flex justify-end w-full">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-[9px] uppercase tracking-widest font-bold text-primary shadow-lg">
            {exp.timePeriod}
          </span>
        </div>

        {exp.images && exp.images.length > 1 && (
          <div className="relative z-10 flex gap-1.5 justify-center mt-auto pb-1">
            {exp.images.map((_, idx) => (
              <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-primary mb-2 line-clamp-1">{exp.name}</h3>
        <p className="text-xs font-medium text-foreground/60 line-clamp-2 mb-4 flex-1">{exp.description || 'No description provided.'}</p>
        <div className="flex justify-between items-end border-t border-primary/5 pt-4">
          <p className="text-[9px] uppercase tracking-widest text-foreground/40 font-bold">Price per person</p>
          <p className="text-lg font-bold text-accent">₹{exp.price}</p>
        </div>
      </div>
      
      <div className="px-6 pb-6 mt-auto flex gap-2">
        <button onClick={() => onToggleActive(exp.id)} className={`p-3 rounded-xl border flex items-center justify-center transition-colors shadow-sm shrink-0 ${ exp.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100 border-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'}`}><Power size={16} strokeWidth={2.5} /></button>
        <button onClick={() => onEdit(exp)} className="flex-1 py-3 bg-secondary/30 hover:bg-secondary text-primary rounded-xl text-[9px] uppercase tracking-[0.2em] font-bold transition-colors border border-primary/5 shadow-sm"><Edit3 size={14} className="inline mr-2" /> Edit</button>
        <button onClick={() => onDelete(exp.id)} className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-colors shadow-sm"><Trash2 size={16} /></button>
      </div>
    </div>
  )
}
// ------------------------------------

export default function ExperiencesPage() {
  // Title & Description for SEO (and nice browser tab titles!)
  useDocumentMeta(" Experiences | Ruh Musafir ", "Manage and showcase your hotel's unique experiences and activities for Ruh Musafir hotel guests.");

  const [experiences, setExperiences] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExp, setEditingExp] = useState(null)
  
  const [formData, setFormData] = useState({ name: '', description: '', timePeriod: '', price: 0 })
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([]) // Stores the finalized File objects

  // --- CROPPER STATES ---
  const [imageToCrop, setImageToCrop] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(16 / 9)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const loadExperiences = async () => {
    setIsLoading(true)
    try {
      const res = await fetchClient('/experiences').catch(() => [])
      setExperiences(Array.isArray(res) ? res : (res?.data || []))
    } catch (e) {
      toast.error('Failed to load experiences', { style: toastStyle })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadExperiences() }, [])

  const openModal = (exp = null) => {
    if (exp) {
      setEditingExp(exp)
      setFormData({ name: exp.name, description: exp.description || '', timePeriod: exp.timePeriod, price: exp.price })
      setExistingImages(exp.images || [])
    } else {
      setEditingExp(null)
      setFormData({ name: '', description: '', timePeriod: '', price: 0 })
      setExistingImages([])
    }
    setNewImages([])
    setIsModalOpen(true)
  }

  // --- IMAGE UPLOAD & CROP ENGINE ---
  const onFileSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.readAsDataURL(e.target.files[0])
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result)
      })
    }
  }

  const handleApplyCrop = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      const file = new File([croppedImageBlob], `exp-img-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setNewImages(prev => [...prev, file])
      setImageToCrop(null)
    } catch (e) {
      toast.error('Failed to crop image', { style: toastStyle })
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const form = new FormData()
    
    const payload = { ...formData, id: editingExp?.id, existingImages }
    form.append('experienceData', JSON.stringify(payload))
    newImages.forEach(file => form.append('newImages', file))

    try {
      await fetchClient('/experiences', { method: 'POST', body: form, isFormData: true })
      toast.success(editingExp ? 'Experience Updated' : 'Experience Created', { style: toastStyle })
      setIsModalOpen(false)
      loadExperiences()
    } catch (err) {
      toast.error('Failed to save experience', { style: toastStyle })
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await fetchClient(`/experiences/${id}/toggle-active`, { method: 'PATCH' })
      toast.success('Status Updated', { style: toastStyle })
      loadExperiences()
    } catch (err) {
      toast.error('Action failed', { style: toastStyle })
    }
  }

  const handleDelete = async (id) => {
    if(!window.confirm("Permanently delete this experience?")) return;
    try {
      await fetchClient(`/experiences/${id}`, { method: 'DELETE' })
      toast.success('Deleted successfully', { style: toastStyle })
      loadExperiences()
    } catch (err) {
      toast.error('Delete failed', { style: toastStyle })
    }
  }

  const safeExperiences = Array.isArray(experiences) ? experiences : []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white/40 p-8 rounded-4xl border border-primary/5 shadow-sm">
        <div>
          <h2 className="text-3xl lg:text-5xl text-primary font-bold tracking-tight leading-none">
            Guest <span className="italic font-light text-foreground/60">Experiences</span>
          </h2>
          <p className="text-sm text-foreground/60 font-serif italic mt-3">Curate add-ons, tours, and activities for the booking engine.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 text-[9px] uppercase tracking-[0.2em] font-bold">
          <Plus size={14} /> New Experience
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : safeExperiences.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg overflow-hidden text-center py-24">
          <Compass className="text-primary/20 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-bold text-primary">No Experiences Found</h3>
          <p className="text-xs text-foreground/50 mt-1 max-w-sm mx-auto">Create your first activity or add-on to offer it during the booking process.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeExperiences.map(exp => (
            <ExperienceCard 
              key={exp.id} 
              exp={exp} 
              onToggleActive={handleToggleActive} 
              onEdit={openModal} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setIsModalOpen(false)}>
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 max-h-[90vh] flex flex-col">
              
              <div className="bg-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-primary/5">
                <DialogTitle className="text-sm font-bold tracking-widest uppercase text-primary flex items-center gap-3">
                  <Compass size={16} /> {editingExp ? 'Edit Experience' : 'New Experience'}
                </DialogTitle>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-secondary rounded-full text-foreground/40 hover:text-primary"><X size={16} /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25">
                <form id="exp-form" onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Title</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-xs font-bold text-primary" placeholder="e.g. Hidden Pine Trail" />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Description</label>
                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-xs font-bold text-primary" placeholder="Details about the activity..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Time Period</label>
                      <input type="text" required value={formData.timePeriod} onChange={(e) => setFormData({...formData, timePeriod: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-xs font-bold text-primary" placeholder="e.g. 3 Hours, Half Day" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Price (₹)</label>
                      <input type="number" min="0" required value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 focus:border-primary outline-none text-xs font-bold text-primary" />
                    </div>
                  </div>

                  {/* Image Manager */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold ml-1">Imagery</label>
                    <div className="grid grid-cols-4 gap-3">
                      {existingImages.map((img, idx) => (
                        <div key={`old-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={getImageUrl(img)} alt="upload" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      {newImages.map((file, idx) => (
                        <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-secondary/30 flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-all cursor-pointer">
                        <Plus size={20} className="mb-1" />
                        <span className="text-[8px] uppercase tracking-widest font-bold">Add</span>
                        <input type="file" accept="image/*" className="hidden" onChange={onFileSelected} onClick={(e) => (e.target.value = null)} />
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="px-6 py-5 border-t border-primary/5 bg-gray-50 shrink-0 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 bg-white text-primary text-[9px] uppercase font-bold rounded-xl border">Cancel</button>
                <button type="submit" form="exp-form" className="px-6 py-3 bg-primary text-white text-[9px] uppercase font-bold rounded-xl shadow-lg">Save Configuration</button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      {/* --- CROPPER OVERLAY FIX (Wrapped in Dialog so it stays in front!) --- */}
      <Transition show={!!imageToCrop} as={Fragment}>
        <Dialog as="div" className="relative z-200" onClose={() => setImageToCrop(null)}>
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-md" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 flex flex-col">
                <div className="bg-primary px-8 py-5 flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-3 text-white">
                    <Crop size={18} className="text-secondary" /> Adjust Aspect Ratio
                  </DialogTitle>
                  <button onClick={() => setImageToCrop(null)} className="text-white/70 hover:text-white p-2"><X size={20} /></button>
                </div>
                
                <div className="p-8">
                  <div className="relative h-96 w-full bg-foreground rounded-2xl overflow-hidden mb-6">
                    <Cropper 
                      image={imageToCrop} 
                      crop={crop} 
                      zoom={zoom} 
                      aspect={aspect} 
                      onCropChange={setCrop} 
                      onZoomChange={setZoom} 
                      onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)} 
                    />
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {[ { label: 'Free', val: undefined }, { label: '1:1', val: 1 }, { label: '16:9', val: 16/9 }, { label: '21:9', val: 21/9 }, { label: '4:3', val: 4/3 }, { label: '3:4', val: 3/4 }, { label: '5:4', val: 5/4 }, { label: '2:3', val: 2/3 } ].map(ratio => (
                      <button 
                        key={ratio.label} type="button" onClick={() => setAspect(ratio.val)} 
                        className={`px-3 py-1.5 rounded-lg text-[8px] uppercase tracking-widest font-bold border transition-all ${ aspect === ratio.val ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-primary/60 hover:text-primary border-primary/10' }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>

                  <button type="button" onClick={handleApplyCrop} className="w-full py-4 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
                    <Check size={16} /> Confirm Crop
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}