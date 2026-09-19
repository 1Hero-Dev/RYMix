import React, { useState, useEffect } from 'react';
import { Store, LoyaltyVoucher } from '../types';
import { fidelityDB } from '../db/localDatabase';
import { LazyImage } from './common/LazyImage';
import { Sparkles, Ticket, Flame, Star, ChevronRight, Award, Utensils, Check } from 'lucide-react';

interface Props {
  onSelectStore: (store: Store) => void;
  stores: Store[];
}

export const DineInGroupDealsScreen: React.FC<Props> = ({ onSelectStore, stores }) => {
  const [claimedVoucher, setClaimedVoucher] = useState(false);

  useEffect(() => {
    const profile = fidelityDB.getProfile();
    const alreadyClaimed = profile.vouchers.some((v) => v.code === 'RYM-LAUNCH-300');
    if (alreadyClaimed) {
      setClaimedVoucher(true);
    }
  }, []);

  const handleClaimLaunchVoucher = () => {
    const profile = fidelityDB.getProfile();
    if (!profile.vouchers.some((v) => v.code === 'RYM-LAUNCH-300')) {
      const newVoucher: LoyaltyVoucher = {
        id: `vouch-launch-${Date.now()}`,
        code: 'RYM-LAUNCH-300',
        title: 'Bon Lancement Spécial Ahmed Rachedi (-300 DZD)',
        discountDZD: 300,
        pointsCost: 0,
        minSpendDZD: 1500,
        isUsed: false,
        expiresAt: '2026-12-31',
      };
      fidelityDB.updateProfile({
        ...profile,
        vouchers: [newVoucher, ...profile.vouchers],
      });
    }
    setClaimedVoucher(true);
  };

  const voucherPacks = [
    {
      id: 'vp-1',
      title: 'Pack Matin Traditionnel Kesra Chaouia & Petit-Lait (Lben)',
      storeName: 'Boulangerie & Pâtisserie El Manar - Ahmed Rachedi Centre',
      store: stores[1] || stores[0],
      originalPrice: 450,
      dealPrice: 350,
      sales: '640 vendus',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      tags: ['2 Kesras Chaudes', '1L Lben Frais', 'Dattes'],
    },
    {
      id: 'vp-2',
      title: 'Panier Familial Épicerie Essentielle & Goûter Enfants',
      storeName: 'Supérette El Baraka - Route Principale, Ahmed Rachedi',
      store: stores[0],
      originalPrice: 2800,
      dealPrice: 2400,
      sales: '420 vendus',
      imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
      tags: ['Huile Elio 5L', 'Sucre 2kg', 'Lait Candia', 'Biscuits Bimo'],
    },
    {
      id: 'vp-3',
      title: 'Menu Duo Poulet Rôti aux Épices & Frites Maison',
      storeName: 'Rôtisserie & Fast-Food El Waha - Ahmed Rachedi',
      store: stores[2] || stores[0],
      originalPrice: 1800,
      dealPrice: 1450,
      sales: '890 vendus',
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
      tags: ['1 Poulet Entier Rôti', 'Grande Frite', 'Sauce Ail Harissa'],
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <div className="flex items-center gap-1.5">
          <Award size={18} className="text-[#D9943B]" />
          <h1 className="font-bold text-[15px] text-[#071E26]">
            <span className="sm:hidden">Offres</span>
            <span className="hidden sm:inline">Bons Plans & Offres</span>
          </h1>
        </div>
        <span className="text-[11px] text-[#071E26] bg-[#D9943B]/15 font-bold px-2 py-0.5 rounded-full border border-[#D9943B]/30">
          Ahmed Rachedi
        </span>
      </header>

      <div className="p-3.5 space-y-3.5">
        {/* Flash Voucher Drop Card */}
        <div className="card-gradient-bluegreen text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#2B788C]/20 blur-xl pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide badge-gradient-primary text-[#071E26] px-2 py-0.5 rounded-full inline-block mb-1 shadow-xs">
                Bon RYM de Lancement
              </span>
              <h2 className="text-xl font-black leading-tight text-white">-300 DZD OFFERTS</h2>
              <p className="text-xs text-[#EADBCE] mt-1 font-medium">
                Valable dès 1 500 DZD sur toutes les supérettes, boulangeries et commerces d'Ahmed Rachedi
              </p>
            </div>
            <Ticket size={32} className="text-[#E5A34C] opacity-90 shrink-0" />
          </div>

          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between relative z-10">
            <span className="text-[11px] font-medium text-[#EADBCE]">Expire dans 4 jours • 1 par compte</span>
            <button
              onClick={handleClaimLaunchVoucher}
              className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer ${
                claimedVoucher ? 'bg-emerald-600 text-white' : 'btn-gradient-primary text-[#071E26]'
              }`}
            >
              {claimedVoucher ? (
                <>
                  <Check size={13} />
                  <span>Ajouté au profil</span>
                </>
              ) : (
                'Obtenir le bon'
              )}
            </button>
          </div>
        </div>

        {/* Must-Eat Section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Flame size={16} className="text-[#D91A67]" />
              <h3 className="font-bold text-sm text-[#071E26]">Packs Dégustation à Prix Réduit</h3>
            </div>
            <span className="text-xs text-zinc-400">Économisez jusqu'à 30%</span>
          </div>

          <div className="space-y-3">
            {voucherPacks.map((pack) => {
              const discountPercent = Math.round(
                ((pack.originalPrice - pack.dealPrice) / pack.originalPrice) * 100
              );
              const savingsDZD = pack.originalPrice - pack.dealPrice;

              return (
                <div
                  key={pack.id}
                  onClick={() => onSelectStore(pack.store)}
                  className="bg-white rounded-2xl p-3 border border-black/[0.04] shadow-xs cursor-pointer hover:border-amber-200 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex gap-3">
                    <div className="w-24 h-24 aspect-square rounded-xl overflow-hidden bg-neutral-100 shrink-0 relative border border-black/5">
                      <LazyImage
                        src={pack.imageUrl}
                        alt={pack.title}
                        placeholderType="food"
                        targetWidth={200}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs z-10">
                        -{discountPercent}%
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h4 className="font-bold text-xs text-[#1C1B1B] leading-snug line-clamp-2">
                          {pack.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{pack.storeName}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pack.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-neutral-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-neutral-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-[#1C1B1B]">{pack.dealPrice} DZD</span>
                          <span className="text-[10px] text-zinc-400 line-through">{pack.originalPrice} DZD</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.2 rounded font-bold">
                            Économie {savingsDZD} DZD
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400">{pack.sales}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
