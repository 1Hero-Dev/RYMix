import React, { useState } from 'react';
import { Store, CartItem } from '../types';
import {
  ArrowLeft,
  Search,
  Zap,
  ShoppingBag,
  Sparkles,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface Props {
  store: Store;
  onBack: () => void;
  cartItems: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onUpdateCartQuantity: (itemId: string, delta: number) => void;
  onOpenCheckout: () => void;
}

export const GroceryMarketScreen: React.FC<Props> = ({
  store,
  onBack,
  cartItems,
  onAddToCart,
  onUpdateCartQuantity,
  onOpenCheckout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const categories = [
    'Tous',
    '🍓 Fruits de Saison',
    '🥬 Légumes Frais',
    '🥩 Boucherie & Volailles',
    '🥛 Produits Laitiers',
    '🍳 Œufs & Petit Déj',
  ];

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountDZD = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);

  const getItemQuantity = (id: string) => {
    return cartItems
      .filter((ci) => ci.menuItemId === id)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const filteredItems = store.items.filter((item) => {
    if (selectedCategory === 'Tous') return true;
    return item.category === selectedCategory;
  });

  const handleQuickAdd = (item: (typeof store.items)[0]) => {
    const cartItem: CartItem = {
      menuItemId: item.id,
      storeId: store.id,
      storeName: store.name,
      name: item.name,
      basePrice: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      options: [],
    };
    onAddToCart(cartItem);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-24 relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Retour"
            className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-700 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-[14px] text-[#1C1B1B]">RYM Marché 24h</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                Dark Store Express
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">Livraison en 20 min • Alger</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
          <Zap size={12} className="text-[#D9943B]" />
          <span>Chaîne du froid 100%</span>
        </div>
      </header>

      {/* Fresh Flash Promo Banner */}
      <div className="p-3.5 pb-2">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-3.5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="max-w-[70%]">
              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
                Arrivage Fraîcheur du Matin
              </span>
              <h2 className="text-base font-extrabold leading-tight">
                Fruits & Légumes de la Mitidja et Tipaza
              </h2>
              <p className="text-xs text-white/80 mt-1">
                Jusqu'à -30% sur les récoltes du jour • Préparation en 3 min
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl animate-float-bob">
              🍓
            </div>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="px-3.5 pb-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#1C1B1B] text-white font-bold shadow-xs'
                    : 'bg-white text-zinc-600 hover:bg-neutral-100 font-medium border border-black/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Product Grid */}
      <div className="p-3.5 pt-0">
        <div className="grid grid-cols-2 gap-2.5">
          {filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-2.5 border border-black/[0.04] shadow-xs flex flex-col justify-between hover:border-amber-200 transition-all"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 mb-2 border border-black/5">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {item.badge && (
                      <span className="absolute top-1 left-1 bg-[#FF5722] text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-[#1C1B1B] leading-tight line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{item.description}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-extrabold text-[#FF5722]">{item.price}</span>
                      <span className="text-[9px] text-[#FF5722] font-bold">DZD</span>
                    </div>
                    {item.originalPrice && (
                      <span className="text-[9px] text-zinc-400 line-through leading-none">
                        {item.originalPrice} DZD
                      </span>
                    )}
                  </div>

                  {/* Quantity Actions */}
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-0.5 border border-neutral-200">
                      <button
                        onClick={() => onUpdateCartQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-zinc-700 shadow-xs"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-bold px-1 text-zinc-900">{qty}</span>
                      <button
                        onClick={() => onUpdateCartQuantity(item.id, 1)}
                        className="w-5 h-5 rounded-full bg-[#D9943B] flex items-center justify-center text-zinc-900 shadow-xs"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleQuickAdd(item)}
                      className="w-7 h-7 rounded-full bg-[#D9943B] text-zinc-900 flex items-center justify-center shadow-xs active:scale-90 transition-transform font-bold"
                      aria-label="Ajouter au panier"
                    >
                      <Plus size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5">Livraison Express 20 min • Dark Store #04</span>
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
