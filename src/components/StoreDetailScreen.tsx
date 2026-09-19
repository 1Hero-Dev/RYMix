import React, { useState, useMemo, useCallback } from 'react';
import { Store, CartItem } from '../types';
import { LazyImage } from './common/LazyImage';
import { HorizontalScrollContainer } from './common/HorizontalScrollContainer';
import {
  ArrowLeft,
  Search,
  Share2,
  Heart,
  Star,
  Clock,
  Zap,
  Ticket,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Props {
  store: Store;
  onBack: () => void;
  cartItems: CartItem[];
  onOpenDishCustomization: (dishId: string) => void;
  onUpdateCartQuantity: (menuItemId: string, delta: number) => void;
  onOpenCheckout: () => void;
}

export const StoreDetailScreen: React.FC<Props> = React.memo(({
  store,
  onBack,
  cartItems,
  onOpenDishCustomization,
  onUpdateCartQuantity,
  onOpenCheckout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(store.menuCategories[0] || '🔥 Les Populaires');
  const [isFavorited, setIsFavorited] = useState(false);
  const [claimedCoupon, setClaimedCoupon] = useState(false);

  // Memoize cart totals
  const { totalCount, totalAmountDZD } = useMemo(() => {
    let count = 0;
    let amount = 0;
    for (let i = 0; i < cartItems.length; i++) {
      count += cartItems[i].quantity;
      amount += cartItems[i].basePrice * cartItems[i].quantity;
    }
    return { totalCount: count, totalAmountDZD: amount };
  }, [cartItems]);

  // Memoize lookup map for item quantities in cart to avoid repeated array filters
  const itemQuantityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < cartItems.length; i++) {
      const ci = cartItems[i];
      map[ci.menuItemId] = (map[ci.menuItemId] || 0) + ci.quantity;
    }
    return map;
  }, [cartItems]);

  const getItemCartQuantity = useCallback((itemId: string) => {
    return itemQuantityMap[itemId] || 0;
  }, [itemQuantityMap]);

  // Memoize filtered items by selected menu category
  const filteredItems = useMemo(() => {
    return store.items.filter((item) => item.category === selectedCategory);
  }, [store.items, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F4EC] pb-24 relative">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-[#EADBCE] shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          <button
            onClick={onBack}
            aria-label="Retour"
            className="w-8 h-8 rounded-full bg-[#F8F4EC] border border-[#EADBCE] flex items-center justify-center text-[#0A2B35] hover:bg-[#EADBCE] active:scale-95 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="text-[#0A2B35]" />
          </button>
          <h1 className="font-bold text-[14px] text-[#0A2B35] truncate">{store.name}</h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button aria-label="Recherche dans le menu" className="w-8 h-8 rounded-full hover:bg-[#F8F4EC] flex items-center justify-center text-[#0A2B35] cursor-pointer">
            <Search size={18} className="text-[#0A2B35]" />
          </button>
          <button aria-label="Partager" className="w-8 h-8 rounded-full hover:bg-[#F8F4EC] flex items-center justify-center text-[#0A2B35] cursor-pointer">
            <Share2 size={18} className="text-[#0A2B35]" />
          </button>
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            aria-label="Favoris"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isFavorited ? 'btn-gradient-tertiary text-white shadow-xs scale-105' : 'hover:bg-[#F8F4EC] text-[#0A2B35]'
            }`}
          >
            <Heart size={18} className={isFavorited ? 'text-white fill-white' : 'text-[#D91A67]'} />
          </button>
        </div>
      </header>

      {/* Store Header Card */}
      <div className="p-3.5 pb-2">
        <div className="card-gradient-warm rounded-2xl p-3 border border-[#EADBCE] shadow-xs">
          <div className="flex gap-3 items-start">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#EADBCE] shrink-0 bg-[#F8F4EC]">
              <LazyImage
                src={store.imageUrl}
                alt={store.name}
                placeholderType="store"
                targetWidth={180}
                priority={true}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="badge-gradient-primary text-[10px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                  <Zap size={10} className="text-[#071E26]" /> Express
                </span>
                <span className="bg-[#F8F4EC] border border-[#EADBCE] text-[#0A2B35] text-[10px] px-1.5 py-0.5 rounded font-medium">
                  {store.category}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#648692] mb-1">
                <span className="font-bold text-[#0A2B35] flex items-center gap-0.5">
                  <Star size={13} className="fill-[#D9943B] text-[#D9943B]" /> {store.rating}
                </span>
                <span>{store.reviewCount} commandes</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#648692]">
                <Clock size={12} className="text-[#D9943B]" />
                <span className="text-[#0A2B35] font-bold">{store.deliveryTimeMin} mins</span>
                <span className="text-zinc-300">•</span>
                <span>{store.distanceKm} km</span>
                <span className="text-zinc-300">•</span>
                <span>Frais: {store.deliveryFee} DZD</span>
              </div>
            </div>
          </div>

          {/* Store Announcement */}
          <div className="mt-2.5 pt-2 border-t border-[#EADBCE]/60 flex items-center gap-1.5 text-xs text-[#648692]">
            <span className="badge-gradient-soft-tertiary text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
              Avis
            </span>
            <p className="truncate text-[11px] text-[#0A2B35]">{store.notice}</p>
          </div>
        </div>
      </div>

      {/* Coupons Strip */}
      <div className="px-3.5 pb-2">
        <HorizontalScrollContainer
          id="store-coupons-horizontal-list"
          step={240}
          ariaLabel="Coupons et offres"
          className="gap-2 py-0.5"
        >
          {store.promotion && (
            <div className="bg-[#F8F4EC] border border-dashed border-[#D9943B] rounded-xl px-2.5 py-1.5 flex items-center gap-2 shrink-0">
              <div>
                <div className="font-bold text-xs text-[#0A2B35] leading-none">
                  {store.promotion.type === 'free_delivery'
                    ? 'Livraison Offerte'
                    : store.promotion.percentage
                    ? `-${store.promotion.percentage}%`
                    : store.promotion.discountDZD && store.promotion.minSubtotalDZD
                    ? `-${Math.round((store.promotion.discountDZD / store.promotion.minSubtotalDZD) * 100)}%`
                    : `-${store.promotion.discountDZD} DZD`}
                </div>
                <span className="text-[10px] text-[#D91A67] font-semibold">
                  Dès {store.promotion.minSubtotalDZD} DZD
                </span>
              </div>
              <div className="h-5 w-px bg-[#EADBCE]"></div>
              <button
                onClick={() => setClaimedCoupon(!claimedCoupon)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  claimedCoupon
                    ? 'bg-[#0A2B35] text-white'
                    : 'btn-gradient-primary active:scale-95'
                }`}
              >
                {claimedCoupon ? 'Appliqué ✓' : 'Réclamer'}
              </button>
            </div>
          )}

          <div className="bg-[#F7EBD9] border border-dashed border-[#D9943B] rounded-xl px-2.5 py-1.5 flex items-center gap-2 shrink-0">
            <Ticket size={14} className="text-[#D9943B]" />
            <div>
              <div className="font-bold text-xs text-[#0A2B35] leading-none">Offre Ahmed Rachedi Express</div>
              <span className="text-[10px] text-[#648692]">
                {totalAmountDZD >= 1200
                  ? 'Livraison 100% offerte débloquée !'
                  : `Plus que ${1200 - totalAmountDZD} DZD pour livraison offerte`}
              </span>
            </div>
          </div>
        </HorizontalScrollContainer>
      </div>

      {/* 2-Column Split Menu Screen */}
      <div className="flex-1 flex border-t border-black/5 bg-white min-h-[460px]">
        {/* Left Category Sidebar */}
        <aside className="w-24 bg-[#FCF9F3] flex flex-col shrink-0 border-r border-[#EADBCE] select-none">
          {store.menuCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left py-3 px-2.5 text-[11px] transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-white font-extrabold text-[#0A2B35] shadow-xs'
                    : 'text-[#648692] hover:bg-[#F8F4EC] font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#D9943B] rounded-r-full" />
                )}
                <span className="line-clamp-2 leading-snug pl-1">{cat}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Food Items Feed */}
        <section className="flex-1 p-3 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#EADBCE]/60">
            <h2 className="font-bold text-[13px] text-[#0A2B35]">{selectedCategory}</h2>
            <span className="text-[10px] text-[#648692]">Plats préparés à la commande</span>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const qtyInCart = getItemCartQuantity(item.id);

              return (
                <article
                  key={item.id}
                  onClick={() => onOpenDishCustomization(item.id)}
                  className="flex items-start gap-3 pb-3.5 border-b border-[#EADBCE]/60 last:border-0 cursor-pointer hover:bg-[#F8F4EC]/70 rounded-xl p-1.5 -m-1.5 transition-colors"
                >
                  <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-[#F8F4EC] border border-[#EADBCE] aspect-square">
                    <LazyImage
                      src={item.imageUrl}
                      alt={item.name}
                      placeholderType="food"
                      targetWidth={200}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                    {item.badge && (
                      <span className="absolute top-1 left-1 badge-gradient-tertiary text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs z-10 leading-none">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-[13px] text-[#0A2B35] leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-[#648692] line-clamp-2 mt-0.5">{item.description}</p>
                      {item.salesCount && (
                        <span className="text-[10px] text-[#648692] block mt-0.5">{item.salesCount}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-extrabold text-[#0A2B35]">{item.price}</span>
                          <span className="text-[10px] font-bold text-[#648692]">DZD</span>
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-zinc-400 line-through leading-none">
                              {item.originalPrice} DZD
                            </span>
                            <span className="badge-gradient-soft-tertiary text-[8px] font-bold px-1 rounded leading-tight">
                              -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Add button or Stepper */}
                      {qtyInCart > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-[#F8F4EC] rounded-full p-0.5 border border-[#EADBCE]"
                        >
                          <button
                            onClick={() => onUpdateCartQuantity(item.id, -1)}
                            className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#0A2B35] shadow-xs active:scale-95 cursor-pointer"
                          >
                            <Minus size={12} className="text-[#0A2B35]" />
                          </button>
                          <span className="text-xs font-bold text-[#0A2B35] px-0.5">{qtyInCart}</span>
                          <button
                            onClick={() => onOpenDishCustomization(item.id)}
                            className="btn-gradient-primary w-5 h-5 rounded-full flex items-center justify-center shadow-xs active:scale-95 cursor-pointer"
                          >
                            <Plus size={12} className="text-[#071E26]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDishCustomization(item.id);
                          }}
                          className="btn-gradient-primary w-6 h-6 rounded-full flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer"
                        >
                          <Plus size={14} className="text-[#071E26]" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCount > 0 && (() => {
        // Calculate item discount savings
        const itemSavings = cartItems.reduce((acc, ci) => {
          const item = store.items.find((i) => i.id === ci.menuItemId);
          if (item?.originalPrice && item.originalPrice > item.price) {
            return acc + (item.originalPrice - item.price) * ci.quantity;
          }
          return acc;
        }, 0);

        // Check if coupon or free delivery applies
        const minSpend = store.promotion?.minSubtotalDZD ?? 1200;
        const qualifiesForPromo = claimedCoupon && store.promotion && totalAmountDZD >= minSpend;
        const promoDiscount = qualifiesForPromo
          ? (store.promotion?.type === 'free_delivery'
              ? store.deliveryFee
              : (store.promotion?.discountDZD ?? 0))
          : 0;

        const totalSavings = itemSavings + promoDiscount;
        const missingForPromo = Math.max(0, minSpend - totalAmountDZD);

        return (
          <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-0 right-0 w-full max-w-[430px] mx-auto px-2.5 sm:px-3.5 z-40">
            <div className="card-gradient-dark-fusion text-white rounded-full p-1.5 sm:p-2 pl-2.5 sm:pl-3 flex items-center justify-between shadow-2xl backdrop-blur-md gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full btn-gradient-primary flex items-center justify-center font-bold shadow-xs">
                    <ShoppingBag size={18} className="text-[#071E26]" />
                  </div>
                  <span className="absolute -top-1 -right-1 badge-gradient-tertiary text-white text-[9px] font-extrabold px-1 rounded-full ring-2 ring-[#0A2B35]">
                    {totalCount}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1 leading-none flex-wrap">
                    <span className="text-sm sm:text-base font-extrabold text-white truncate">{totalAmountDZD} DZD</span>
                    {totalSavings > 0 && (
                      <span className="badge-gradient-soft-tertiary text-[9px] px-1 py-0.2 rounded font-bold">
                        -{Math.round((totalSavings / (totalAmountDZD + totalSavings)) * 100)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] text-[#648692] mt-0.5 truncate">
                    {totalAmountDZD >= 1200 || (qualifiesForPromo && store.promotion?.type === 'free_delivery')
                      ? 'Livraison offerte'
                      : `Livraison ${store.deliveryFee} DZD`}
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenCheckout}
                className="btn-gradient-primary text-xs font-extrabold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-md flex items-center gap-1 transition-all shrink-0 cursor-pointer"
              >
                <span>Valider ({totalCount})</span>
                <ArrowRight size={13} className="text-[#071E26]" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
});
