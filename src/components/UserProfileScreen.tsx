import React, { useState } from 'react';
import { LazyImage } from './common/LazyImage';
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
  Database,
  Sparkles,
  Flame,
  MessageSquare,
  LogIn,
  LogOut,
  UserCheck,
  HelpCircle,
  History,
  Coins,
  Bell,
  BellRing,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { Persona } from '../types';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { useFirebaseAuth } from '../firebase/AuthContext';
import { FidelitySystemModal } from './FidelitySystemModal';
import { RatingLoyaltyProgressCard } from './RatingLoyaltyProgressCard';

interface Props {
  onSwitchToCourier: () => void;
  onSwitchToMerchant: () => void;
  onOpenProfessionalPortals?: (role?: Persona) => void;
  onOpenAuth?: (initialMode?: 'signin' | 'signup') => void;
  onOpenFAQ?: () => void;
  onOpenPointsHistory?: () => void;
  onOpenNotificationsModal?: () => void;
  onOpenBffModal?: () => void;
}

export const UserProfileScreen: React.FC<Props> = ({
  onSwitchToCourier,
  onSwitchToMerchant,
  onOpenProfessionalPortals,
  onOpenAuth,
  onOpenFAQ,
  onOpenPointsHistory,
  onOpenNotificationsModal,
  onOpenBffModal,
}) => {
  const { fidelityProfile, purchasingHistory, merchantReviews, courierReviews } = useLocalDatabase();
  const {
    profile,
    currentUser,
    signOut,
    notificationPermission,
    isNotificationSupported,
    notificationsEnabled,
    requestNotificationPermission,
    setNotificationsEnabled,
    sendNativeNotification,
  } = useFirebaseAuth();
  const [showFidelityModal, setShowFidelityModal] = useState(false);
  const [notificationTestStatus, setNotificationTestStatus] = useState<string | null>(null);

  const activeVouchersCount = fidelityProfile.vouchers.filter((v) => !v.isUsed).length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F4EC] pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-[#EADBCE] shadow-xs">
        <h1 className="font-bold text-[16px] text-[#0A2B35]">Mon Profil</h1>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#0A2B35] bg-[#F7EBD9] border border-[#EADBCE] px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9943B]"></span>
            <span>Client VIP</span>
          </span>
        </div>
      </header>

      <div className="p-3.5 space-y-3.5">
        {/* User Profile Info Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#EADBCE] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {profile?.photoURL ? (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#D9943B]">
                  <LazyImage
                    src={profile.photoURL}
                    alt={profile.displayName}
                    placeholderType="avatar"
                    targetWidth={120}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#0A2B35] text-[#D9943B] flex items-center justify-center font-extrabold text-xl border-2 border-[#D9943B]">
                  {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'H'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 badge-gradient-primary text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-white shadow-xs">
                {profile?.role === 'customer' ? 'CLIENT' : profile?.role === 'driver' ? 'LIVREUR' : profile?.role === 'shop' ? 'RESTO' : 'ADMIN'}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="font-bold text-base text-[#0A2B35]">
                  {profile?.displayName || fidelityProfile.userName}
                </h2>
                <span className="badge-gradient-soft-primary text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#EADBCE]">
                  Membre {fidelityProfile.tier} ({fidelityProfile.pointsMultiplier}x)
                </span>
              </div>
              <p className="text-xs text-[#648692] mt-0.5">
                {profile?.phone || fidelityProfile.phone} • {profile?.wilaya || 'Ahmed Rachedi'} ({profile?.commune || 'Centre-ville'})
              </p>
              {profile?.email && (
                <p className="text-[10px] text-[#648692] truncate max-w-[200px]">{profile.email}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 items-end">
            {onOpenAuth && (
              <button
                onClick={() => onOpenAuth('signin')}
                className="px-2.5 py-1 rounded-lg bg-[#F8F4EC] hover:bg-[#EADBCE] border border-[#EADBCE] text-[#0A2B35] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn size={12} className="text-[#0A2B35]" />
                <span>{currentUser ? 'Changer' : 'Connexion'}</span>
              </button>
            )}
          </div>
        </div>

        {/* VIP Club Gold Card */}
        <div
          onClick={() => setShowFidelityModal(true)}
          className="card-gradient-hero rounded-2xl p-4 text-[#071E26] shadow-md relative overflow-hidden cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-wide uppercase">
                <Crown size={16} />
                <span>Club VIP Ahmed Rachedi • Fidélité Active</span>
              </div>
              <p className="text-xs font-semibold opacity-90 mt-1">
                Gagnez des points sur chaque repas & course à Ahmed Rachedi
              </p>
            </div>
            <span className="btn-gradient-tertiary text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              AHMED RACHEDI
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-black/10 flex justify-between items-center text-xs font-bold">
            <span>Solde fidélité : {fidelityProfile.pointsBalance} pts</span>
            <span className="underline flex items-center gap-1">
              Gérer mes points & bons ({activeVouchersCount}) →
            </span>
          </div>
        </div>

        {/* Visual Progress Indicator for Loyalty Points from Ratings */}
        <RatingLoyaltyProgressCard
          fidelityProfile={fidelityProfile}
          merchantReviews={merchantReviews}
          courierReviews={courierReviews}
          currentUserId={currentUser?.uid || 'user-amine-43'}
          onOpenFidelityModal={() => setShowFidelityModal(true)}
          onOpenPointsHistory={onOpenPointsHistory}
        />

        {/* Wallet & Balance Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 border border-[#EADBCE] shadow-xs text-center">
            <span className="text-[10px] text-[#648692] font-semibold block mb-0.5">Portefeuille</span>
            <span className="text-sm font-extrabold text-[#0A2B35]">2 400 <span className="text-[10px] text-[#648692] font-normal">DZD</span></span>
          </div>
          <div
            onClick={() => setShowFidelityModal(true)}
            className="bg-white rounded-2xl p-3 border border-[#EADBCE] shadow-xs text-center cursor-pointer hover:bg-[#F8F4EC] transition-colors"
          >
            <span className="text-[10px] text-[#648692] font-semibold block mb-0.5">Mes Bons d'Achat</span>
            <span className="text-sm font-extrabold text-[#D91A67]">{activeVouchersCount} <span className="text-[10px] font-normal">actifs</span></span>
          </div>
          <div
            id="profile-wallet-points-terroir"
            onClick={onOpenPointsHistory || (() => setShowFidelityModal(true))}
            className="bg-white rounded-2xl p-3 border border-[#EADBCE] shadow-xs text-center cursor-pointer hover:bg-[#F8F4EC] transition-colors"
          >
            <span className="text-[10px] text-[#648692] font-semibold block mb-0.5">Points Terroir</span>
            <span className="text-sm font-extrabold text-[#0A2B35]">{fidelityProfile.pointsBalance} <span className="text-[10px] font-normal">pts</span></span>
          </div>
        </div>

        {/* Menu Services List */}
        <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs divide-y divide-[#EADBCE]/60 text-xs">
          {/* Points History Dedicated View */}
          <div
            id="profile-btn-points-history"
            onClick={onOpenPointsHistory || (() => setShowFidelityModal(true))}
            className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer bg-[#F7EBD9]/40"
          >
            <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
              <History size={16} className="text-[#D9943B]" />
              <div>
                <span className="font-bold text-xs text-[#0A2B35] block">Historique des points fidélité</span>
                <span className="text-[10px] text-[#648692] block">
                  Détail de chaque commande et points cumulés
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-right shrink-0">
              <span className="text-[10px] bg-[#F7EBD9] text-[#0A2B35] font-extrabold px-2 py-0.5 rounded-full border border-[#EADBCE]">
                +{purchasingHistory.reduce((sum, r) => sum + (r.pointsEarned || 0), 0)} pts
              </span>
              <ChevronRight size={16} className="text-[#648692]" />
            </div>
          </div>

          <div
            onClick={() => setShowFidelityModal(true)}
            className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
              <Sparkles size={16} className="text-[#D9943B]" />
              <span>Avantages & Échange de points fidélité</span>
            </div>
            <span className="text-[11px] font-bold text-[#D9943B]">
              {fidelityProfile.pointsBalance} pts
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer">
            <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
              <MapPin size={16} className="text-[#0A2B35]" />
              <span>Mes adresses enregistrées (Cité El Bassatine, Ahmed Rachedi)</span>
            </div>
            <ChevronRight size={16} className="text-[#648692]" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer">
            <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
              <Gift size={16} className="text-[#0A2B35]" />
              <span>Parrainer à Ahmed Rachedi (Recevez 500 DZD de réduction)</span>
            </div>
            <span className="text-[10px] bg-[#F7EBD9] text-[#0A2B35] px-1.5 py-0.2 rounded font-bold border border-[#EADBCE]">
              Bonus
            </span>
          </div>

          {/* Native Notification & Background Alerts Control */}
          <div className="p-3.5 bg-[#FCF9F3] border-y border-[#EADBCE] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#0A2B35] font-bold text-xs">
                <BellRing size={16} className="text-[#0A2B35]" />
                <span>Alertes de Commande en Arrière-Plan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    notificationPermission === 'granted'
                      ? 'bg-[#F7EBD9] text-[#0A2B35] border border-[#EADBCE]'
                      : notificationPermission === 'denied'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-[#F7EBD9] text-[#0A2B35] border border-[#EADBCE]'
                  }`}
                >
                  {notificationPermission === 'granted'
                    ? 'Autorisé'
                    : notificationPermission === 'denied'
                    ? 'Bloqué'
                    : 'À autoriser'}
                </span>
                {notificationPermission === 'granted' && (
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#D9943B] rounded cursor-pointer"
                    title="Activer/Désactiver les alertes"
                  />
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#648692] leading-tight">
              Recevez les notifications d'étapes (en cuisine, coursier en route, livreur arrivé) même si l'application est minimisée ou en arrière-plan.
            </p>

            <div className="flex items-center gap-2 pt-1">
              {notificationPermission !== 'granted' ? (
                <button
                  onClick={async () => {
                    const res = await requestNotificationPermission();
                    if (res === 'granted') {
                      setNotificationTestStatus('Permissions accordées !');
                    } else {
                      setNotificationTestStatus('Non accordé');
                    }
                    setTimeout(() => setNotificationTestStatus(null), 3000);
                  }}
                  className="flex-1 bg-[#0A2B35] hover:bg-[#114250] text-white py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                >
                  <Bell size={13} className="text-[#D9943B]" />
                  <span>Activer les notifications natives</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setNotificationTestStatus('Basculez maintenant vers un autre onglet (alerte dans 3s)...');
                    setTimeout(() => {
                      sendNativeNotification('🛵 RYM Ahmed Rachedi', {
                        body: 'Le coursier Walid M. est en route avec votre commande !',
                        tag: 'test-profile',
                        requireInteraction: true,
                      });
                      setNotificationTestStatus('Alerte native envoyée !');
                      setTimeout(() => setNotificationTestStatus(null), 3000);
                    }, 3000);
                  }}
                  className="flex-1 bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <BellRing size={13} />
                  <span>Tester en arrière-plan (3s)</span>
                </button>
              )}

              {onOpenNotificationsModal && (
                <button
                  onClick={onOpenNotificationsModal}
                  className="px-2.5 py-1.5 bg-white border border-[#EADBCE] hover:bg-[#F8F4EC] rounded-xl text-[11px] font-bold text-[#0A2B35] transition-all active:scale-95 cursor-pointer"
                >
                  Détails
                </button>
              )}
            </div>

            {notificationTestStatus && (
              <div className="text-[10px] text-[#0A2B35] font-semibold bg-[#F7EBD9] p-1.5 rounded-lg text-center border border-[#EADBCE]">
                {notificationTestStatus}
              </div>
            )}
          </div>

          {/* Mobile BFF Architecture & Network Optimization Link */}
          {onOpenBffModal && (
            <div
              id="profile-btn-open-bff"
              onClick={onOpenBffModal}
              className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer border-b border-[#EADBCE]/60 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
                <Smartphone size={16} className="text-[#00B578]" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900">Passerelle BFF Mobile</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                      Actif
                    </span>
                  </div>
                  <p className="text-[10px] text-[#648692]">
                    Économie de données cellulaires (68%) & ETag cache
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#648692]" />
            </div>
          )}

          {onOpenFAQ && (
            <div
              id="profile-btn-open-faq"
              onClick={onOpenFAQ}
              className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer border-b border-[#EADBCE]/60"
            >
              <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
                <HelpCircle size={16} className="text-[#D9943B]" />
                <span>
                  <span className="sm:hidden">FAQ (Livraison & COD)</span>
                  <span className="hidden sm:inline">Foire Aux Questions (Livraison, Tarifs & Paiement COD)</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] bg-[#F7EBD9] text-[#0A2B35] border border-[#EADBCE] px-2 py-0.5 rounded font-bold">
                  Ahmed Rachedi
                </span>
                <ChevronRight size={16} className="text-[#648692]" />
              </div>
            </div>
          )}

          <div className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer">
            <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
              <Headphones size={16} className="text-[#0A2B35]" />
              <span>Assistance & Service Pro Ahmed Rachedi (24/7)</span>
            </div>
            <ChevronRight size={16} className="text-[#648692]" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer">
            <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
              <Globe size={16} className="text-[#0A2B35]" />
              <span>Langue de l'application (Français / العربية)</span>
            </div>
            <span className="text-[#648692] font-bold">FR</span>
          </div>

          {onOpenAuth && (
            <div
              onClick={() => onOpenAuth('signin')}
              className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-[#0A2B35] font-medium">
                <UserCheck size={16} className="text-[#0A2B35]" />
                <span>Authentification & Sécurité (SMS OTP / Email)</span>
              </div>
              <span className="text-[10px] bg-[#F8F4EC] border border-[#EADBCE] text-[#0A2B35] px-2 py-0.5 rounded font-bold">
                Gérer
              </span>
            </div>
          )}

          <div
            onClick={signOut}
            className="p-3.5 flex items-center justify-between hover:bg-[#F8F4EC] cursor-pointer text-[#D91A67] border-t border-[#EADBCE]/60"
          >
            <div className="flex items-center gap-2.5 font-medium">
              <LogOut size={16} className="text-[#D91A67]" />
              <span>Se déconnecter de la session</span>
            </div>
            <ChevronRight size={16} className="text-[#648692]" />
          </div>
        </div>

        {/* Partnership / Ecosystem switcher shortcuts */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#648692]">
              Espaces Professionnels Dédiés (Wilaya 43)
            </h3>
            <span className="text-[9px] bg-[#F7EBD9] text-[#0A2B35] font-bold px-1.5 py-0.5 rounded border border-[#EADBCE]">
              100% Gratuit & Pro
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onOpenProfessionalPortals ? onOpenProfessionalPortals('courier') : onSwitchToCourier()}
              className="p-3 rounded-xl bg-[#0A2B35] text-white border border-[#EADBCE]/20 flex flex-col items-start text-left hover:bg-[#114250] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2 font-bold shadow-xs">
                <Bike size={16} />
              </div>
              <span className="font-bold text-xs text-white">Portail Livreur</span>
              <span className="text-[10px] text-[#648692] mt-0.5">Tournées GPS, 0% commission & courses</span>
            </button>

            <button
              onClick={() => onOpenProfessionalPortals ? onOpenProfessionalPortals('merchant') : onSwitchToMerchant()}
              className="p-3 rounded-xl bg-[#F7EBD9] border border-[#EADBCE] flex flex-col items-start text-left hover:bg-[#EADBCE] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0A2B35] text-[#D9943B] flex items-center justify-center mb-2 font-bold shadow-xs">
                <Store size={16} />
              </div>
              <span className="font-bold text-xs text-[#0A2B35]">Portail Commerçant</span>
              <span className="text-[10px] text-[#648692] mt-0.5">Terminal cuisine, stocks & commandes</span>
            </button>

            <button
              onClick={() => onOpenProfessionalPortals ? onOpenProfessionalPortals('admin') : undefined}
              className="p-3 rounded-xl bg-[#071E26] border border-rose-500/20 text-white flex flex-col items-start text-left hover:bg-[#0A2B35] active:scale-95 transition-all shadow-sm cursor-pointer sm:col-span-1"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-2 font-bold shadow-xs">
                <ShieldAlert size={16} />
              </div>
              <span className="font-bold text-xs text-white">Console Admin</span>
              <span className="text-[10px] text-[#648692] mt-0.5">Supervision Mila, flotte & dispatch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FidelitySystemModal
        isOpen={showFidelityModal}
        onClose={() => setShowFidelityModal(false)}
        onOpenPointsHistory={onOpenPointsHistory}
      />
    </div>
  );
};
