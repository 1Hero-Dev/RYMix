import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CartItem, DeliveryAddress } from '../types';
import { LazyImage } from './common/LazyImage';
import {
  MapPin,
  Store,
  Clock,
  Banknote,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  Navigation,
  Phone,
  Sparkles,
} from 'lucide-react';
import {
  MILA_DEFAULT_ORIGIN,
  MILA_DEFAULT_DESTINATION,
  AHMED_RACHEDI_BOUNDS,
  LatLng,
} from '../utils/roadRoutingService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  storeName: string;
  cartItems: CartItem[];
  deliveryFee: number;
  isFreeDelivery: boolean;
  packagingFee: number;
  discount: number;
  appliedDiscountLabel?: string;
  subtotal: number;
  grandTotal: number;
  deliveryAddress: DeliveryAddress;
  deliveryNotes?: string;
  ecoCutlery?: boolean;
  estimatedTime?: string;
  distanceMeters?: number;
}

export const CheckoutOrderConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  storeName,
  cartItems,
  deliveryFee,
  isFreeDelivery,
  packagingFee,
  discount,
  appliedDiscountLabel,
  subtotal,
  grandTotal,
  deliveryAddress,
  deliveryNotes,
  ecoCutlery,
  estimatedTime = '12–18 min',
  distanceMeters = 1450,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const totalItemCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Initialize Miniature Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Small delay to ensure modal DOM is mounted and visible
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const origin: LatLng = MILA_DEFAULT_ORIGIN;
      const destLat = deliveryAddress.lat || MILA_DEFAULT_DESTINATION[0];
      const destLng = deliveryAddress.lng || MILA_DEFAULT_DESTINATION[1];
      const destination: LatLng = [destLat, destLng];

      try {
        const map = L.map(mapContainerRef.current, {
          center: destination,
          zoom: 15,
          minZoom: 13,
          maxZoom: 18,
          maxBounds: AHMED_RACHEDI_BOUNDS,
          maxBoundsViscosity: 1.0,
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
        });

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Store Origin Marker
        const storeIcon = L.divIcon({
          className: 'custom-minimal-marker',
          html: `
            <div style="transform: translate(-50%, -50%);">
              <div style="background-color: #071E26; color: #D9943B; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);" class="w-7 h-7 rounded-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                  <path d="M2 7h20"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [28, 28],
        });
        L.marker(origin, { icon: storeIcon }).addTo(map);

        // Client Delivery Pin
        const destIcon = L.divIcon({
          className: 'custom-minimal-marker',
          html: `
            <div style="transform: translate(-50%, -50%);">
              <div style="background-color: #D91A67; color: white; border: 2px solid white; box-shadow: 0 4px 8px -1px rgba(217,26,103,0.4);" class="w-8 h-8 rounded-full flex items-center justify-center animate-bounce">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
        });
        L.marker(destination, { icon: destIcon }).addTo(map);

        // Connecting road line (simulated shortest path)
        const midpoint: LatLng = [
          (origin[0] + destination[0]) / 2 + 0.001,
          (origin[1] + destination[1]) / 2 - 0.002,
        ];
        L.polyline([origin, midpoint, destination], {
          color: '#00B578',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.85,
        }).addTo(map);

        const bounds = L.latLngBounds([origin, destination]);
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
        map.invalidateSize();

        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('MiniMap initialization notice:', err);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, deliveryAddress]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-order-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        {/* Top Header Bar */}
        <header className="px-4 py-3 border-b border-black/[0.06] bg-white/95 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-zinc-700 transition-colors"
              aria-label="Modifier"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 id="confirm-order-title" className="font-extrabold text-[15px] text-[#1C1B1B] leading-tight">
                Confirmation de commande
              </h2>
              <p className="text-[10px] text-zinc-500">Dernière vérification avant envoi au restaurant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded-lg"
          >
            Modifier
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
          {/* 1. Miniature Map & Delivery Address Card */}
          <section className="bg-neutral-50 rounded-2xl p-3 border border-black/[0.05] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1C1B1B] flex items-center gap-1.5">
                <Navigation size={14} className="text-[#1C1B1B]" />
                Itinéraire de livraison (Ahmed Rachedi)
              </span>
              <span className="text-[11px] font-bold text-zinc-900 bg-neutral-200 px-2 py-0.5 rounded-full">
                ~{(distanceMeters / 1000).toFixed(1)} km • {estimatedTime}
              </span>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-black/10 shadow-inner bg-neutral-200">
              <div ref={mapContainerRef} className="w-full h-full" />
              {/* Floating ETA Badge on Map */}
              <div className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md shadow-xs border border-black/5 flex items-center gap-1 text-[10px] font-bold text-zinc-800">
                <Clock size={11} className="text-[#1C1B1B]" />
                Livraison estimée : {estimatedTime}
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white rounded-xl p-2.5 border border-black/[0.04] space-y-1.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-[#1C1B1B] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[#1C1B1B] truncate">
                    {deliveryAddress.street || 'Cité El Bassatine'}, {deliveryAddress.commune || 'Ahmed Rachedi'}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    {deliveryAddress.wilaya || 'Ahmed Rachedi'} {deliveryAddress.building && `• ${deliveryAddress.building}`}
                  </div>
                </div>
              </div>

              {/* Landmark Callout */}
              {deliveryAddress.landmark && (
                <div className="flex items-center gap-1.5 bg-neutral-100 text-zinc-900 border border-neutral-200 px-2 py-1 rounded-lg text-[11px] font-semibold">
                  <span className="text-[10px] uppercase tracking-wider bg-neutral-200 text-zinc-900 px-1 py-0.2 rounded font-bold">
                    Repère
                  </span>
                  <span className="truncate">{deliveryAddress.landmark}</span>
                </div>
              )}

              {/* Recipient Phone & Notes */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px] text-zinc-600">
                <div className="flex items-center gap-1">
                  <Phone size={11} className="text-[#1C1B1B]" />
                  <span className="font-semibold text-zinc-800">{deliveryAddress.phone || '+213 551 23 45 67'}</span>
                  <span className="text-zinc-400">({deliveryAddress.recipientName || 'Amine B.'})</span>
                </div>
                {deliveryNotes && (
                  <span className="text-zinc-500 italic truncate max-w-[140px] text-[10px]" title={deliveryNotes}>
                    "{deliveryNotes}"
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 2. Items Recap */}
          <section className="bg-white rounded-2xl p-3 border border-black/[0.05] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1C1B1B]">
                <Store size={14} className="text-[#1C1B1B]" />
                <span>{storeName}</span>
              </div>
              <span className="text-[11px] font-bold text-zinc-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                {totalItemCount} {totalItemCount > 1 ? 'articles' : 'article'}
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {cartItems.map((item, idx) => {
                const uniqueKey = `${item.menuItemId || 'cart-item'}-${idx}`;
                const itemTotalPrice = (item.basePrice || 0) * item.quantity;
                return (
                  <div key={uniqueKey} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-100 border border-black/5">
                      <LazyImage
                        src={item.imageUrl}
                        alt={item.name}
                        targetWidth={100}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <h4 className="font-bold text-xs text-[#1C1B1B] truncate">{item.name}</h4>
                        <span className="font-extrabold text-xs text-zinc-900 shrink-0">
                          {itemTotalPrice} DZD
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                        <span className="font-bold text-amber-600 bg-amber-50 px-1.5 rounded">
                          ×{item.quantity}
                        </span>
                        <span>{item.basePrice} DZD / unité</span>
                      </div>

                      {/* Selected Customization Options */}
                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.options.map((opt, optIdx) => (
                            <span
                              key={`${uniqueKey}-opt-${optIdx}`}
                              className="text-[9px] bg-neutral-100 text-zinc-600 font-medium px-1.5 py-0.2 rounded border border-neutral-200/60"
                            >
                              {opt.optionName}{opt.priceDelta > 0 ? ` (+${opt.priceDelta} DZD)` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Chef Remark */}
                      {item.chefRemark && (
                        <div className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded mt-1 font-medium inline-block">
                          Note : {item.chefRemark}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {ecoCutlery && (
              <div className="text-[10px] text-zinc-800 bg-neutral-100 p-2 rounded-lg flex items-center gap-1.5 border border-neutral-200 font-medium">
                <CheckCircle2 size={12} className="shrink-0 text-[#1C1B1B]" />
                Option éco-responsable : Pas de couverts jetables requis.
              </div>
            )}
          </section>

          {/* 3. Delivery Fee & Payment Breakdown */}
          <section className="bg-white rounded-2xl p-3 border border-black/[0.05] shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Détail du tarif & livraison
            </h3>

            <div className="space-y-1.5 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>Sous-total articles</span>
                <span className="font-semibold text-zinc-800">{subtotal} DZD</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span>Frais de livraison</span>
                  <span className="text-[10px] text-zinc-400">(~1.4 km)</span>
                </div>
                {isFreeDelivery || deliveryFee === 0 ? (
                  <span className="font-bold text-[#1C1B1B] bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
                    OFFERTE (0 DZD)
                  </span>
                ) : (
                  <span className="font-semibold text-zinc-800">+{deliveryFee} DZD</span>
                )}
              </div>

              <div className="flex justify-between">
                <span>Frais d'emballage & service</span>
                <span className="font-semibold text-zinc-800">+{packagingFee} DZD</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-zinc-900 font-semibold bg-neutral-100 p-1.5 rounded-lg">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Sparkles size={12} className="text-[#1C1B1B]" />
                    {appliedDiscountLabel || 'Remise appliquée'}
                  </span>
                  <span>-{discount} DZD</span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-100 flex items-baseline justify-between">
                <div>
                  <span className="font-extrabold text-[13px] text-[#1C1B1B]">Total net à payer</span>
                  <span className="block text-[10px] text-zinc-400">Règlement en espèces à la livraison</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#1C1B1B]">{grandTotal}</span>
                  <span className="text-xs font-bold text-[#1C1B1B] ml-1">DZD</span>
                </div>
              </div>
            </div>

            {/* Cash on Delivery Notice Banner */}
            <div className="mt-2 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 flex items-start gap-2 text-zinc-900">
              <Banknote size={18} className="text-[#1C1B1B] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <strong className="block font-bold mb-0.5 text-zinc-950">
                  Paiement en espèces (COD) à la réception
                </strong>
                Merci de préparer l'appoint exact de <strong>{grandTotal} DZD</strong> pour faciliter le travail de votre coursier.
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Actions Sticky */}
        <footer className="p-3 bg-[#F8F4EC] border-t border-[#EADBCE] shadow-xl shrink-0 flex items-center gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="h-12 px-4 rounded-xl bg-white hover:bg-[#EADBCE] text-[#071E26] font-bold text-xs transition-colors border border-[#EADBCE] cursor-pointer"
          >
            Modifier
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.99] text-[#071E26] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#071E26] border-t-transparent rounded-full animate-spin" />
                <span>Envoi de la commande...</span>
              </div>
            ) : (
              <>
                <ShieldCheck size={16} className="text-[#071E26]" />
                <span>Valider la commande • {grandTotal} DZD</span>
                <ChevronRight size={15} className="text-[#071E26]" />
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};
