import { Fragment } from 'react'
import { Search, ChevronDown, Loader2, UtensilsCrossed, Coffee, ShoppingBag, Trash2, Minus, Plus, Receipt } from 'lucide-react'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react'
import { getImageUrl } from '@/pages/SettingsPage'

export default function PosTerminalTab({ state, handlers }) {
  return (
    <div className="absolute inset-0 flex gap-6 animate-in fade-in duration-300">
      {/* LEFT: MENU GRID */}
      <div className="flex-1 flex flex-col gap-4 bg-white/60 backdrop-blur-xl p-6 rounded-4xl border border-primary/10 shadow-lg min-w-0">
        <div className="flex gap-3 shrink-0 relative z-50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
            <input type="text" placeholder="Search menu items..." value={state.searchQuery} onChange={e => handlers.setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-primary/5 focus:border-primary/20 outline-none text-xs font-bold text-primary shadow-sm transition-all" />
          </div>
          
          <div className="w-36">
            <Listbox value={state.terminalDiet} onChange={handlers.setTerminalDiet}>
              <div className="relative h-full">
                <ListboxButton className="h-full w-full flex items-center justify-between px-4 bg-white border border-primary/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm outline-none cursor-pointer">
                  <span className="truncate">{state.terminalDiet === 'ALL' ? 'All Diets' : state.terminalDiet === 'VEG' ? 'Veg Only' : 'Non-Veg'}</span>
                  <ChevronDown size={14} className="opacity-50" />
                </ListboxButton>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none">
                    {['ALL', 'VEG', 'NON_VEG'].map((diet) => (
                      <ListboxOption key={diet} value={diet} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                        {diet === 'ALL' ? 'All Diets' : diet === 'VEG' ? 'Veg Only' : 'Non-Veg'}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          </div>

          <div className="w-44">
            <Listbox value={state.activeCategory} onChange={handlers.setActiveCategory}>
              <div className="relative h-full">
                <ListboxButton className="h-full w-full flex items-center justify-between px-4 bg-white border border-primary/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm outline-none cursor-pointer">
                  <span className="truncate">{state.activeCategory}</span><ChevronDown size={14} className="opacity-50" />
                </ListboxButton>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/5 focus:outline-none">
                    {['All', ...state.categories].map((cat) => (
                      <ListboxOption key={cat} value={cat} className={({ active }) => `relative cursor-pointer select-none py-3 px-3 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>{cat}</ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start pb-6">
          {state.isLoading ? (
            <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
          ) : state.terminalCategories.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-foreground/40 text-center">
              <UtensilsCrossed size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">No Menu Items Found</p>
            </div>
          ) : (
            state.terminalCategories.map(category => (
              <Fragment key={category}>
                <div className="col-span-full mt-4 mb-2"><h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-accent border-b border-primary/5 pb-2">{category}</h3></div>
                {state.terminalMenuGrouped[category].map(item => (
                  <div key={item.id} onClick={() => handlers.addToCart(item)} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all cursor-pointer group flex flex-col relative ${!item.isAvailable ? 'opacity-50 grayscale border-primary/5' : 'border-primary/5 hover:shadow-md hover:border-primary/30'}`}>
                    <div className="aspect-video bg-secondary/50 relative overflow-hidden">
                      {item.image ? <img src={item.image.startsWith('http') ? item.image : getImageUrl(item.image)} alt={item.name} className={`w-full h-full object-cover ${item.isAvailable ? 'group-hover:scale-105' : ''} transition-transform duration-500`} /> : <div className="absolute inset-0 flex items-center justify-center text-primary/20"><Coffee size={32}/></div>}
                      <div className="absolute top-3 left-3 w-4 h-4 bg-white rounded-sm flex items-center justify-center shadow-md"><div className={`w-2 h-2 rounded-full ${item.diet === 'VEG' ? 'bg-emerald-500' : 'bg-red-500'}`} /></div>
                      {!item.isAvailable && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]"><span className="px-3 py-1.5 bg-white border border-primary/10 rounded-lg shadow-sm text-[9px] uppercase tracking-widest font-bold text-primary">Sold Out</span></div>}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-1">
                      <p className="text-[8px] uppercase tracking-widest font-bold text-foreground/40">{item.category}</p>
                      <h4 className="text-xs font-bold text-primary leading-tight line-clamp-2">{item.name}</h4>
                      <p className="text-sm font-bold text-accent mt-2">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </Fragment>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: CART SIDEBAR */}
      <div className="w-100 flex flex-col bg-white/80 backdrop-blur-xl rounded-4xl border border-primary/10 shadow-lg overflow-hidden shrink-0">
        <div className="p-5 border-b border-primary/5 bg-secondary/10 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2"><ShoppingBag size={16} /> Current Order</h3>
            <div className="flex items-center gap-3">
              {state.editingTicketId && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold uppercase tracking-widest rounded">Editing</span>}
              <button onClick={() => { handlers.setCart([]); handlers.setEditingTicketId(null); handlers.setWalkInPhone(''); handlers.setWalkInFirstName(''); handlers.setWalkInLastName(''); }} className="text-[9px] uppercase tracking-widest font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"><Trash2 size={12} /> Clear</button>
            </div>
          </div>
          
          {/* THE FIX: Type Buttons now reset the payment method logically */}
          <div className="flex space-x-1.5 bg-white p-1 rounded-xl border border-primary/5 shadow-sm mb-4">
            <button onClick={() => { handlers.setCustomerType('WALK_IN'); handlers.setPaymentMethod('CASH'); }} className={`flex-1 py-2 text-[9px] uppercase font-bold tracking-widest rounded-lg transition-colors ${state.customerType === 'WALK_IN' ? 'bg-primary text-white shadow-md' : 'text-foreground/50 hover:bg-secondary'}`}>Walk-in</button>
            <button onClick={() => { handlers.setCustomerType('IN_HOUSE'); handlers.setPaymentMethod('ROOM_TAB'); }} className={`flex-1 py-2 text-[9px] uppercase font-bold tracking-widest rounded-lg transition-colors ${state.customerType === 'IN_HOUSE' ? 'bg-primary text-white shadow-md' : 'text-foreground/50 hover:bg-secondary'}`}>In-House Tab</button>
          </div>
          
          {/* DOMINO'S STYLE AUTO-FILL */}
          {state.customerType === 'WALK_IN' ? (
            <div className="space-y-3 bg-white p-3 rounded-xl border border-primary/5 shadow-sm">
              <div>
                <label className="block text-[8px] uppercase tracking-widest text-foreground/50 font-bold mb-1 ml-1">Phone Number (Search)</label>
                <input type="text" placeholder="+91..." value={state.walkInPhone} onChange={e => handlers.handlePhoneLookup(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-primary/10 rounded-lg text-xs font-bold text-primary outline-none focus:border-primary transition-all" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[8px] uppercase tracking-widest text-foreground/50 font-bold mb-1 ml-1">First Name</label>
                  <input type="text" placeholder="John" value={state.walkInFirstName} onChange={e => handlers.setWalkInFirstName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-primary/10 rounded-lg text-xs font-bold text-primary outline-none focus:border-primary transition-all" />
                </div>
                <div className="flex-1">
                  <label className="block text-[8px] uppercase tracking-widest text-foreground/50 font-bold mb-1 ml-1">Last Name</label>
                  <input type="text" placeholder="Doe" value={state.walkInLastName} onChange={e => handlers.setWalkInLastName(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-primary/10 rounded-lg text-xs font-bold text-primary outline-none focus:border-primary transition-all" />
                </div>
              </div>
            </div>
          ) : (
            // <select value={state.selectedRoom} onChange={e => handlers.setSelectedRoom(e.target.value)} className="w-full p-3 bg-white border border-primary/10 rounded-xl text-[10px] uppercase tracking-widest font-bold text-primary outline-none">
            //   <option value="">Select Checked-In Guest...</option>
            //   {state.activeBookings.map(b => (
            //     <option key={b.id} value={b.id}>{b.room?.roomNumber} - {b.guestFirstName} {b.guestLastName}</option>
            //   ))}
            // </select>
            <Listbox value={state.selectedRoom} onChange={handlers.setSelectedRoom}>
              {console.log(state)}
              <div className="relative">
                <ListboxButton className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-primary/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm outline-none cursor-pointer">
                  <span className="truncate">
                    {state.activeBookings.find(b => b.id === state.selectedRoom) 
                      ? `${state.activeBookings.find(b => b.id === state.selectedRoom).roomNumber} - ${state.activeBookings.find(b => b.id === state.selectedRoom).guestFirstName} ${state.activeBookings.find(b => b.id === state.selectedRoom).guestLastName}` 
                      : 'Select Checked-In Guest...'}
                  </span>
                  <ChevronDown size={14} className="opacity-50" />
                </ListboxButton>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <ListboxOptions className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-primary/10 focus:outline-none">
                    {state.activeBookings.map(b => (
                      <ListboxOption key={b.id} value={b.id} className={({ active }) => `relative cursor-pointer select-none p-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${active ? 'bg-secondary text-primary' : 'text-foreground/70'}`}>
                        {b.roomNumber} - {b.guestFirstName} {b.guestLastName}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Transition>
              </div>
            </Listbox>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-accent/25 scrollbar-corner-foreground/75 scrollbar-track-accent/25 p-5 space-y-4">
          {state.cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-foreground/40 text-center">
              <UtensilsCrossed size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Cart is Empty</p>
            </div>
          ) : (
            state.cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-white border border-primary/5 rounded-xl shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${item.diet === 'VEG' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <p className="text-xs font-bold text-primary leading-tight">{item.name}</p>
                    </div>
                    <p className="text-[10px] text-accent font-bold mt-1 pl-3.5">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-1 border border-primary/5 shrink-0">
                    <button onClick={() => handlers.updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-primary transition-colors"><Minus size={12}/></button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => handlers.updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-primary transition-colors"><Plus size={12}/></button>
                  </div>
                </div>
                <input type="text" placeholder="Add note (e.g., Extra hot)" value={item.notes || ''} onChange={(e) => handlers.updateItemNote(item.id, e.target.value)} className="text-[9px] p-2 bg-gray-50 border border-primary/10 rounded-lg outline-none text-primary ml-3.5 w-[calc(100%-14px)]" />
              </div>
            ))
          )}
        </div>

        {/* THE FIX: Unified Checkout Bar with In-House Payment Options */}
        <div className="p-5 bg-white border-t border-primary/5 shrink-0 space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/50">Grand Total</span>
            <span className="text-2xl font-bold text-primary">₹{state.cartTotal}</span>
          </div>
          
          <div className="space-y-3">
            {state.customerType === 'IN_HOUSE' && (
               <p className="text-[9px] text-center text-foreground/50 italic px-2">Guest can pay now or charge to their final room ledger.</p>
            )}
            <div className="flex gap-2">
              {state.customerType === 'IN_HOUSE' && (
                <button onClick={() => handlers.setPaymentMethod('ROOM_TAB')} className={`flex-1 py-2.5 rounded-xl border text-[9px] uppercase tracking-widest font-bold transition-all ${state.paymentMethod === 'ROOM_TAB' ? 'bg-primary text-white border-primary shadow-md' : 'bg-gray-50 text-foreground/60 border-primary/10'}`}>Room Tab</button>
              )}
              <button onClick={() => handlers.setPaymentMethod('CASH')} className={`flex-1 py-2.5 rounded-xl border text-[9px] uppercase tracking-widest font-bold transition-all ${state.paymentMethod === 'CASH' ? 'bg-primary text-white border-primary shadow-md' : 'bg-gray-50 text-foreground/60 border-primary/10'}`}>Cash</button>
              <button onClick={() => handlers.setPaymentMethod('UPI')} className={`flex-1 py-2.5 rounded-xl border text-[9px] uppercase tracking-widest font-bold transition-all ${state.paymentMethod === 'UPI' ? 'bg-primary text-white border-primary shadow-md' : 'bg-gray-50 text-foreground/60 border-primary/10'}`}>UPI / Card</button>
            </div>
            
            <button 
              disabled={state.cart.length === 0 || (state.customerType === 'IN_HOUSE' && !state.selectedRoom)} 
              onClick={handlers.handleProcessOrder} 
              className="w-full py-4 bg-accent hover:bg-accent/90 text-white text-[10px] uppercase font-bold tracking-[0.2em] rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Receipt size={16} /> 
              {state.editingTicketId 
                ? 'Update Order' 
                : (state.paymentMethod === 'ROOM_TAB' ? 'Charge to Room Tab' : 'Print Ticket & Pay')
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}