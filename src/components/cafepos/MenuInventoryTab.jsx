import { Fragment } from 'react'
import { Search, Filter, FolderCog, Plus, Loader2, UtensilsCrossed, Coffee, Power, Edit3, Trash2 } from 'lucide-react'
import { getImageUrl } from '@/pages/SettingsPage'

export default function MenuInventoryTab({ state, handlers }) {
  
  // --- BULLETPROOF IMAGE RENDERER ---
  // This prevents the app from crashing if the database returns a weird format.
  const renderImage = (img) => {
    if (!img) return null;
    if (typeof img === 'string' && img.includes('http')) return img;
    return getImageUrl(img);
  };

  return (
    <div className="absolute inset-0 flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* HEADER CONTROLS */}
      <div className="flex justify-between items-center bg-white/40 p-6 rounded-4xl border border-primary/5 shadow-sm shrink-0">
        <div className="flex gap-4 relative">
          <div className="relative w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={14} />
            <input type="text" placeholder="Search inventory..." className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-primary/5 outline-none text-xs font-bold text-primary shadow-sm" />
          </div>
          <div className="relative flex items-center gap-2">
            <button onClick={() => handlers.setIsFilterOpen(!state.isFilterOpen)} className={`flex items-center gap-2 px-4 py-2.5 border text-[9px] uppercase tracking-widest font-bold rounded-xl shadow-sm transition-colors ${state.isFilterOpen ? 'bg-primary text-white border-primary' : 'bg-white border-primary/5 text-primary'}`}><Filter size={14}/> Filters</button>
            <button onClick={() => handlers.setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 border border-primary/5 bg-secondary/30 hover:bg-secondary text-primary text-[9px] uppercase tracking-widest font-bold rounded-xl shadow-sm transition-colors"><FolderCog size={14}/> Categories</button>

            {state.isFilterOpen && (
              <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-xl border border-primary/10 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest text-foreground/50 font-bold mb-2">Dietary Restriction</label>
                    <select value={state.invFilters.diet} onChange={(e) => handlers.setInvFilters({...state.invFilters, diet: e.target.value})} className="w-full p-2 bg-gray-50 border border-primary/10 rounded-lg text-xs font-bold text-primary outline-none"><option value="ALL">All Items</option><option value="VEG">Vegetarian Only</option><option value="NON_VEG">Non-Vegetarian</option></select>
                  </div>
                  <div>
                    <label className="block text-[8px] uppercase tracking-widest text-foreground/50 font-bold mb-2">Category</label>
                    <select value={state.invFilters.category} onChange={(e) => handlers.setInvFilters({...state.invFilters, category: e.target.value})} className="w-full p-2 bg-gray-50 border border-primary/10 rounded-lg text-xs font-bold text-primary outline-none"><option value="ALL">All Categories</option>{state.categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => handlers.openItemModal()} className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 text-[9px] uppercase tracking-[0.2em] font-bold"><Plus size={14} /> Add Menu Item</button>
      </div>

      {/* INVENTORY GRID */}
      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-4xl border border-primary/10 shadow-lg flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 content-start pb-6">
          {state.isLoading ? (
            <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : state.inventoryCategories.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-foreground/40 text-center">
              <UtensilsCrossed size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">No Items Configured</p>
            </div>
          ) : (
            state.inventoryCategories.map(category => (
              <Fragment key={category}>
                <div className="col-span-full mt-2 mb-2">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2">{category}</h3>
                </div>
                {state.inventoryMenuGrouped[category].map(item => (
                  
                  /* --- UPGRADED MENU INVENTORY CARD ("CLOUD SUITE" STYLE) --- */
                  <div key={item.id} className={`bg-white rounded-[1.5rem] border shadow-sm flex flex-col group transition-all duration-300 ${!item.isAvailable ? 'opacity-60 grayscale-[0.3] border-primary/5' : 'border-primary/10 hover:shadow-md hover:-translate-y-1'}`}>
                    
                    {/* Top Image Section (Fixed height, overflow hidden) */}
                    <div className="relative h-[200px] w-full overflow-hidden shrink-0 bg-gray-100 rounded-t-[1.5rem]">
                      {item.image ? (
                        <img 
                          src={renderImage(item.image)} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-primary/20"><Coffee size={32}/></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
                      
                      {/* Top Left Badge (Category & Diet) */}
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.diet === 'VEG' ? 'bg-[#00c885]' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{item.category}</span>
                      </div>

                      {/* Top Right Badge (Stock Status) */}
                      <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg shadow-sm flex items-center justify-center ${item.isAvailable ? 'bg-[#00c885] text-white' : 'bg-red-500 text-white'}`}>
                        <span className="text-[9px] uppercase tracking-widest font-bold">
                          {item.isAvailable ? 'AVAILABLE' : 'OUT OF STOCK'}
                        </span>
                      </div>

                      {/* --- FIX: DYNAMIC SLIDESHOW DOTS --- */}
                      {/* Will only show if the item has an array of multiple images! */}
                      {Array.isArray(item.images) && item.images.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
                          {item.images.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full shadow-sm ${idx === 0 ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}></div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col bg-white rounded-b-[1.5rem]">
                      <h3 className="text-[18px] font-bold text-[#4c554c] leading-tight line-clamp-1 mb-2">{item.name}</h3>
                      <p className="text-[11px] font-medium text-gray-500 line-clamp-2 h-8 mb-4">{item.description || 'No description available.'}</p>
                      
                      <div className="w-full h-px bg-gray-100 my-1"></div>

                      <div className="flex justify-between items-end mt-3 mb-5">
                        {/* Left box (Menu Item Type) */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                          <UtensilsCrossed size={14} className="text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Menu Item</span>
                        </div>
                        {/* Right side Price */}
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Base Price</span>
                          <span className="text-[18px] font-extrabold text-[#4c554c]">₹{item.price}</span>
                        </div>
                      </div>

                      {/* Bottom Action Buttons (3 Buttons layout) */}
                      <div className="flex gap-3">
                        {/* Soft Delete (Power) */}
                        <button onClick={() => handlers.handleToggleMenuStock(item.id)} className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors shadow-sm shrink-0 ${item.isAvailable ? 'text-red-500 bg-red-50 border-red-100 hover:bg-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`} title={item.isAvailable ? "Soft Delete (Hide)" : "Restore Item"}>
                          <Power size={18} strokeWidth={2.5} />
                        </button>
                        
                        {/* --- FIX: PEN ICON INSTEAD OF TEXT --- */}
                        <button onClick={() => handlers.openItemModal(item)} className="flex-1 h-12 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 shadow-sm transition-colors flex items-center justify-center text-gray-600" title="Edit Item">
                          <Edit3 size={18} />
                        </button>
                        
                        {/* Hard Delete (Trash) */}
                        <button onClick={() => handlers.handleDeleteMenu(item.id)} className="w-12 h-12 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 shadow-sm transition-colors flex items-center justify-center shrink-0" title="Hard Delete">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>

                  </div>
                  /* ------------------------------------ */

                ))}
              </Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  )
}