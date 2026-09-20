import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Store as StoreIcon,
  ChefHat,
  ShoppingBasket,
  Croissant,
  Pill,
  Beef,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Check,
  Boxes,
  Layers,
  UtensilsCrossed,
} from 'lucide-react';
import { BusinessCategory, Store } from '../../types';
import { BUSINESS_CATEGORIES, CategoryDetail } from '../../data/businessCategories';
import { MILA_NEIGHBORHOODS } from '../../data/mockData';
import { adminService } from '../../services/adminService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (newStore: Store) => void;
  onStoreCreated?: (newStore: Store) => void;
  initialCategory?: BusinessCategory;
}

export const MerchantOnboardingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onComplete,
  onStoreCreated,
  initialCategory = 'restaurant',
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory>(initialCategory);

  // Store information states
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('+213 550 00 00 00');
  const [neighborhood, setNeighborhood] = useState(MILA_NEIGHBORHOODS[0].name);
  const [address, setAddress] = useState('Boulevard 1er Novembre 1954');
  const [landmark, setLandmark] = useState('Près de la Grande Mosquée');
  const [minOrderDZD, setMinOrderDZD] = useState('600');
  const [deliveryFeeDZD, setDeliveryFeeDZD] = useState('100');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('20');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategoryDetail = BUSINESS_CATEGORIES[selectedCategory] || BUSINESS_CATEGORIES.restaurant;

  const handleNextStep = () => {
    setStep(2);
    // Pre-populate suggested prep time
    setPrepTimeMinutes(String(currentCategoryDetail.recommendedPrepTime));
    if (!storeName) {
      if (selectedCategory === 'grocery') setStoreName('Supérette El Baraka');
      else if (selectedCategory === 'restaurant') setStoreName('Restaurant & Grillades El Bahdja');
      else if (selectedCategory === 'bakery') setStoreName('Boulangerie Traditionnelle El Hana');
      else if (selectedCategory === 'pharmacy') setStoreName('Pharmacie de la Liberté');
      else if (selectedCategory === 'butcher') setStoreName('Boucherie Centrale du Terroir');
      else setStoreName('Boutique & Artisanat Mila');
    }
  };

  const handleFinishOnboarding = () => {
    setErrorMessage(null);
    if (!storeName.trim()) {
      setErrorMessage('Veuillez renseigner le nom de votre établissement commercial.');
      return;
    }

    const parsedMinOrder = parseInt(minOrderDZD, 10) || 500;
    const parsedFee = parseInt(deliveryFeeDZD, 10) || 100;
    const parsedPrep = parseInt(prepTimeMinutes, 10) || currentCategoryDetail.recommendedPrepTime;

    // Create the newly tailored store using adminService
    const newStore = adminService.addStore({
      name: storeName.trim(),
      category: currentCategoryDetail.badgeLabel,
      phone: phone.trim(),
      address: `${address.trim()}, ${neighborhood}`,
      landmark: landmark.trim(),
      deliveryFee: parsedFee,
      minOrder: parsedMinOrder,
      prepTimeMinutes: parsedPrep,
      imageUrl: currentCategoryDetail.sampleProducts[0]?.imageUrl,
    });

    // Enrich with BusinessCategory metadata and initial tailored sample products
    const initialItems = currentCategoryDetail.sampleProducts.map((sample, index) => ({
      id: `item-${newStore.id}-${index + 1}`,
      storeId: newStore.id,
      name: sample.name,
      description: sample.description,
      price: sample.price,
      category: sample.category,
      imageUrl: sample.imageUrl,
      isAvailable: true,
      badge: sample.badge,
      unit: sample.unit,
      stockQuantity: sample.stockQuantity,
      stockThreshold: sample.stockThreshold,
      prepTimeMinutes: sample.prepTimeMinutes,
      spiciness: sample.spiciness,
      dishCourse: sample.dishCourse,
      bakingBatchTime: sample.bakingBatchTime,
      requiresPrescription: sample.requiresPrescription,
      dosageFormat: sample.dosageFormat,
      aisle: (sample as any).aisle,
    }));

    const completeTailoredStore: Store = {
      ...newStore,
      businessCategory: selectedCategory,
      menuCategories: currentCategoryDetail.defaultCategories,
      items: initialItems,
    };

    // Save with items and category
    adminService.updateStore(newStore.id, {
      businessCategory: selectedCategory,
      menuCategories: currentCategoryDetail.defaultCategories,
      items: initialItems,
    });

    if (onStoreCreated) {
      onStoreCreated(completeTailoredStore);
    } else if (onComplete) {
      onComplete(completeTailoredStore);
    }
    onClose();
  };

  const categoryList = Object.values(BUSINESS_CATEGORIES);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-[#071E26] via-[#0A2B35] to-[#0D3845] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-bold shadow-xs">
              <StoreIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">
                  Onboarding Commerçant RYM
                </h3>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                  Étape {step} sur 2
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                {step === 1
                  ? 'Sélectionnez votre type d\'activité pour adapter votre interface'
                  : 'Configurez les paramètres de votre boutique'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-zinc-900 text-sm mb-1">
                  1. Quel est le domaine d'activité de votre commerce ?
                </h4>
                <p className="text-zinc-500 text-xs">
                  Votre sélection configurera instantanément vos outils de gestion (ex :{' '}
                  <strong className="text-zinc-700">gestion de menu</strong> pour les restaurants, ou{' '}
                  <strong className="text-zinc-700">suivi d'inventaire & stocks</strong> pour les épiceries).
                </p>
              </div>

              {/* Grid of Business Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categoryList.map((cat) => {
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#00B578] bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs font-bold"
                            style={{ backgroundColor: cat.color }}
                          >
                            {cat.id === 'restaurant' && <ChefHat size={18} />}
                            {cat.id === 'grocery' && <ShoppingBasket size={18} />}
                            {cat.id === 'bakery' && <Croissant size={18} />}
                            {cat.id === 'pharmacy' && <Pill size={18} />}
                            {cat.id === 'butcher' && <Beef size={18} />}
                            {cat.id === 'artisan' && <Sparkles size={18} />}
                          </div>
                          <div>
                            <span className="font-extrabold text-zinc-900 text-xs block leading-tight">
                              {cat.nameFr}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-arabic">{cat.nameAr}</span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#00B578] border-[#00B578] text-white'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                        {cat.description}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-700">
                          Outil dédié : <span className="text-[#071E26] underline">{cat.catalogTabLabel}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Preview of Adapted Features */}
              <div className="p-3.5 rounded-2xl border border-[#D9943B]/30 bg-[#FBF9F5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#D9943B]" />
                    <span>Outils débloqués pour : {currentCategoryDetail.badgeLabel}</span>
                  </span>
                  <span className="text-[10px] font-extrabold text-[#D9943B] bg-[#D9943B]/10 px-2 py-0.5 rounded-full">
                    Interface personnalisée
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  {currentCategoryDetail.secondaryTools.map((tool, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-zinc-700 font-medium">
                      <CheckCircle2 size={13} className="text-[#00B578] shrink-0" />
                      <span className="line-clamp-1">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STORE DETAILS & OPERATIONAL PROFILE */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: currentCategoryDetail.color }}
                >
                  {selectedCategory === 'grocery' && <ShoppingBasket size={16} />}
                  {selectedCategory === 'restaurant' && <ChefHat size={16} />}
                  {selectedCategory === 'bakery' && <Croissant size={16} />}
                  {selectedCategory === 'pharmacy' && <Pill size={16} />}
                  {selectedCategory === 'butcher' && <Beef size={16} />}
                  {selectedCategory === 'artisan' && <Sparkles size={16} />}
                </div>
                <div>
                  <span className="font-bold text-zinc-900 block text-xs">
                    Catégorie sélectionnée : {currentCategoryDetail.nameFr}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Onglet catalogue adapté en « {currentCategoryDetail.catalogTabLabel} »
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-zinc-800 mb-1">
                    Nom de votre Commerce / Établissement *
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Supérette El Baraka ou Restaurant Beni Haroun"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-bold focus:bg-white focus:outline-none focus:border-[#00B578]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Phone size={12} className="text-zinc-500" />
                      <span>Téléphone de Contact *</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+213 550 12 34 56"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Clock size={12} className="text-zinc-500" />
                      <span>{selectedCategory === 'grocery' ? 'Temps préparation colis' : 'Temps de cuisson / prep'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={prepTimeMinutes}
                        onChange={(e) => setPrepTimeMinutes(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 font-bold"
                      />
                      <span className="absolute right-3 top-2 font-bold text-zinc-400 text-[11px]">min</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <MapPin size={12} className="text-zinc-500" />
                      <span>Quartier à Ahmed Rachedi</span>
                    </label>
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-medium"
                    >
                      {MILA_NEIGHBORHOODS.map((n) => (
                        <option key={n.id} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Repère ou Rue</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Ex: Face à la Grande Mosquée"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-medium"
                    />
                  </div>
                </div>

                {/* Pricing rules */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Commande Min. (DZD)</label>
                    <input
                      type="number"
                      step="50"
                      value={minOrderDZD}
                      onChange={(e) => setMinOrderDZD(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Frais Livraison (DZD)</label>
                    <input
                      type="number"
                      step="10"
                      value={deliveryFeeDZD}
                      onChange={(e) => setDeliveryFeeDZD(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-zinc-700 font-bold hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Changer de catégorie</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-zinc-500 font-bold hover:bg-neutral-200/60 transition-colors cursor-pointer"
            >
              Annuler
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl bg-[#00B578] hover:bg-emerald-600 text-white font-extrabold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>Continuer avec cette catégorie</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="px-6 py-2.5 rounded-xl bg-[#00B578] hover:bg-emerald-600 text-white font-extrabold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Valider & Accéder à l'Espace Pro</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
