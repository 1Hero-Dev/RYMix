import React, { useState } from 'react';
import { MapPin, ChevronDown, QrCode, Bell, Sun, Check } from 'lucide-react';
import { ALGERIAN_NEIGHBORHOODS } from '../data/mockData';

interface Props {
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  onOpenNotifications?: () => void;
  onOpenScanner?: () => void;
}

export const HeaderBar: React.FC<Props> = ({
  selectedLocation,
  onSelectLocation,
  onOpenNotifications,
  onOpenScanner,
}) => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-black/[0.04] px-3.5 py-2.5 flex items-center justify-between">
        {/* Location Dropdown */}
        <button
          onClick={() => setShowLocationPicker(true)}
          className="flex items-center gap-1.5 hover:bg-neutral-100 px-2 py-1 -ml-1 rounded-full transition-colors text-left max-w-[240px]"
        >
          <div className="w-6 h-6 rounded-full bg-[#D9943B]/20 flex items-center justify-center shrink-0">
            <MapPin size={15} className="text-[#B02F00]" />
          </div>
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-0.5">
              <span className="font-bold text-[14px] text-[#1C1B1B] truncate">{selectedLocation}</span>
              <ChevronDown size={14} className="text-[#81765F] shrink-0" />
            </div>
            <span className="text-[10px] text-zinc-500 font-medium leading-none">Livraison Express • Alger</span>
          </div>
        </button>

        {/* Right utility group */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/40 text-[11px] font-semibold">
            <Sun size={12} className="text-[#D9943B]" />
            <span>24°C</span>
          </div>

          <button
            onClick={onOpenScanner}
            aria-label="Scanner QR"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#1C1B1B] transition-transform active:scale-95"
          >
            <QrCode size={17} />
          </button>

          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#1C1B1B] transition-transform active:scale-95 relative"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5722]"></span>
          </button>
        </div>
      </header>

      {/* Location Picker Dialog */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#D9943B]" />
                <h3 className="font-bold text-[16px]">Sélectionnez votre quartier</h3>
              </div>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-sm px-2 py-1"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              RYM est actif dans les principales villes algériennes avec des dark stores et coursiers locaux dédiés.
            </p>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto no-scrollbar">
              {ALGERIAN_NEIGHBORHOODS.map((nh) => {
                const isSelected = selectedLocation.includes(nh.name);
                return (
                  <button
                    key={nh.id}
                    onClick={() => {
                      onSelectLocation(`${nh.name}, ${nh.city}`);
                      setShowLocationPicker(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'border-[#D9943B] bg-amber-50/50 font-bold text-[#1C1B1B]'
                        : 'border-neutral-100 hover:bg-neutral-50 text-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="text-[13px] font-semibold">{nh.name}</div>
                      <div className="text-[11px] text-zinc-400">{nh.city} • Zone couverte en 25 min</div>
                    </div>
                    {isSelected && <Check size={16} className="text-[#B02F00]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
