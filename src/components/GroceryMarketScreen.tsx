import React, { useState } from 'react';
import { Store, CartItem } from '../types';
import { LazyImage } from './common/LazyImage';
import { HorizontalScrollContainer } from './common/HorizontalScrollContainer';
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F4EC] pb-24 relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-[#EADBCE] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Retour"
            className="w-8 h-8 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#071E26] active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-[14px] text-[#071E26]">Marché</h1>
              <span className="bg-[#D9943B]/20 text-[#B8731E] text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-[#D9943B]/30">
                Terroir & Express
              </span>
            </div>
            <span className="text-[10px] text-[#648692] font-medium">Livraison en 18 min • Ahmed Rachedi</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] bg-[#F7EBD9] text-[#B8731E] border border-[#D9943B]/30 px-2 py-0.5 rounded-full font-bold">
          <Zap size={12} className="text-[#D9943B]" />
          <span className="sm:hidden">100% Frais</span>
          <span className="hidden sm:inline">Fraîcheur & Zéro Majoration</span>
        </div>
      </header>

      {/* Fresh Flash Promo Banner */}
      <div className="p-3.5 pb-2">
        <div className="card-gradient-bluegreen text-white rounded-2xl p-3.5 shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#2B788C]/20 blur-xl pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <div className="max-w-[70%]">
              <span className="text-[10px] font-extrabold uppercase tracking-wide badge-gradient-primary text-[#071E26] px-2 py-0.5 rounded-full inline-block mb-1 shadow-xs">
                Terroir d'Ahmed Rachedi
              </span>
              <h2 className="text-base font-extrabold leading-tight text-white">
                Fruits & Légumes des Vergers Locaux
              </h2>
              <p className="text-xs text-[#EADBCE] mt-1 font-medium">
                Direct producteurs d'Ahmed Rachedi • 100% Frais du jour
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-2xl animate-float-bob shadow-xs">
              🍓
            </div>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="px-3.5 pb-2">
        <HorizontalScrollContainer
          id="grocery-categories-horizontal-list"
          step={200}
          ariaLabel="Rayons du marché"
          className="gap-1.5 py-1"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A2B35] text-[#D9943B] font-bold shadow-xs'
                    : 'bg-white text-[#648692] hover:bg-[#F8F4EC] font-medium border border-[#EADBCE]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </HorizontalScrollContainer>
      </div>

      {/* 2-Column Product Grid */}
      <div className="p-3.5 pt-0">
        <div className="grid grid-cols-2 gap-2.5">
          {filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-2.5 border border-[#EADBCE] shadow-xs flex flex-col justify-between hover:border-[#D9943B]/60 transition-all"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[#F8F4EC] mb-2 border border-[#EADBCE]">
                    <LazyImage
                      src={item.imageUrl}
                      alt={item.name}
                      placeholderType="grocery"
                      targetWidth={240}
                      className="w-full h-full object-cover"
                    />
                    {item.badge && (
                      <span className="absolute top-1 left-1 btn-gradient-tertiary text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded z-10 shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-[#071E26] leading-tight line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-[#648692] line-clamp-1 mt-0.5">{item.description}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#EADBCE]/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-extrabold text-[#D91A67]">{item.price}</span>
                      <span className="text-[9px] text-[#D91A67] font-bold">DZD</span>
                    </div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-[#648692] line-through leading-none">
                          {item.originalPrice} DZD
                        </span>
                        <span className="text-[8px] bg-[#D9943B]/10 text-[#B8731E] border border-[#D9943B]/30 font-bold px-1 rounded leading-tight">
                          -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quantity Actions */}
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 bg-[#F8F4EC] rounded-full p-0.5 border border-[#EADBCE]">
                      <button
                        onClick={() => onUpdateCartQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#071E26] shadow-xs cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-bold px-1 text-[#071E26]">{qty}</span>
                      <button
                        onClick={() => onUpdateCartQuantity(item.id, 1)}
                        className="w-5 h-5 rounded-full bg-[#D9943B] flex items-center justify-center text-[#071E26] shadow-xs cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleQuickAdd(item)}
                      className="w-7 h-7 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center shadow-xs active:scale-90 transition-transform font-bold cursor-pointer"
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
      {totalCount > 0 && (() => {
        const itemSavings = cartItems.reduce((acc, it) => {
          const menuItem = store.items.find((mi) => mi.id === it.menuItemId);
          if (menuItem?.originalPrice && menuItem.originalPrice > menuItem.price) {
            return acc + (menuItem.originalPrice - menuItem.price) * it.quantity;
          }
          return acc;
        }, 0);
        const qualifiesForFreeDelivery = totalAmountDZD >= 1200;
        const totalSavings = itemSavings + (qualifiesForFreeDelivery ? store.deliveryFee : 0);

        return (
          <div className="fixed bottom-3 left-0 right-0 w-full max-w-[430px] mx-auto px-3.5 z-40">
            <div className="bg-[#071E26] text-white rounded-full p-2 pl-3 flex items-center justify-between shadow-2xl border border-[#EADBCE]/20 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center font-bold">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="absolute -top-1 -right-1 btn-gradient-tertiary text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-[#071E26] shadow-2xs">
                    {totalCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className="text-base font-extrabold text-white">{totalAmountDZD} DZD</span>
                    {totalSavings > 0 && (
                      <span className="text-[10px] bg-[#D9943B]/20 text-[#E5A34C] border border-[#D9943B]/40 px-1.5 py-0.5 rounded font-bold">
                        Économie -{Math.round((totalSavings / (totalAmountDZD + totalSavings)) * 100)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#648692] mt-0.5">
                    {qualifiesForFreeDelivery
                      ? 'Livraison offerte débloquée !'
                      : `Livraison ${store.deliveryFee} DZD • Plus que ${1200 - totalAmountDZD} DZD pour livraison offerte`}
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenCheckout}
                className="bg-[#D9943B] hover:bg-[#E5A34C] active:scale-95 text-[#071E26] text-xs font-extrabold px-4 py-2.5 rounded-full shadow-md flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Valider ({totalCount})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
