import React, { useState } from 'react';
import { Store } from '../types';
import { Sparkles, Ticket, Flame, Star, ChevronRight, Award, Utensils } from 'lucide-react';

interface Props {
  onSelectStore: (store: Store) => void;
  stores: Store[];
}

export const DineInGroupDealsScreen: React.FC<Props> = ({ onSelectStore, stores }) => {
  const [claimedVoucher, setClaimedVoucher] = useState(false);

  const voucherPacks = [
    {
      id: 'vp-1',
      title: 'Pack Duo Grillades d\'Alger & Cherbet',
      storeName: 'Le Palmier - Val d\'Hydra',
      store: stores[0],
      originalPrice: 2200,
      dealPrice: 1650,
      discountText: '-25%',
      sales: '1 420 vendus',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZcajW4AQPcuh3IwKX-aaqm90PMUiqWwMUDortueKA578fQESqFXpZkmS4YS28Zc61dZ2QNMZ63QxU7CvUJTQTrhJKljU-4u4H3cHNHY5TP4bFiMF53yfJrk4hGGMVgGwCOVEuTXmFCcYRMuoNNyVNVg2OS2YiIQzp8-jMK3tgtEZgD52l4Na3F8ZKtFauCPBs-ZobymCmBPbqQ_VP1hnI5HJP0Xo_2jBNtodxcX4uL1pYREMPes-u',
      tags: ['2 Chawarmas Maxi', '2 Portions Frites', '2 Cherbets d\'Alger'],
    },
    {
      id: 'vp-2',
      title: 'Plateau Dégustation Pâtisseries Royales & Thé à la Menthe',
      storeName: 'La Rose d\'Alger - Didouche',
      store: stores[2] || stores[0],
      originalPrice: 1500,
      dealPrice: 1100,
      discountText: '-27%',
      sales: '890 vendus',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFcoNrTGtNgB5GXL3YJhjRX99ywUOilOAxBuWSlZ-DfxVIASpRFC32cteiFUweOkvMKiQpI5MJcl_5G8QfC-I1xoYhJzro99P1VprVTnIsVGpWmw9iyXyx65mJq1HuvK74XfIPmdLTOAFxtRG87Ir52crw9spH0VUtv1H3072hovB87zU6Ok2ahUildY1_KyeJbOObtl7FngRXEKLI6pk1ES3m2xfmj8VfED6OdhQh8dNNavBCC-4N',
      tags: ['Boîte 8 Gâteaux', 'Thé Menthe 1L'],
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <div className="flex items-center gap-1.5">
          <Award size={18} className="text-[#D9943B]" />
          <h1 className="font-bold text-[15px] text-[#1C1B1B]">Bons Plans & Découverte</h1>
        </div>
        <span className="text-[11px] text-amber-900 bg-amber-50 font-bold px-2 py-0.5 rounded-full border border-amber-200">
          Guide 2025 Alger
        </span>
      </header>

      <div className="p-3.5 space-y-3.5">
        {/* Flash Voucher Drop Card */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-black/20 px-2 py-0.5 rounded-full inline-block mb-1">
                Coupon Spécial Lancement RYM
              </span>
              <h2 className="text-xl font-extrabold leading-tight">-300 DZD OFFERTS</h2>
              <p className="text-xs text-white/90 mt-1">
                Valable dès 1 500 DZD sur tous les restaurants partenaires d'Alger
              </p>
            </div>
            <Ticket size={32} className="opacity-75 shrink-0" />
          </div>

          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="text-[11px] font-medium">Expire dans 4 jours • 1 par compte</span>
            <button
              onClick={() => setClaimedVoucher(true)}
              className="bg-white text-zinc-950 text-xs font-extrabold px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-all"
            >
              {claimedVoucher ? '✓ Ajouté au profil' : 'Obtenir le bon'}
            </button>
          </div>
        </div>

        {/* Must-Eat 2025 Section */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Flame size={16} className="text-[#FF5722]" />
              <h3 className="font-bold text-sm text-[#1C1B1B]">Packs Dégustation à Prix Réduit</h3>
            </div>
            <span className="text-xs text-zinc-400">Économisez jusqu'à 30%</span>
          </div>

          <div className="space-y-3">
            {voucherPacks.map((pack) => (
              <div
                key={pack.id}
                onClick={() => onSelectStore(pack.store)}
                className="bg-white rounded-2xl p-3 border border-black/[0.04] shadow-xs cursor-pointer hover:border-amber-200 transition-all flex flex-col gap-2.5"
              >
                <div className="flex gap-3">
                  <div className="w-22 h-22 rounded-xl overflow-hidden bg-neutral-100 shrink-0 relative border border-black/5">
                    <img src={pack.imageUrl} alt={pack.title} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-[#FF5722] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                      {pack.discountText}
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
                        <span className="text-sm font-extrabold text-[#FF5722]">{pack.dealPrice} DZD</span>
                        <span className="text-[10px] text-zinc-400 line-through">{pack.originalPrice} DZD</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{pack.sales}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
