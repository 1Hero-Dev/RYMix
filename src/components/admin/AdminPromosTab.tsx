import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import { DynamicPromoCode } from '../../types';
import {
  Ticket,
  Plus,
  Trash2,
  Check,
  X,
  Tag,
  Calendar,
  Percent,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface Props {
  promos: DynamicPromoCode[];
  onPromosUpdated: () => void;
}

export const AdminPromosTab: React.FC<Props> = ({ promos, onPromosUpdated }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // New promo form state
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE' | 'FREE_DELIVERY'>('FIXED');
  const [discountValue, setDiscountValue] = useState(150);
  const [minSpendDZD, setMinSpendDZD] = useState(800);
  const [maxUsageCount, setMaxUsageCount] = useState(100);

  const handleTogglePromo = (promoCode: string, currentStatus: boolean) => {
    adminService.togglePromoActive(promoCode, !currentStatus);
    onPromosUpdated();
  };

  const handleDeletePromo = (promoCode: string) => {
    adminService.deletePromoCode(promoCode);
    onPromosUpdated();
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) return;

    adminService.addPromoCode({
      code: code.trim().toUpperCase(),
      title,
      discountType,
      discountDZD: discountType === 'fixed' ? Number(discountValue) || 0 : undefined,
      percentage: discountType === 'percentage' ? Number(discountValue) || 10 : undefined,
      minOrderDZD: Number(minSpendDZD) || 0,
    });

    setCode('');
    setTitle('');
    setShowAddModal(false);
    onPromosUpdated();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={18} className="text-[#D91A67]" />
          <div>
            <h3 className="font-bold text-xs text-zinc-900">
              Codes Promotionnels & Campagnes Ahmed Rachedi
            </h3>
            <p className="text-[10px] text-zinc-400">
              {promos.length} codes configurés sur la plateforme
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
        >
          <Plus size={15} />
          <span>Créer un Code Promo</span>
        </button>
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {promos.map((promo) => (
          <div
            key={promo.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
              promo.isActive ? 'border-neutral-200 hover:border-black/20' : 'border-neutral-200/60 opacity-60 bg-neutral-50/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-mono font-black text-xs rounded-lg uppercase tracking-wider">
                  {promo.code}
                </span>

                <button
                  onClick={() => handleTogglePromo(promo.code, promo.isActive)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    promo.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-zinc-600'
                  }`}
                >
                  {promo.isActive ? 'ACTIF' : 'DÉSACTIVÉ'}
                </button>
              </div>

              <div>
                <h4 className="font-bold text-xs text-zinc-900">{promo.title}</h4>
                <div className="text-sm font-black text-emerald-700 mt-0.5">
                  {promo.discountType === 'FIXED' && `-${promo.discountValue} DZD`}
                  {promo.discountType === 'PERCENTAGE' && `-${promo.discountValue}%`}
                  {promo.discountType === 'FREE_DELIVERY' && 'Livraison Offerte'}
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-zinc-500 pt-1 border-t border-neutral-100">
                <div className="flex justify-between">
                  <span>Panier minimum:</span>
                  <span className="font-semibold text-zinc-800">{promo.minSpendDZD} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilisations:</span>
                  <span className="font-semibold text-zinc-800">
                    {promo.currentUsageCount} / {promo.maxUsageCount || '∞'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">
                Créé le {promo.createdAt}
              </span>

              <button
                onClick={() => handleDeletePromo(promo.code)}
                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Supprimer code"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: CREATE PROMO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-[#D9943B]" />
                <h3 className="font-bold text-sm">Nouveau Code Promo</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Code Coupon (Majuscules) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MILA50, RAMADAN, EID..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Intitulé / Description Promo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Remise Spéciale Printemps (-150 DZD)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Type de Remise
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium"
                  >
                    <option value="FIXED">Montant fixe (DZD)</option>
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="FREE_DELIVERY">Frais de livraison offerts</option>
                  </select>
                </div>

                {discountType !== 'FREE_DELIVERY' && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 block mb-1">
                      Valeur {discountType === 'FIXED' ? '(DZD)' : '(%)'}
                    </label>
                    <input
                      type="number"
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Commande Minimum (DZD)
                  </label>
                  <input
                    type="number"
                    value={minSpendDZD}
                    onChange={(e) => setMinSpendDZD(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Nombre Max d'Utilisations
                  </label>
                  <input
                    type="number"
                    value={maxUsageCount}
                    onChange={(e) => setMaxUsageCount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D9943B] font-bold text-xs rounded-xl text-[#071E26] hover:brightness-105"
                >
                  Créer le Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
