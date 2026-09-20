import React, { useState } from 'react';
import {
  Order,
  Store,
  DynamicPromoCode,
  PlatformOperationalSettings,
  AdminTab,
} from '../../types';
import { adminService } from '../../services/adminService';
import { LocalCourierTelemetryPing } from '../../utils/localRealtimeSimulator';
import {
  Store as StoreIcon,
  Bike,
  ClipboardList,
  Users,
  Ticket,
  DollarSign,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Plus,
  Send,
  Radio,
  ArrowRight,
  Database,
  Flame,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Percent,
  Check,
  Eye,
} from 'lucide-react';

interface Props {
  orders: Order[];
  stores: Store[];
  couriers: LocalCourierTelemetryPing[];
  users: Array<any>;
  promos: DynamicPromoCode[];
  settings: PlatformOperationalSettings;
  onNavigateTab: (tab: AdminTab) => void;
  onRefreshStores: () => void;
  onRefreshSettings: () => void;
  onOpenManualOrderModal: () => void;
  onOpenTechStack: () => void;
  onOpenFirebase?: () => void;
  onOpenHttpSms?: () => void;
  onOpenDbInspector: () => void;
}

export const AdminOverviewTab: React.FC<Props> = ({
  orders,
  stores,
  couriers,
  users,
  promos,
  settings,
  onNavigateTab,
  onRefreshStores,
  onRefreshSettings,
  onOpenManualOrderModal,
  onOpenTechStack,
  onOpenFirebase,
  onOpenHttpSms,
  onOpenDbInspector,
}) => {
  // Live Announcement state
  const [bannerText, setBannerText] = useState(
    settings.announcementBannerText || settings.announcementBanner || ''
  );
  const [bannerSaved, setBannerSaved] = useState(false);

  // Quick broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'ALL' | 'DRIVERS' | 'MERCHANTS'>('ALL');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [showBroadcastBox, setShowBroadcastBox] = useState(false);

  // Quick platform tariff adjustments
  const [baseFee, setBaseFee] = useState(settings.baseDeliveryFeeDZD || 150);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeDeliveryThresholdDZD || 1200);
  const [radiusKm, setRadiusKm] = useState(settings.maxDeliveryRadiusKm || 2.0);
  const [tariffsSaved, setTariffsSaved] = useState(false);

  // Metrics computation across the entire app
  const totalSalesVolume = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const activeDeliveriesCount = orders.filter(
    (o) => o.status === 'ASSIGNED' || o.status === 'PICKED_UP' || o.status === 'DELIVERING'
  ).length;

  const totalCodCollected = orders
    .filter((o) => o.paymentStatus === 'COLLECTED')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCodToCollect = orders
    .filter((o) => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingRestaurantPayouts = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Math.round(o.subtotal * 0.95), 0);

  const openStoresCount = stores.filter((s) => s.isOpen).length;
  const totalMenuItems = stores.reduce((sum, s) => sum + (s.items?.length || 0), 0);
  const onlineCouriers = couriers.filter((c) => c.freshness !== 'OFFLINE').length;
  const inRadiusCouriers = couriers.filter((c) => c.eligible2KmRadius).length;
  const activePromosCount = promos.filter((p) => p.isActive).length;
  const totalPromoUsage = promos.reduce((sum, p) => sum + (p.usageCount || 0), 0);
  const totalLoyaltyPoints = users.reduce((sum, u) => sum + (u.points || 150), 0);

  // Handlers
  const handleToggleMaintenanceMode = () => {
    const updated = {
      ...settings,
      maintenanceMode: !settings.maintenanceMode,
    };
    adminService.updateSettings(updated);
    onRefreshSettings();
  };

  const handleSetSurge = (mult: number) => {
    const updated = {
      ...settings,
      surgeMultiplier: mult,
    };
    adminService.updateSettings(updated);
    onRefreshSettings();
  };

  const handleSaveBanner = () => {
    const updated = {
      ...settings,
      announcementBanner: bannerText,
      announcementBannerText: bannerText,
    };
    adminService.updateSettings(updated);
    onRefreshSettings();
    setBannerSaved(true);
    setTimeout(() => setBannerSaved(false), 2500);
  };

  const handleSaveTariffs = () => {
    const updated: PlatformOperationalSettings = {
      ...settings,
      baseDeliveryFeeDZD: Number(baseFee) || 150,
      freeDeliveryThresholdDZD: Number(freeThreshold) || 1200,
      maxDeliveryRadiusKm: Number(radiusKm) || 2.0,
      launchRadiusMeters: (Number(radiusKm) || 2.0) * 1000,
    };
    adminService.updateSettings(updated);
    onRefreshSettings();
    setTariffsSaved(true);
    setTimeout(() => setTariffsSaved(false), 2500);
  };

  const handleToggleAllStores = (open: boolean) => {
    stores.forEach((st) => {
      adminService.toggleStoreOpen(st.id, open);
    });
    onRefreshStores();
  };

  const handleSendQuickBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    adminService.broadcastAnnouncement(broadcastTitle, broadcastMsg, broadcastAudience);
    setBroadcastTitle('');
    setBroadcastMsg('');
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setShowBroadcastBox(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. MASTER OPERATIONAL CONTROLS & EMERGENCY BAR */}
      <div className="bg-gradient-to-r from-zinc-900 via-[#181A1D] to-zinc-900 border border-zinc-800/90 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                settings.maintenanceMode
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : settings.surgeMultiplier > 1
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Centre de Commandement & Gestion Intégrale
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    settings.maintenanceMode
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : settings.surgeMultiplier > 1
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {settings.maintenanceMode
                    ? 'MAINTENANCE (COMMANDES BLOQUÉES)'
                    : settings.surgeMultiplier > 1
                    ? `SURGE ACTIF ×${settings.surgeMultiplier}`
                    : 'PLATEFORME 100% OPÉRATIONNELLE'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pilotage centralisé de l'écosystème : Commerces, Menus, Flotte, Livreurs, Tarifs, Utilisateurs & Caisse
              </p>
            </div>
          </div>

          {/* Quick Master Switches */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Surge multiplier switch */}
            <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl p-1 text-xs">
              <span className="text-[11px] text-zinc-400 px-2 font-medium">Affluence / Météo :</span>
              {[1.0, 1.2, 1.5].map((m) => (
                <button
                  key={m}
                  onClick={() => handleSetSurge(m)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    settings.surgeMultiplier === m
                      ? 'bg-[#D9943B] text-[#071E26] shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {m === 1.0 ? 'Normal' : `Rush ×${m}`}
                </button>
              ))}
            </div>

            {/* Emergency Maintenance Toggle */}
            <button
              onClick={handleToggleMaintenanceMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                settings.maintenanceMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60'
              }`}
            >
              <AlertTriangle size={14} />
              <span>
                {settings.maintenanceMode ? 'Rétablir les Commandes' : 'Interrompre (Maintenance)'}
              </span>
            </button>

            {/* Quick broadcast toggle */}
            <button
              onClick={() => setShowBroadcastBox(!showBroadcastBox)}
              className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Send size={14} />
              <span>Alerte Push</span>
            </button>
          </div>
        </div>

        {/* Expandable Quick Broadcast Box */}
        {showBroadcastBox && (
          <form
            onSubmit={handleSendQuickBroadcast}
            className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-4">
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Titre de l'alerte (ex: Pluie abondante sur Ahmed Rachedi)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D9943B]"
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Message diffusé sur les apps (Clients, Livreurs ou Commerçants)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D9943B]"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={broadcastAudience}
                onChange={(e) => setBroadcastAudience(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="ALL">Tous les utilisateurs</option>
                <option value="DRIVERS">Livreurs uniquement</option>
                <option value="MERCHANTS">Commerçants uniquement</option>
              </select>
            </div>
            <div className="sm:col-span-1 flex items-center">
              <button
                type="submit"
                className="w-full bg-[#D9943B] hover:brightness-105 text-[#071E26] py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
              >
                {broadcastSent ? <Check size={14} /> : 'Diffuser'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. THE 6 OPERATIONAL PILLARS OF THE APPLICATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* PILLAR 1: COMMERCES & MENUS */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4.5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-[#D9943B] flex items-center justify-center border border-amber-500/20">
                  <StoreIcon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#D9943B] transition-colors">
                    Commerces & Menus
                  </h3>
                  <p className="text-[11px] text-zinc-400">Catalogue, prix & disponibilités</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {openStoresCount} / {stores.length} ouverts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Total Plats/Articles</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{totalMenuItems} articles</span>
              </div>
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Temps de prépa moyen</span>
                <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">~18 min</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => handleToggleAllStores(true)}
                title="Ouvrir tous les commerces"
                className="text-[10px] bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 px-2 py-1 rounded-lg border border-emerald-800/50 font-bold transition-all cursor-pointer"
              >
                Tout ouvrir
              </button>
              <button
                onClick={() => handleToggleAllStores(false)}
                title="Fermer tous les commerces"
                className="text-[10px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 px-2 py-1 rounded-lg border border-rose-800/50 font-bold transition-all cursor-pointer"
              >
                Tout fermer
              </button>
            </div>
            <button
              onClick={() => onNavigateTab('stores')}
              className="text-xs font-bold text-[#D9943B] hover:text-amber-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Gérer les magasins</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* PILLAR 2: FLOTTE & LIVREURS */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4.5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Bike size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    Flotte & Livreurs
                  </h3>
                  <p className="text-[11px] text-zinc-400">Télémétrie GPS, shifts & caisses</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {onlineCouriers} / {couriers.length} actifs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Éligibles Rayon 2km</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{inRadiusCouriers} livreurs</span>
              </div>
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Missions en cours</span>
                <span className="font-extrabold text-[#D9943B] text-sm mt-0.5 block">{activeDeliveriesCount} en route</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-mono">Rayon Haversine actif</span>
            <button
              onClick={() => onNavigateTab('fleet')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Gérer la flotte</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* PILLAR 3: COMMANDES & DISPATCH */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4.5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Commandes & Flux
                  </h3>
                  <p className="text-[11px] text-zinc-400">Supervision, dispatch & transitions</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {orders.length} commandes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Volume Total Ventes</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{totalSalesVolume.toLocaleString()} DZD</span>
              </div>
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Taux de succès</span>
                <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">99.2%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
            <button
              onClick={onOpenManualOrderModal}
              className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30 font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <PhoneCall size={11} />
              <span>Commande Téléphone</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('dispatch')}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              >
                Radar
              </button>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Toutes</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* PILLAR 4: UTILISATEURS & FIDÉLITÉ */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4.5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                    Utilisateurs & Rôles
                  </h3>
                  <p className="text-[11px] text-zinc-400">Comptes, droits & Club Baraka</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                {users.length} comptes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Points Club Baraka</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{totalLoyaltyPoints.toLocaleString()} pts</span>
              </div>
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Rôles configurés</span>
                <span className="font-extrabold text-purple-400 text-sm mt-0.5 block">Client, Livreur, Pro, Admin</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-mono">RBAC Firebase Auth</span>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Gérer les utilisateurs</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* PILLAR 5: PROMOTIONS & MARKETING */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4.5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center border border-pink-500/20">
                  <Ticket size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">
                    Promotions & Vouchers
                  </h3>
                  <p className="text-[11px] text-zinc-400">Codes promo & campagnes fidélité</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                {activePromosCount} / {promos.length} actifs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Total Rédemptions</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{totalPromoUsage} fois</span>
              </div>
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Offre phare</span>
                <span className="font-extrabold text-pink-400 text-sm mt-0.5 block font-mono">RACHEDI (-150 DZD)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-mono">Vérification checkout</span>
            <button
              onClick={() => onNavigateTab('promos')}
              className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Gérer les promos</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* PILLAR 6: FINANCES & TRÉSORERIE COD */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4.5 flex flex-col justify-between hover:border-zinc-700 transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">
                    Finances & Audit COD
                  </h3>
                  <p className="text-[11px] text-zinc-400">Encaissements espèces & règlements</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                {totalCodCollected.toLocaleString()} DZD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">À percevoir livreurs</span>
                <span className="font-extrabold text-amber-400 text-sm mt-0.5 block">{pendingCodToCollect.toLocaleString()} DZD</span>
              </div>
              <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-500 block">Dû aux Commerçants</span>
                <span className="font-extrabold text-white text-sm mt-0.5 block">{pendingRestaurantPayouts.toLocaleString()} DZD</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-emerald-400 font-medium">0% commission (Lancement)</span>
            <button
              onClick={() => onNavigateTab('settlement')}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Auditer les comptes</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. QUICK PLATFORM OPERATIONAL ADJUSTMENTS (Tariffs & Announcement Banner) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Tariff Adjustments */}
        <div className="lg:col-span-6 bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#D9943B]" />
                <h3 className="text-sm font-bold text-white">
                  Ajustements Immédiats des Tarifs de Livraison
                </h3>
              </div>
              {tariffsSaved && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 size={13} />
                  <span>Appliqué !</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <label className="text-zinc-400 block text-[11px] font-medium mb-1">
                  Frais de base (DZD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={baseFee}
                    onChange={(e) => setBaseFee(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#D9943B]"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-zinc-500 font-bold">DZD</span>
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 block">Facturé au client</span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <label className="text-zinc-400 block text-[11px] font-medium mb-1">
                  Seuil livraison gratuite
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#D9943B]"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-zinc-500 font-bold">DZD</span>
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 block">Dès ce panier</span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <label className="text-zinc-400 block text-[11px] font-medium mb-1">
                  Rayon Ahmed Rachedi
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#D9943B]"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-zinc-500 font-bold">km</span>
                </div>
                <span className="text-[9px] text-zinc-500 mt-1 block">Geofence stricte</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Voir tous les paramètres système...
            </button>
            <button
              onClick={handleSaveTariffs}
              className="bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer"
            >
              Mettre à jour les tarifs
            </button>
          </div>
        </div>

        {/* Right: Broadcast Announcement Banner to Customer App */}
        <div className="lg:col-span-6 bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Bannière d'Annonce Diffusée aux Clients
                </h3>
              </div>
              {bannerSaved && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 size={13} />
                  <span>Diffusée !</span>
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 mb-2">
              Ce texte s'affiche en tête de l'application cliente pour tous les habitants d'Ahmed Rachedi.
            </p>

            <textarea
              rows={2}
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="Ex: Plateforme 100% active sur Ahmed Rachedi : livraisons express en 25 min."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D9943B] resize-none"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Mise à jour instantanée sans redémarrage</span>
            <button
              onClick={handleSaveBanner}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold border border-zinc-700 transition-all cursor-pointer"
            >
              Diffuser la bannière
            </button>
          </div>
        </div>
      </div>

      {/* 4. SHORTCUTS & SYSTEM DIAGNOSTICS */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Outils & Diagnostics de l'Écosystème
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Accès direct aux micro-services, à la base locale et à l'architecture DDD Outbox
            </p>
          </div>

          {/* Quick diagnostic shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenManualOrderModal}
              className="flex items-center gap-1.5 bg-[#D9943B] hover:brightness-105 text-[#071E26] px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <PhoneCall size={14} />
              <span>Commande Téléphonique</span>
            </button>

            <button
              onClick={onOpenDbInspector}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-700 cursor-pointer"
            >
              <Database size={14} className="text-[#D9943B]" />
              <span>Base Locale</span>
            </button>

            {onOpenFirebase && (
              <button
                onClick={onOpenFirebase}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/30 cursor-pointer"
              >
                <Flame size={14} className="text-amber-500" />
                <span>Cloud Firestore</span>
              </button>
            )}

            {onOpenHttpSms && (
              <button
                onClick={onOpenHttpSms}
                className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30 cursor-pointer"
              >
                <MessageSquare size={14} className="text-[#00B578]" />
                <span>Passerelle SMS</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('architecture')}
              className="flex items-center gap-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-800/50 cursor-pointer"
            >
              <Layers size={14} className="text-emerald-400" />
              <span>Architecture 9 Couches</span>
            </button>
          </div>
        </div>

        {/* Live Micro-services Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="font-bold text-white block">API Gateway</span>
              <span className="text-[10px] text-zinc-500">Fastify / Port 3000</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-bold text-white block">PostgreSQL</span>
              <span className="text-[10px] text-zinc-500">Prisma / Outbox</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="font-bold text-white block">Go Dispatch Engine</span>
              <span className="text-[10px] text-zinc-500">Haversine sub-ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-bold text-white block">Firebase Auth</span>
              <span className="text-[10px] text-zinc-500">RBAC & Tokens</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-bold text-white block">SMS Gateway</span>
              <span className="text-[10px] text-zinc-500">HTTP-SMS Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
