import React, { useState } from 'react';
import { Store, CartItem } from '../types';
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

export const StoreDetailScreen: React.FC<Props> = ({
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

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountDZD = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);

  const getItemCartQuantity = (itemId: string) => {
    return cartItems
      .filter((ci) => ci.menuItemId === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const filteredItems = store.items.filter((item) => item.category === selectedCategory);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-24 relative">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          <button
            onClick={onBack}
            aria-label="Retour"
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-700 hover:bg-neutral-200 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bold text-[14px] text-[#1C1B1B] truncate">{store.name}</h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button aria-label="Recherche dans le menu" className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-zinc-600">
            <Search size={18} />
          </button>
          <button aria-label="Partager" className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-zinc-600">
            <Share2 size={18} />
          </button>
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            aria-label="Favoris"
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#FF5722]"
          >
            <Heart size={18} className={isFavorited ? 'fill-current' : ''} />
          </button>
        </div>
      </header>

      {/* Store Header Card */}
      <div className="p-3.5 pb-2">
        <div className="bg-white rounded-2xl p-3 border border-black/[0.04] shadow-xs">
          <div className="flex gap-3 items-start">
            <img
              src={store.imageUrl}
              alt={store.name}
              className="w-16 h-16 rounded-xl object-cover border border-black/5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="bg-[#D9943B] text-zinc-900 text-[10px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                  <Zap size={10} /> Livraison RYM Express
                </span>
                <span className="bg-neutral-100 text-zinc-600 text-[10px] px-1.5 py-0.5 rounded font-medium">
                  {store.category}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <span className="font-bold text-[#FF5722] flex items-center gap-0.5">
                  <Star size={13} className="fill-current" /> {store.rating}
                </span>
                <span>{store.reviewCount} commandes</span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Clock size={12} className="text-emerald-600" />
                <span className="text-emerald-700 font-bold">{store.deliveryTimeMin} mins</span>
                <span className="text-zinc-300">•</span>
                <span>{store.distanceKm} km</span>
                <span className="text-zinc-300">•</span>
                <span>Frais: {store.deliveryFee} DZD</span>
              </div>
            </div>
          </div>

          {/* Store Announcement */}
          <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="bg-orange-50 text-[#FF5722] text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
              Avis
            </span>
            <p className="truncate text-[11px] text-zinc-500">{store.notice}</p>
          </div>
        </div>
      </div>

      {/* Coupons Strip */}
      <div className="px-3.5 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="bg-orange-50/60 border border-dashed border-[#FF5722]/40 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shrink-0">
            <div>
              <div className="font-bold text-xs text-[#FF5722] leading-none">-150 DZD</div>
              <span className="text-[10px] text-zinc-500">Dès 1 200 DZD</span>
            </div>
            <div className="h-5 w-px bg-[#FF5722]/20"></div>
            <button
              onClick={() => setClaimedCoupon(true)}
              className="text-[10px] font-bold bg-[#FF5722] text-white px-2 py-0.5 rounded-full"
            >
              {claimedCoupon ? 'Appliqué' : 'Réclamer'}
            </button>
          </div>

          <div className="bg-amber-50 border border-dashed border-[#D9943B] rounded-xl px-2.5 py-1.5 flex items-center gap-2 shrink-0">
            <Ticket size={14} className="text-amber-800" />
            <div>
              <div className="font-bold text-xs text-amber-900 leading-none">Club VIP RYM</div>
              <span className="text-[10px] text-zinc-500">Frais de livraison offerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split Menu Screen */}
      <div className="flex-1 flex border-t border-black/5 bg-white min-h-[460px]">
        {/* Left Category Sidebar */}
        <aside className="w-24 bg-neutral-50 flex flex-col shrink-0 border-r border-black/5 select-none">
          {store.menuCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left py-3 px-2 text-[11px] transition-all relative ${
                  isActive
                    ? 'bg-white font-bold text-[#1C1B1B] border-l-[3px] border-[#D9943B] shadow-xs'
                    : 'text-zinc-500 hover:bg-neutral-100 font-medium'
                }`}
              >
                <span className="line-clamp-2 leading-snug">{cat}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Food Items Feed */}
        <section className="flex-1 p-3 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <h2 className="font-bold text-[13px] text-[#1C1B1B]">{selectedCategory}</h2>
            <span className="text-[10px] text-zinc-400">Plats préparés à la commande</span>
          </div>

          <div className="space-y-3">
            {filteredItems.map((item) => {
              const qtyInCart = getItemCartQuantity(item.id);

              return (
                <article
                  key={item.id}
                  onClick={() => onOpenDishCustomization(item.id)}
                  className="flex gap-2.5 pb-3 border-b border-neutral-100 last:border-0 cursor-pointer hover:bg-neutral-50/50 rounded-xl p-1 -m-1 transition-colors"
                >
                  <div className="relative shrink-0 w-22 h-22 rounded-xl overflow-hidden bg-neutral-100 border border-black/5">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {item.badge && (
                      <span className="absolute top-1 left-1 bg-[#FF5722] text-white text-[8px] font-bold px-1 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-bold text-[13px] text-[#1C1B1B] leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">{item.description}</p>
                      {item.salesCount && (
                        <span className="text-[10px] text-zinc-400 block mt-0.5">{item.salesCount}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-[#FF5722]">{item.price} DZD</span>
                        {item.originalPrice && (
                          <span className="text-[10px] text-zinc-400 line-through">{item.originalPrice} DZD</span>
                        )}
                      </div>

                      {/* Add button or Stepper */}
                      {qtyInCart > 0 ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-neutral-100 rounded-full p-0.5 border border-neutral-200"
                        >
                          <button
                            onClick={() => onUpdateCartQuantity(item.id, -1)}
                            className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-zinc-700 shadow-xs active:scale-95"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-zinc-900 px-0.5">{qtyInCart}</span>
                          <button
                            onClick={() => onOpenDishCustomization(item.id)}
                            className="w-5 h-5 rounded-full bg-[#D9943B] flex items-center justify-center text-zinc-900 shadow-xs active:scale-95"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDishCustomization(item.id);
                          }}
                          className="w-6 h-6 rounded-full bg-[#D9943B] text-zinc-900 flex items-center justify-center shadow-xs hover:brightness-105 active:scale-90 transition-transform"
                        >
                          <Plus size={14} />
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
      {totalCount > 0 && (
        <div className="fixed bottom-3 left-0 right-0 w-full max-w-[430px] mx-auto px-3.5 z-40">
          <div className="bg-[#1F2124] text-white rounded-full p-2 pl-3 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#D9943B] text-[#1C1B1B] flex items-center justify-center font-bold">
                  <ShoppingBag size={20} />
                </div>
                <span className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-[#1F2124]">
                  {totalCount}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="text-base font-extrabold text-white">{totalAmountDZD} DZD</span>
                  <span className="text-[10px] bg-[#FF5722]/30 text-orange-200 px-1 rounded font-bold">
                    Économie 150 DZD
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5">Livraison {store.deliveryFee} DZD • Couverts offerts</span>
              </div>
            </div>

            <button
              onClick={onOpenCheckout}
              className="bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#1C1B1B] text-xs font-extrabold px-4 py-2.5 rounded-full shadow-md flex items-center gap-1 transition-all"
            >
              <span>Valider ({totalCount})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
