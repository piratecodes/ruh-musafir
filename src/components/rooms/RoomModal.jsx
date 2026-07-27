import { Fragment, useState, useEffect, useRef } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { BedDouble, X, Trash2, Layers, ChevronDown, ImagePlus, Crop, Check } from 'lucide-react'
import Cropper from 'react-easy-crop'
import { getImageUrl } from '@/pages/SettingsPage' 

// Utility to create the final cropped file
const createImage = (url) => new Promise((res, rej) => { const img = new Image(); img.addEventListener('load', () => res(img)); img.addEventListener('error', rej); img.crossOrigin = 'anonymous'; img.src = url; })
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95))
}

export default function RoomModal({ isOpen, onClose, roomData, onSave, onDelete }) {
  const [formData, setFormData] = useState({ name: '', slug: '', roomNumber: '', type: 'PRIVATE', description: '', capacity: 2, basePrice: 1000, beds: [], bedSize: 'Standard Bed' })
  
  // Image State
  const fileInputRef = useRef(null)
  const [images, setImages] = useState([]) 
  
  // Cropper State
  const [imageToCrop, setImageToCrop] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(16/9) 
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    if (roomData) {
      setFormData({ ...roomData, beds: roomData.beds || [] })
      setImages(roomData.images?.map(url => ({ type: 'existing', url })) || [])
    } else {
      setFormData({ name: '', slug: '', roomNumber: '', type: 'PRIVATE', description: '', capacity: 2, basePrice: 1000, beds: [], bedSize: '' })
      setImages([])
    }
  }, [roomData, isOpen])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener('load', () => { setImageToCrop(reader.result) })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleApplyCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      setImages([...images, { type: 'new', url: URL.createObjectURL(croppedBlob), blob: croppedBlob }])
      setImageToCrop(null)
    } catch (e) { console.error(e) }
  }

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleFinalSubmit = (e) => {
    e.preventDefault()
    const existingImages = images.filter(i => i.type === 'existing').map(i => i.url)
    const newBlobs = images.filter(i => i.type === 'new').map(i => i.blob)

    const payload = new FormData()
    payload.append('roomData', JSON.stringify({ ...formData, existingImages }))
    newBlobs.forEach((blob, i) => { payload.append('newImages', blob, `img-${i}.jpg`) })

    onSave(payload)
  }

  const handleAddBunk = () => {
    const currentBunks = Math.floor(formData.beds.length / 2) + 1
    const newBeds = [
      { id: `temp-lower-${Date.now()}`, name: `Bunk ${currentBunks} - Lower`, status: 'AVAILABLE' },
      { id: `temp-upper-${Date.now()}`, name: `Bunk ${currentBunks} - Upper`, status: 'AVAILABLE' }
    ]
    setFormData({ ...formData, beds: [...formData.beds, ...newBeds], capacity: formData.beds.length + 2 })
  }
  
  const handleRemoveBed = (bedId) => {
    const updatedBeds = formData.beds.filter(b => b.id !== bedId)
    setFormData({ ...formData, beds: updatedBeds, capacity: updatedBeds.length })
  }

  const getStatusTheme = (status) => {
    if (status === 'AVAILABLE') return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    if (status === 'OCCUPIED') return 'bg-amber-50 text-amber-600 border-amber-200'
    return 'bg-red-50 text-red-600 border-red-200'
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={() => { if(!imageToCrop) onClose() }}>
        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className={`w-full max-w-2xl transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 flex flex-col transition-all ${imageToCrop ? 'hidden' : 'max-h-[90vh]'}`}>
                
                <div className="bg-white px-8 py-5 flex items-center justify-between shrink-0 border-b border-primary/5">
                  <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3 text-primary">
                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-primary">
                      <BedDouble size={20} />
                    </div>
                    {roomData ? 'Room Settings' : 'New Inventory'}
                  </DialogTitle>
                  <button onClick={onClose} className="text-foreground/40 hover:text-primary transition-colors p-2 bg-secondary/20 hover:bg-secondary rounded-full"><X size={20} /></button>
                </div>

                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 flex-1 p-8">
                  <form id="room-form" onSubmit={handleFinalSubmit} className="space-y-8">
                    
                    {/* 1. CORE DETAILS */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2">Core Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Room Name / Alias</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. The Cloud Suite" className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Slug</label>
                            <input type="text" required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="e.g. the-cloud-suite" className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Room Number</label>
                          <input type="text" required value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} placeholder="e.g. 101" className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Configuration</label>
                          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value, beds: e.target.value === 'PRIVATE' ? [] : formData.beds})} className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary cursor-pointer appearance-none">
                            <option value="PRIVATE">Private Suite</option>
                            <option value="DORM">Dormitory</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Room Description</label>
                        <textarea type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. The Cloud Suite" className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                      </div>
                    </div>

                    {/* 2. CAPACITY & PRICING */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2">Capacity & Pricing</h4>
                      {formData.type === 'PRIVATE' ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Bed Size</label>
                            <input type="text" required value={formData.bedSize} onChange={(e) => setFormData({...formData, bedSize: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Max Capacity</label>
                            <input type="number" min="1" required value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Price Per Night (₹)</label>
                            <input type="number" min="0" required value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-3xl border border-primary/5">
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-primary font-bold">Bed Management</label>
                              <p className="text-[10px] text-foreground/50 mt-1">Total Capacity: {formData.capacity}</p>
                            </div>
                            <button type="button" onClick={handleAddBunk} className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white hover:bg-accent/80 transition-colors rounded-xl text-[9px] uppercase tracking-widest font-bold shadow-md">
                              <Layers size={14} /> Add Bunk
                            </button>
                          </div>

                          {formData.beds.length > 0 && (
                            <div className="space-y-2 bg-secondary/5 p-4 rounded-3xl border border-primary/5">
                              {formData.beds.map((bed, index) => (
                                <div key={bed.id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl shadow-sm border border-primary/5">
                                  <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</div>
                                  <input type="text" value={bed.name} onChange={(e) => { const newBeds = [...formData.beds]; newBeds[index].name = e.target.value; setFormData({...formData, beds: newBeds}); }} className="flex-1 bg-transparent text-xs font-bold text-primary outline-none px-2" />
                                  <Listbox value={bed.status} onChange={(val) => { const newBeds = [...formData.beds]; newBeds[index].status = val; setFormData({...formData, beds: newBeds}); }}>
                                    <div className="relative">
                                      <ListboxButton className={`relative w-28 flex items-center justify-between cursor-pointer py-1.5 px-3 rounded-lg border text-[8px] font-bold uppercase tracking-widest transition-colors ${getStatusTheme(bed.status)}`}>
                                        <span className="block truncate">{bed.status}</span>
                                        <ChevronDown size={12} className="opacity-50" aria-hidden="true" />
                                      </ListboxButton>
                                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                        <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-32 overflow-auto rounded-xl bg-white p-1 text-base shadow-xl ring-1 ring-primary/10 focus:outline-none right-0">
                                          {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].map((status) => (
                                            <ListboxOption key={status} value={status} className={({ active }) => `relative cursor-pointer select-none py-2 px-3 text-[8px] uppercase tracking-widest font-bold rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                                              {status}
                                            </ListboxOption>
                                          ))}
                                        </ListboxOptions>
                                      </Transition>
                                    </div>
                                  </Listbox>
                                  <button type="button" onClick={() => handleRemoveBed(bed.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-foreground/70 font-bold mb-1.5 ml-1">Price Per Bed (₹)</label>
                            <input type="number" min="0" required value={formData.basePrice} onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl bg-secondary/30 border border-primary/10 focus:border-primary outline-none transition-all text-xs font-bold text-primary" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. GALLERY UPLOAD SECTION (Moved to the bottom!) */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-primary/5 pb-2">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent">Gallery</h4>
                        <span className="text-[10px] uppercase font-bold text-foreground/40">{images.length}/10 Images</span>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {images.map((img, i) => (
                          <div key={i} className="aspect-video bg-secondary rounded-xl overflow-hidden relative group shadow-sm border border-primary/10">
                            <img src={img.type === 'existing' ? getImageUrl(img.url) : img.url} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button type="button" onClick={() => handleRemoveImage(i)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {images.length < 10 && (
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-video bg-secondary/30 hover:bg-secondary/60 rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 transition-colors group">
                            <ImagePlus size={24} className="text-primary/40 group-hover:text-primary/70" />
                            <span className="text-[9px] uppercase tracking-widest font-bold text-primary/40 group-hover:text-primary/70">Add Image</span>
                          </button>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                      </div>
                    </div>

                  </form>
                </div>

                <div className="px-8 py-5 bg-gray-50 border-t border-primary/5 shrink-0 flex justify-between rounded-b-4xl">
                  {roomData ? ( <button type="button" onClick={() => onDelete(roomData.id)} className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-red-500 hover:text-red-600"><Trash2 size={16} /> Delete</button> ) : <div/>}
                  <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-3.5 bg-white text-primary text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl border border-primary/10">Cancel</button>
                    <button type="submit" form="room-form" className="px-6 py-3.5 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl shadow-lg shadow-primary/30">Save Room</button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>

            {/* --- CROPPER OVERLAY --- */}
            {imageToCrop && (
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10">
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
                    
                    {/* Aspect Ratio Toolbar - Now with more options */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {[ 
                        { label: 'Free', val: undefined }, 
                        { label: '1:1', val: 1 }, 
                        { label: '16:9', val: 16/9 }, 
                        { label: '21:9', val: 21/9 },
                        { label: '4:3', val: 4/3 }, 
                        { label: '3:4', val: 3/4 }, 
                        { label: '5:4', val: 5/4 },
                        { label: '2:3', val: 2/3 }
                    ].map(ratio => (
                        <button 
                        key={ratio.label} 
                        type="button"
                        onClick={() => setAspect(ratio.val)} 
                        className={`px-3 py-1.5 rounded-lg text-[8px] uppercase tracking-widest font-bold border transition-all ${
                            aspect === ratio.val 
                            ? 'bg-primary text-white border-primary shadow-md' 
                            : 'bg-white text-primary/60 hover:text-primary border-primary/10'
                        }`}
                        >
                        {ratio.label}
                        </button>
                    ))}
                    </div>

                    <button 
                    type="button" 
                    onClick={handleApplyCrop} 
                    className="w-full py-4 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                    >
                    <Check size={16} /> Confirm Crop
                    </button>
                </div>
                </DialogPanel>
            </TransitionChild>
            )}

          </div>
        </div>
      </Dialog>
    </Transition>
  )
}