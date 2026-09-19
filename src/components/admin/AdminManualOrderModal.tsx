import React, { useState } from 'react';
import { Store, MenuItem, Order } from '../../types';
import { adminService } from '../../services/adminService';
import {
  PhoneCall,
  X,
  Plus,
  Minus,
  Check,
  MapPin,
  Store as StoreIcon,
  DollarSign,
  Truck,
  AlertCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  stores: Store[];
  onClose: () => void;
  onOrderCreated: (newOrder: Order) => void;
}

export const AdminManualOrderModal: React.FC<Props> = ({
  isOpen,
  stores,
  onClose,
  onOrderCreated,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+213 ');
  const [addressStreet, setAddressStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Selected store and items
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customDeliveryFee, setCustomDeliveryFee] = useState<number>(
    selectedStore?.deliveryFee || 150
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const selectedItemsList = Object.entries(quantities)
    .map(([itemId, qty]) => {
      const item = selectedStore?.items?.find((i) => i.id === itemId);
      return item ? { item, qty } : null;
    })
    .filter(Boolean) as Array<{ item: MenuItem; qty: number }>;

  const subtotal = selectedItemsList.reduce((sum, entry) => sum + entry.item.price * entry.qty, 0);
  const total = subtotal + Number(customDeliveryFee || 0) + 50; // +50 packaging

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Veuillez renseigner le nom et le numéro de téléphone du client.');
      return;
    }

    if (selectedItemsList.length === 0) {
      setErrorMsg('Veuillez ajouter au moins un plat au panier.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newOrder = adminService.createManualPhoneOrder({
        customerName,
        customerPhone,
        commune: 'Ahmed Rachedi',
        street: addressStreet || 'Centre-Ville',
        landmark: landmark || 'Près du centre',
        storeId: selectedStore.id,
        items: selectedItemsList.map((entry) => ({
          menuItemId: entry.item.id,
          name: entry.item.name,
          price: entry.item.price,
          quantity: entry.qty,
        })),
        deliveryFee: Number(customDeliveryFee) || 150,
        notes: deliveryNotes,
      }, stores);

      onOrderCreated(newOrder);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <PhoneCall size={18} className="text-[#D9943B]" />
            <div>
              <h3 className="font-bold text-sm">Commande Téléphonique Directe (Dispatch)</h3>
              <p className="text-[10px] text-zinc-300">
                Saisie manuelle par l'administrateur pour les clients par appel vocal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Info Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>1. Coordonnées de l'Appelant</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Nom du Client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mourad Bouzid"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Téléphone Mobile *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+213 550..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Quartier / Rue à Ahmed Rachedi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cité 50 Logements, Rue Principale..."
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Repère / Point de Chute
                </label>
                <input
                  type="text"
                  placeholder="Ex: Près de la Mosquée Al-Ansar"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Store Selection Section */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-100">
            <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>2. Choix de l'Établissement</span>
            </h4>

            <select
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                setQuantities({});
                const st = stores.find((s) => s.id === e.target.value);
                if (st) setCustomDeliveryFee(st.deliveryFee);
              }}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold text-zinc-800"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category}) • Frais habituels: {s.deliveryFee} DZD
                </option>
              ))}
            </select>
          </div>

          {/* Item Selection from Menu */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h4 className="text-xs font-bold text-zinc-900 flex items-center justify-between">
              <span>3. Sélection des Plats</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                {selectedItemsList.length} articles sélectionnés
              </span>
            </h4>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {selectedStore?.items?.map((item) => {
                const qty = quantities[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 block">{item.name}</span>
                      <span className="text-[10px] text-zinc-500">{item.price.toLocaleString()} DZD</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                      )}
                      {qty > 0 && (
                        <span className="font-mono font-bold text-xs w-4 text-center">{qty}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-[#D9943B] hover:brightness-105 flex items-center justify-center font-bold text-[#071E26]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Fee and Totals */}
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600">Frais de livraison appliqués :</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={customDeliveryFee}
                  onChange={(e) => setCustomDeliveryFee(Number(e.target.value))}
                  className="w-20 text-xs p-1 bg-white border border-neutral-300 rounded text-right font-mono"
                />
                <span className="text-zinc-500 font-medium">DZD</span>
              </div>
            </div>

            <div className="flex justify-between text-zinc-600">
              <span>Sous-total articles :</span>
              <span className="font-mono font-semibold">{subtotal.toLocaleString()} DZD</span>
            </div>

            <div className="flex justify-between text-zinc-600">
              <span>Frais d'emballage standard :</span>
              <span className="font-mono font-semibold">50 DZD</span>
            </div>

            <div className="pt-2 border-t border-neutral-300 flex justify-between font-extrabold text-sm text-[#1C1B1B]">
              <span>Total Commande (COD) :</span>
              <span className="font-black text-emerald-700">{total.toLocaleString()} DZD</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedItemsList.length === 0}
              className="px-4 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Validation...' : 'Créer & Dispatchez la Commande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
