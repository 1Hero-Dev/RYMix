import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Store,
  Bike,
  Heart,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  Coins,
  ArrowRight,
  ArrowLeft,
  Utensils,
  Check,
} from 'lucide-react';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { useAuth } from '../firebase/AuthContext';
import { submitOrderRatingToFirestore } from '../firebase/firebaseServices';
import { Order, PurchasingHistoryRecord, DishRating } from '../types';

interface Props {
  isOpen: boolean;
  order: Order | PurchasingHistoryRecord | null;
  initialRating?: number;
  onClose: () => void;
  onSubmitted?: (ratingData: {
    merchantRating: number;
    courierRating?: number;
    comment: string;
    dishRatings?: DishRating[];
  }) => void;
}

export const OrderRatingModal: React.FC<Props> = ({
  isOpen,
  order,
  initialRating = 5,
  onClose,
  onSubmitted,
}) => {
  const { submitMerchantReview, submitCourierReview, addBonusPoints } = useLocalDatabase();
  const { currentUser, profile } = useAuth();

  // Multi-step flow: Step 1 = Courier, Step 2 = Restaurant, Step 3 = Dish
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Step 1: Courier rating states
  const [courierRating, setCourierRating] = useState<number>(initialRating || 5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [politenessRating, setPolitenessRating] = useState<number>(5);
  const [routeRespectRating, setRouteRespectRating] = useState<number>(5);
  const [foodHandlingRating, setFoodHandlingRating] = useState<number>(5);
  const [courierComment, setCourierComment] = useState<string>('');
  const [selectedCourierTags, setSelectedCourierTags] = useState<string[]>([
    'Ponctuel',
    'Souriant & Poli',
  ]);
  const [tipAmountDZD, setTipAmountDZD] = useState<number>(50);

  // Step 2: Merchant & Dish rating states
  const [merchantRating, setMerchantRating] = useState<number>(initialRating || 5);
  const [tasteRating, setTasteRating] = useState<number>(5);
  const [packagingRating, setPackagingRating] = useState<number>(5);
  const [speedRating, setSpeedRating] = useState<number>(5);
  const [portionRating, setPortionRating] = useState<number>(5);
  const [merchantComment, setMerchantComment] = useState<string>('');
  const [selectedMerchantTags, setSelectedMerchantTags] = useState<string[]>([
    'Chaud & Frais',
    'Portion Généreuse',
  ]);

  // Dish ratings state
  const [dishRatingsState, setDishRatingsState] = useState<Record<string, DishRating>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Extract ordered items
  const orderItems =
    order && order.items && order.items.length > 0
      ? order.items
      : [
          {
            id: 'item-beniharoun-maxi',
            name: 'Menu Maxi Chawarma Poulet Braisé & Frites',
            quantity: 1,
            price: 750,
          },
        ];

  // Initialize dish ratings
  useEffect(() => {
    if (orderItems.length > 0) {
      const initial: Record<string, DishRating> = {};
      orderItems.forEach((item: any) => {
        const id = item.id || item.productId || 'dish-1';
        initial[id] = {
          itemId: id,
          name: item.productNameSnapshot || item.name || 'Plat Commandé',
          rating: 5,
          sentiment: 'LOVE',
          comment: '',
          tag: 'Délicieux & Bien chaud',
        };
      });
      setDishRatingsState(initial);
    }
  }, [order]);

  useEffect(() => {
    if (initialRating && initialRating >= 1 && initialRating <= 5) {
      setCourierRating(initialRating);
      setMerchantRating(initialRating);
    }
    setActiveStep(1); // Always start with Courier first, then Restaurant & Dish
  }, [initialRating, isOpen]);

  if (!isOpen || !order) return null;

  const courierName = order.courierName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Walid M.';
  const storeName = order.storeName || 'Restaurant Beni Haroun';

  const courierTagOptions = [
    'Ponctuel',
    'Souriant & Poli',
    'Respecte le code routier',
    'Sac thermique propre',
    'Appel discret à l’arrivée',
    'Très professionnel',
  ];

  const merchantTagOptions = [
    'Chaud & Frais',
    'Portion Généreuse',
    '100% Viande Locale',
    'Emballage Soigné',
    'Sauces Parfaites',
    'Cuisine Authentique d\'Ahmed Rachedi',
  ];

  const toggleCourierTag = (tag: string) => {
    setSelectedCourierTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleMerchantTag = (tag: string) => {
    setSelectedMerchantTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const updateDishRating = (itemId: string, updates: Partial<DishRating>) => {
    setDishRatingsState((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {
          itemId,
          name: 'Plat',
          rating: 5,
          sentiment: 'LOVE',
        }),
        ...updates,
      },
    }));
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const customerUid = currentUser?.uid || profile?.uid || (order as any).customerId || 'cust-amine-43';
    const customerDisplayName = currentUser?.displayName || profile?.displayName || 'Amine Benali';

    const feedbackText =
      merchantComment.trim() ||
      'Excellente commande, préparation impeccable et saveurs authentiques d\'Ahmed Rachedi !';

    const courierFeedbackText =
      courierComment.trim() || 'Livreur très soigné et très poli à l’arrivée à Cité El Bassatine.';

    const dishRatingsList = Object.values(dishRatingsState);

    // 1. Submit to Firestore if available
    try {
      await submitOrderRatingToFirestore({
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeId: order.storeId,
        storeName: order.storeName,
        courierId: order.courierId || 'courier-walid-43',
        courierName: courierName,
        customerId: customerUid,
        customerName: customerDisplayName,
        merchantRating,
        merchantComment: feedbackText,
        merchantTags: selectedMerchantTags,
        criteria: {
          foodTaste: tasteRating,
          packaging: packagingRating,
          speed: speedRating,
          portionSize: portionRating,
        },
        courierRating,
        courierComment: courierFeedbackText,
        courierTags: selectedCourierTags,
        courierCriteria: {
          punctuality: punctualityRating,
          politeness: politenessRating,
          routeRespect: routeRespectRating,
          foodHandling: foodHandlingRating,
        },
        tipAmountDZD,
      });
    } catch (err) {
      console.warn('Firestore rating persistence note:', err);
    }

    // 2. Submit Courier Review in local database
    submitCourierReview({
      courierId: order.courierId || 'courier-walid-43',
      courierName: courierName,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: customerUid,
      customerName: customerDisplayName,
      rating: courierRating,
      criteria: {
        punctuality: punctualityRating,
        politeness: politenessRating,
        routeRespect: routeRespectRating,
        foodHandling: foodHandlingRating,
      },
      complimentTags: selectedCourierTags,
      tipAmountDZD,
      feedbackNote: courierFeedbackText,
    });

    // 3. Submit Merchant & Dish Review in local database
    submitMerchantReview({
      storeId: order.storeId,
      storeName: order.storeName,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: customerUid,
      customerName: customerDisplayName,
      overallRating: merchantRating,
      criteria: {
        foodTaste: tasteRating,
        packaging: packagingRating,
        speed: speedRating,
        portionSize: portionRating,
      },
      comment: feedbackText,
      tags: selectedMerchantTags,
      verifiedPurchase: true,
    });

    // 4. Award +50 points de fidélité pour avis vérifié complet
    addBonusPoints(
      50,
      `Avis vérifié sur commande #${order.orderNumber} (Livreur & Restaurant)`
    );

    setIsSubmitting(false);
    setSuccessNotice(true);

    setTimeout(() => {
      setSuccessNotice(false);
      if (onSubmitted) {
        onSubmitted({
          merchantRating,
          courierRating,
          comment: feedbackText,
          dishRatings: dishRatingsList,
        });
      }
      onClose();
    }, 1800);
  };

  return (
    <div
      id="order-rating-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200"
    >
      <div
        id="order-rating-modal-card"
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-black/10"
      >
        {/* Header Strip */}
        <div className="bg-[#0A2B35] text-white p-4 relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#D9943B] text-[#071E26]">
                <Star size={16} className="fill-current" />
              </span>
              <h2 className="font-extrabold text-base text-white">Évaluer votre commande</h2>
            </div>
            <p className="text-xs text-[#648692] mt-0.5">
              {order.orderNumber} • {storeName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progression Bar (Courier -> Restaurant -> Dish) */}
        <div className="bg-[#F8F4EC] border-b border-[#EADBCE] px-3 py-2 flex items-center justify-between gap-1.5">
          {/* Step 1 Tab Button */}
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStep === 1
                ? 'bg-[#0A2B35] text-white shadow-sm'
                : 'bg-white text-zinc-700 border border-[#EADBCE] hover:bg-[#F8F4EC]'
            }`}
          >
            <Bike size={14} />
            <span className="truncate">1. Le Livreur</span>
            {courierRating > 0 && activeStep > 1 && (
              <Check size={13} className="text-[#D9943B] font-black ml-0.5 shrink-0" />
            )}
          </button>

          <ArrowRight size={12} className="text-[#648692] shrink-0" />

          {/* Step 2 Tab Button */}
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStep === 2
                ? 'bg-[#D9943B] text-[#071E26] shadow-sm'
                : 'bg-white text-zinc-700 border border-[#EADBCE] hover:bg-[#F8F4EC]'
            }`}
          >
            <Store size={14} />
            <span className="truncate">2. Le Restaurant</span>
            {merchantRating > 0 && activeStep > 2 && (
              <Check size={13} className="text-[#D9943B] font-black ml-0.5 shrink-0" />
            )}
          </button>

          <ArrowRight size={12} className="text-zinc-400 shrink-0" />

          {/* Step 3 Tab Button */}
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStep === 3
                ? 'btn-gradient-tertiary text-white shadow-sm'
                : 'bg-white text-zinc-700 border border-[#EADBCE] hover:bg-[#F8F4EC]'
            }`}
          >
            <Utensils size={14} />
            <span className="truncate">3. Les Plats</span>
          </button>
        </div>

        {/* Loyalty Reward Banner */}
        <div className="bg-[#F7EBD9] border-b border-[#EADBCE] px-4 py-2 flex items-center gap-2 text-xs font-bold text-[#0A2B35]">
          <Sparkles size={16} className="text-[#D9943B] shrink-0" />
          <span>+50 Points Fidélité offerts dès validation pour encourager la qualité à Ahmed Rachedi !</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitAll} className="flex-1 overflow-y-auto p-4 space-y-4">
          {successNotice ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>Avis transmis et certifié</span>
              </div>
              <h3 className="font-extrabold text-lg text-zinc-900">
                Avis & Notes enregistrés avec succès !
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Merci beaucoup ! Votre évaluation du livreur ({courierName}), du restaurant ({storeName}) et des plats a bien été prise en compte. <strong>+50 points fidélité</strong> ont été crédités.
              </p>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* STEP 1: RATE THE COURIER (Walid M.) */}
              {/* ======================================================== */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200/80 space-y-3.5">
                    {/* Courier Identification Banner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          <Bike size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                            Étape 1 sur 2 • Livreur Partenaire Ahmed Rachedi
                          </span>
                          <h4 className="font-bold text-base text-zinc-900">{courierName}</h4>
                          <span className="text-[11px] text-zinc-500">Scooter SYM 125cc • Ahmed Rachedi</span>
                        </div>
                      </div>

                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-900 text-[10px] font-extrabold">
                        Ahmed Rachedi
                      </span>
                    </div>

                    {/* Star Rating for Courier */}
                    <div className="text-center py-3 bg-white rounded-xl border border-blue-100 shadow-xs">
                      <span className="text-xs font-semibold text-zinc-600 block mb-1.5">
                        Comment s'est passée la livraison avec {courierName} ?
                      </span>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setCourierRating(star)}
                            className="p-1 hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Star
                              size={32}
                              className={
                                star <= courierRating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-zinc-200'
                              }
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 mt-1.5 block">
                        {courierRating === 5
                          ? 'Service Impeccable (5/5)'
                          : courierRating === 4
                          ? 'Très bon coursier (4/5)'
                          : courierRating === 3
                          ? 'Correct (3/5)'
                          : 'À améliorer'}
                      </span>
                    </div>

                    {/* Detailed Criteria for Courier */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Ponctualité</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setPunctualityRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= punctualityRating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Politesse</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setPolitenessRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= politenessRating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Respect itinéraire</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setRouteRespectRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= routeRespectRating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Sac isotherme</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setFoodHandlingRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= foodHandlingRating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Compliments Chips for Courier */}
                    <div>
                      <span className="text-[11px] font-bold text-zinc-500 block mb-1.5">
                        Compliments au livreur :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {courierTagOptions.map((tag) => {
                          const isSelected = selectedCourierTags.includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => toggleCourierTag(tag)}
                              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                              }`}
                            >
                              {isSelected && '✓ '}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cash Tip */}
                    <div className="p-3 bg-white rounded-xl border border-black/5 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                          <Coins size={15} className="text-[#D9943B]" />
                          <span>Pourboire direct au livreur (espèces) :</span>
                        </span>
                        <span className="font-extrabold text-[#D91A67]">{tipAmountDZD} DZD</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[0, 50, 100, 200].map((amt) => (
                          <button
                            type="button"
                            key={amt}
                            onClick={() => setTipAmountDZD(amt)}
                            className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              tipAmountDZD === amt
                                ? 'bg-[#D9943B]/20 text-[#071E26] border-[#D9943B] font-extrabold'
                                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            {amt === 0 ? 'Aucun' : `+${amt} DZD`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Courier Comment */}
                    <div>
                      <textarea
                        rows={2}
                        value={courierComment}
                        onChange={(e) => setCourierComment(e.target.value)}
                        placeholder={`Un mot pour ${courierName} (ex: Arrivé très vite à la Cité 500 Logements, poli et courtois)...`}
                        className="w-full text-xs p-2.5 bg-white rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Next Step Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <span>Continuer vers l'évaluation du Restaurant (Étape 2/3)</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 2: RATE THE RESTAURANT AND THE DISH */}
              {/* ======================================================== */}
              {activeStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Restaurant Overview Box */}
                  <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center font-bold text-sm shadow-sm">
                          <Store size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                            Étape 2 sur 3 • Commerçant & Restaurant
                          </span>
                          <h4 className="font-bold text-base text-zinc-900">{storeName}</h4>
                          <span className="text-[11px] text-zinc-500">Ahmed Rachedi • Spécialités locales</span>
                        </div>
                      </div>
                    </div>

                    {/* Overall Restaurant Stars */}
                    <div className="text-center py-3 bg-white rounded-xl border border-amber-100 shadow-xs">
                      <span className="text-xs font-semibold text-zinc-600 block mb-1.5">
                        Note globale du restaurant
                      </span>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setMerchantRating(star)}
                            className="p-1 hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Star
                              size={32}
                              className={
                                star <= merchantRating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-zinc-200'
                              }
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 mt-1.5 block">
                        {merchantRating === 5
                          ? 'Exceptionnel (5/5)'
                          : merchantRating === 4
                          ? 'Très bon (4/5)'
                          : merchantRating === 3
                          ? 'Correct (3/5)'
                          : 'À améliorer'}
                      </span>
                    </div>

                    {/* Detailed Restaurant Criteria */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Goût & Saveurs</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setTasteRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= tasteRating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Emballage & Soin</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setPackagingRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= packagingRating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Rapidité cuisine</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setSpeedRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= speedRating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                        <span className="text-zinc-700 font-medium">Générosité portion</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => setPortionRating(s)}
                              className="hover:scale-110"
                            >
                              <Star
                                size={14}
                                className={
                                  s <= portionRating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-zinc-300'
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Compliments Restaurant */}
                    <div>
                      <span className="text-[11px] font-bold text-zinc-500 block mb-1.5">
                        Points forts du restaurant :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {merchantTagOptions.map((tag) => {
                          const isSelected = selectedMerchantTags.includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => toggleMerchantTag(tag)}
                              className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#D9943B] text-[#071E26] font-bold border border-[#B8731E] shadow-xs'
                                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                              }`}
                            >
                              {isSelected && '✓ '}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                    {/* General Restaurant Comment */}
                    <div>
                      <textarea
                        rows={2}
                        value={merchantComment}
                        onChange={(e) => setMerchantComment(e.target.value)}
                        placeholder="Commentaire global sur le restaurant (qualité générale, respect des consignes)..."
                        className="w-full text-xs p-2.5 bg-white rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-[#D9943B] text-zinc-800"
                      />
                    </div>

                    {/* Navigation Buttons for Step 2 */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="h-12 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                        <span>Retour Livreur</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="flex-1 h-12 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.99] text-[#071E26] rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-md transition-all cursor-pointer"
                      >
                        <span>Continuer vers les Plats ({orderItems.length}) (Étape 3/3)</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
              )}

              {/* ======================================================== */}
              {/* STEP 3: RATE INDIVIDUAL DISHES */}
              {/* ======================================================== */}
              {activeStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Dish Overview Box */}
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 space-y-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        <Utensils size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Étape 3 sur 3 • Évaluation des plats
                        </span>
                        <h4 className="font-bold text-base text-zinc-900">Plats & Spécialités commandés</h4>
                        <span className="text-[11px] text-zinc-500">
                          {orderItems.length} article{orderItems.length > 1 ? 's' : ''} à évaluer individuellement
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Dish Ratings List */}
                  <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                        <Utensils size={16} />
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                          Détails des plats reçus
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Attribuez une note et votre avis pour chaque plat
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {orderItems.map((item: any, idx: number) => {
                        const itemId = item.id || item.productId || `dish-${idx}`;
                        const currentDishReview = dishRatingsState[itemId] || {
                          itemId,
                          name: item.productNameSnapshot || item.name || 'Plat',
                          rating: 5,
                          sentiment: 'LOVE',
                          comment: '',
                        };

                        return (
                          <div
                            key={itemId}
                            className="bg-white rounded-xl p-3 border border-zinc-200/80 space-y-2.5 shadow-xs"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-bold text-xs text-zinc-900">
                                  {item.productNameSnapshot || item.name || 'Menu Maxi Chawarma'}
                                </h5>
                                <span className="text-[11px] text-zinc-400">
                                  Quantité : ×{item.quantity || 1} • {item.subtotalSnapshot || item.price || 750} DZD
                                </span>
                              </div>

                              {/* Dish Stars */}
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    type="button"
                                    key={star}
                                    onClick={() => updateDishRating(itemId, { rating: star })}
                                    className="p-0.5 hover:scale-110 active:scale-95 cursor-pointer"
                                  >
                                    <Star
                                      size={18}
                                      className={
                                        star <= currentDishReview.rating
                                          ? 'text-amber-500 fill-amber-500'
                                          : 'text-zinc-200'
                                      }
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Quick Sentiment Chips */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateDishRating(itemId, {
                                    sentiment: 'LOVE',
                                    tag: '😍 Délicieux & Généreux',
                                  })
                                }
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all cursor-pointer ${
                                  currentDishReview.sentiment === 'LOVE'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                                }`}
                              >
                                😍 Délicieux
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDishRating(itemId, {
                                    sentiment: 'LIKE',
                                    tag: '👍 Très bon',
                                  })
                                }
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all cursor-pointer ${
                                  currentDishReview.sentiment === 'LIKE'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                                }`}
                              >
                                👍 Très bon
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDishRating(itemId, {
                                    sentiment: 'AVERAGE',
                                    tag: '😐 Correct',
                                  })
                                }
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all cursor-pointer ${
                                  currentDishReview.sentiment === 'AVERAGE'
                                    ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                                }`}
                              >
                                😐 Moyen
                              </button>
                            </div>

                            {/* Dish note */}
                            <input
                              type="text"
                              value={currentDishReview.comment || ''}
                              onChange={(e) =>
                                updateDishRating(itemId, { comment: e.target.value })
                              }
                              placeholder="Commentaire sur ce plat (ex: Assaisonnement parfait, frites bien croustillantes)..."
                              className="w-full text-[11px] p-2 bg-zinc-50 rounded-lg border border-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-zinc-800"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Buttons for Step 3 */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="h-12 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      <span>Retour Restaurant</span>
                    </button>

                    <button
                      type="submit"
                      id="submit-rating-btn"
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.99] text-[#071E26] rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles size={16} />
                      <span>Valider tous les avis & Gagner +50 Pts</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};
