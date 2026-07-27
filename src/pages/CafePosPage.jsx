import { useState, Fragment, useEffect } from 'react'
import { Coffee, List, Grid, Edit3, ChevronDown, Smartphone, UtensilsCrossed, Printer, CheckCircle2, Power, Crop, Check, X, FolderCog, Search, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import Cropper from 'react-easy-crop'
import toast from 'react-hot-toast'
import { fetchClient } from '@/api/fetchClient'
import { useAuthStore } from '@/store/authStore' 
import { getImageUrl } from '@/pages/SettingsPage'

import useDocumentMeta from '@/hooks/useDocumentMeta';

// --- MODULAR IMPORTS ---
import PosTerminalTab from '@/components/cafepos/PosTerminalTab'
import OrderLedgerTab from '@/components/cafepos/OrderLedgerTab'
import MenuInventoryTab from '@/components/cafepos/MenuInventoryTab'

const toastStyle = { background: '#ffffff', color: '#112440', border: '1px solid rgba(17, 36, 64, 0.1)', borderRadius: '1rem', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }

const createImage = (url) => new Promise((resolve, reject) => {
  const image = new Image(); image.addEventListener('load', () => resolve(image)); image.addEventListener('error', (error) => reject(error)); image.setAttribute('crossOrigin', 'anonymous'); image.src = url;
})
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => { canvas.toBlob((file) => { resolve(file) }, 'image/jpeg') })
}

