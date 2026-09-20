import React, { useState, useMemo, useCallback } from 'react';
import { CartItem, DeliveryAddress, Order, Delivery } from '../types';
import { LazyImage } from './common/LazyImage';
import { CheckoutOrderConfirmationModal } from './CheckoutOrderConfirmationModal';
import {
  calculateServerAuthoritativeFee,
  createOrderItemSnapshots,
  generateIdempotencyKey,
} from '../utils/orderStateMachine';
import { outboxEventBus } from '../events/outboxEventBus';
import { createOrderFulfillmentRecord } from '../domain/fulfillment';
import { fidelityDB } from '../db/localDatabase';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { adminService } from '../services/adminService';
import { apiGateway } from '../services/apiGateway';
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
  HelpCircle,
  Ticket,
  Tag,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';

interface Props {
  cartItems: CartItem[];
  deliveryAddress: DeliveryAddress;
  onUpdateAddress: (address: DeliveryAddress) => void;
  onBack: () => void;
  onConfirmOrder: (newOrder: Order) => void;
  onOpenFAQ?: () => void;
}

export const CheckoutScreen: React.FC<Props> = React.memo(({
  cartItems,
  deliveryAddress,
  onUpdateAddress,
  onBack,
  onConfirmOrder,
  onOpenFAQ,
}) => {
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'takeout'>('delivery');
  const [ecoCutlery, setEcoCutlery] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('Sonner à l\'interphone. Préparer l\'appoint en espèces.');
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [showConfirmationReview, setShowConfirmationReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loyalty & Promotion State
  const { fidelityProfile } = useLocalDatabase();
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [orderPlacementError, setOrderPlacementError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountDZD: number;
    label: string;
  } | null>(null);

  // Address edit state
  const [editWilaya, setEditWilaya] = useState(deliveryAddress.wilaya || 'Ahmed Rachedi');
  const [editCommune, setEditCommune] = useState(deliveryAddress.commune || 'Ahmed Rachedi');
  const [editStreet, setEditStreet] = useState(deliveryAddress.street || 'Cité El Bassatine');
  const [editLandmark, setEditLandmark] = useState(deliveryAddress.landmark || 'Près de la Mosquée Al-Ansar');
  const [editPhone, setEditPhone] = useState(deliveryAddress.phone || '+213 551 23 45 67');

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  }, [cartItems]);

  const selectedVoucher = useMemo(() => {
    if (!selectedVoucherId) return null;
    return fidelityProfile.vouchers.find((v) => v.id === selectedVoucherId && !v.isUsed) || null;
  }, [selectedVoucherId, fidelityProfile.vouchers]);

  // Active unused vouchers from local loyalty DB
  const availableVouchers = useMemo(() => {
    return fidelityProfile.vouchers.filter((v) => !v.isUsed);
  }, [fidelityProfile.vouchers]);

  // Voucher discount verification against minimum spend
  const voucherDiscount = useMemo(() => {
    if (!selectedVoucher) return 0;
    if (subtotal < selectedVoucher.minSpendDZD) return 0;
    return selectedVoucher.discountDZD;
  }, [selectedVoucher, subtotal]);

  const manualPromoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    return appliedPromo.discountDZD;
  }, [appliedPromo]);

  const isFreeDeliveryQualified = subtotal >= 1200;

  // Server-authoritative fee computation and discount calculation wrapped in useMemo
  const {
    estimatedDistanceMeters,
    isWithin2KmRadius,
    deliveryFee,
    packagingFee,
    deliveryDiscount,
    voucherDiscountValue,
    manualDiscountValue,
    totalDiscount,
    grandTotal,
    pointsToEarn,
  } = useMemo(() => {
    const isPeripheralCommune =
      editCommune.toLowerCase().includes('senoussi') || editCommune.toLowerCase().includes('oued endja');
    const estimatedDistanceMeters = isPeripheralCommune ? 2600 : 1450;
    const within2Km = estimatedDistanceMeters <= 2000;

    const feeCalc = calculateServerAuthoritativeFee(subtotal, {
      ...deliveryAddress,
      commune: editCommune,
      landmark: editLandmark,
    });

    const baseDelFee = deliveryMode === 'delivery' ? feeCalc.deliveryFee : 0;
    const packFee = feeCalc.packagingFee;
    const delDisc = isFreeDeliveryQualified && deliveryMode === 'delivery' ? baseDelFee : 0;

    const totalDisc = delDisc + voucherDiscount + manualPromoDiscount;
    const total = Math.max(0, subtotal + baseDelFee + packFee - totalDisc);
    const earnedPoints = fidelityDB.calculatePointsForAmount(total, fidelityProfile.tier);

    return {
      estimatedDistanceMeters,
      isWithin2KmRadius: within2Km,
      deliveryFee: baseDelFee,
      packagingFee: packFee,
      deliveryDiscount: delDisc,
      voucherDiscountValue: voucherDiscount,
      manualDiscountValue: manualPromoDiscount,
      totalDiscount: totalDisc,
      grandTotal: total,
      pointsToEarn: earnedPoints,
    };
  }, [
    subtotal,
    editCommune,
    editLandmark,
    deliveryAddress,
    deliveryMode,
    isFreeDeliveryQualified,
    voucherDiscount,
    manualPromoDiscount,
    fidelityProfile.tier,
  ]);

  const handleApplyPromoCode = () => {
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    const validation = adminService.validatePromoCode(code, subtotal, deliveryFee);
    if (!validation.valid) {
      setPromoError(validation.error || 'Code promotionnel non valide ou expiré.');
      return;
    }

    setAppliedPromo({
      code: validation.code,
      discountDZD: validation.discountDZD,
      label: validation.label,
    });
    setPromoInput('');
  };

  const storeName = cartItems[0]?.storeName || 'Restaurant Ahmed Rachedi';
  const storeId = cartItems[0]?.storeId || 'store-beni-haroun';

  const handlePlaceOrder = async () => {
    if (adminService.getSettings().maintenanceMode) {
      setOrderPlacementError('Le service de commande est temporairement suspendu par l\'administrateur pour maintenance à Ahmed Rachedi.');
      setShowConfirmationReview(false);
      return;
    }
    if (isSubmitting || !isWithin2KmRadius) return;
    setOrderPlacementError(null);
    setIsSubmitting(true);

    if (appliedPromo) {
      adminService.recordPromoRedemption(appliedPromo.code);
    }

    const idempotencyKey = generateIdempotencyKey('cust-amine');
    const voucherCodeUsed = selectedVoucher ? selectedVoucher.code : appliedPromo ? appliedPromo.code : undefined;

    try {
      // Execute Authoritative Server-Side Checkout & Payment Orchestration (Recommendations C4, C5, C6, H1, H3)
      const session = {
        userId: 'cust-amine',
        name: deliveryAddress.recipientName || 'Amine B.',
        role: 'CUSTOMER' as const,
        token: 'auth-jwt-token-customer',
      };

      const response = await apiGateway.submitCheckout(session, {
        items: cartItems,
        storeId,
        storeName,
        storeCategory: 'Livraison Express Ahmed Rachedi',
        storeImageUrl: cartItems[0]?.imageUrl || '',
        deliveryAddress: {
          ...deliveryAddress,
          wilaya: editWilaya,
          commune: editCommune,
          street: editStreet,
          landmark: editLandmark,
          phone: editPhone,
        },
        deliveryNotes,
        cutleryOption: ecoCutlery,
        voucherCode: voucherCodeUsed,
        paymentMethod: 'COD',
        idempotencyKey,
      });

      if (!response.success || !response.order) {
        setIsSubmitting(false);
        setOrderPlacementError(response.error || 'Erreur lors de la validation serveur de la commande.');
        setShowConfirmationReview(false);
        return;
      }

      // Redeem selected voucher in the client fidelity cache
      if (selectedVoucherId) {
        fidelityDB.redeemVoucher(selectedVoucherId);
      }

      // 1. Initialize Fulfillment Record for tracking
      try {
        createOrderFulfillmentRecord(
          response.order.id,
          response.order.storeId,
          response.order.storeCategory,
          response.order.items
        );
      } catch (e) {
        console.warn('Fulfillment record init:', e);
      }

      setIsSubmitting(false);
      onConfirmOrder(response.order);
    } catch (err: any) {
      setIsSubmitting(false);
      setOrderPlacementError(err?.message || 'Erreur inattendue lors de la transmission.');
      setShowConfirmationReview(false);
    }
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
        <h1 className="font-bold text-[15px] text-[#0A2B35]">Confirmation de Commande</h1>
        <div className="w-8"></div>
      </header>

      <div className="p-3.5 space-y-3">
        {orderPlacementError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Service indisponible</span>
              <p>{orderPlacementError}</p>
            </div>
          </div>
        )}

        {/* Toggle Mode: Livraison vs À Emporter */}
        <div className="bg-white p-1 rounded-2xl border border-[#EADBCE] flex shadow-xs">
          <button
            onClick={() => setDeliveryMode('delivery')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              deliveryMode === 'delivery'
                ? 'bg-[#0A2B35] text-white shadow-xs'
                : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            🛵 Livraison à domicile (28 min)
          </button>
          <button
            onClick={() => setDeliveryMode('takeout')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              deliveryMode === 'takeout'
                ? 'bg-[#0A2B35] text-white shadow-xs'
                : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            🛍️ À emporter au comptoir
          </button>
        </div>

        {/* Algerian Delivery Address Card */}
        {deliveryMode === 'delivery' && (
          <div className="card-gradient-warm rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full btn-gradient-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <MapPin size={17} className="text-[#071E26]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[14px] text-[#0A2B35]">{deliveryAddress.label}</span>
                    <span className="badge-gradient-soft-primary text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {deliveryAddress.commune}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-800 font-medium mt-0.5">
                    {deliveryAddress.street}, {deliveryAddress.building} ({deliveryAddress.floor})
                  </p>

                  {/* Algerian Landmark Callout */}
                  <div className="mt-1.5 bg-[#F7EBD9]/80 border border-[#D9943B]/40 rounded-lg p-1.5 flex items-start gap-1.5">
                    <Building size={13} className="text-[#B8731E] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#0A2B35] font-semibold leading-tight">
                      <span className="underline text-[#B8731E]">Repère de livraison :</span> {deliveryAddress.landmark}
                    </p>
                  </div>

                  {/* Operational Launch Radius Geofence Callout (~2.0 km) */}
                  <div className={`mt-2 rounded-lg p-2 border text-xs flex items-center justify-between ${
                    isWithin2KmRadius
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isWithin2KmRadius ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="font-semibold text-[11px]">
                        Rayon de lancement : {(estimatedDistanceMeters / 1000).toFixed(2)} km {isWithin2KmRadius ? '≤ 2,0 km' : '> 2,0 km (Hors zone)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border border-black/5">
                      {isWithin2KmRadius ? 'Éligible Rachedi' : 'Périmètre dépassé'}
                    </span>
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
                className="text-xs font-bold text-[#D91A67] hover:underline shrink-0 cursor-pointer"
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
              <p className="text-[10px] text-emerald-800">Engagement Ponctualité : Bon de 300 DZD si retard</p>
            </div>
          </div>
          <span className="badge-gradient-primary text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">Garanti</span>
        </div>

        {/* Order Items Review */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EADBCE]/60">
            <h2 className="font-bold text-[13px] text-[#0A2B35]">{storeName}</h2>
            <span className="text-xs text-[#648692] font-medium">{cartItems.length} article(s)</span>
          </div>

          <div className="space-y-2.5">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <div className="w-13 h-13 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-black/5">
                  <LazyImage
                    src={item.imageUrl}
                    alt={item.name}
                    placeholderType="food"
                    targetWidth={120}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-[#0A2B35] line-clamp-1">{item.name}</span>
                    <span className="font-extrabold text-xs text-[#D91A67] ml-2">
                      {item.basePrice * item.quantity} DZD
                    </span>
                  </div>

                  {item.options.length > 0 && (
                    <div className="text-[10px] text-[#648692] mt-0.5">
                      {item.options.map((o) => o.optionName).join(' · ')}
                    </div>
                  )}

                  {item.chefRemark && (
                    <div className="text-[10px] text-[#B8731E] bg-[#F7EBD9] px-1.5 py-0.2 rounded mt-0.5 font-medium inline-block border border-[#EADBCE]">
                      Remarque : {item.chefRemark}
                    </div>
                  )}

                  <div className="text-[11px] text-[#648692] mt-0.5 font-medium">Qté : ×{item.quantity}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Eco Cutlery Option */}
          <div className="pt-2 border-t border-[#EADBCE]/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Leaf size={15} className="text-[#0A2B35]" />
              <div>
                <span className="text-xs font-semibold text-[#0A2B35]">Couverts et serviettes jetables</span>
                <p className="text-[10px] text-[#648692]">Moins de plastique pour notre environnement</p>
              </div>
            </div>
            <button
              onClick={() => setEcoCutlery(!ecoCutlery)}
              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                ecoCutlery ? 'bg-[#0A2B35]' : 'bg-zinc-200'
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
          <div className="pt-2 border-t border-[#EADBCE]/60">
            <label htmlFor="delivery-notes" className="text-[11px] font-bold text-[#0A2B35] block mb-1">
              Instructions pour le livreur
            </label>
            <input
              id="delivery-notes"
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Ex: Interphone B14, laisser au concierge si absent..."
              className="w-full text-xs bg-neutral-50 border border-[#EADBCE] rounded-lg p-2 focus:outline-none focus:border-[#D9943B]"
            />
          </div>
        </div>

        {/* Payment Method: Pure Cash on Delivery */}
        <div className="card-gradient-warm rounded-2xl p-3.5 border border-[#D9943B]/40 shadow-xs space-y-2">
          <h3 className="font-bold text-[13px] text-[#0A2B35]">Mode de Paiement</h3>

          <div className="p-3 rounded-xl border border-[#D9943B] bg-white/90 ring-1 ring-[#D9943B] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full btn-gradient-primary flex items-center justify-center shadow-xs">
                <Banknote size={17} className="text-[#071E26]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#0A2B35]">
                    <span className="sm:hidden">COD</span>
                    <span className="hidden sm:inline">Paiement en espèces à la livraison</span>
                  </span>
                  <span className="badge-gradient-tertiary text-[9px] text-white font-extrabold px-1.5 py-0.2 rounded shadow-xs">
                    Recommandé
                  </span>
                </div>
                <p className="text-[10px] text-[#648692]">Réglez directement en dinars (DZD) auprès de votre coursier Ahmed Rachedi</p>
              </div>
            </div>
            <Check size={16} className="text-[#D9943B]" />
          </div>

          {onOpenFAQ && (
            <button
              id="checkout-btn-faq-cod"
              type="button"
              onClick={onOpenFAQ}
              className="mt-1 text-[11px] text-[#648692] hover:text-[#0A2B35] flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <HelpCircle size={12} className="text-[#D9943B]" />
              <span>Comment fonctionne le paiement à la livraison ? Voir la FAQ Ahmed Rachedi</span>
            </button>
          )}
        </div>

        {/* Coupons, Vouchers & Promo Code Section */}
        <div className="card-gradient-bluegreen-soft rounded-2xl p-3.5 border border-[#2B788C]/30 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Ticket size={16} className="text-[#D91A67]" />
              <h3 className="font-bold text-[13px] text-[#0A2B35]">Bons de réduction & Codes Promo</h3>
            </div>
            <span className="badge-gradient-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
              <Sparkles size={10} className="text-[#071E26]" /> Club {fidelityProfile.tier}
            </span>
          </div>

          {/* User's active Loyalty Vouchers */}
          {availableVouchers.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-600 block">
                Vos bons fidélité disponibles ({availableVouchers.length})
              </span>
              <div className="space-y-1.5">
                {availableVouchers.map((v) => {
                  const isSelected = selectedVoucherId === v.id;
                  const isEligible = subtotal >= v.minSpendDZD;
                  const missingDZD = Math.max(0, v.minSpendDZD - subtotal);

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (!isEligible) return;
                        setSelectedVoucherId(isSelected ? null : v.id);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#00B578] bg-emerald-50/60 ring-1 ring-[#00B578]'
                          : isEligible
                          ? 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100'
                          : 'border-dashed border-neutral-200 bg-neutral-50/50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#0A2B35]">{v.title}</span>
                          <span className="text-[9px] bg-[#FDF2F7] text-[#D91A67] border border-[#D91A67]/30 font-mono px-1 rounded font-bold">
                            {v.code}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {isEligible ? (
                            <span className="text-[#0A2B35] font-medium">
                              Éligible • Dès {v.minSpendDZD} DZD
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium">
                              Nécessite encore {missingDZD} DZD d'achats (Dès {v.minSpendDZD} DZD)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="badge-gradient-tertiary text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                          -{Math.round((v.discountDZD / v.minSpendDZD) * 100)}%
                        </span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full btn-gradient-tertiary text-white flex items-center justify-center shadow-2xs">
                            <Check size={12} />
                          </div>
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                              isEligible
                                ? 'border-neutral-300 text-zinc-500'
                                : 'border-neutral-200 text-zinc-300'
                            }`}
                          >
                            +
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Promo code input field */}
          <div className="pt-2 border-t border-neutral-100">
            {appliedPromo ? (
              <div className="p-2.5 bg-[#FDF2F7] rounded-xl border border-[#D91A67]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#D91A67]/20 text-[#D91A67] flex items-center justify-center">
                    <Check size={14} />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0A2B35] block">
                      Code {appliedPromo.code} appliqué
                    </span>
                    <span className="text-[10px] text-[#648692]">{appliedPromo.label}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(null)}
                  className="w-6 h-6 rounded-full hover:bg-neutral-200/60 flex items-center justify-center text-zinc-700 cursor-pointer"
                  aria-label="Supprimer le code"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        if (promoError) setPromoError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromoCode();
                        }
                      }}
                      placeholder="Ex: RACHEDI, BIENVENUE, BARAKA..."
                      className="w-full text-xs pl-8 pr-2 py-2 bg-neutral-50 border border-[#EADBCE] rounded-lg focus:outline-none focus:border-[#D9943B] uppercase font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    className="btn-gradient-primary px-3.5 py-2 active:scale-95 text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                  >
                    Appliquer
                  </button>
                </div>
                {promoError && (
                  <p className="text-[10px] text-red-600 mt-1 font-medium">{promoError}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                  <span>Astuce codes testés :</span>
                  <button
                    type="button"
                    onClick={() => setPromoInput('RACHEDI')}
                    className="underline hover:text-zinc-600 font-mono"
                  >
                    RACHEDI
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setPromoInput('BIENVENUE')}
                    className="underline hover:text-zinc-600 font-mono"
                  >
                    BIENVENUE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown - Server Authoritative & Logically Itemized */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-zinc-600">
            <span>Sous-total articles</span>
            <span className="font-medium">{subtotal} DZD</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Frais de livraison ({editCommune})</span>
            <span className="font-medium">
              {deliveryMode === 'takeout'
                ? '0 DZD (À emporter)'
                : `${deliveryFee} DZD`}
            </span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Emballage isotherme certifié</span>
            <span className="font-medium">{packagingFee} DZD</span>
          </div>

          {/* Promotion / Free Delivery Itemization */}
          {deliveryDiscount > 0 && (
            <div className="flex justify-between text-[#00B578] font-bold">
              <span>Livraison offerte (Dès 1 200 DZD)</span>
              <span>-{deliveryDiscount} DZD</span>
            </div>
          )}

          {/* Selected Loyalty Voucher */}
          {voucherDiscountValue > 0 && selectedVoucher && (
            <div className="flex justify-between text-[#00B578] font-bold">
              <span>Bon de réduction ({selectedVoucher.code})</span>
              <span>-{voucherDiscountValue} DZD</span>
            </div>
          )}

          {/* Applied Manual Promo Code */}
          {manualDiscountValue > 0 && appliedPromo && (
            <div className="flex justify-between text-[#00B578] font-bold">
              <span>Code promotionnel ({appliedPromo.code})</span>
              <span>-{manualDiscountValue} DZD</span>
            </div>
          )}

          <div className="pt-2 border-t border-neutral-100 flex justify-between items-baseline font-bold text-[#0A2B35]">
            <div>
              <span className="text-sm">Total net en espèces</span>
              <span className="block text-[10px] text-[#648692] font-normal">
                Règlement direct auprès du coursier
              </span>
            </div>
            <span className="text-base text-[#D91A67] font-extrabold">{grandTotal} DZD</span>
          </div>

          {/* Loyalty points to earn preview */}
          <div className="pt-1.5 flex items-center justify-between text-[11px] text-[#0A2B35] bg-[#F7EBD9]/70 p-2 rounded-lg border border-[#EADBCE]">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles size={12} className="text-[#D9943B]" />
              Points Club Baraka à gagner sur cette commande :
            </span>
            <span className="font-bold font-mono text-[#D91A67]">+{pointsToEarn} pts</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] mx-auto px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-[#EADBCE] shadow-xl z-40">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex flex-col">
            <span className="text-[9.5px] sm:text-[10px] text-[#648692] font-semibold uppercase">
              <span className="sm:hidden">Total (COD)</span>
              <span className="hidden sm:inline">Total à payer (Espèces)</span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-[#0A2B35]">{grandTotal}</span>
              <span className="text-xs font-bold text-[#D91A67]">DZD</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (isSubmitting || !isWithin2KmRadius) return;
              setShowConfirmationReview(true);
            }}
            disabled={!isWithin2KmRadius || isSubmitting}
            className={`flex-1 h-11 sm:h-12 rounded-full px-3 sm:px-5 flex items-center justify-center gap-1.5 sm:gap-2 font-bold shadow-md transition-all text-xs sm:text-sm cursor-pointer ${
              !isWithin2KmRadius
                ? 'bg-neutral-300 text-zinc-500 cursor-not-allowed'
                : 'btn-gradient-primary hover:opacity-95 active:scale-[0.98]'
            }`}
          >
            <span>
              {!isWithin2KmRadius ? (
                'Rayon > 2 km (Inéligible)'
              ) : (
                <>
                  <span className="sm:hidden">Vérifier & Commander</span>
                  <span className="hidden sm:inline">Vérifier & Commander (Espèces)</span>
                </>
              )}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* Simplified Visual Order Confirmation Modal */}
      <CheckoutOrderConfirmationModal
        isOpen={showConfirmationReview}
        onClose={() => setShowConfirmationReview(false)}
        onConfirm={handlePlaceOrder}
        isSubmitting={isSubmitting}
        storeName={storeName}
        cartItems={cartItems}
        deliveryFee={deliveryFee}
        isFreeDelivery={isFreeDeliveryQualified}
        packagingFee={packagingFee}
        discount={totalDiscount}
        appliedDiscountLabel={
          selectedVoucher
            ? selectedVoucher.title
            : appliedPromo
            ? appliedPromo.label
            : deliveryDiscount > 0
            ? 'Livraison offerte'
            : undefined
        }
        subtotal={subtotal}
        grandTotal={grandTotal}
        deliveryAddress={{
          ...deliveryAddress,
          wilaya: editWilaya,
          commune: editCommune,
          street: editStreet,
          landmark: editLandmark,
          phone: editPhone,
        }}
        deliveryNotes={deliveryNotes}
        ecoCutlery={ecoCutlery}
        estimatedTime="12–18 min"
        distanceMeters={estimatedDistanceMeters}
      />

      {/* Address Edit Dialog Modal */}
      {showAddressEditor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-2xl p-4 space-y-3 shadow-2xl border border-[#EADBCE]">
            <h3 className="font-bold text-[15px] text-[#0A2B35]">Modifier l'adresse algérienne</h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[#648692] font-semibold block mb-0.5">Wilaya & Commune</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editWilaya}
                    onChange={(e) => setEditWilaya(e.target.value)}
                    className="p-2 border border-[#EADBCE] rounded-lg focus:outline-none focus:border-[#D9943B]"
                    placeholder="Ahmed Rachedi"
                  />
                  <input
                    type="text"
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    className="p-2 border border-[#EADBCE] rounded-lg focus:outline-none focus:border-[#D9943B]"
                    placeholder="Ahmed Rachedi"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#648692] font-semibold block mb-0.5">Rue / Résidence / Bâtiment</label>
                <input
                  type="text"
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  className="w-full p-2 border border-[#EADBCE] rounded-lg focus:outline-none focus:border-[#D9943B]"
                  placeholder="Cité 500 Logements, Bâtiment C4"
                />
              </div>

              <div>
                <label className="text-[#B8731E] font-bold block mb-0.5">
                  Repère / Landmark (Crucial en Algérie)
                </label>
                <input
                  type="text"
                  value={editLandmark}
                  onChange={(e) => setEditLandmark(e.target.value)}
                  className="w-full p-2 border border-[#D9943B] bg-[#F7EBD9]/50 rounded-lg focus:outline-none focus:border-[#B8731E]"
                  placeholder="Près de la Mosquée Al-Ansar, en face du CEM..."
                />
              </div>

              <div>
                <label className="text-[#648692] font-semibold block mb-0.5">Numéro de téléphone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2 border border-[#EADBCE] rounded-lg focus:outline-none focus:border-[#D9943B]"
                  placeholder="+213 550 12 34 56"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddressEditor(false)}
                className="flex-1 py-2 rounded-xl text-[#0A2B35] bg-[#F8F4EC] hover:bg-[#EADBCE] font-bold text-xs cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAddress}
                className="flex-1 py-2 rounded-xl bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
