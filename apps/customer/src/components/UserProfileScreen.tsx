import React from 'react';
import {
  Crown,
  Wallet,
  Ticket,
  MapPin,
  FileText,
  Gift,
  Bike,
  Store,
  Globe,
  Settings,
  ShieldCheck,
  ChevronRight,
  Headphones,
} from 'lucide-react';

interface Props {
  onSwitchToCourier: () => void;
  onSwitchToMerchant: () => void;
}

export const UserProfileScreen: React.FC<Props> = ({
  onSwitchToCourier,
  onSwitchToMerchant,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <h1 className="font-bold text-[16px] text-[#1C1B1B]">Mon Profil RYM</h1>
        <button aria-label="Paramètres" className="text-zinc-600 hover:text-zinc-900">
          <Settings size={18} />
        </button>
      </header>

      <div className="p-3.5 space-y-3.5">
        {/* User Profile Info Card */}
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuN2_w-EBNtEXJguBVUeD5bfr4lhFYP9v-b1VFSGROFgx6RXqoF5GL9ooQUB3VjQoQ4Vf6aJyJvt4-UM1Zq1temtjmArdLxFCleb3mp8EFzcpHJsuMXGOHdLa6fuol7ilUBCci6mfacs12VyQWsAZNHp0pkoYUGqyZNTkYh30tf011opO1qtvgoPeMkIhM_eGtTVj7ra-ec0R_7Fy9TD3CWRApTQszxxQXb5hf_wx7SD5qVWzZs1OO"
                alt="Amine Benali"
                className="w-14 h-14 rounded-full object-cover border-2 border-[#D9943B]"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#D9943B] text-[#1C1B1B] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-white">
                VIP
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-base text-[#1C1B1B]">Amine Benali</h2>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  Membre Gold
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">+213 550 •• •• 56 • Alger (Hydra)</p>
            </div>
          </div>

          <ChevronRight size={18} className="text-zinc-400" />
        </div>

        {/* RYM VIP Club Gold Card */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 rounded-2xl p-4 text-[#1C1B1B] shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-wide uppercase">
                <Crown size={16} />
                <span>Club VIP RYM Privilège</span>
              </div>
              <p className="text-xs font-semibold opacity-90 mt-1">
                Livraison gratuite illimitée sur vos commandes & réductions exclusives
              </p>
            </div>
            <span className="bg-black text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              ACTIF
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-black/10 flex justify-between items-center text-xs font-bold">
            <span>Économisé ce mois : 1 850 DZD</span>
            <span className="underline cursor-pointer">Voir mes avantages →</span>
          </div>
        </div>

        {/* Wallet & Balance Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 border border-black/[0.04] shadow-xs text-center">
            <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Portefeuille RYM</span>
            <span className="text-sm font-extrabold text-[#1C1B1B]">2 400 <span className="text-[10px] text-zinc-500 font-normal">DZD</span></span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-black/[0.04] shadow-xs text-center">
            <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Mes Coupons</span>
            <span className="text-sm font-extrabold text-[#FF5722]">4 <span className="text-[10px] font-normal">actifs</span></span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-black/[0.04] shadow-xs text-center">
            <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Points Fidélité</span>
            <span className="text-sm font-extrabold text-emerald-700">850 <span className="text-[10px] font-normal">pts</span></span>
          </div>
        </div>

        {/* Menu Services List */}
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-xs divide-y divide-neutral-100 text-xs">
          <div className="p-3.5 flex items-center justify-between hover:bg-neutral-50 cursor-pointer">
            <div className="flex items-center gap-2.5 text-zinc-800 font-medium">
              <MapPin size={16} className="text-[#FF5722]" />
              <span>Mes adresses enregistrées (Hydra, Alger Centre)</span>
            </div>
            <ChevronRight size={16} className="text-zinc-400" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-neutral-50 cursor-pointer">
            <div className="flex items-center gap-2.5 text-zinc-800 font-medium">
              <Gift size={16} className="text-purple-600" />
              <span>Parrainer un proche (Recevez 500 DZD)</span>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">
              Bonus
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-neutral-50 cursor-pointer">
            <div className="flex items-center gap-2.5 text-zinc-800 font-medium">
              <Headphones size={16} className="text-blue-600" />
              <span>Centre d'aide & Service Client Algérie (24/7)</span>
            </div>
            <ChevronRight size={16} className="text-zinc-400" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-neutral-50 cursor-pointer">
            <div className="flex items-center gap-2.5 text-zinc-800 font-medium">
              <Globe size={16} className="text-emerald-600" />
              <span>Langue de l'application (Français / العربية)</span>
            </div>
            <span className="text-zinc-400 font-bold">FR</span>
          </div>
        </div>

        {/* Partnership / Ecosystem switcher shortcuts */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs space-y-2.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
            Espace Professionnel & Partenaires
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSwitchToCourier}
              className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex flex-col items-start text-left hover:bg-amber-100/70 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-[#D9943B] text-[#1C1B1B] flex items-center justify-center mb-2 font-bold shadow-xs">
                <Bike size={16} />
              </div>
              <span className="font-bold text-xs text-[#1C1B1B]">Espace Livreur</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Accéder à la vue coursier</span>
            </button>

            <button
              onClick={onSwitchToMerchant}
              className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col items-start text-left hover:bg-neutral-100 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1C1B1B] text-white flex items-center justify-center mb-2 font-bold shadow-xs">
                <Store size={16} />
              </div>
              <span className="font-bold text-xs text-[#1C1B1B]">Espace Commerçant</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Gérer les commandes & cuisine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
