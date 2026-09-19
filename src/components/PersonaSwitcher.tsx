import React from 'react';
import { Persona } from '../types';
import { Smartphone, Bike, Store as StoreIcon, ShieldAlert, Cpu } from 'lucide-react';
import { RymGazelleIcon } from './RymGazelleIcon';

interface Props {
  currentPersona: Persona;
  onChangePersona: (persona: Persona) => void;
  onOpenTechStack?: () => void;
}

export const PersonaSwitcher: React.FC<Props> = React.memo(({
  currentPersona,
  onChangePersona,
  onOpenTechStack,
}) => {
  return (
    <div className="w-full bg-[#071E26] text-white px-2.5 sm:px-3.5 py-1.5 flex items-center justify-between border-b border-[#114250]/40 text-xs z-50">
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <RymGazelleIcon size={17} />
        <span className="font-extrabold text-[#E5A34C] tracking-wider text-[12px] sm:text-[13px]">RYM</span>
        <span className="text-[9px] text-[#EADBCE]/80 font-medium hidden min-[360px]:inline border-l border-white/20 pl-1.5 ml-0.5">
          Ahmed Rachedi
        </span>

        {/* Technical stack & DB config button is strictly restricted to Admin/Ops account only */}
        {currentPersona === 'admin' && (
          <button
            onClick={onOpenTechStack}
            title="Afficher la configuration Realtime Dispatch & Database URLs"
            className="ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-[#D9943B] hover:text-[#071E26] transition-colors text-[9px] font-mono font-bold text-zinc-300"
          >
            <Cpu size={12} strokeWidth={2} />
            <span className="hidden sm:inline">Système</span>
          </button>
        )}
      </div>

      {/* Account Persona Selector: Compact responsive icons on narrow screens */}
      <div className="flex items-center bg-[#0A2B35]/80 rounded-full p-0.5 gap-0.5 border border-[#114250]/50" role="tablist" aria-label="Choisir un compte">
        <button
          onClick={() => onChangePersona('customer')}
          title="Espace Client"
          aria-label="Espace Client"
          className={`flex items-center justify-center gap-1 px-1.5 min-[380px]:px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
            currentPersona === 'customer'
              ? 'btn-gradient-tertiary text-white shadow-xs font-bold'
              : 'text-[#EADBCE] hover:text-white hover:bg-white/10'
          }`}
        >
          <Smartphone size={13} strokeWidth={2.2} />
          <span className="hidden min-[480px]:inline">Client</span>
        </button>

        <button
          onClick={() => onChangePersona('courier')}
          title="Espace Livreur"
          aria-label="Espace Livreur"
          className={`flex items-center justify-center gap-1 px-1.5 min-[380px]:px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
            currentPersona === 'courier'
              ? 'btn-gradient-tertiary text-white shadow-xs font-bold'
              : 'text-[#EADBCE] hover:text-white hover:bg-white/10'
          }`}
        >
          <Bike size={13} strokeWidth={2.2} />
          <span className="hidden min-[480px]:inline">Livreur</span>
        </button>

        <button
          onClick={() => onChangePersona('merchant')}
          title="Espace Commerçant"
          aria-label="Espace Commerçant"
          className={`flex items-center justify-center gap-1 px-1.5 min-[380px]:px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
            currentPersona === 'merchant'
              ? 'btn-gradient-tertiary text-white shadow-xs font-bold'
              : 'text-[#EADBCE] hover:text-white hover:bg-white/10'
          }`}
        >
          <StoreIcon size={13} strokeWidth={2.2} />
          <span className="hidden min-[480px]:inline">Commerçant</span>
        </button>

        <button
          onClick={() => onChangePersona('admin')}
          title="Console Administration & Opérations"
          aria-label="Console Administration & Opérations"
          className={`flex items-center justify-center gap-1 px-1.5 min-[380px]:px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
            currentPersona === 'admin'
              ? 'btn-gradient-tertiary text-white shadow-xs font-bold'
              : 'text-[#EADBCE] hover:text-white hover:bg-white/10'
          }`}
        >
          <ShieldAlert size={13} strokeWidth={2.2} />
          <span className="hidden min-[480px]:inline">Admin</span>
        </button>
      </div>
    </div>
  );
});
