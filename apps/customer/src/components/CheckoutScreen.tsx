import React, { useState } from 'react';
import { CartItem, DeliveryAddress, Order } from '../types';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  Banknote,
  Check,
  ChevronRight,
  Leaf,
  Info,
  Building,
  Phone,
} from 'lucide-react';

interface Props {
  cartItems: CartItem[];
  deliveryAddress: DeliveryAddress;
  onUpdateAddress: (address: DeliveryAddress) => void;
  onBack: () => void;
  onConfirmOrder: (newOrder: Order) => void;
}

export const CheckoutScreen: React.FC<Props> = ({
  cartItems,
  deliveryAddress,
  onUpdateAddress,
  onBack,
  onConfirmOrder,
}) => {
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'takeout'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CIB'>('COD');
  const [ecoCutlery, setEcoCutlery] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('Sonner 2 fois à l\'interphone. Préparer l\'appoint si possible.');
  const [showAddressEditor, setShowAddressEditor] = useState(false);

  // Address edit state
  const [editWilaya, setEditWilaya] = useState(deliveryAddress.wilaya);
  const [editCommune, setEditCommune] = useState(deliveryAddress.commune);
  const [editStreet, setEditStreet] = useState(deliveryAddress.street);
  const [editLandmark, setEditLandmark] = useState(deliveryAddress.landmark);
  const [editPhone, setEditPhone] = useState(deliveryAddress.phone);

  const subtotal = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  const deliveryFee = deliveryMode === 'delivery' ? 150 : 0;
  const packagingFee = 50;
  const discount = subtotal >= 1000 ? 150 : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee + packagingFee - discount);

  const storeName = cartItems[0]?.storeName || 'Restaurant RYM';
  const storeId = cartItems[0]?.storeId || 'store-palmier';

  const handlePlaceOrder = () => {
    const orderId = `order-${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: orderId,
      orderNumber: `#HB-${Date.now().toString().slice(-4)}`,
      storeId,
      storeName,
      storeCategory: 'Livraison Express',
      storeImageUrl: cartItems[0]?.imageUrl || '',
      items: cartItems,
      subtotal,
      deliveryFee,
      packagingFee,
      discount,
      total: grandTotal,
      status: 'CONFIRMED',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedDeliveryTime: 'dans 25-30 mins',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      courierId: 'courier-karim',
      courierName: 'Karim B.',
      courierPhone: '+213 555 88 99 00',
      courierAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnLgieeCF8ANxDxGqfJBxx4kjN-psqMb4MO9qTa3aoO0Qsz5aYMyWF-4meTl3-YluN6pO1WvE3z8q13EjhO4ylotuROjN2F7b3cGzY6InATavSGNRiY81Abt6msgXrjxk1hJZh3ivc3Qg62zoChrbudeY-GLLB23Axh3UpzfYfLXjdMxaZU-7HXMBbw9EyBfXunbj3n_WZXmeMexp59kbQmk5YHH5YXHBP2O0vbMoPila0sJJxBx5A',
      courierRating: 4.9,
      courierVehicle: 'Scooter Honda SH',
      deliveryAddress,
      deliveryNotes,
      cutleryOption: ecoCutlery,
      statusTimeline: [
        {
          status: 'PENDING',
          label: 'Commande transmise',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: false,
        },
        {
          status: 'CONFIRMED',
          label: 'Confirmée par le restaurant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: true,
        },
        { status: 'PREPARING', label: 'En cuisine', timestamp: 'En attente', completed: false, current: false },
        { status: 'PICKED_UP', label: 'Récupérée par le livreur', timestamp: 'En attente', completed: false, current: false },
        { status: 'DELIVERING', label: 'En route vers votre adresse', timestamp: 'En attente', completed: false, current: false },
        { status: 'DELIVERED', label: 'Livrée avec signature', timestamp: 'En attente', completed: false, current: false },
      ],
    };

    onConfirmOrder(newOrder);
  };

  const handleSaveAddress = () => {
    onUpdateAddress({
      ...deliveryAddress,
      wilaya: editWilaya,
      commune: editCommune,
      street: editStreet,
      landmark: editLandmark,
      phone: editPhone,
    });
    setShowAddressEditor(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-24 relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-700 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-[15px] text-[#1C1B1B]">Confirmation de Commande</h1>
        <div className="w-8"></div>
      </header>

      <div className="p-3.5 space-y-3">
        {/* Toggle Mode: Livraison vs À Emporter */}
        <div className="bg-white p-1 rounded-2xl border border-black/[0.04] flex shadow-xs">
          <button
            onClick={() => setDeliveryMode('delivery')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              deliveryMode === 'delivery'
                ? 'bg-[#D9943B] text-[#1C1B1B] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            🛵 Livraison à domicile (28 min)
          </button>
          <button
            onClick={() => setDeliveryMode('takeout')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              deliveryMode === 'takeout'
                ? 'bg-[#D9943B] text-[#1C1B1B] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            🛍️ À emporter au comptoir
          </button>
        </div>

        {/* Algerian Delivery Address Card */}
        {deliveryMode === 'delivery' && (
          <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[14px] text-[#1C1B1B]">{deliveryAddress.label}</span>
                    <span className="text-[10px] bg-neutral-100 text-zinc-600 font-semibold px-1.5 py-0.2 rounded">
                      {deliveryAddress.commune}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-800 font-medium mt-0.5">
                    {deliveryAddress.street}, {deliveryAddress.building} ({deliveryAddress.floor})
                  </p>

                  {/* Algerian Landmark Callout */}
                  <div className="mt-1.5 bg-amber-50/80 border border-amber-200/50 rounded-lg p-1.5 flex items-start gap-1.5">
                    <Building size={13} className="text-[#B02F00] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#B02F00] font-semibold leading-tight">
                      <span className="underline">Repère de livraison :</span> {deliveryAddress.landmark}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-700">{deliveryAddress.recipientName}</span>
                    <span>•</span>
                    <span>{deliveryAddress.phone}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAddressEditor(true)}
                className="text-xs font-bold text-[#FF5722] hover:underline shrink-0"
              >
                Modifier
              </button>
            </div>
          </div>
        )}

        {/* Estimated Delivery Time with Guarantee */}
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-emerald-700" />
            <div>
              <div className="text-xs font-bold text-emerald-950">Arrivée estimée : 12:45 - 12:55</div>
              <p className="text-[10px] text-emerald-800">Engagement Ponctualité RYM : Bon de 300 DZD si retard</p>
            </div>
          </div>
          <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">Garanti</span>
        </div>

        {/* Order Items Review */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h2 className="font-bold text-[13px] text-[#1C1B1B]">{storeName}</h2>
            <span className="text-xs text-zinc-400 font-medium">{cartItems.length} article(s)</span>
          </div>

          <div className="space-y-2.5">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-13 h-13 rounded-lg object-cover bg-neutral-100 shrink-0 border border-black/5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-[#1C1B1B] line-clamp-1">{item.name}</span>
                    <span className="font-extrabold text-xs text-zinc-900 ml-2">
                      {item.basePrice * item.quantity} DZD
                    </span>
                  </div>

                  {item.options.length > 0 && (
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {item.options.map((o) => o.optionName).join(' · ')}
                    </div>
                  )}

                  {item.chefRemark && (
                    <div className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded mt-0.5 font-medium inline-block">
                      Remarque : {item.chefRemark}
                    </div>
                  )}

                  <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">Qté : ×{item.quantity}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Eco Cutlery Option */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Leaf size={15} className="text-emerald-600" />
              <div>
                <span className="text-xs font-semibold text-zinc-800">Couverts et serviettes jetables</span>
                <p className="text-[10px] text-zinc-400">Moins de plastique pour notre environnement</p>
              </div>
            </div>
            <button
              onClick={() => setEcoCutlery(!ecoCutlery)}
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                ecoCutlery ? 'bg-[#00B578]' : 'bg-zinc-200'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  ecoCutlery ? 'translate-x-4' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Delivery Note Input */}
          <div className="pt-2 border-t border-neutral-100">
            <label htmlFor="delivery-notes" className="text-[11px] font-bold text-zinc-700 block mb-1">
              Instructions pour le livreur RYM
            </label>
            <input
              id="delivery-notes"
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Ex: Interphone B14, laisser au concierge si absent..."
              className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-2 focus:outline-none focus:border-[#D9943B]"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs space-y-2">
          <h3 className="font-bold text-[13px] text-[#1C1B1B] mb-1">Mode de Paiement</h3>

          {/* COD (Cash on Delivery) - Preselected */}
          <label
            onClick={() => setPaymentMethod('COD')}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              paymentMethod === 'COD'
                ? 'border-[#D9943B] bg-amber-50/40 ring-1 ring-[#D9943B]'
                : 'border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Banknote size={17} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#1C1B1B]">Paiement en espèces à la livraison (COD)</span>
                  <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1 rounded">Recommandé</span>
                </div>
                <p className="text-[10px] text-zinc-500">Réglez directement en dinars (DZD) auprès du livreur</p>
              </div>
            </div>
            {paymentMethod === 'COD' && <Check size={16} className="text-[#D9943B]" />}
          </label>

          {/* CIB / Edahabia / BaridiMob */}
          <label
            onClick={() => setPaymentMethod('CIB')}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              paymentMethod === 'CIB'
                ? 'border-[#D9943B] bg-amber-50/40 ring-1 ring-[#D9943B]'
                : 'border-neutral-100 hover:border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                <CreditCard size={17} />
              </div>
              <div>
                <span className="font-bold text-xs text-[#1C1B1B]">Carte Edahabia / CIB (BaridiMob)</span>
                <p className="text-[10px] text-zinc-500">Paiement électronique sécurisé par SATIM</p>
              </div>
            </div>
            {paymentMethod === 'CIB' && <Check size={16} className="text-[#D9943B]" />}
          </label>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-zinc-600">
            <span>Sous-total articles</span>
            <span className="font-medium">{subtotal} DZD</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Frais de livraison ({deliveryAddress.commune})</span>
            <span className="font-medium">{deliveryFee} DZD</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Emballage isotherme de qualité</span>
            <span className="font-medium">{packagingFee} DZD</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#FF5722] font-semibold">
              <span>Coupon de réduction RYM</span>
              <span>-{discount} DZD</span>
            </div>
          )}
          <div className="pt-2 border-t border-neutral-100 flex justify-between items-baseline">
            <span className="font-bold text-sm text-[#1C1B1B]">Total à régler à la livraison</span>
            <span className="font-extrabold text-base text-[#FF5722]">{grandTotal} DZD</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] mx-auto p-3 bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-xl z-40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase">Total (Espèces / COD)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#1C1B1B]">{grandTotal}</span>
              <span className="text-xs font-bold text-[#FF5722]">DZD</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="flex-1 h-12 bg-[#D9943B] hover:brightness-105 active:scale-[0.98] text-[#1C1B1B] rounded-full px-5 flex items-center justify-center gap-2 font-bold shadow-md transition-all text-sm"
          >
            <span>Confirmer & Commander (COD)</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* Address Edit Dialog Modal */}
      {showAddressEditor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-2xl p-4 space-y-3 shadow-2xl">
            <h3 className="font-bold text-[15px] text-[#1C1B1B]">Modifier l'adresse algérienne</h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-zinc-500 font-semibold block mb-0.5">Wilaya & Commune</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editWilaya}
                    onChange={(e) => setEditWilaya(e.target.value)}
                    className="p-2 border rounded-lg"
                    placeholder="16 - Alger"
                  />
                  <input
                    type="text"
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    className="p-2 border rounded-lg"
                    placeholder="Hydra"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-500 font-semibold block mb-0.5">Rue / Résidence / Bâtiment</label>
                <input
                  type="text"
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Rue du Val d'Hydra, Bâtiment B"
                />
              </div>

              <div>
                <label className="text-[#B02F00] font-bold block mb-0.5">
                  Repère / Landmark (Crucial en Algérie)
                </label>
                <input
                  type="text"
                  value={editLandmark}
                  onChange={(e) => setEditLandmark(e.target.value)}
                  className="w-full p-2 border border-amber-300 bg-amber-50/50 rounded-lg"
                  placeholder="Près de la Grande Mosquée, En face de la pharmacie..."
                />
              </div>

              <div>
                <label className="text-zinc-500 font-semibold block mb-0.5">Numéro de téléphone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="+213 550 12 34 56"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddressEditor(false)}
                className="flex-1 py-2 rounded-xl text-zinc-600 bg-neutral-100 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAddress}
                className="flex-1 py-2 rounded-xl bg-[#D9943B] text-zinc-900 font-bold text-xs shadow-xs"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
