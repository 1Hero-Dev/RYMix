import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Sparkles,
  DollarSign,
  Package,
  Clock,
  Flame,
  Boxes,
  Calendar,
  Barcode,
  Scale,
  ShieldCheck,
  ChefHat,
  ShoppingBasket,
  Croissant,
  Pill,
  Beef,
  Layers,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';
import { MenuItem, BusinessCategory } from '../../types';
import { BUSINESS_CATEGORIES } from '../../data/businessCategories';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<MenuItem>) => void;
  initialItem?: MenuItem | null;
  businessCategory: BusinessCategory;
  existingCategories: string[];
}

export const ProductEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  businessCategory,
  existingCategories,
}) => {
  const categoryConfig = BUSINESS_CATEGORIES[businessCategory] || BUSINESS_CATEGORIES.restaurant;

  // Form states
  const [name, setName] = useState(initialItem?.name || '');
  const [category, setCategory] = useState(
    initialItem?.category || existingCategories[0] || categoryConfig.defaultCategories[0] || 'Général'
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [price, setPrice] = useState(initialItem?.price ? String(initialItem.price) : '');
  const [originalPrice, setOriginalPrice] = useState(
    initialItem?.originalPrice ? String(initialItem.originalPrice) : ''
  );
  const [description, setDescription] = useState(initialItem?.description || '');
  const [imageUrl, setImageUrl] = useState(
    initialItem?.imageUrl ||
      categoryConfig.sampleProducts[0]?.imageUrl ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
  );
  const [isAvailable, setIsAvailable] = useState(initialItem ? initialItem.isAvailable : true);
  const [badge, setBadge] = useState(initialItem?.badge || '');

  // Category-tailored states: Grocery
  const [stockQuantity, setStockQuantity] = useState(
    initialItem?.stockQuantity !== undefined ? String(initialItem.stockQuantity) : '24'
  );
  const [stockThreshold, setStockThreshold] = useState(
    initialItem?.stockThreshold !== undefined ? String(initialItem.stockThreshold) : '5'
  );
  const [unit, setUnit] = useState(
    initialItem?.unit || categoryConfig.unitOptions[0] || 'pièce'
  );
  const [sku, setSku] = useState(initialItem?.sku || '');
  const [expiryDate, setExpiryDate] = useState(initialItem?.expiryDate || '');
  const [aisle, setAisle] = useState(
    initialItem?.aisle || categoryConfig.aisleOptions?.[0] || 'Rayon Principal'
  );
  const [isOrganicOrLocal, setIsOrganicOrLocal] = useState(
    initialItem?.isOrganicOrLocal ?? true
  );

  // Category-tailored states: Restaurant
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initialItem?.prepTimeMinutes !== undefined
      ? String(initialItem.prepTimeMinutes)
      : String(categoryConfig.recommendedPrepTime)
  );
  const [dishCourse, setDishCourse] = useState<MenuItem['dishCourse']>(
    initialItem?.dishCourse || 'plat'
  );
  const [spiciness, setSpiciness] = useState<MenuItem['spiciness']>(
    initialItem?.spiciness || 'none'
  );
  const [allowChefRemark, setAllowChefRemark] = useState(
    initialItem?.allowChefRemark ?? true
  );
  const [isHalal, setIsHalal] = useState(initialItem?.isHalal ?? true);

  // Category-tailored states: Bakery
  const [bakingBatchTime, setBakingBatchTime] = useState(
    initialItem?.bakingBatchTime || 'Fournée de 07h00'
  );

  // Category-tailored states: Pharmacy
  const [requiresPrescription, setRequiresPrescription] = useState(
    initialItem?.requiresPrescription ?? false
  );
  const [dosageFormat, setDosageFormat] = useState(
    initialItem?.dosageFormat || 'Boîte standard'
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialItem?.name || '');
    setCategory(
      initialItem?.category || existingCategories[0] || categoryConfig.defaultCategories[0] || 'Général'
    );
    setNewCategoryName('');
    setIsAddingNewCategory(false);
    setPrice(initialItem?.price ? String(initialItem.price) : '');
    setOriginalPrice(initialItem?.originalPrice ? String(initialItem.originalPrice) : '');
    setDescription(initialItem?.description || '');
    setImageUrl(
      initialItem?.imageUrl ||
        categoryConfig.sampleProducts[0]?.imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
    );
    setIsAvailable(initialItem ? initialItem.isAvailable : true);
    setBadge(initialItem?.badge || '');
    setStockQuantity(
      initialItem?.stockQuantity !== undefined ? String(initialItem.stockQuantity) : '24'
    );
    setStockThreshold(
      initialItem?.stockThreshold !== undefined ? String(initialItem.stockThreshold) : '5'
    );
    setUnit(initialItem?.unit || categoryConfig.unitOptions[0] || 'pièce');
    setSku(initialItem?.sku || '');
    setExpiryDate(initialItem?.expiryDate || '');
    setAisle(initialItem?.aisle || categoryConfig.aisleOptions?.[0] || 'Rayon Principal');
    setIsOrganicOrLocal(initialItem?.isOrganicOrLocal ?? true);
    setPrepTimeMinutes(
      initialItem?.prepTimeMinutes !== undefined
        ? String(initialItem.prepTimeMinutes)
        : String(categoryConfig.recommendedPrepTime)
    );
    setDishCourse(initialItem?.dishCourse || 'plat');
    setSpiciness(initialItem?.spiciness || 'none');
    setAllowChefRemark(initialItem?.allowChefRemark ?? true);
    setIsHalal(initialItem?.isHalal ?? true);
    setBakingBatchTime(initialItem?.bakingBatchTime || 'Fournée de 07h00');
    setRequiresPrescription(initialItem?.requiresPrescription ?? false);
    setDosageFormat(initialItem?.dosageFormat || 'Boîte standard');
    setErrorMessage(null);
  }, [isOpen, initialItem, businessCategory, existingCategories, categoryConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedPrice = parseFloat(price);
    if (!name.trim()) {
      setErrorMessage('Veuillez saisir le nom du produit.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage('Veuillez saisir un tarif valide en DZD supérieur à 0.');
      return;
    }

    const finalCategory = isAddingNewCategory && newCategoryName.trim()
      ? newCategoryName.trim()
      : category;

    const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
    const parsedStock = stockQuantity ? parseInt(stockQuantity, 10) : undefined;
    const parsedThreshold = stockThreshold ? parseInt(stockThreshold, 10) : undefined;
    const parsedPrepTime = prepTimeMinutes ? parseInt(prepTimeMinutes, 10) : undefined;

    const payload: Partial<MenuItem> = {
      name: name.trim(),
      category: finalCategory,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice && parsedOriginalPrice > parsedPrice ? parsedOriginalPrice : undefined,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      isAvailable,
      badge: badge.trim() || undefined,

      // Grocery & Inventory fields
      unit,
      stockQuantity: !isNaN(parsedStock as number) ? parsedStock : undefined,
      stockThreshold: !isNaN(parsedThreshold as number) ? parsedThreshold : undefined,
      sku: sku.trim() || undefined,
      expiryDate: expiryDate || undefined,
      aisle: aisle || undefined,
      isOrganicOrLocal,

      // Restaurant & Kitchen fields
      prepTimeMinutes: !isNaN(parsedPrepTime as number) ? parsedPrepTime : undefined,
      dishCourse,
      spiciness,
      allowChefRemark,
      isHalal,

      // Bakery fields
      bakingBatchTime: bakingBatchTime.trim() || undefined,

      // Pharmacy fields
      requiresPrescription,
      dosageFormat: dosageFormat.trim() || undefined,
    };

    onSave(payload);
    onClose();
  };

  // Quick preset photos
  const photoPresets = [
    { label: 'Plat Chaud', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { label: 'Sandwich / Chawarma', url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80' },
    { label: 'Poisson Frais', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80' },
    { label: 'Brique Lait / Épicerie', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' },
    { label: 'Semoule & Céréales', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
    { label: 'Pain & Viennoiserie', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' },
    { label: 'Boîte Soins / Pharmacie', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header with Category Badge */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-[#071E26] to-[#0A2B35] text-white">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs"
              style={{ backgroundColor: categoryConfig.color }}
            >
              {businessCategory === 'grocery' && <ShoppingBasket size={20} />}
              {businessCategory === 'restaurant' && <ChefHat size={20} />}
              {businessCategory === 'bakery' && <Croissant size={20} />}
              {businessCategory === 'pharmacy' && <Pill size={20} />}
              {businessCategory === 'butcher' && <Beef size={20} />}
              {businessCategory === 'artisan' && <Sparkles size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white">
                  {initialItem ? 'Modifier le Produit' : 'Publier un Nouveau Produit'}
                </h3>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: categoryConfig.color }}
                >
                  {categoryConfig.badgeLabel}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Champs de publication adaptés à votre commerce ({categoryConfig.nameFr})
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Informations Générales */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-zinc-800 mb-1">
                {businessCategory === 'grocery'
                  ? 'Désignation de l\'article (Marque & Format) *'
                  : businessCategory === 'restaurant'
                  ? 'Nom du Plat ou Formule *'
                  : 'Nom du Produit *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  businessCategory === 'grocery'
                    ? 'Ex: Lait Frais Candia Silia 1L ou Semoule Sim 1kg'
                    : 'Ex: Chawarma Maxi Poulet Braisé'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#D9943B] font-medium"
                required
              />
            </div>

            {/* Category / Rayon Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-zinc-800">
                  {businessCategory === 'grocery' ? 'Rayon & Famille de Produits *' : 'Catégorie sur la Carte *'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                  className="text-[10px] text-[#00B578] font-bold hover:underline"
                >
                  {isAddingNewCategory ? 'Choisir existante' : '+ Nouveau rayon / catégorie'}
                </button>
              </div>

              {isAddingNewCategory ? (
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Produits Bio du Terroir, Boissons Chaudes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#00B578] bg-emerald-50/20 text-zinc-900 focus:outline-none font-medium"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#D9943B] font-medium"
                >
                  {Array.from(new Set([...existingCategories, ...categoryConfig.defaultCategories])).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  Prix de Vente (DZD) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 750"
                    className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-extrabold text-sm focus:bg-white focus:outline-none focus:border-[#00B578]"
                    required
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-zinc-400 text-xs">
                    DZD
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  Prix Barré / Promo (Optionnel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Ex: 900"
                    className="w-full pl-3.5 pr-12 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 font-medium focus:bg-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-zinc-400 text-xs">
                    DZD
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-zinc-800 mb-1">
                Description & Ingrédients
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={
                  businessCategory === 'grocery'
                    ? 'Origine, contenance, conseils d\'utilisation ou caractéristiques...'
                    : 'Garniture, accompagnement, méthode de cuisson au feu de bois...'
                }
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 focus:bg-white focus:outline-none focus:border-[#D9943B] resize-none"
              />
            </div>
          </div>

          {/* ================================================================ */}
          {/* SECTION 2: TAILORED PUBLISHING FIELDS (CATEGORY DEPENDENT)       */}
          {/* ================================================================ */}

          <div className="p-3.5 rounded-2xl border border-[#D9943B]/20 bg-[#FBF9F5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-[#0A2B35] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#D9943B]" />
                <span>Paramètres Spécifiques : {categoryConfig.badgeLabel}</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Affichage client optimisé</span>
            </div>

            {/* GROCERY TAILORED FIELDS: INVENTORY, UNITS, EXPIRY & AISLES */}
            {businessCategory === 'grocery' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Scale size={13} className="text-emerald-600" />
                      <span>Unité de Vente</span>
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-semibold text-zinc-900"
                    >
                      {categoryConfig.unitOptions.map((u) => (
                        <option key={u} value={u}>
                          Au {u} ({u})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Boxes size={13} className="text-emerald-600" />
                      <span>Quantité en Stock</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 bg-white font-extrabold text-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => setStockQuantity(String(Math.max(0, parseInt(stockQuantity || '0', 10) + 10)))}
                        className="px-2 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold rounded-lg text-[10px]"
                        title="+10 unités"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <AlertCircle size={13} className="text-amber-600" />
                      <span>Alerte Seuil Bas</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stockThreshold}
                      onChange={(e) => setStockThreshold(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-medium"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Avertit quand stock &lt; seuil</span>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Barcode size={13} className="text-zinc-600" />
                      <span>Code-Barre / SKU</span>
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Ex: 613000123456"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Calendar size={13} className="text-blue-600" />
                      <span>Date de Péremption (DLC)</span>
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Emplacement Rayon</label>
                    <select
                      value={aisle}
                      onChange={(e) => setAisle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-zinc-900"
                    >
                      {categoryConfig.aisleOptions?.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOrganicOrLocal}
                    onChange={(e) => setIsOrganicOrLocal(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-zinc-700 font-semibold">
                    🌱 Produit du terroir / Agriculture locale de Mila (Mise en avant Baraka)
                  </span>
                </label>
              </div>
            )}

            {/* RESTAURANT TAILORED FIELDS: PREP TIME, DISH COURSE, SPICINESS, CHEF REMARKS */}
            {businessCategory === 'restaurant' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Clock size={13} className="text-[#D9943B]" />
                      <span>Temps de Cuisson / Prep</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="90"
                        step="5"
                        value={prepTimeMinutes}
                        onChange={(e) => setPrepTimeMinutes(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-neutral-200 bg-white font-bold"
                      />
                      <span className="absolute right-3 top-2 text-zinc-400 font-bold text-[11px]">min</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                      <Layers size={13} className="text-[#071E26]" />
                      <span>Type de Plat</span>
                    </label>
                    <select
                      value={dishCourse}
                      onChange={(e) => setDishCourse(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-semibold text-zinc-900"
                    >
                      <option value="plat">Plat Principal / Grillade</option>
                      <option value="entree">Entrée / Salade Mechouia</option>
                      <option value="formule">Formule Complète + Boisson</option>
                      <option value="dessert">Dessert Maison</option>
                      <option value="boisson">Boisson Fraîche</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                    <Flame size={13} className="text-red-500" />
                    <span>Niveau de Harissa & Piquant</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {[
                      { id: 'none', label: 'Sans piquant' },
                      { id: 'mild', label: '🌶️ Doux' },
                      { id: 'spicy', label: '🌶️🌶️ Fort' },
                      { id: 'extra_spicy', label: '🔥 Harissa Mila' },
                    ].map((sp) => (
                      <button
                        type="button"
                        key={sp.id}
                        onClick={() => setSpiciness(sp.id as any)}
                        className={`py-1.5 px-1 rounded-xl border text-[10px] font-bold transition-all ${
                          spiciness === sp.id
                            ? 'bg-red-500 text-white border-red-500 shadow-xs'
                            : 'bg-white text-zinc-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowChefRemark}
                      onChange={(e) => setAllowChefRemark(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00B578] focus:ring-[#00B578]"
                    />
                    <span className="text-zinc-700 font-semibold">
                      Autoriser les remarques personnalisées client (sans oignon, sauce à part...)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHalal}
                      onChange={(e) => setIsHalal(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-zinc-700 font-semibold">
                      100% Viande Locale Contrôlée Halal (Beni Haroun / Mila)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* BAKERY TAILORED FIELDS */}
            {businessCategory === 'bakery' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Horaire de Fournée</label>
                    <input
                      type="text"
                      value={bakingBatchTime}
                      onChange={(e) => setBakingBatchTime(e.target.value)}
                      placeholder="Ex: Fournée de 07h00"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-800 mb-1">Pains Disponibles</label>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PHARMACY TAILORED FIELDS */}
            {businessCategory === 'pharmacy' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill size={16} className="text-blue-600" />
                    <div>
                      <span className="font-bold text-zinc-900 block">Ordonnance Médicale Obligatoire ?</span>
                      <span className="text-[10px] text-zinc-500">Le client devra photographier son ordonnance</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiresPrescription}
                    onChange={(e) => setRequiresPrescription(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 mb-1">Conditionnement & Posologie</label>
                  <input
                    type="text"
                    value={dosageFormat}
                    onChange={(e) => setDosageFormat(e.target.value)}
                    placeholder="Ex: Boîte de 30 comprimés sécables ou Flacon 125ml"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Photo du Produit & Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-800 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-zinc-600" />
                <span>Photo du Produit</span>
              </label>
              <span className="text-[10px] text-zinc-400">Présélectionnez ou collez une URL</span>
            </div>

            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 text-zinc-900 text-xs font-mono"
            />

            {/* Photo preset badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {photoPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setImageUrl(preset.url)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                    imageUrl === preset.url
                      ? 'bg-[#D9943B] text-[#071E26] font-bold border-[#D9943B]'
                      : 'bg-neutral-100 text-zinc-700 border-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Badge commercial */}
            <div className="pt-2">
              <label className="block font-bold text-zinc-800 mb-1 flex items-center gap-1">
                <Tag size={13} className="text-zinc-600" />
                <span>Badge Promotionnel (Optionnel)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['', 'Populaire', 'Spécialité Locale', 'Nouveau', 'Promo -15%', 'Terroir Mila'].map((b) => (
                  <button
                    type="button"
                    key={b || 'aucun'}
                    onClick={() => setBadge(b)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                      badge === b
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                        : 'bg-white text-zinc-600 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {b || 'Aucun badge'}
                  </button>
                ))}
              </div>
            </div>

            {/* Disponibilité immédiate */}
            <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div>
                <span className="font-bold text-zinc-900 block">Disponible à la Vente Immédiate</span>
                <span className="text-[10px] text-zinc-500">Visible et commandable par les clients sur RYM</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${
                  isAvailable ? 'bg-[#00B578] justify-end' : 'bg-neutral-300 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-neutral-200 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-zinc-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-2 py-3 bg-[#00B578] hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Check size={16} />
              <span>{initialItem ? 'Enregistrer les Modifications' : 'Publier le Produit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
