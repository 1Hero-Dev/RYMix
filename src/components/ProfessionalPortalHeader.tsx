import React from 'react';
import { Persona } from '../types';
import {
  Bike,
  Store,
  ShieldAlert,
  LogOut,
  User,
  Users,
  Cpu,
  ArrowLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { RymGazelleIcon } from './RymGazelleIcon';
import { useFirebaseAuth } from '../firebase/AuthContext';

interface Props {
  currentPersona: Persona;
  onChangePersona: (persona: Persona) => void;
  onOpenAccountsModal: () => void;
  onOpenTechStack?: () => void;
}

export const ProfessionalPortalHeader: React.FC<Props> = React.memo(({
  currentPersona,
  onChangePersona,
  onOpenAccountsModal,
  onOpenTechStack,
}) => {
  const { profile, signOut } = useFirebaseAuth();

  const getPortalInfo = () => {
    switch (currentPersona) {
      case 'courier':
        return {
          title: 'Portail Livreur Partenaire',
          icon: Bike,
          roleBadge: 'Livreur Agréé #43',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          userName: profile?.displayName || 'Walid Mebarki',
        };
      case 'merchant':
        return {
          title: 'Portail Commerçant & Restaurant',
          icon: Store,
          roleBadge: 'Resto Partenaire',
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          userName: profile?.displayName || 'Chef Karim (Beni Haroun)',
        };
      case 'admin':
        return {
          title: 'Console Administration & Opérations',
          icon: ShieldAlert,
          roleBadge: 'Superviseur Mila',
          badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          userName: profile?.displayName || 'Direction Opérations',
        };
      default:
        return {
          title: 'Espace Professionnel',
          icon: Shield,
          roleBadge: 'Pro',
          badgeColor: 'bg-[#D9943B]/20 text-[#D9943B] border border-[#D9943B]/30',
          userName: profile?.displayName || 'Compte Pro',
        };
    }
  };

  const portalInfo = getPortalInfo();
  const Icon = portalInfo.icon;

  const handleSignOutToCustomer = async () => {
    try {
      await signOut();
    } catch {}
    localStorage.setItem('rym_active_account_persona', 'customer');
    onChangePersona('customer');
  };

  return (
    <div className="w-full bg-[#071E26] text-white px-3 sm:px-4 py-2 flex items-center justify-between border-b border-[#114250] text-xs z-50 shadow-md">
      {/* Left: Brand + Portal Designation */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0 bg-[#0A2B35] px-2 py-0.8 rounded-full border border-[#114250]">
          <RymGazelleIcon size={16} />
          <span className="font-black text-[#E5A34C] tracking-wider text-[11px] sm:text-[12px]">RYM</span>
        </div>

        <div className="h-4 w-px bg-white/20 shrink-0 hidden min-[400px]:block"></div>

        <div className="flex items-center gap-1.5 truncate">
          <div className="w-5 h-5 rounded-md bg-[#D9943B] text-[#071E26] flex items-center justify-center font-bold shrink-0">
            <Icon size={12} />
          </div>
          <span className="font-extrabold text-white text-[11px] sm:text-[12px] truncate">
            {portalInfo.title}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline-block ${portalInfo.badgeColor}`}>
            {portalInfo.roleBadge}
          </span>
        </div>
      </div>

      {/* Right: Active Account Pill + Portal Switcher + Logout */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Technical stack for Admin */}
        {currentPersona === 'admin' && onOpenTechStack && (
          <button
            onClick={onOpenTechStack}
            title="Configuration système & télémétrie"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-[#D9943B] hover:text-[#071E26] transition-colors text-[10px] font-mono font-bold text-zinc-300 cursor-pointer"
          >
            <Cpu size={12} strokeWidth={2} />
            <span className="hidden md:inline">Système</span>
          </button>
        )}

        {/* Change Account / Switch Portal */}
        <button
          onClick={onOpenAccountsModal}
          title="Changer de compte ou de portail professionnel"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A2B35] hover:bg-[#114250] border border-[#114250] text-[#EADBCE] hover:text-white transition-colors text-[11px] font-semibold cursor-pointer shadow-2xs"
        >
          <Users size={12} className="text-[#D9943B]" />
          <span className="hidden min-[480px]:inline truncate max-w-[120px]">
            {portalInfo.userName}
          </span>
          <span className="text-[10px] text-[#D9943B] font-bold">Changer</span>
        </button>

        {/* Direct Disconnect to Customer Home */}
        <button
          onClick={handleSignOutToCustomer}
          title="Se déconnecter et revenir à l'espace client"
          aria-label="Déconnexion"
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white transition-colors text-[11px] font-bold border border-rose-500/30 cursor-pointer"
        >
          <LogOut size={12} />
          <span className="hidden sm:inline">Quitter</span>
        </button>
      </div>
    </div>
  );
});
