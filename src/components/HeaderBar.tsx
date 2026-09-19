import React, { useState } from 'react';
import { MapPin, ChevronDown, QrCode, Bell, Sun, Check, User, Shield } from 'lucide-react';
import { MILA_NEIGHBORHOODS } from '../data/essentialHomeData';
import { useFirebaseAuth } from '../firebase/AuthContext';
import { RymGazelleIcon } from './RymGazelleIcon';

interface Props {
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  onOpenNotifications?: () => void;
  onOpenScanner?: () => void;
  onOpenAuth?: () => void;
  onOpenProfessionalAccounts?: () => void;
}

export const HeaderBar: React.FC<Props> = React.memo(({
  selectedLocation,
  onSelectLocation,
  onOpenNotifications,
  onOpenScanner,
  onOpenAuth,
  onOpenProfessionalAccounts,
}) => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { profile, currentUser } = useFirebaseAuth();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FCF9F3]/95 backdrop-blur-md shadow-xs border-b border-[#EADBCE] px-2.5 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-1.5">
        {/* Brand & Location Dropdown */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 shrink-0 bg-[#F7EBD9] px-2 py-1 rounded-full border border-[#D9943B]/40 shadow-2xs">
            <RymGazelleIcon size={18} />
            <span className="font-black text-[12px] sm:text-[13px] tracking-wider text-[#0A2B35]">RYM</span>
          </div>

          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-1 hover:bg-[#F2E8DA] px-1 sm:px-1.5 py-1 rounded-full transition-colors text-left min-w-0 flex-1 max-w-[130px] min-[360px]:max-w-[160px] min-[400px]:max-w-[200px] sm:max-w-[240px] cursor-pointer"
            title="Changer de quartier à Ahmed Rachedi"
          >
            <MapPin size={13} className="text-[#0A2B35] shrink-0" />
            <div className="flex flex-col truncate min-w-0">
              <div className="flex items-center gap-0.5">
                <span className="font-bold text-[11.5px] sm:text-[13px] text-[#0A2B35] truncate">{selectedLocation}</span>
                <ChevronDown size={12} className="text-[#0A2B35] shrink-0" />
              </div>
              <span className="text-[9px] sm:text-[10px] text-[#648692] font-medium leading-none truncate">
                Ahmed Rachedi
              </span>
            </div>
          </button>
        </div>

        {/* Right utility group */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="hidden min-[400px]:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5EDE0] text-[#0A2B35] border border-[#EADBCE] text-[10.5px] sm:text-[11px] font-semibold">
            <Sun size={12} className="text-[#D9943B]" />
            <span>22°C</span>
          </div>

          <button
            onClick={onOpenScanner}
            aria-label="Scanner QR Code"
            title="Scanner QR Code"
            className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 rounded-full bg-[#F5EDE0] hover:bg-[#EADBCE] flex items-center justify-center text-[#0A2B35] transition-transform active:scale-95 cursor-pointer"
          >
            <QrCode size={15} strokeWidth={2} />
          </button>

          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            title="Notifications"
            className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 rounded-full bg-[#F5EDE0] hover:bg-[#EADBCE] flex items-center justify-center text-[#0A2B35] transition-transform active:scale-95 relative cursor-pointer"
          >
            <Bell size={15} strokeWidth={2} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full btn-gradient-tertiary"></span>
          </button>

          {onOpenProfessionalAccounts && (
            <button
              onClick={onOpenProfessionalAccounts}
              aria-label="Accéder aux portails professionnels"
              title="Portails Professionnels (Livreur, Commerçant, Admin)"
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#0A2B35] text-[#D9943B] hover:bg-[#114250] hover:text-white transition-all text-xs font-bold border border-[#D9943B]/40 shadow-2xs cursor-pointer active:scale-95"
            >
              <Shield size={13} className="text-[#D9943B] shrink-0" />
              <span className="text-[10px] font-extrabold tracking-wide uppercase">Pro</span>
            </button>
          )}

          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              aria-label="Connexion / Profil"
              title={currentUser ? `Connecté: ${profile?.displayName || 'Compte'}` : 'Connexion / Inscription'}
              className="flex items-center gap-1 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-full bg-[#0A2B35] text-white hover:bg-[#114250] transition-transform active:scale-95 text-xs font-bold shadow-2xs cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center text-[10px] font-black shrink-0">
                {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'R'}
              </div>
              <span className="hidden min-[480px]:inline truncate max-w-[70px]">
                {currentUser ? profile?.displayName?.split(' ')[0] : 'Compte'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Location Picker Dialog */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[420px] bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <RymGazelleIcon size={20} />
                <h3 className="font-bold text-[15px]">Quartiers d'Ahmed Rachedi</h3>
              </div>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-sm px-2 py-1 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Livraison express sur l'ensemble de la commune d'Ahmed Rachedi avec nos commerces partenaires locaux (supérettes, boulangeries artisanales, primeurs et restauration).
            </p>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto no-scrollbar">
              {MILA_NEIGHBORHOODS.map((nh) => {
                const isSelected = selectedLocation.includes(nh.name);
                return (
                  <button
                    key={nh.id}
                    onClick={() => {
                      onSelectLocation(`${nh.name}, ${nh.city}`);
                      setShowLocationPicker(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#D9943B] bg-[#F7EBD9] font-bold text-[#0A2B35]'
                        : 'border-[#EADBCE]/60 hover:bg-[#F8F4EC] text-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="text-[13px] font-semibold">{nh.name}</div>
                      <div className="text-[11px] text-[#648692]">{nh.city} • Livraison en 15-20 min</div>
                    </div>
                    {isSelected && <Check size={16} className="text-[#D91A67]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