export default function CafePosPage() {
  useDocumentMeta(" Cafe POS | Ruh Musafir ", "Manage your hotel's cafe operations, including menu items, orders, and inventory for Ruh Musafir hotel management.");

  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState('REGISTER') 
  const [isLoading, setIsLoading] = useState(true)
  
  // LIVE DATABASE STATES
  const [menuItems, setMenuItems] = useState([])
  const [ledgerOrders, setLedgerOrders] = useState([])
  const [activeBookings, setActiveBookings] = useState([]) 
  
  // --- REGISTER STATES ---
  const [activeCategory, setActiveCategory] = useState('All')
  const [terminalDiet, setTerminalDiet] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [customerType, setCustomerType] = useState('WALK_IN')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [editingTicketId, setEditingTicketId] = useState(null) 

  // --- WALK-IN DETAILS STATES ---
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInFirstName, setWalkInFirstName] = useState('')
  const [walkInLastName, setWalkInLastName] = useState('')

  // --- LEDGER STATES ---
  const [ledgerTimeframe, setLedgerTimeframe] = useState('TODAY') 
  const [selectedTicket, setSelectedTicket] = useState(null) 

  // --- INVENTORY STATES ---
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false) 
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [invFilters, setInvFilters] = useState({ diet: 'ALL', category: 'ALL' })
  
  // Modal Form States
  const [categories, setCategories] = useState([])
  const [newItemCategory, setNewItemCategory] = useState('')
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [catSearch, setCatSearch] = useState('') 
  
  const [itemForm, setItemForm] = useState({ id: null, name: '', description: '', price: 0, diet: 'VEG' })
  
  // --- CROPPER STATES ---
  const [imageToCrop, setImageToCrop] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(4 / 3) 
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [finalImage, setFinalImage] = useState(null) 
  const [finalImageFile, setFinalImageFile] = useState(null)

  // --- API DATA FETCHING ---
  const loadCafeData = async () => {
    setIsLoading(true)
    try {
      const menuRes = await fetchClient('/menu').catch(() => [])
      const ordersRes = await fetchClient('/orders/ledger?range=all').catch(() => [])
      const bookingsRes = await fetchClient('/bookings').catch(() => []) 
      const catRes = await fetchClient('/menu/categories').catch(() => []) 
      
      setMenuItems(Array.isArray(menuRes) ? menuRes : (menuRes?.data || []))
      setLedgerOrders(Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []))

      const parsedBookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.data || [])
      setActiveBookings(parsedBookings.filter(b => b.status === 'CHECKED_IN'))

      const parsedCats = Array.isArray(catRes) ? catRes : (catRes?.data || [])
      const dbCats = parsedCats.map(c => c.name)
      setCategories(dbCats)
      if (!newItemCategory && dbCats.length > 0) setNewItemCategory(dbCats[0])
    } catch (e) {
      toast.error('Failed to load Cafe data', { style: toastStyle })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadCafeData() }, [])

  const handlePhoneLookup = async (phone) => {
    setWalkInPhone(phone)
    if (phone.length >= 10) {
      try {
        const res = await fetchClient(`/orders/lookup/${phone}`)
        if (res?.data) {
          setWalkInFirstName(res.data.firstName || '')
          setWalkInLastName(res.data.lastName || '')
          toast.success('Customer found!', { style: toastStyle })
        }
      } catch (e) { /* silent fail */ }
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const addToCart = (menuItem) => {
    if (!menuItem.isAvailable && !editingTicketId) { toast.error('Item is Out of Stock!', { style: toastStyle }); return; }
    setCart(prev => {
      const existing = prev.find(item => item.id === menuItem.id)
      if (existing) return prev.map(item => item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { ...menuItem, quantity: 1, notes: '' }]
    })
  }

  const updateQuantity = (id, delta) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0))
  const updateItemNote = (id, note) => setCart(prev => prev.map(item => item.id === id ? { ...item, notes: note } : item))
  
  const handleProcessOrder = async () => {
    if (customerType === 'WALK_IN' && (!walkInFirstName || !walkInPhone)) { toast.error('Please enter Name and Phone.', { style: toastStyle }); return; }
    try {
      const payload = {
        items: cart.map(item => ({ menuItemId: item.id, quantity: item.quantity })),
        bookingId: customerType === 'IN_HOUSE' ? selectedRoom : undefined,
        walkInFirstName: customerType === 'WALK_IN' ? walkInFirstName : undefined,
        walkInLastName: customerType === 'WALK_IN' ? walkInLastName : undefined,
        walkInPhone: customerType === 'WALK_IN' ? walkInPhone : undefined,
        // THE FIX: Unconditionally pass the selected method (ROOM_TAB, CASH, UPI) to the backend
        payment: paymentMethod 
      }
      if (editingTicketId) {
        await fetchClient(`/orders/${editingTicketId}`, { method: 'PATCH', body: JSON.stringify(payload) })
        toast.success(`Ticket Updated!`, { style: toastStyle })
      } else {
        await fetchClient('/orders', { method: 'POST', body: JSON.stringify(payload) })
        toast.success(`New Ticket Generated!`, { style: toastStyle })
      }
      setCart([]); setEditingTicketId(null); setWalkInPhone(''); setWalkInFirstName(''); setWalkInLastName(''); loadCafeData()
    } catch(e) { toast.error(e.message || 'Failed to process order', { style: toastStyle }) }
  }

  const handleEditTicket = (order) => {
    setSelectedTicket(null); setEditingTicketId(order.id)
    setCustomerType(order.bookingId ? 'IN_HOUSE' : 'WALK_IN'); setSelectedRoom(order.bookingId || '')
    setWalkInPhone(order.walkInPhone || ''); setWalkInFirstName(order.walkInFirstName || ''); setWalkInLastName(order.walkInLastName || '');
    const reconstructedCart = order.items.map(i => ({ id: i.menuItem.id, name: i.menuItem.name, price: i.unitPrice, quantity: i.quantity, diet: i.menuItem.diet || 'VEG', notes: '' }))
    setCart(reconstructedCart); setActiveTab('REGISTER'); toast.success('Ticket loaded for editing.', { style: toastStyle })
  }

  // --- THE FIX: Pass both status AND method explicitly ---
  const handleUpdateOrderStatus = async (id, status, method) => {
    try {
      await fetchClient(`/orders/${id}/status`, { 
        method: 'PATCH', 
        body: JSON.stringify({ status, method }) // Method goes to the backend!
      })
      toast.success(`Order marked as ${status}`, { style: toastStyle })
      if (selectedTicket && selectedTicket.id === id) setSelectedTicket({...selectedTicket, status})
      loadCafeData()
    } catch (e) { toast.error('Failed to update status', { style: toastStyle }) }
  }

  const handleDeleteOrder = async (id) => {
    if(!window.confirm("WARNING: Permanently delete this order from the database?")) return;
    try {
      await fetchClient(`/orders/${id}`, { method: 'DELETE' })
      toast.success('Order permanently deleted', { style: toastStyle })
      setSelectedTicket(null)
      loadCafeData()
    } catch (e) { toast.error('Delete failed', { style: toastStyle }) }
  }

  const handleCancelTicket = async (id) => {
    if(!window.confirm("Are you sure you want to cancel this ticket?")) return;
    try { await fetchClient(`/orders/${id}/cancel`, { method: 'PATCH' }); toast.success('Ticket Cancelled', { style: toastStyle }); loadCafeData() } catch (e) {}
  }

  const handleSaveMenu = async (e) => {
    e.preventDefault()
    const form = new FormData()
    const payload = { name: itemForm.name, description: itemForm.description, price: parseFloat(itemForm.price), category: newItemCategory, diet: itemForm.diet }
    if (itemForm.id) payload.id = itemForm.id;
    form.append('menuData', JSON.stringify(payload))
    if (finalImageFile) form.append('image', finalImageFile)
    try { await fetchClient('/menu', { method: 'POST', body: form, isFormData: true }); toast.success('Menu Updated', { style: toastStyle }); setIsItemModalOpen(false); loadCafeData() } catch (e) {}
  }

  const handleToggleMenuStock = async (id) => { try { await fetchClient(`/menu/${id}/toggle`, { method: 'PATCH' }); loadCafeData() } catch (e) {} }
  const handleDeleteMenu = async (id) => { if(window.confirm("Permanently delete this menu item?")) { try { await fetchClient(`/menu/${id}`, { method: 'DELETE' }); toast.success('Deleted', { style: toastStyle }); loadCafeData() } catch (e) {} } }
  const handleToggleCategoryStock = async (catName) => { try { await fetchClient(`/menu/category/${catName}/toggle`, { method: 'PATCH' }); toast.success('Category Stock Updated', { style: toastStyle }); loadCafeData() } catch (e) {} }
  const handleHardDeleteCategory = async (catName) => { if(window.confirm(`WARNING: This will permanently delete ALL items inside the "${catName}" category. Continue?`)) { try { await fetchClient(`/menu/category/${catName}`, { method: 'DELETE' }); toast.success('Category Erased', { style: toastStyle }); loadCafeData() } catch (e) {} } }

  const confirmCustomCategory = async () => {
    if(customCategoryInput.trim()) {
      const newCat = customCategoryInput.trim()
      if (categories.includes(newCat)) { toast.error('Category exists'); return; }
      try {
        await fetchClient('/menu/categories', { method: 'POST', body: JSON.stringify({ name: newCat }) });
        setCategories([...categories, newCat]); setNewItemCategory(newCat); setCustomCategoryInput(''); toast.success('Category saved!', { style: toastStyle });
      } catch (e) { toast.error('Failed to save category'); }
    }
    setIsAddingNewCategory(false);
  }

  const openItemModal = (item = null) => {
    if (item) { setItemForm({ id: item.id, name: item.name, description: item.description || '', price: item.price, diet: item.diet || 'VEG' }); setNewItemCategory(item.category) } 
    else { setItemForm({ id: null, name: '', description: '', price: 0, diet: 'VEG' }); setNewItemCategory(categories[0] || '') }
    setIsAddingNewCategory(false); setCustomCategoryInput(''); setFinalImage(item?.image ? getImageUrl(item.image) : null); setFinalImageFile(null); setIsItemModalOpen(true)
  }

  const onFileSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader(); reader.readAsDataURL(e.target.files[0]);
      reader.addEventListener('load', () => setImageToCrop(reader.result));
    }
  }
  const handleApplyCrop = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels)
      setFinalImage(URL.createObjectURL(croppedImageBlob))
      setFinalImageFile(new File([croppedImageBlob], `menu-img-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      setImageToCrop(null)
    } catch (e) { toast.error('Crop failed', { style: toastStyle }) }
  }

  const handlePrintReceipt = () => { setTimeout(() => window.print(), 100); }

  const safeMenu = Array.isArray(menuItems) ? menuItems : []
  const safeOrders = Array.isArray(ledgerOrders) ? ledgerOrders : []
  const sortedMenu = [...safeMenu].sort((a, b) => a.name.localeCompare(b.name))

  const terminalMenuFlat = sortedMenu.filter(item => (activeCategory === 'All' || item.category === activeCategory) && (terminalDiet === 'ALL' || item.diet === terminalDiet) && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const terminalMenuGrouped = terminalMenuFlat.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {})
  const terminalCategories = Object.keys(terminalMenuGrouped).sort()

  const inventoryMenuFlat = sortedMenu.filter(item => (invFilters.diet === 'ALL' || item.diet === invFilters.diet) && (invFilters.category === 'ALL' || item.category === invFilters.category))
  const inventoryMenuGrouped = inventoryMenuFlat.reduce((acc, item) => { if (!acc[item.category]) acc[item.category] = []; acc[item.category].push(item); return acc }, {})
  const inventoryCategories = Object.keys(inventoryMenuGrouped).sort()

  const getKitchenBadge = (status) => {
    if (status === 'SERVED') return 'bg-gray-100 text-foreground/50 border-gray-200'
    if (status === 'PREPARING') return 'bg-blue-50 text-blue-600 border-blue-200'
    return 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
  }

  const posContext = {
    state: { activeCategory, terminalDiet, searchQuery, cart, customerType, paymentMethod, selectedRoom, editingTicketId, walkInPhone, walkInFirstName, walkInLastName, ledgerTimeframe, selectedTicket, isFilterOpen, invFilters, categories, isLoading, activeBookings, cartTotal, terminalCategories, terminalMenuGrouped, inventoryCategories, inventoryMenuGrouped, safeOrders },
    handlers: { setActiveCategory, setTerminalDiet, setSearchQuery, setCart, setCustomerType, setPaymentMethod, setSelectedRoom, setEditingTicketId, setWalkInPhone, setWalkInFirstName, setWalkInLastName, setLedgerTimeframe, setSelectedTicket, setIsFilterOpen, setInvFilters, handlePhoneLookup, addToCart, updateQuantity, updateItemNote, handleProcessOrder, handleEditTicket, handleUpdateOrderStatus, handleDeleteOrder, handleCancelTicket, handleToggleMenuStock, handleDeleteMenu, handleToggleCategoryStock, handleHardDeleteCategory, openItemModal, handlePrintReceipt, getKitchenBadge, setIsCategoryModalOpen }
  };

  // Define who has modification rights
  const isAdmin = user?.role === 'ADMIN';
  const canModifyTicket = isAdmin || selectedTicket?.status === 'PENDING';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-350 mx-auto pb-12 h-[calc(100vh-4rem)] flex flex-col relative print:h-auto print:pb-0 print:space-y-0">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-white/40 p-6 rounded-4xl border border-primary/5 shadow-sm shrink-0 print:hidden">
        <div>
          <h2 className="text-3xl lg:text-4xl text-primary font-bold tracking-tight leading-none">Cafe <span className="italic font-light text-foreground/60">POS</span></h2>
          <p className="text-sm text-foreground/60 font-serif italic mt-2">Manage orders, tabs, and culinary inventory.</p>
        </div>
        <div className="flex bg-secondary/40 p-1 rounded-xl border border-primary/5 shadow-sm">
          {[{ id: 'REGISTER', label: 'POS Terminal', icon: Grid }, { id: 'LEDGER', label: 'Order Ledger', icon: List }, { id: 'INVENTORY', label: 'Menu Inventory', icon: Coffee }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[9px] uppercase tracking-[0.15em] font-bold transition-all ${ activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-foreground/50 hover:text-primary' }`}>
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative print:hidden">
        {activeTab === 'REGISTER' && <PosTerminalTab {...posContext} />}
        {activeTab === 'LEDGER' && <OrderLedgerTab {...posContext} />}
        {activeTab === 'INVENTORY' && <MenuInventoryTab {...posContext} />}
      </div>

      {/* --- INVENTORY CREATION MODAL --- */}
      <Transition show={isItemModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => setIsItemModalOpen(false)}>
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm print:hidden" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 flex flex-col max-h-[90vh]">
              <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-b-primary/5 shrink-0">
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-3"><UtensilsCrossed size={16}/> {itemForm.id ? 'Edit Menu Item' : 'New Menu Item'}</DialogTitle>
                <button onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-secondary rounded-full"><X size={16}/></button>
              </div>
              <form id="menu-form" onSubmit={handleSaveMenu} className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 space-y-5">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Item Name</label>
                  <input type="text" required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} placeholder="e.g. Masala Chai" className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 outline-none text-xs font-bold text-primary" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Menu Description</label>
                  <textarea rows="2" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} placeholder="Describe the ingredients or flavor..." className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 outline-none text-xs font-bold text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Category</label>
                    {!isAddingNewCategory ? (
                      <Listbox value={newItemCategory} onChange={(val) => { if (val === 'NEW') setIsAddingNewCategory(true); else setNewItemCategory(val); }}>
                        <div className="relative">
                          <ListboxButton className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 outline-none text-xs font-bold text-primary uppercase tracking-widest cursor-pointer transition-colors hover:border-primary/30 shadow-sm">
                            <span className="truncate">{newItemCategory || 'Select Category'}</span><ChevronDown size={14} className="opacity-50" />
                          </ListboxButton>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                              {categories.map((c) => (<ListboxOption key={c} value={c} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>{c}</ListboxOption>))}
                              <ListboxOption value="NEW" className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors text-accent ${active ? 'bg-accent/10' : ''}`}>+ Add New Category</ListboxOption>
                            </ListboxOptions>
                          </Transition>
                        </div>
                      </Listbox>
                    ) : (
                      <div className="flex gap-2">
                        <input autoFocus type="text" placeholder="New Category..." value={customCategoryInput} onChange={e=>setCustomCategoryInput(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-white border border-accent/30 outline-none text-xs font-bold text-primary uppercase tracking-widest shadow-sm" />
                        <button type="button" onClick={confirmCustomCategory} className="px-3 bg-accent text-white rounded-xl shadow-md hover:bg-accent/90 transition-colors"><CheckCircle2 size={16}/></button>
                        <button type="button" onClick={() => setIsAddingNewCategory(false)} className="px-3 bg-gray-100 text-foreground/60 rounded-xl hover:bg-gray-200 transition-colors"><X size={16}/></button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Dietary</label>
                    <Listbox value={itemForm.diet} onChange={val => setItemForm({...itemForm, diet: val})}>
                      <div className="relative">
                        <ListboxButton className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 outline-none text-xs font-bold text-primary uppercase tracking-widest cursor-pointer transition-colors hover:border-primary/30 shadow-sm">
                          <span className="truncate">{itemForm.diet === 'VEG' ? 'VEG' : 'NON-VEG'}</span><ChevronDown size={14} className="opacity-50" />
                        </ListboxButton>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                          <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                            {['VEG', 'NON_VEG'].map((diet) => (<ListboxOption key={diet} value={diet} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>{diet === 'VEG' ? 'VEG' : 'NON-VEG'}</ListboxOption>))}
                          </ListboxOptions>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Price (₹)</label>
                  <input type="number" required min="0" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-primary/10 outline-none text-xs font-bold text-primary" />
                </div>
                <div className="pt-2">
                  <label className="block text-[9px] uppercase tracking-widest text-foreground/60 font-bold mb-1.5 ml-1">Product Image (4:3 Ratio)</label>
                  {finalImage ? (
                    <div className="relative w-48 aspect-video rounded-xl overflow-hidden group border border-primary/10 shadow-sm">
                      <img src={finalImage} alt="cropped" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => {setFinalImage(null); setFinalImageFile(null)}} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><X size={16} /></button>
                    </div>
                  ) : (
                    <label className="w-48 aspect-video rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-primary/40 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <Plus size={24} className="mb-1"/><span className="text-[8px] uppercase tracking-widest font-bold">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={onFileSelected} onClick={(e) => (e.target.value = null)} />
                    </label>
                  )}
                </div>
              </form>
              <div className="px-6 py-5 border-t border-primary/5 bg-gray-50 flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-5 py-3 bg-white text-primary text-[9px] uppercase font-bold rounded-xl border">Cancel</button>
                <button type="submit" form="menu-form" className="px-6 py-3 bg-primary text-white text-[9px] uppercase font-bold rounded-xl shadow-lg">Save Item</button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      {/* --- CATEGORY MANAGEMENT MODAL --- */}
      <Transition show={isCategoryModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-150" onClose={() => {setIsCategoryModalOpen(false); setCatSearch('')}}>
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm print:hidden" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 flex flex-col max-h-[80vh]">
              <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-b-primary/5 shrink-0">
                <DialogTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-3"><FolderCog size={16}/> Manage Categories</DialogTitle>
                <button onClick={() => {setIsCategoryModalOpen(false); setCatSearch('')}} className="p-2 hover:bg-secondary rounded-full"><X size={16}/></button>
              </div>
              <div className="p-6 bg-gray-50 border-b border-primary/5 shrink-0 space-y-4">
                <div className="flex gap-2">
                  <input type="text" placeholder="New Category Name..." value={customCategoryInput} onChange={e => setCustomCategoryInput(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white border border-primary/10 outline-none text-xs font-bold text-primary uppercase tracking-widest focus:border-primary transition-all shadow-sm" />
                  <button onClick={confirmCustomCategory} className="px-4 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md transition-colors flex items-center justify-center"><Plus size={16}/></button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40" size={14} />
                  <input type="text" placeholder="Search categories..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-primary/10 outline-none text-xs font-bold text-primary shadow-sm transition-all focus:border-primary" />
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 space-y-2 bg-white">
                {categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase())).length === 0 ? (
                  <p className="text-center text-xs font-bold text-foreground/40 py-8 uppercase tracking-widest">No categories found</p>
                ) : (
                  categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase())).map(cat => (
                    <div key={cat} className="flex items-center justify-between p-4 bg-gray-50 border border-primary/10 rounded-xl hover:border-primary/20 transition-all">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{cat}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleCategoryStock(cat)} className="p-2 bg-white hover:bg-secondary text-primary rounded-lg border border-primary/10 transition-colors shadow-sm" title="Toggle Category Availability"><Power size={14}/></button>
                        <button onClick={() => handleHardDeleteCategory(cat)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border border-red-100 transition-colors shadow-sm" title="Hard Delete Category"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      {/* CROPPER OVERLAY */}
      <Transition show={!!imageToCrop} as={Fragment}>
        <Dialog as="div" className="relative z-200" onClose={() => setImageToCrop(null)}>
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-md print:hidden" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 flex flex-col">
                <div className="bg-primary px-8 py-5 flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-3"><Crop size={18} className="text-secondary" /> Adjust Item Photo</DialogTitle>
                  <button onClick={() => setImageToCrop(null)} className="text-white/70 hover:text-white p-2"><X size={20} /></button>
                </div>
                <div className="p-8">
                  <div className="relative h-96 w-full bg-foreground rounded-2xl overflow-hidden mb-6">
                    <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setCroppedAreaPixels(px)} />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {[ { label: 'Free', val: undefined }, { label: '1:1', val: 1 }, { label: '16:9', val: 16/9 }, { label: '21:9', val: 21/9 }, { label: '4:3', val: 4/3 }, { label: '3:4', val: 3/4 }, { label: '5:4', val: 5/4 }, { label: '2:3', val: 2/3 } ].map(ratio => (
                      <button key={ratio.label} type="button" onClick={() => setAspect(ratio.val)} className={`px-3 py-1.5 rounded-lg text-[8px] uppercase tracking-widest font-bold border transition-all ${ aspect === ratio.val ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-primary/60 hover:text-primary border-primary/10' }`}>{ratio.label}</button>
                    ))}
                  </div>
                  <button type="button" onClick={handleApplyCrop} className="w-full py-4 bg-primary text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-primary/20"><Check size={16} /> Confirm Crop</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* --- UPGRADED PRINT-READY RECEIPT MODAL --- */}
      <Transition show={!!selectedTicket} as={Fragment}>
        <Dialog as="div" className="relative z-150" onClose={() => setSelectedTicket(null)}>
          <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm print:hidden" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4 print:p-0 print:block print:relative">
            <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-4xl bg-white text-left align-middle shadow-2xl border border-primary/10 flex flex-col print:shadow-none print:border-0 print:rounded-none print:w-full print:max-w-full">
              
              <div className="p-8 pb-6 border-b border-dashed border-primary/20 text-center bg-gray-50 print:bg-white print:pt-0">
                <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-primary print:hidden"><X size={16}/></button>
                
                <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center shadow-sm border border-primary/5 mb-3 print:border-gray-300 print:shadow-none"><Coffee size={20} className="text-primary print:text-black"/></div>
                <h2 className="text-xl font-black text-primary uppercase tracking-widest print:text-black">Ruh Musafir</h2>
                <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest mt-1 print:text-black">123 Cloud Suite Avenue, Hilltop Region</p>
                <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest print:text-black">Phone: +91 9876543210</p>
                
                <div className="mt-4 pt-4 border-t border-primary/5 print:border-black">
                  <p className="text-[10px] text-foreground/60 uppercase tracking-widest mt-1 print:text-black">Ticket No: <span className="font-bold text-primary print:text-black">{selectedTicket?.id?.slice(-6).toUpperCase()}</span></p>
                  <p className="text-[9px] font-bold text-foreground/40 mt-1 uppercase tracking-widest print:text-black">{new Date(selectedTicket?.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-8 space-y-6 print:py-4">
                <div className="flex flex-col gap-1 text-xs font-bold text-primary uppercase tracking-widest print:text-black">
                  <div className="flex justify-between">
                    <span className="text-foreground/50">Customer:</span>
                    <span className="text-right">{selectedTicket?.booking ? `${selectedTicket.booking.room?.roomNumber} - ${selectedTicket.booking.guestFirstName}` : `${selectedTicket?.walkInFirstName || 'Walk-In'} ${selectedTicket?.walkInLastName || ''}`}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-foreground/50">Phone:</span>
                    <span className="text-right">{selectedTicket?.booking?.guestPhone || selectedTicket?.walkInPhone || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-b border-primary/5 py-4 space-y-3 print:border-black">
                  {selectedTicket?.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-primary print:text-black"><span>{item.quantity}x {item.menuItem?.name || 'Item'}</span><span className="font-bold">₹{item.unitPrice * item.quantity}</span></div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-widest text-primary print:text-black">Total Paid</span>
                  <span className="text-2xl font-bold text-accent print:text-black">₹{selectedTicket?.totalAmount}</span>
                </div>

                {/* --- THE FIX: PAYMENT TOGGLE UI WITH MODE OF PAYMENT --- */}
                <div className="flex flex-col gap-3 p-4 bg-secondary/20 rounded-xl border border-primary/5 print:hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Payment</span>
                    {selectedTicket?.status !== 'PAID' && (
                      <Listbox value={paymentMethod} onChange={setPaymentMethod}>
                        <div className="relative z-50">
                          <ListboxButton className="flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-primary shadow-sm outline-none cursor-pointer hover:border-primary/30 transition-all">
                            {paymentMethod}
                            <ChevronDown size={10} className="opacity-50" />
                          </ListboxButton>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <ListboxOptions className="absolute right-0 mt-1 w-24 overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                              {['CASH', 'UPI/ Card'].map((mode) => (
                                <ListboxOption 
                                  key={mode} 
                                  value={mode} 
                                  className={({ active }) => `cursor-pointer select-none py-2 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}
                                >
                                  {mode}
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </Transition>
                        </div>
                      </Listbox>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedTicket.id, selectedTicket.status === 'PAID' ? 'SERVED' : 'PAID', paymentMethod)}
                    className={`w-full py-2.5 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all shadow-sm ${selectedTicket?.status === 'PAID' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-primary border border-primary/10 hover:bg-gray-50'}`}>
                    {selectedTicket?.status === 'PAID' ? 'SUCCESS (PAID)' : `Mark as Paid via ${paymentMethod}`}
                  </button>
                </div>

              </div>
              
              <div className="px-6 py-5 bg-white border-t border-primary/5 grid grid-cols-2 gap-3 shrink-0 print:hidden">
                <button className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 text-[9px] uppercase font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"><Smartphone size={14} /> WhatsApp</button>
                <button onClick={handlePrintReceipt} className="flex items-center justify-center gap-2 py-3 bg-secondary/50 text-primary text-[9px] uppercase font-bold rounded-xl border border-primary/5 hover:bg-secondary transition-colors"><Printer size={14} /> Print Bill</button>
                {canModifyTicket ? (
                  <>
                    <button onClick={() => { setSelectedTicket(null); handleEditTicket(selectedTicket); }} className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 text-[9px] uppercase font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"><Edit3 size={14} /> Edit</button>
                    <button onClick={() => { handleDeleteOrder(selectedTicket.id); setSelectedTicket(null); }} className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 text-[9px] uppercase font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors"><Trash2 size={14} /> Delete</button>
                  </>
                ) : (
                  <div className="col-span-2 text-center mt-2">
                    <p className="text-[9px] text-red-500 uppercase tracking-widest font-bold">Ticket is locked. Admin required for voids.</p>
                  </div>
                )}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}