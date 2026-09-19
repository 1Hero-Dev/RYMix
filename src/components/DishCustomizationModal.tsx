import React, { useState } from 'react';
import { MenuItem, CartItem } from '../types';
import { LazyImage } from './common/LazyImage';
import { X, Check, ArrowRight, Minus, Plus, ChefHat, Sparkles } from 'lucide-react';

interface Props {
  dish: MenuItem;
  storeName: string;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const DishCustomizationModal: React.FC<Props> = ({
  dish,
  storeName,
  onClose,
  onAddToCart,
}) => {
  // Option states
  const [selectedPortion, setSelectedPortion] = useState<string>('p-std');
  const [selectedSpicy, setSelectedSpicy] = useState<string>('s-trad');
  const [selectedSide, setSelectedSide] = useState<string>('side-frites');
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['add-fromage']);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['Moins d\'huile']);
  const [chefRemark, setChefRemark] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Fallback defaults if dish doesn't define optionGroups
  const portionGroup = dish.optionGroups?.find((g) => g.id === 'opt-portion') || {
    id: 'opt-portion',
    name: 'Taille de la Portion',
    required: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: 'p-std', name: 'Portion Standard', priceDelta: 0 },
      { id: 'p-double', name: 'Double Viande (+80g poulet)', priceDelta: 250 },
      { id: 'p-jumbo', name: 'Formule Géante + Boisson', priceDelta: 400 },
    ],
  };

  const spicyGroup = dish.optionGroups?.find((g) => g.id === 'opt-spicy') || {
    id: 'opt-spicy',
    name: 'Niveau de Harissa & Piquant',
    required: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: 's-mild', name: 'Doux (Sans piquant)', priceDelta: 0 },
      { id: 's-trad', name: '🌶️ Harissa Traditionnelle', priceDelta: 0 },
      { id: 's-hot', name: '🌶️🌶️ Piquant Extra Fort', priceDelta: 50 },
    ],
  };

  const sidesGroup = dish.optionGroups?.find((g) => g.id === 'opt-sides') || {
    id: 'opt-sides',
    name: 'Accompagnement au Choix',
    required: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { id: 'side-frites', name: 'Frites fraîches maison', priceDelta: 0 },
      { id: 'side-riz', name: 'Riz safrané parfumé', priceDelta: 50 },
      { id: 'side-salade', name: 'Salade Mechouia grillée', priceDelta: 100 },
      { id: 'side-none', name: 'Sans féculent (Keto)', priceDelta: -50 },
    ],
  };

  const addonsGroup = dish.optionGroups?.find((g) => g.id === 'opt-addons') || {
    id: 'opt-addons',
    name: 'Suppléments Gourmands',
    required: false,
    minSelect: 0,
    maxSelect: 4,
    options: [
      { id: 'add-fromage', name: 'Fromage fondu gruyère', priceDelta: 100 },
      { id: 'add-oeuf', name: 'Œuf au plat coulant', priceDelta: 80 },
      { id: 'add-sauce', name: 'Sauce fromagère crémeuse', priceDelta: 80 },
      { id: 'add-olives', name: 'Olives violettes marinées', priceDelta: 60 },
    ],
  };

  const preferencesList = ['Moins d\'huile', 'Sans coriandre', 'Sauce à part', 'Oignons bien caramélisés'];

  // Calculate dynamic unit price
  const portionPrice = portionGroup.options.find((o) => o.id === selectedPortion)?.priceDelta || 0;
  const spicyPrice = spicyGroup.options.find((o) => o.id === selectedSpicy)?.priceDelta || 0;
  const sidePrice = sidesGroup.options.find((o) => o.id === selectedSide)?.priceDelta || 0;
  const addonsPrice = selectedAddons.reduce((acc, id) => {
    const opt = addonsGroup.options.find((o) => o.id === id);
    return acc + (opt ? opt.priceDelta : 0);
  }, 0);

  const unitPrice = dish.price + portionPrice + spicyPrice + sidePrice + addonsPrice;
  const totalPrice = unitPrice * quantity;

  const handleToggleAddon = (id: string) => {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter((item) => item !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  const handleTogglePref = (pref: string) => {
    if (selectedPrefs.includes(pref)) {
      setSelectedPrefs(selectedPrefs.filter((p) => p !== pref));
    } else {
      setSelectedPrefs([...selectedPrefs, pref]);
    }
  };

  const handleConfirm = () => {
    const selectedOptionsLog = [
      {
        groupName: portionGroup.name,
        optionName: portionGroup.options.find((o) => o.id === selectedPortion)?.name || '',
        priceDelta: portionPrice,
      },
      {
        groupName: spicyGroup.name,
        optionName: spicyGroup.options.find((o) => o.id === selectedSpicy)?.name || '',
        priceDelta: spicyPrice,
      },
      {
        groupName: sidesGroup.name,
        optionName: sidesGroup.options.find((o) => o.id === selectedSide)?.name || '',
        priceDelta: sidePrice,
      },
      ...selectedAddons.map((id) => {
        const opt = addonsGroup.options.find((o) => o.id === id)!;
        return {
          groupName: addonsGroup.name,
          optionName: opt.name,
          priceDelta: opt.priceDelta,
        };
      }),
      ...selectedPrefs.map((pref) => ({
        groupName: 'Préférence',
        optionName: pref,
        priceDelta: 0,
      })),
    ];

    const cartItem: CartItem = {
      menuItemId: dish.id,
      storeId: dish.storeId,
      storeName: storeName,
      name: dish.name,
      basePrice: unitPrice,
      quantity,
      imageUrl: dish.imageUrl,
      options: selectedOptionsLog,
      chefRemark: chefRemark.trim() || undefined,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end justify-center">
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Modal Handle & Header */}
        <div className="p-3 pb-2 border-b border-neutral-100 bg-white sticky top-0 z-20">
          <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-2.5"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="badge-gradient-tertiary text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                <ChefHat size={11} className="text-white" />
                {storeName}
              </span>
              <span className="badge-gradient-soft-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#EADBCE]">
                Recommandé #1
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-7 h-7 rounded-full bg-[#F5EDE0] flex items-center justify-center text-[#0A2B35] hover:bg-[#EADBCE] active:scale-95"
            >
              <X size={16} />
            </button>
          </div>

          {/* Dish Hero Snapshot */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="w-18 h-18 rounded-xl overflow-hidden bg-neutral-100 shrink-0 relative border border-black/5">
              <LazyImage
                src={dish.imageUrl}
                alt={dish.name}
                placeholderType="food"
                targetWidth={180}
                priority={true}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 inset-x-0 badge-gradient-tertiary text-white text-[9px] font-bold text-center py-0.5 z-10">
                Top Choix
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-[15px] text-[#0A2B35] leading-tight line-clamp-1">{dish.name}</h2>
              <p className="text-xs text-[#648692] line-clamp-1 mt-0.5">{dish.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-[#D91A67] font-bold text-xs">DZD</span>
                  <span className="text-[#D91A67] font-extrabold text-[18px] leading-none">{dish.price}</span>
                  {dish.originalPrice && dish.originalPrice > dish.price && (
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-zinc-400 text-xs line-through">{dish.originalPrice} DZD</span>
                      <span className="badge-gradient-soft-tertiary text-[9px] font-extrabold px-1.5 py-0.2 rounded leading-tight">
                        -{Math.round(((dish.originalPrice - dish.price) / dish.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <span className="badge-gradient-soft-tertiary text-[10px] px-1.5 py-0.5 rounded font-bold">
                  🌶️ Harissa Douce
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Customization Options Canvas */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3.5">
          {/* Section 1: Portion Size */}
          <section className="bg-white rounded-xl p-3 border border-[#EADBCE] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[14px] text-[#0A2B35]">{portionGroup.name}</h3>
                <span className="bg-[#F7EBD9] text-[#0A2B35] text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#EADBCE]">Requis</span>
              </div>
              <span className="text-[11px] text-[#648692] font-medium">Choix unique</span>
            </div>

            <div className="space-y-1.5">
              {portionGroup.options.map((opt) => {
                const isSelected = selectedPortion === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSelectedPortion(opt.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#D9943B] bg-[#F7EBD9]/60 ring-1 ring-[#D9943B]'
                        : 'border-[#EADBCE]/70 hover:border-[#D9943B]/50 bg-neutral-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#D9943B] bg-[#D9943B]' : 'border-zinc-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-[13px] font-semibold text-[#0A2B35]">{opt.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#D91A67]">
                      {opt.priceDelta === 0 ? 'Inclus' : `+${opt.priceDelta} DZD`}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Section 2: Spicy & Harissa Level */}
          <section className="bg-white rounded-xl p-3 border border-[#EADBCE] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[14px] text-[#0A2B35]">{spicyGroup.name}</h3>
                <span className="bg-[#F7EBD9] text-[#0A2B35] text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#EADBCE]">Requis</span>
              </div>
              <span className="text-[11px] text-[#648692] font-medium">Choix unique</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {spicyGroup.options.map((opt) => {
                const isSelected = selectedSpicy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSpicy(opt.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center relative transition-all ${
                      isSelected
                        ? 'border-[#D9943B] bg-[#F7EBD9]/60 ring-1 ring-[#D9943B]'
                        : 'border-[#EADBCE]/70 hover:border-[#D9943B]/50 bg-neutral-50/40'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#D9943B] rounded-bl-lg flex items-center justify-center">
                        <Check size={10} className="text-[#071E26] font-bold" />
                      </span>
                    )}
                    <span className="text-[12px] font-bold text-[#0A2B35]">{opt.name}</span>
                    <span className="text-[10px] text-[#D91A67] font-semibold mt-0.5">
                      {opt.priceDelta === 0 ? 'Gratuit' : `+${opt.priceDelta} DZD`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 3: Accompagnement */}
          <section className="bg-white rounded-xl p-3 border border-[#EADBCE] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[14px] text-[#0A2B35]">{sidesGroup.name}</h3>
                <span className="bg-[#F7EBD9] text-[#0A2B35] text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#EADBCE]">Requis</span>
              </div>
              <span className="text-[11px] text-[#648692] font-medium">1 au choix</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {sidesGroup.options.map((opt) => {
                const isSelected = selectedSide === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSide(opt.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'border-[#D9943B] bg-[#F7EBD9]/60 ring-1 ring-[#D9943B]'
                        : 'border-[#EADBCE]/70 hover:border-[#D9943B]/50 bg-neutral-50/40'
                    }`}
                  >
                    <span className="text-[12px] font-semibold text-[#0A2B35]">{opt.name}</span>
                    <span className="text-[11px] font-bold text-[#D91A67]">
                      {opt.priceDelta === 0 ? 'Inclus' : opt.priceDelta > 0 ? `+${opt.priceDelta} DZD` : `${opt.priceDelta} DZD`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 4: Add-ons & Toppings */}
          <section className="bg-white rounded-xl p-3 border border-[#EADBCE] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[14px] text-[#0A2B35]">{addonsGroup.name}</h3>
                <span className="bg-neutral-100 text-[#648692] text-[10px] font-semibold px-1.5 py-0.2 rounded">Optionnel</span>
              </div>
              <span className="text-[11px] text-[#648692] font-medium">Sélection multiple</span>
            </div>

            <div className="space-y-1.5">
              {addonsGroup.options.map((opt) => {
                const isChecked = selectedAddons.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={() => handleToggleAddon(opt.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-[#D9943B] bg-[#F7EBD9]/40'
                        : 'border-[#EADBCE]/60 hover:bg-[#F8F4EC]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          isChecked ? 'btn-gradient-tertiary text-white font-bold' : 'border border-zinc-300'
                        }`}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span className="text-[12px] text-[#0A2B35] font-medium">{opt.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#D91A67]">+{opt.priceDelta} DZD</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Section 5: Préférences de préparation */}
          <section className="bg-white rounded-xl p-3 border border-[#EADBCE] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[14px] text-[#0A2B35]">Préférences de Préparation</h3>
              <span className="text-[11px] text-[#648692] font-medium">Touchez pour activer</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {preferencesList.map((pref) => {
                const isActive = selectedPrefs.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => handleTogglePref(pref)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                      isActive
                        ? 'bg-[#F7EBD9] text-[#0A2B35] border border-[#D9943B] shadow-xs'
                        : 'bg-neutral-100 text-[#0A2B35] border border-transparent hover:bg-neutral-200'
                    }`}
                  >
                    {isActive && <Check size={12} className="text-[#D9943B]" />}
                    <span>{pref}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 6: Chef Remark */}
          <section className="bg-white rounded-xl p-3 border border-[#EADBCE] shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="chef-remark" className="font-bold text-[13px] text-[#0A2B35] flex items-center gap-1">
                <Sparkles size={14} className="text-[#D9943B]" />
                Instructions spéciales pour le cuisinier
              </label>
              <span className="text-[10px] text-[#648692]">{chefRemark.length}/50</span>
            </div>
            <textarea
              id="chef-remark"
              rows={2}
              maxLength={50}
              value={chefRemark}
              onChange={(e) => setChefRemark(e.target.value)}
              placeholder="Ex: Sauce blanche séparée, pain bien doré, sans sel..."
              className="w-full text-xs bg-neutral-50 border border-[#EADBCE] rounded-lg p-2 focus:outline-none focus:border-[#D9943B] resize-none"
            />
          </section>
        </div>

        {/* Sticky Action Footer */}
        <footer className="p-3 bg-white border-t border-[#EADBCE] shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-[#648692] mb-2 px-1">
            <div className="truncate max-w-[280px]">
              <span className="font-semibold text-[#0A2B35]">Sélection:</span> Standard · Harissa Maison · Frites
            </div>
            <span className="text-[#D91A67] font-bold text-[11px] flex items-center gap-0.5">
              ⚡ Préparation rapide
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Stepper */}
            <div className="flex items-center bg-[#F8F4EC] rounded-full p-1 border border-[#EADBCE] gap-2.5">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Diminuer quantité"
                className="w-7 h-7 rounded-full bg-white border border-[#EADBCE] flex items-center justify-center text-[#0A2B35] active:scale-95"
              >
                <Minus size={14} />
              </button>
              <span className="font-bold text-sm text-[#0A2B35] min-w-[16px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Augmenter quantité"
                className="w-7 h-7 rounded-full btn-gradient-primary flex items-center justify-center active:scale-95 shadow-xs"
              >
                <Plus size={14} className="text-[#071E26]" />
              </button>
            </div>

            {/* Total and Add Button */}
            <button
              onClick={handleConfirm}
              className="flex-1 h-11 btn-gradient-primary hover:opacity-95 active:scale-[0.98] rounded-full px-4 flex items-center justify-between shadow-md transition-transform font-bold cursor-pointer"
            >
              <div className="flex items-baseline gap-1 text-left">
                <span className="text-[10px] uppercase font-semibold text-[#071E26]/80">Total</span>
                <span className="text-base font-extrabold text-[#071E26]">{totalPrice} DZD</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#071E26]">
                <span>Ajouter au Panier</span>
                <ArrowRight size={15} />
              </div>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
