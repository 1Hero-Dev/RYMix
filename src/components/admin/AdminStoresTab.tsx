import React, { useState } from 'react';
import { Store, MenuItem } from '../../types';
import { adminService } from '../../services/adminService';
import {
  Store as StoreIcon,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Utensils,
  Clock,
  Phone,
  MapPin,
  DollarSign,
  ChevronRight,
  Eye,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface Props {
  stores: Store[];
  onStoresUpdated: () => void;
}

export const AdminStoresTab: React.FC<Props> = ({ stores, onStoresUpdated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [managingMenuStore, setManagingMenuStore] = useState<Store | null>(null);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);

  // New Store Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Restaurant');
  const [newStorePhone, setNewStorePhone] = useState('+213 ');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreLandmark, setNewStoreLandmark] = useState('');
  const [newStoreDeliveryFee, setNewStoreDeliveryFee] = useState(150);
  const [newStoreMinOrder, setNewStoreMinOrder] = useState(700);
  const [newStorePrepTime, setNewStorePrepTime] = useState(20);

  // New Menu Item Form State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(600);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPopular, setNewItemPopular] = useState(false);

  // Filtered stores
  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || s.category.includes(categoryFilter);
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(stores.map((s) => s.category)));

  const handleToggleStoreOpen = (storeId: string, currentOpen: boolean) => {
    adminService.toggleStoreOpen(storeId, !currentOpen);
    onStoresUpdated();
  };

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    adminService.addStore({
      name: newStoreName,
      category: newStoreCategory,
      phone: newStorePhone,
      address: newStoreAddress || 'Ahmed Rachedi Centre',
      landmark: newStoreLandmark || 'Près du centre-ville',
      deliveryFee: Number(newStoreDeliveryFee) || 150,
      minOrder: Number(newStoreMinOrder) || 700,
      prepTimeMinutes: Number(newStorePrepTime) || 20,
    });

    // Reset & close
    setNewStoreName('');
    setNewStoreAddress('');
    setNewStoreLandmark('');
    setShowAddStoreModal(false);
    onStoresUpdated();
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingMenuStore || !newItemName.trim()) return;

    adminService.addMenuItem(managingMenuStore.id, {
      name: newItemName,
      description: newItemDesc,
      price: Number(newItemPrice) || 500,
      category: newItemCategory || managingMenuStore.menuCategories[0] || 'Plats',
      isPopular: newItemPopular,
    });

    // Refresh managed store reference
    const refreshed = adminService.getStores().find((s) => s.id === managingMenuStore.id);
    if (refreshed) setManagingMenuStore(refreshed);

    setNewItemName('');
    setNewItemDesc('');
    setShowAddItemModal(false);
    onStoresUpdated();
  };

  const handleToggleStock = (storeId: string, itemId: string, currentInStock: boolean) => {
    adminService.toggleMenuItemStock(storeId, itemId, !currentInStock);
    const refreshed = adminService.getStores().find((s) => s.id === storeId);
    if (refreshed) setManagingMenuStore(refreshed);
    onStoresUpdated();
  };

  const handleDeleteItem = (storeId: string, itemId: string) => {
    adminService.deleteMenuItem(storeId, itemId);
    const refreshed = adminService.getStores().find((s) => s.id === storeId);
    if (refreshed) setManagingMenuStore(refreshed);
    onStoresUpdated();
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un restaurant, commerce ou adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#D9943B]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 font-medium text-zinc-700 focus:outline-none"
          >
            <option value="ALL">Toutes catégories ({stores.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddStoreModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Ajouter un Établissement</span>
        </button>
      </div>

      {/* Stores Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredStores.map((store) => {
          const totalItems = store.items?.length || 0;
          const inStockItems = store.items?.filter((i) => i.isAvailable !== false).length || 0;

          return (
            <div
              key={store.id}
              className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden flex flex-col hover:border-black/20 transition-all"
            >
              {/* Card Header with Image & Status Badge */}
              <div className="relative h-32 w-full bg-neutral-100 overflow-hidden">
                <img
                  src={store.imageUrl}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs flex items-center gap-1 ${
                      store.isOpen
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {store.isOpen ? 'OUVERT' : 'FERMÉ'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                    ★ {store.rating || 4.9}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleStoreOpen(store.id, store.isOpen)}
                  title={store.isOpen ? 'Fermer la boutique' : 'Ouvrir la boutique'}
                  className="absolute top-2.5 right-2.5 px-2 py-1 bg-white/90 hover:bg-white text-zinc-900 rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  {store.isOpen ? 'Fermer' : 'Ouvrir'}
                </button>

                <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                  <h3 className="font-bold text-sm truncate drop-shadow-sm">{store.name}</h3>
                  <p className="text-[11px] text-zinc-200 truncate">{store.category}</p>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5 text-xs text-zinc-600">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <MapPin size={13} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{store.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Phone size={13} className="text-zinc-400 shrink-0" />
                    <span>{store.phone || '+213 (Standard Ahmed Rachedi)'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-500 border-t border-neutral-100">
                    <span>Frais: <strong>{store.deliveryFee} DZD</strong></span>
                    <span>Min: <strong>{store.minOrder} DZD</strong></span>
                    <span>Prép: <strong>{store.prepTimeMinutes || 20} min</strong></span>
                  </div>
                </div>

                {/* Actions & Menu Management Button */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-zinc-500">
                    <strong>{inStockItems}</strong>/{totalItems} plats en stock
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setManagingMenuStore(store)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-[#D9943B] hover:text-[#071E26] text-zinc-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Utensils size={13} />
                      <span>Gérer la Carte</span>
                    </button>

                    <button
                      onClick={() => setEditingStore(store)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Modifier informations"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD STORE */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StoreIcon size={18} className="text-[#D9943B]" />
                <h3 className="font-bold text-sm">Ajouter un Établissement Partenaire</h3>
              </div>
              <button
                onClick={() => setShowAddStoreModal(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Nom du Commerce / Restaurant *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fast-Food Al Baraka, Boucherie Moderne..."
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Catégorie Principale
                  </label>
                  <select
                    value={newStoreCategory}
                    onChange={(e) => setNewStoreCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                  >
                    <option value="Grillades & Plats Traditionnels">Grillades & Plats Traditionnels</option>
                    <option value="Pizzeria & Tacos">Pizzeria & Tacos</option>
                    <option value="Boulangerie & Pâtisserie">Boulangerie & Pâtisserie</option>
                    <option value="Supérette & Épicerie">Supérette & Épicerie</option>
                    <option value="Boutiques & Mode">Boutiques & Mode</option>
                    <option value="Cafés & Salons de Thé">Cafés & Salons de Thé</option>
                    <option value="Pharmacie & Santé">Pharmacie & Santé</option>
                    <option value="Boucherie Halal">Boucherie Halal</option>
                    <option value="Fruits & Légumes">Fruits & Légumes</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Numéro de Téléphone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+213 550..."
                    value={newStorePhone}
                    onChange={(e) => setNewStorePhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Adresse à Ahmed Rachedi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boulevard 1er Novembre, Cité El Bassatine..."
                  value={newStoreAddress}
                  onChange={(e) => setNewStoreAddress(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Repère / Point de Référence Local
                </label>
                <input
                  type="text"
                  placeholder="Ex: En face de la Grande Mosquée, près du Dispensaire..."
                  value={newStoreLandmark}
                  onChange={(e) => setNewStoreLandmark(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Frais Livraison
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newStoreDeliveryFee}
                      onChange={(e) => setNewStoreDeliveryFee(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-zinc-400">DZD</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Min Commande
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newStoreMinOrder}
                      onChange={(e) => setNewStoreMinOrder(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-zinc-400">DZD</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Préparation
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newStorePrepTime}
                      onChange={(e) => setNewStorePrepTime(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-zinc-400">min</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Créer l'Établissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE MENU ITEMS */}
      {managingMenuStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Utensils size={18} className="text-[#D9943B]" />
                <div>
                  <h3 className="font-bold text-sm">Gestion de la Carte & Menu</h3>
                  <p className="text-[10px] text-zinc-300">{managingMenuStore.name} ({managingMenuStore.commune})</p>
                </div>
              </div>
              <button
                onClick={() => setManagingMenuStore(null)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Menu Items List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700">
                  {managingMenuStore.items?.length || 0} Articles au catalogue
                </span>
                <button
                  onClick={() => {
                    setNewItemCategory(managingMenuStore.menuCategories[0] || 'Plats');
                    setShowAddItemModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#D9943B] text-[#071E26] font-bold text-xs rounded-lg shadow-xs hover:brightness-105 active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>Ajouter un Plat</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {managingMenuStore.items?.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      item.isAvailable !== false
                        ? 'bg-neutral-50/60 border-neutral-200'
                        : 'bg-neutral-100/60 border-neutral-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-neutral-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-zinc-900 truncate">{item.name}</h4>
                          <span className="text-[10px] text-zinc-400 bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-medium">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate max-w-md">{item.description}</p>
                        <span className="font-extrabold text-xs text-[#1C1B1B] mt-0.5 block">
                          {item.price.toLocaleString()} DZD
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleStock(managingMenuStore.id, item.id, item.isAvailable !== false)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                          item.isAvailable !== false
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                        }`}
                      >
                        {item.isAvailable !== false ? (
                          <>
                            <Check size={12} />
                            <span>En Stock</span>
                          </>
                        ) : (
                          <>
                            <X size={12} />
                            <span>Épuisé</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteItem(managingMenuStore.id, item.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end shrink-0">
              <button
                onClick={() => setManagingMenuStore(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: ADD MENU ITEM */}
      {showAddItemModal && managingMenuStore && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Nouveau Plat au Menu</h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Nom de l'article / plat *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pizza Végétarienne Ahmed Rachedi..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Prix (DZD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Catégorie Menu
                  </label>
                  <input
                    type="text"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    placeholder="Ex: Plats Principaux"
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Description & Ingrédients
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sauce tomate fraîche, fromage fondu, herbes locales..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popCheck"
                  checked={newItemPopular}
                  onChange={(e) => setNewItemPopular(e.target.checked)}
                  className="rounded text-[#D9943B] focus:ring-[#D9943B]"
                />
                <label htmlFor="popCheck" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                  Mettre en avant comme "Populaire" / Coup de cœur
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  Enregistrer l'Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STORE BASIC MODAL */}
      {editingStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Modifier {editingStore.name}</h3>
              <button
                onClick={() => setEditingStore(null)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Téléphone</label>
                <input
                  type="text"
                  value={editingStore.phone || ''}
                  onChange={(e) => setEditingStore({ ...editingStore, phone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Frais Livraison (DZD)</label>
                  <input
                    type="number"
                    value={editingStore.deliveryFee}
                    onChange={(e) => setEditingStore({ ...editingStore, deliveryFee: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Min Commande (DZD)</label>
                  <input
                    type="number"
                    value={editingStore.minOrder}
                    onChange={(e) => setEditingStore({ ...editingStore, minOrder: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  onClick={() => setEditingStore(null)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    adminService.updateStore(editingStore.id, {
                      phone: editingStore.phone,
                      deliveryFee: editingStore.deliveryFee,
                      minOrder: editingStore.minOrder,
                    });
                    setEditingStore(null);
                    onStoresUpdated();
                  }}
                  className="px-4 py-2 bg-[#D9943B] font-bold text-xs rounded-xl text-[#071E26]"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
