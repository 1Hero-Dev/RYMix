import React, { useState, useEffect } from 'react';
import { Store, CartItem } from '../types';
import {
  Search,
  Mic,
  Utensils,
  ShoppingBag,
  Ticket,
  Luggage,
  Film,
  Apple,
  Cross,
  Coffee,
  Bike,
  Sparkles,
  Zap,
  Star,
  Clock,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface Props {
  stores: Store[];
  onSelectStore: (store: Store) => void;
  onOpenGrocery: () => void;
  cartItems: CartItem[];
  onOpenCheckout: () => void;
  onSelectDishToCustomize: (store: Store, dishId: string) => void;
}

export const HomeDiscoveryScreen: React.FC<Props> = ({
  stores,
  onSelectStore,
  onOpenGrocery,
  cartItems,
  onOpenCheckout,
  onSelectDishToCustomize,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState<'nearby' | 'grocery' | 'vouchers' | 'top_rated'>('nearby');

  // Countdown timer for flash sale
  const [timeLeft, setTimeLeft] = useState({ hours: 0, mins: 42, secs: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        return { hours: 1, mins: 30, secs: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalCartDZD = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Category matrix items (10 icons)
  const categories = [
    { id: 'food', name: 'Livraison Repas', icon: Utensils, bg: 'bg-[#D9943B]', color: 'text-zinc-900', hot: true },
    { id: 'grocery', name: 'RYM Marché', icon: ShoppingBag, bg: 'bg-emerald-50 text-emerald-700', action: onOpenGrocery },
    { id: 'dining', name: 'Bons Resto', icon: Utensils, bg: 'bg-orange-50 text-orange-700' },
    { id: 'travel', name: 'Hôtels & Séjours', icon: Luggage, bg: 'bg-amber-50 text-amber-700' },
    { id: 'shows', name: 'Sorties & Ciné', icon: Film, bg: 'bg-purple-50 text-purple-700' },
    { id: 'fresh', name: 'Fruits & Bio', icon: Apple, bg: 'bg-emerald-50 text-emerald-700', action: onOpenGrocery },
    { id: 'pharmacy', name: 'Pharmacie 24h', icon: Cross, bg: 'bg-red-50 text-red-600' },
    { id: 'tea', name: 'Cafés & Thés', icon: Coffee, bg: 'bg-amber-50 text-amber-800' },
    { id: 'bikes', name: 'RYM Coursier', icon: Bike, bg: 'bg-yellow-100 text-yellow-900' },
    { id: 'deals', name: 'Méga Vouchers', icon: Sparkles, bg: 'bg-rose-50 text-rose-600' },
  ];

  // Filter stores
  const filteredStores = stores.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col pb-28">
      {/* Search Bar */}
      <div className="px-3.5 pt-2 pb-2">
        <div className="bg-white rounded-full p-1 pl-3.5 flex items-center shadow-xs border border-black/5">
          <Search size={16} className="text-zinc-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher chawarma, pizza, couscous, supérette..."
            className="w-full bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none border-none p-0"
          />
          <button className="p-1 text-zinc-400 hover:text-zinc-600 mr-1" aria-label="Recherche vocale">
            <Mic size={16} />
          </button>
          <button className="bg-[#D9943B] text-[#1C1B1B] text-xs px-3.5 py-1.5 rounded-full font-bold shadow-xs active:scale-95 transition-transform shrink-0">
            Chercher
          </button>
        </div>
      </div>

      {/* 10-Icon Super-App Grid */}
      <div className="px-3.5 py-1">
        <div className="grid grid-cols-5 gap-y-2.5 gap-x-1 bg-white p-3 rounded-2xl shadow-xs border border-black/[0.04]">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={cat.action || (() => onSelectStore(stores[0]))}
                className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative shadow-xs ${
                    cat.bg.includes('bg-') ? cat.bg : 'bg-neutral-100'
                  }`}
                >
                  <Icon size={20} className={cat.color || 'text-zinc-700'} />
                  {cat.hot && (
                    <span className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[8px] leading-tight px-1 rounded-full font-bold">
                      HOT
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-800 mt-1 text-center font-medium line-clamp-1">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flash Sale Banner (Méga Vente RYM) */}
      <div className="px-3.5 py-2">
        <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-amber-200/80 p-3 rounded-2xl border border-amber-200/60 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[14px] text-amber-950">Méga Vente RYM 11.11</span>
              <span className="bg-[#FF5722] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Rush Déjeuner</span>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-zinc-800">
              <span className="bg-[#1C1B1B] text-white px-1.5 py-0.2 rounded text-[10px]">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              :
              <span className="bg-[#1C1B1B] text-white px-1.5 py-0.2 rounded text-[10px]">
                {String(timeLeft.mins).padStart(2, '0')}
              </span>
              :
              <span className="bg-[#1C1B1B] text-white px-1.5 py-0.2 rounded text-[10px]">
                {String(timeLeft.secs).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Flash Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div
              onClick={() => onSelectStore(stores[0])}
              className="bg-white/90 backdrop-blur-xs p-2 rounded-xl flex items-center gap-2 border border-black/5 shadow-xs cursor-pointer hover:bg-white active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXgK0NauGzq7NBUsA_EWhrT91S70btBrr7ikNQDeZ6kvC-lRiK_RzMH0eekPLr-QNWZaluA6-Iugvrm3EApfRLDSJoBPm0jyHcrIomUgWjxyIQav4GfnYFDhN54NSjQdHt67nuQvNohApFLZMAatYgm_8FKBJEfg-6IzKErJzlP-3ygErAzwXzQHmKMy-BwojlxvHW3AS9jhn7ceYAmJIEvZLY76ULfYayw7-DutccphSMAbhcpsks"
                  alt="Chawarma Promo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#FF5722] truncate">-150 DZD Chawarma</span>
                <span className="text-[9px] text-zinc-400 line-through">900 DZD</span>
                <span className="text-[9px] text-emerald-700 font-semibold">100 portions max</span>
              </div>
            </div>

            <div
              onClick={onOpenGrocery}
              className="bg-white/90 backdrop-blur-xs p-2 rounded-xl flex items-center gap-2 border border-black/5 shadow-xs cursor-pointer hover:bg-white active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTMMmy-w4l3HkEFtHyH5RtbqSHqKDF0Qio3NMqmwctRrBZiL2G5pbAC0jQ05cg2HQMn9Gfqn8DfYr5Ex-E6z3pmCp7NDXAnDoaIZaQt56dse-qVgMKPRmtRWYnCE9ha0cbvsUX7F2nJQhW55Mqmq_oluGysX7Gdiefscwn4-hI_xAEjYrP7xAJB9fnmkbbtKgKBH6UmZJbfJ4XDsWfcUAN6FVlVb5lil1i2bHkKDUQoa31myoG7_Aj"
                  alt="Fraises Bio"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[#FF5722] truncate">-30% Fraises Bio</span>
                <span className="text-[9px] text-zinc-400 line-through">650 DZD</span>
                <span className="text-[9px] text-emerald-700 font-semibold">Livraison 20 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Segment Tabs */}
      <div className="px-3.5 sticky top-[53px] bg-[#F6F7F9] z-20 pt-1 pb-1">
        <div className="flex items-center gap-4 border-b border-zinc-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSegment('nearby')}
            className={`pb-2 text-xs whitespace-nowrap transition-colors relative ${
              activeSegment === 'nearby' ? 'text-[#1C1B1B] font-bold border-b-2 border-[#D9943B]' : 'text-zinc-500'
            }`}
          >
            Bons Repas à Proximité
          </button>
          <button
            onClick={onOpenGrocery}
            className={`pb-2 text-xs whitespace-nowrap transition-colors ${
              activeSegment === 'grocery' ? 'text-[#1C1B1B] font-bold border-b-2 border-[#D9943B]' : 'text-zinc-500'
            }`}
          >
            RYM Marché (Courses 20 min)
          </button>
          <button
            onClick={() => setActiveSegment('vouchers')}
            className={`pb-2 text-xs whitespace-nowrap transition-colors ${
              activeSegment === 'vouchers' ? 'text-[#1C1B1B] font-bold border-b-2 border-[#D9943B]' : 'text-zinc-500'
            }`}
          >
            Bons Vouchers Resto
          </button>
          <button
            onClick={() => setActiveSegment('top_rated')}
            className={`pb-2 text-xs whitespace-nowrap transition-colors ${
              activeSegment === 'top_rated' ? 'text-[#1C1B1B] font-bold border-b-2 border-[#D9943B]' : 'text-zinc-500'
            }`}
          >
            Mieux Notés ★ 4.8+
          </button>
        </div>
      </div>

      {/* Store & Restaurant Feed */}
      <div className="px-3.5 space-y-3 mt-2">
        {filteredStores.map((store) => (
          <article
            key={store.id}
            onClick={() => onSelectStore(store)}
            className="bg-white rounded-2xl p-3 shadow-xs border border-black/[0.04] flex flex-col gap-2.5 cursor-pointer hover:border-amber-200 transition-all active:scale-[0.99]"
          >
            <div className="flex gap-3">
              <div className="w-22 h-22 rounded-xl overflow-hidden shrink-0 relative bg-neutral-100 border border-black/5">
                <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] text-center font-bold py-0.5">
                  Top Marque
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-bold text-[14px] text-[#1C1B1B] line-clamp-1">{store.name}</h3>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex items-center text-[#B02F00]">
                      <Star size={12} className="fill-current" />
                      <span className="text-xs font-bold ml-0.5">{store.rating}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">({store.reviewCount})</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-[11px] text-zinc-500 font-medium">{store.deliveryTimeMin} mins</span>
                    <span className="text-zinc-300">•</span>
                    <span className="text-[11px] text-zinc-500">{store.distanceKm} km</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                      Livraison {store.deliveryFee} DZD
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Zap size={9} /> RYM Express
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] bg-orange-50 text-[#FF5722] border border-orange-200/50 px-1.5 py-0.2 rounded font-medium">
                    -150 DZD dès 1 200 DZD
                  </span>
                  <span className="text-[10px] bg-neutral-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium">
                    Paiement COD
                  </span>
                </div>
              </div>
            </div>

            {/* Featured items micro-preview in this store */}
            {store.items.length > 0 && (
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] bg-neutral-100 text-zinc-500 px-1 rounded font-bold shrink-0">
                    Spécialité
                  </span>
                  <p className="text-xs text-zinc-700 font-medium truncate">
                    {store.items[0].name} —{' '}
                    <span className="font-bold text-[#FF5722]">{store.items[0].price} DZD</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDishToCustomize(store, store.items[0].id);
                  }}
                  className="w-6 h-6 rounded-full bg-[#D9943B] text-zinc-900 flex items-center justify-center shrink-0 shadow-xs hover:brightness-105 active:scale-90"
                  aria-label="Ajouter au panier"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Floating Sticky Cart Preview Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-14 left-0 right-0 w-full max-w-[430px] mx-auto px-3.5 z-30 pointer-events-none">
          <div className="pointer-events-auto bg-[#1F2124] text-white rounded-full p-2 pl-3 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#D9943B] text-[#1C1B1B] flex items-center justify-center font-bold">
                  <ShoppingBag size={20} />
                </div>
                <span className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-[#1F2124]">
                  {totalCartCount}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-extrabold text-white">{totalCartDZD} DZD</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">• Frais 150 DZD</span>
                </div>
                <span className="text-[10px] text-zinc-400">Paiement à la livraison (COD)</span>
              </div>
            </div>

            <button
              onClick={onOpenCheckout}
              className="bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#1C1B1B] text-xs font-extrabold px-4 py-2.5 rounded-full shadow-md flex items-center gap-1 transition-all"
            >
              <span>Commander</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
