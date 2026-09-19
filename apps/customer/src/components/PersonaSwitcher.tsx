import React from 'react';
import { Persona } from '../types';
import { Smartphone, Bike, Store as StoreIcon } from 'lucide-react';

interface Props {
  currentPersona: Persona;
  onChangePersona: (persona: Persona) => void;
}

export const PersonaSwitcher: React.FC<Props> = ({ currentPersona, onChangePersona }) => {
  return (
    <div className="w-full max-w-[430px] mx-auto bg-[#1F2124] text-white px-3 py-1.5 flex items-center justify-between border-b border-white/10 text-xs z-50">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#00B578] animate-pulse"></span>
        <span className="font-bold text-[#D9943B]">RYM Algérie</span>
        <span className="text-zinc-400 text-[10px]">Super-App</span>
      </div>

      <div className="flex items-center bg-white/10 rounded-full p-0.5">
        <button
          onClick={() => onChangePersona('customer')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            currentPersona === 'customer'
              ? 'bg-[#D9943B] text-[#1C1B1B] shadow-sm'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Smartphone size={12} />
          <span>Client</span>
        </button>

        <button
          onClick={() => onChangePersona('courier')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            currentPersona === 'courier'
              ? 'bg-[#D9943B] text-[#1C1B1B] shadow-sm'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Bike size={12} />
          <span>Livreur</span>
        </button>

        <button
          onClick={() => onChangePersona('merchant')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
            currentPersona === 'merchant'
              ? 'bg-[#D9943B] text-[#1C1B1B] shadow-sm'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <StoreIcon size={12} />
          <span>Commerçant</span>
        </button>
      </div>
    </div>
  );
};
