import React, { useState, useEffect } from 'react';
import { AvailableDeliveryPoolOrder, Order, CourierTab, OptimizedRouteBundle, BatchDeliveryGroup } from '../types';
import { CourierBottomNavBar } from './CourierBottomNavBar';
import { CourierRouteOptimizerBanner } from './CourierRouteOptimizerBanner';
import { CourierBatchRouteView } from './CourierBatchRouteView';
import { groupOrdersIntoBatches } from '../services/courierBatchDeliveryService';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { courierRatingsDB } from '../db/localDatabase';
import { uploadProofOfDelivery, updateDriverLocation } from '../firebase/firebaseServices';
import { convertToWebP } from '../utils/webpConverter';
import { LazyImage } from './common/LazyImage';
import {
  Bike,
  Power,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Phone,
  ArrowRight,
  ShieldCheck,
  Award,
  Wallet,
  Calendar,
  Sparkles,
  TrendingUp,
  MapPinOff,
  Radio,
  FileCheck,
  HelpCircle,
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Store as StoreIcon,
  Headphones,
  Layers,
  Zap,
  Star,
  Coins,
  Camera,
  UploadCloud,
  Flame,
} from 'lucide-react';

interface Props {
  poolOrders: AvailableDeliveryPoolOrder[];
  activeOrder: Order | null;
  onAcceptPoolOrder: (poolId: string) => void;
  onAdvanceActiveOrderStep: () => void;
  onBackToCustomer: () => void;
}

export const CourierAppView: React.FC<Props> = ({
  poolOrders,
  activeOrder,
  onAcceptPoolOrder,
  onAdvanceActiveOrderStep,
  onBackToCustomer,
}) => {
  const { courierReviews } = useLocalDatabase();
  const courierStats = courierRatingsDB.getCourierStats('courier-walid-43');
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<CourierTab>('missions');
  const [todayEarnings, setTodayEarnings] = useState(5450);
  const [deliveredCount, setDeliveredCount] = useState(14);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'express' | 'short'>('all');
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [proofWebpStats, setProofWebpStats] = useState<{ saved: number; format: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [acceptedBundles, setAcceptedBundles] = useState<OptimizedRouteBundle[]>([]);
  const [bundleAlertToast, setBundleAlertToast] = useState<string | null>(null);

  const handleAcceptBundle = (bundle: OptimizedRouteBundle) => {
    setAcceptedBundles((prev) => [...prev, bundle]);
    setTodayEarnings((prev) => prev + bundle.bundleBonusPayoutDZD);
    setBundleAlertToast(`🎉 Commande groupée ${bundle.orderNumber} (${bundle.storeName}) acceptée (+${bundle.bundleBonusPayoutDZD} DZD Net) !`);
    setTimeout(() => setBundleAlertToast(null), 4500);
  };

  // Real-time Driver GPS Telemetry to Firebase Firestore
  useEffect(() => {
    updateDriverLocation('courier-walid-43', {
      lat: 36.4528,
      lng: 6.2675,
      isOnline,
      activeOrderId: activeOrder?.id,
    });
  }, [isOnline, activeOrder?.id]);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrder) return;

    setIsUploadingPhoto(true);
    try {
      // Automatic browser-side WebP compression
      const webpResult = await convertToWebP(file, { quality: 0.82 });
      setProofWebpStats({ saved: webpResult.savedPercent, format: 'WebP' });

      const url = await uploadProofOfDelivery(activeOrder.id, webpResult.file);
      setProofPhotoUrl(url);
    } catch (err) {
      console.warn('Proof of delivery WebP conversion or upload error:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Messages thread state
  const [courierThreads, setCourierThreads] = useState([
    {
      id: 'thread-customer',
      senderName: 'Amine B. (Client Ahmed Rachedi)',
      role: 'Client',
      orderRef: '#HB-42 • Cité El Bassatine',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuN2_w-EBNtEXJguBVUeD5bfr4lhFYP9v-b1VFSGROFgx6RXqoF5GL9ooQUB3VjQoQ4Vf6aJyJvt4-UM1Zq1temtjmArdLxFCleb3mp8EFzcpHJsuMXGOHdLa6fuol7ilUBCci6mfacs12VyQWsAZNHp0pkoYUGqyZNTkYh30tf011opO1qtvgoPeMkIhM_eGtTVj7ra-ec0R_7Fy9TD3CWRApTQszxxQXb5hf_wx7SD5qVWzZs1OO',
      lastText: 'Sonnez au 2ème étage quand vous arrivez khoya. Merci !',
      time: '12:44',
      unread: true,
      messages: [
        { id: '1', sender: 'customer', text: 'Salam Walid, vous êtes en route ?', time: '12:40' },
        { id: '2', sender: 'me', text: 'Salam khoya ! Oui j\'ai récupéré la commande à Beni Haroun, j\'arrive dans 5 min.', time: '12:42' },
        { id: '3', sender: 'customer', text: 'Sonnez au 2ème étage quand vous arrivez khoya. Merci !', time: '12:44' },
      ],
    },
    {
      id: 'thread-merchant',
      senderName: 'Restaurant Beni Haroun - Ahmed Rachedi',
      role: 'Restaurant',
      orderRef: 'Commande #HB-42 (Retrait)',
      avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80',
      lastText: 'Le plat est emballé dans le sac isotherme au comptoir retrait.',
      time: '12:35',
      unread: false,
      messages: [
        { id: '1', sender: 'merchant', text: 'Le plat est emballé dans le sac isotherme au comptoir retrait.', time: '12:35' },
        { id: '2', sender: 'me', text: 'Parfait chef, je me gare devant.', time: '12:36' },
      ],
    },
    {
      id: 'thread-dispatch',
      senderName: 'Dispatch & Support Ahmed Rachedi',
      role: 'Support',
      orderRef: 'Assistance en temps réel',
      avatar: '',
      lastText: 'Zone forte demande détectée près du Centre Commune.',
      time: '11:50',
      unread: false,
      messages: [
        { id: '1', sender: 'dispatch', text: 'Bonjour Walid, radar actif à 100% sur Ahmed Rachedi. Bon service !', time: '10:00' },
        { id: '2', sender: 'dispatch', text: 'Zone forte demande détectée près du Centre Commune.', time: '11:50' },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const currentThread = courierThreads.find((t) => t.id === activeThreadId);

  const handleSendReply = () => {
    if (!replyInput.trim() || !activeThreadId) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: replyInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCourierThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastText: newMsg.text,
              time: newMsg.time,
              unread: false,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
    setReplyInput('');
  };

  const handleQuickSend = (text: string) => {
    if (!activeThreadId) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCourierThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastText: newMsg.text,
              time: newMsg.time,
              unread: false,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
  };

  const availableMissions = poolOrders.filter((p) => p.status === 'available');

  const filteredMissions = availableMissions.filter((mission) => {
    if (selectedFilter === 'express') return mission.urgencyTag.includes('EXPRESS') || mission.urgencyTag.includes('URGENCE');
    if (selectedFilter === 'short') return mission.customerDistance.includes('km') ? parseFloat(mission.customerDistance) <= 1.2 : true;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#111214] text-white pb-24">
      {/* Courier Top Status Bar */}
      <header className="bg-[#191A1C] border-b border-white/10 px-3.5 py-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center font-extrabold text-sm border-2 border-white shadow-sm">
                WM
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#191A1C] ${
                  isOnline ? 'bg-[#00B578]' : 'bg-zinc-500'
                }`}
              ></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm text-white">Walid M.</h1>
                <span className="bg-[#D9943B] text-[#071E26] text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                  Livreur Pro Ahmed Rachedi
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Zone active : Commune d'Ahmed Rachedi</p>
            </div>
          </div>

          {/* Online / Offline Switch */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            title={isOnline ? 'Statut : En Ligne' : 'Statut : En Pause'}
            aria-label={isOnline ? 'Statut : En Ligne' : 'Statut : En Pause'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isOnline ? 'bg-[#00B578] text-white' : 'bg-zinc-700 text-zinc-300'
            }`}
          >
            <Power size={13} strokeWidth={2} />
            <span className="hidden min-[360px]:inline">{isOnline ? 'En Ligne' : 'Pause'}</span>
          </button>
        </div>

        {/* Courier Fast Metric Ribbon */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center text-xs">
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Gains Aujourd'hui</span>
            <span className="font-extrabold text-[#D9943B] text-sm">{todayEarnings} DZD</span>
          </div>
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Livraisons Rachedi</span>
            <span className="font-bold text-white text-sm">{deliveredCount} courses</span>
          </div>
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Commission</span>
            <span className="font-bold text-[#00B578] text-sm">0 DZD (100% Net)</span>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="p-3.5 space-y-3 flex-1">
        {/* TAB 1: MISSIONS RADAR */}
        {activeTab === 'missions' && (
          <div className="space-y-3">
            {/* Mission Radar Status */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-[#00B578] flex items-center justify-center">
                  <Radio size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Offres de livraison / File d'attente</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                      Dispatch Go
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Offres personnalisées par le moteur d'assignation autoritaire</p>
                </div>
              </div>
              <span className="bg-[#00B578]/20 text-[#00B578] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#00B578]/40">
                {availableMissions.length} Offres actives
              </span>
            </div>

            {/* Batch Delivery Engine Corridor Banner */}
            <div className="bg-gradient-to-r from-[#0A2B35] via-[#114250] to-[#071E26] border border-[#D9943B]/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-black shrink-0 shadow-sm">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-white">Moteur Tournées Groupées</span>
                    <span className="text-[9px] bg-emerald-500/25 text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                      Algorithme Rachedi Actif
                    </span>
                  </div>
                  <p className="text-[10px] text-[#EADBCE]">
                    2 corridors groupés détectés (Cité El Bassatine & Cité En-Nasr) • Gain max +1,530 DZD
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('batch')}
                className="px-2.5 py-1.5 rounded-xl bg-[#D9943B] hover:bg-[#E5A34C] active:scale-95 text-[#071E26] text-xs font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Voir Tournée</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Courier Route & Proximity Bundle Optimizer Banner */}
            <CourierRouteOptimizerBanner
              activeOrder={activeOrder}
              courierDestination={[36.4561, 6.2715]}
              courierCurrentPosition={[36.4528, 6.2675]}
              onAcceptBundle={handleAcceptBundle}
            />

            {/* Quick Filters - Unified Icons for Narrow Screens */}
            <div className="flex gap-1.5 sm:gap-2 text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                title="Toutes les missions"
                aria-label="Toutes les missions"
                className={`px-2.5 sm:px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-[#D9943B] text-[#071E26] font-extrabold'
                    : 'bg-white/10 text-zinc-300 hover:bg-white/15'
                }`}
              >
                <Layers size={13} strokeWidth={2} />
                <span className="hidden min-[360px]:inline">Toutes</span>
                <span>({availableMissions.length})</span>
              </button>
              <button
                onClick={() => setSelectedFilter('express')}
                title="Missions express et urgentes"
                aria-label="Missions express et urgentes"
                className={`px-2.5 sm:px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === 'express'
                    ? 'bg-[#D9943B] text-[#071E26] font-extrabold'
                    : 'bg-white/10 text-zinc-300 hover:bg-white/15'
                }`}
              >
                <Zap size={13} strokeWidth={2} />
                <span className="hidden min-[360px]:inline">Express</span>
              </button>
              <button
                onClick={() => setSelectedFilter('short')}
                title="Missions courtes distances"
                aria-label="Missions courtes distances"
                className={`px-2.5 sm:px-3 py-1.5 rounded-full font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedFilter === 'short'
                    ? 'bg-[#D9943B] text-[#071E26] font-extrabold'
                    : 'bg-white/10 text-zinc-300 hover:bg-white/15'
                }`}
              >
                <MapPin size={13} strokeWidth={2} />
                <span className="hidden min-[360px]:inline">&lt;1.2 km</span>
              </button>
            </div>

            {/* Missions List */}
            {filteredMissions.map((mission) => {
              const totalPayout = mission.payoutFeeDZD + mission.rushBonusDZD;

              return (
                <div
                  key={mission.id}
                  className="bg-[#1C1D21] rounded-2xl p-4 border border-white/10 shadow-lg space-y-3 hover:border-amber-400/40 transition-all"
                >
                  {/* Card Header & Payout */}
                  <div className="flex items-center justify-between">
                    <span className="bg-[#D9943B]/20 text-[#E5A34C] border border-[#D9943B]/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      <span className="sm:hidden">
                        {mission.urgencyTag.toUpperCase().includes('EXPRESS') ? 'Express' : mission.urgencyTag}
                      </span>
                      <span className="hidden sm:inline">
                        {mission.urgencyTag}
                      </span>
                    </span>

                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-zinc-400 font-semibold">
                        <span className="sm:hidden">Net :</span>
                        <span className="hidden sm:inline">Net Coursier :</span>
                      </span>
                      <span className="text-base font-extrabold text-[#00B578]">{totalPayout} DZD</span>
                      {mission.rushBonusDZD > 0 && (
                        <span className="text-[10px] text-[#E5A34C] bg-[#D9943B]/20 px-1 rounded font-bold">
                          <span className="sm:hidden">+{mission.rushBonusDZD}</span>
                          <span className="hidden sm:inline">+{mission.rushBonusDZD} Bonus</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route Steps */}
                  <div className="space-y-2 text-xs">
                    {/* Store Pickup */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white/10 text-[#D9943B] flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        1
                      </div>
                      <div>
                        <div className="font-bold text-white">{mission.storeName}</div>
                        <span className="text-[11px] text-zinc-400">
                          {mission.storeAddress} ({mission.storeDistance})
                        </span>
                      </div>
                    </div>

                    {/* Customer Drop-off */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#00B578] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        2
                      </div>
                      <div>
                        <div className="font-bold text-white">{mission.customerDestination}</div>
                        <p className="text-[11px] text-[#D9943B] font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="shrink-0 text-[#D9943B]" />
                          Repère : {mission.customerLandmark}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details strip */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                    <span>{mission.itemsSummary}</span>
                    <span className="font-semibold text-zinc-200">Délai : {mission.deliveryDeadline}</span>
                  </div>

                  {/* Accept Button */}
                  <button
                    onClick={() => {
                      onAcceptPoolOrder(mission.id);
                      setActiveTab('active');
                    }}
                    className="w-full h-11 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] rounded-xl flex items-center justify-center gap-2 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>Prendre la Course ({totalPayout} DZD)</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: BATCH DELIVERY & CONSOLIDATED MULTI-STOP ROUTE */}
        {activeTab === 'batch' && (
          <CourierBatchRouteView
            onClose={() => setActiveTab('missions')}
            onEarningsUpdated={(amt) => setTodayEarnings((prev) => prev + amt)}
            onBatchCompleted={(batch) => {
              setDeliveredCount((prev) => prev + batch.orders.length);
            }}
          />
        )}

        {/* TAB 2: ACTIVE MISSION & GPS */}
        {activeTab === 'active' && (
          <div className="space-y-3">
            {activeOrder ? (
              <>
                {/* Proximity Bundle Optimizer for the active delivery route */}
                <CourierRouteOptimizerBanner
                  activeOrder={activeOrder}
                  courierDestination={[36.4561, 6.2715]}
                  courierCurrentPosition={[36.4528, 6.2675]}
                  onAcceptBundle={handleAcceptBundle}
                />

                {/* Accepted Multi-Delivery Bundles Card (if any accepted) */}
                {acceptedBundles.length > 0 && (
                  <div className="bg-gradient-to-br from-[#1E232A] to-[#16191D] border border-amber-400/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-400 text-zinc-950">
                          <Layers size={16} />
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                            Tournée Groupée Optimisée
                          </span>
                          <h4 className="font-bold text-xs text-white">
                            {1 + acceptedBundles.length} livraisons sur le même corridor Ahmed Rachedi
                          </h4>
                        </div>
                      </div>
                      <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        +{acceptedBundles.reduce((sum, b) => sum + b.bundleBonusPayoutDZD, 0)} DZD Net
                      </span>
                    </div>

                    {/* Step-by-step stops */}
                    <div className="space-y-2 text-xs">
                      {/* Stop 1: Current Order */}
                      <div className="bg-black/30 p-2.5 rounded-xl flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                            1
                          </span>
                          <div>
                            <span className="font-bold text-white block">{activeOrder.orderNumber} • {activeOrder.storeName}</span>
                            <span className="text-[10px] text-zinc-400">Dépose : {activeOrder.deliveryAddress.building} ({activeOrder.deliveryAddress.commune})</span>
                          </div>
                        </div>
                        <span className="font-extrabold text-[#D9943B] text-xs">{activeOrder.total} DZD</span>
                      </div>

                      {/* Grouped stops */}
                      {acceptedBundles.map((bundle, bIdx) => (
                        <div key={bundle.id} className="bg-black/30 p-2.5 rounded-xl flex items-center justify-between border border-[#D9943B]/20">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center text-[10px] font-black">
                              {bIdx + 2}
                            </span>
                            <div>
                              <span className="font-bold text-[#E5A34C] block">{bundle.orderNumber} • {bundle.storeName}</span>
                              <span className="text-[10px] text-zinc-300">Dépose : {bundle.customerDestination} (à {bundle.customerDistanceMeters}m de l'arrêt 1)</span>
                            </div>
                          </div>
                          <span className="font-extrabold text-emerald-400 text-xs">+{bundle.bundleBonusPayoutDZD} DZD</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('batch')}
                      className="w-full mt-2 py-2.5 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Layers size={14} />
                      <span>Consulter la Tournée Multi-Arrêts Consolidée</span>
                    </button>
                  </div>
                )}

                {/* Live Navigation Guidance Card */}
                <div className="bg-[#1C1D21] border border-white/10 text-white rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#00B578] text-white flex items-center justify-center shadow-md">
                        <Navigation size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wide">
                          Guidage GPS Ahmed Rachedi en direct
                        </span>
                        <h3 className="font-extrabold text-sm text-[#D9943B]">
                          Dans 120m, monter vers Cité El Bassatine
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-300 bg-white/10 px-2 py-0.5 rounded">
                      36 km/h
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-zinc-300">
                    <span>Distance restante : 550m</span>
                    <span className="text-emerald-400 font-bold">Arrivée estimée : ~6 min</span>
                  </div>
                </div>

                {/* Customer Details & COD Payment Card */}
                <div className="bg-[#1C1D21] rounded-2xl p-4 border border-white/10 shadow-lg space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white">Livraison en cours</span>
                    <span className="bg-[#D9943B] text-[#071E26] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {activeOrder.orderNumber}
                    </span>
                  </div>

                  {/* Cash on Delivery Callout */}
                  <div className="bg-[#D9943B]/15 border border-[#D9943B]/40 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={20} className="text-[#D9943B]" />
                      <div>
                        <span className="text-xs font-bold text-white">À Encaisser en Espèces à la remise</span>
                        <p className="text-[11px] text-zinc-300">Montant exact à percevoir auprès du client</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-[#D9943B]">{activeOrder.total} DZD</span>
                      <span className="text-[10px] text-zinc-400 block">Sans frais supplémentaires</span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {activeOrder.deliveryAddress.recipientName}
                      </span>
                      <a
                        href={`tel:${activeOrder.deliveryAddress.phone}`}
                        className="flex items-center gap-1 text-xs font-bold text-[#00B578] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30"
                      >
                        <Phone size={12} />
                        <span>Appeler le client</span>
                      </a>
                    </div>

                    <p className="text-zinc-300">
                      {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.building} (Étage{' '}
                      {activeOrder.deliveryAddress.floor})
                    </p>

                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 mt-1">
                      <span className="text-[11px] text-[#D9943B] font-extrabold flex items-center gap-1">
                        <MapPin size={13} className="text-[#D9943B] shrink-0" />
                        <span>Repère Ahmed Rachedi : {activeOrder.deliveryAddress.landmark}</span>
                      </span>
                      <span className="text-[10px] text-zinc-300 block mt-0.5">
                        Consigne : {activeOrder.deliveryNotes || 'Sonner à l\'interphone'}
                      </span>
                    </div>
                  </div>

                  {/* Milestone Button / Completion State */}
                  {activeOrder.status === 'DELIVERED' ? (
                    <div className="space-y-2 pt-1">
                      <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[#00B578] font-bold text-sm">
                          <CheckCircle2 size={18} />
                          <span>Course terminée avec succès</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 mt-1">
                          Montant de {activeOrder.total} DZD perçu en espèces
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('missions')}
                        className="w-full h-11 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] rounded-xl flex items-center justify-center gap-2 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Layers size={15} />
                        <span>Prendre une nouvelle mission sur le radar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Photo Proof of Delivery when delivering */}
                      {activeOrder.status === 'DELIVERING' && (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-300 text-xs flex items-center gap-1.5">
                              <Camera size={14} className="text-[#D9943B]" />
                              <span>Photo de Preuve de Livraison</span>
                            </span>
                            {proofPhotoUrl ? (
                              <div className="flex items-center gap-1.5">
                                {proofWebpStats && (
                                  <span className="text-[10px] bg-sky-500/20 text-sky-400 font-bold px-1.5 py-0.5 rounded border border-sky-500/30">
                                    WebP (-{proofWebpStats.saved}%)
                                  </span>
                                )}
                                <span className="text-[10px] bg-emerald-500/20 text-[#00B578] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                                  ✓ Photo Enregistrée
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-400">Optionnel</span>
                            )}
                          </div>

                          {proofPhotoUrl ? (
                            <div className="relative rounded-lg overflow-hidden border border-white/10 h-24 bg-black/40 flex items-center justify-center">
                              <LazyImage
                                src={proofPhotoUrl}
                                alt="Preuve de livraison"
                                placeholderType="generic"
                                priority={true}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 right-2 text-[9px] bg-black/70 text-white px-1.5 rounded font-mono z-10">
                                Photo certifiée ✓
                              </span>
                            </div>
                          ) : (
                            <label className="border border-dashed border-white/20 hover:border-amber-400/50 rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                              <UploadCloud size={16} className="text-zinc-400" />
                              <span className="text-xs text-zinc-300 font-medium">
                                {isUploadingPhoto ? 'Enregistrement photo...' : 'Prendre ou joindre photo'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoCapture}
                                className="hidden"
                                disabled={isUploadingPhoto}
                              />
                            </label>
                          )}
                        </div>
                      )}

                      <button
                        onClick={onAdvanceActiveOrderStep}
                        className="w-full h-12 bg-[#00B578] hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-md transition-all"
                      >
                        <CheckCircle2 size={18} />
                        <span>
                          {activeOrder.status === 'DELIVERING'
                            ? 'Confirmer la Remise & Encaissement Espèces'
                            : 'Valider Étape Suivante'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#1C1D21] rounded-2xl p-6 border border-white/10 text-center space-y-3">
                <MapPinOff size={36} className="mx-auto text-zinc-500" />
                <h3 className="font-bold text-sm text-white">Aucune course active pour le moment</h3>
                <p className="text-xs text-zinc-400">
                  Consultez les missions disponibles sur le radar d'Ahmed Rachedi pour accepter une livraison.
                </p>
                <button
                  onClick={() => setActiveTab('missions')}
                  className="bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] text-xs font-extrabold px-4 py-2 rounded-xl cursor-pointer"
                >
                  <span className="sm:hidden">Missions</span>
                  <span className="hidden sm:inline">Voir les Missions Ahmed Rachedi</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MESSAGES & CHAT DIRECT COURSIER MILA */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            {currentThread ? (
              /* Active Chat Thread */
              <div className="bg-[#1C1D21] rounded-2xl border border-white/10 overflow-hidden flex flex-col min-h-[460px]">
                {/* Chat Top Bar */}
                <div className="bg-[#24262B] p-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setActiveThreadId(null)}
                      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                      aria-label="Retour"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-white">{currentThread.senderName}</h4>
                        <span className="text-[9px] bg-[#D9943B] text-[#071E26] font-extrabold px-1.5 py-0.2 rounded">
                          {currentThread.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{currentThread.orderRef}</span>
                    </div>
                  </div>

                  <a
                    href="tel:+213550123456"
                    className="w-8 h-8 rounded-full bg-[#00B578] text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                    aria-label="Appeler"
                  >
                    <Phone size={15} />
                  </a>
                </div>

                {/* Messages Bubbles */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[290px] no-scrollbar">
                  {currentThread.messages.map((m) => {
                    const isMe = m.sender === 'me';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                            isMe
                              ? 'bg-[#D9943B] text-[#071E26] font-medium rounded-br-xs'
                              : 'bg-white/10 text-white rounded-bl-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-0.5 px-1">{m.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Presets for Courrier */}
                <div className="px-3 py-1.5 bg-[#24262B]/50 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => handleQuickSend('🛵 J\'arrive dans 3 minutes !')}
                    className="text-[10px] bg-white/10 hover:bg-white/15 text-zinc-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    🛵 Dans 3 mins
                  </button>
                  <button
                    onClick={() => handleQuickSend('📍 Je suis devant l\'immeuble.')}
                    className="text-[10px] bg-white/10 hover:bg-white/15 text-zinc-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    📍 En bas de l'immeuble
                  </button>
                  <button
                    onClick={() => handleQuickSend('💰 Merci de préparer l\'appoint en espèces.')}
                    className="text-[10px] bg-white/10 hover:bg-white/15 text-zinc-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    💰 Appoint espèces à prévoir
                  </button>
                </div>

                {/* Courier Input */}
                <div className="p-2.5 bg-[#24262B] border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Votre message..."
                    className="flex-1 bg-white/10 border border-white/10 rounded-full px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D9943B]"
                  />
                  <button
                    onClick={handleSendReply}
                    className="w-8 h-8 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center font-bold shadow-xs active:scale-90 transition-transform cursor-pointer"
                    aria-label="Envoyer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Threads List */
              <div className="space-y-3">
                <div className="bg-[#1C1D21] border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">Messagerie Coursier Ahmed Rachedi</h3>
                    <p className="text-[11px] text-zinc-400">Communication directe avec vos clients & restaurants</p>
                  </div>
                  <span className="bg-[#00B578]/20 text-[#00B578] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-[#00B578]/40">
                    En ligne
                  </span>
                </div>

                <div className="space-y-2">
                  {courierThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className="bg-[#1C1D21] hover:bg-[#24262B] border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="relative shrink-0">
                        {thread.avatar ? (
                          <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20">
                            <LazyImage
                              src={thread.avatar}
                              alt={thread.senderName}
                              placeholderType="avatar"
                              targetWidth={90}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#D9943B] text-[#071E26] flex items-center justify-center font-extrabold text-xs">
                            <Headphones size={20} />
                          </div>
                        )}
                        {thread.unread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full btn-gradient-tertiary border-2 border-[#1C1D21]"></span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-white truncate">
                            {thread.senderName}
                          </h4>
                          <span className="text-[10px] text-zinc-400">{thread.time}</span>
                        </div>
                        <span className="text-[10px] text-[#D9943B] font-medium block">
                          {thread.orderRef}
                        </span>
                        <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                          {thread.lastText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EARNINGS & WALLET (Gains DZD & Zéro Commission) */}
        {activeTab === 'earnings' && (
          <div className="space-y-3">
            {/* Total Balance Card */}
            <div className="bg-gradient-to-br from-[#1F2125] to-[#151619] border border-white/15 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-semibold">Portefeuille Coursier Ahmed Rachedi</span>
                <span className="bg-emerald-500/20 text-[#00B578] border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  100% Vos Gains
                </span>
              </div>

              <div>
                <span className="text-3xl font-extrabold text-[#D9943B]">{todayEarnings} DZD</span>
                <p className="text-xs text-zinc-400 mt-0.5">Solde encaissé en espèces & disponible</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-zinc-400 text-[10px] block">Semaine en cours</span>
                  <span className="font-bold text-white text-sm">32,400 DZD</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-zinc-400 text-[10px] block">Primes Rush Beni Haroun</span>
                  <span className="font-bold text-[#00B578] text-sm">+1,800 DZD</span>
                </div>
              </div>
            </div>

            {/* Zero Commission Professional Guarantee */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-start gap-3">
              <Sparkles size={20} className="text-[#00B578] shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-white">Application 100% Gratuite pour les Livreurs</h4>
                <p className="text-zinc-300 mt-0.5 leading-relaxed">
                  La plateforme ne prélève aucune commission sur vos courses à Ahmed Rachedi. Tout ce que vous livrez vous revient intégralement.
                </p>
              </div>
            </div>

            {/* Recent Deliveries List */}
            <div className="bg-[#1C1D21] rounded-2xl p-4 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Historique récent des courses à Ahmed Rachedi</span>
                <span className="text-zinc-400 text-[10px]">Aujourd'hui</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-white">Restaurant Beni Haroun ➔ Cité El Bassatine</div>
                    <span className="text-[10px] text-zinc-400">12:15 • 1.1 km • Espèces perçues à la remise</span>
                  </div>
                  <span className="font-extrabold text-[#00B578]">+420 DZD</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-white">Marché Ahmed Rachedi ➔ Cité En-Nasr</div>
                    <span className="text-[10px] text-zinc-400">11:30 • 0.9 km • Sans retard</span>
                  </div>
                  <span className="font-extrabold text-[#00B578]">+320 DZD</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-white">Pharmacie Centrale ➔ Remparts Aïn El Bled</div>
                    <span className="text-[10px] text-zinc-400">10:45 • 1.4 km • Course Santé</span>
                  </div>
                  <span className="font-extrabold text-[#00B578]">+500 DZD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COURIER PROFESSIONAL PROFILE (Wilaya 43) */}
        {activeTab === 'profile' && (
          <div className="space-y-3">
            {/* Courier ID Card */}
            <div className="bg-[#1C1D21] border border-white/10 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white">
                  WM
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-white">Walid Mansouri</h3>
                    <ShieldCheck size={16} className="text-[#00B578]" />
                  </div>
                  <p className="text-xs text-zinc-400">Rider Professionnel Agréé • Ahmed Rachedi</p>
                  <span className="inline-block mt-1 text-[10px] bg-emerald-500/20 text-[#00B578] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    Statut : Actif & Vérifié Ahmed Rachedi
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-zinc-400 text-[10px] block">Véhicule</span>
                  <span className="font-bold text-white">Scooter 125cc (Ahmed Rachedi)</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-zinc-400 text-[10px] block">Note globale</span>
                  <span className="font-bold text-[#D9943B] flex items-center gap-1">
                    <Star size={13} className="fill-current text-[#D9943B]" />
                    <span>{courierStats.averageRating} / 5 ({courierStats.reviewCount} avis)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Live Database Ratings Breakdown & Tips */}
            <div className="bg-[#1C1D21] border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Award size={16} className="text-[#D9943B]" />
                  <span>Détail des Évaluations Vérifiées (Ahmed Rachedi)</span>
                </h4>
                {courierStats.totalTipsDZD > 0 && (
                  <span className="text-[10px] bg-emerald-500/20 text-[#00B578] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    Pourboires cumulés : +{courierStats.totalTipsDZD} DZD
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-zinc-300">Ponctualité</span>
                  <span className="font-bold text-[#E5A34C]">{courierStats.criteriaAverages.punctuality}★</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-zinc-300">Politesse & Accueil</span>
                  <span className="font-bold text-[#E5A34C]">{courierStats.criteriaAverages.politeness}★</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-zinc-300">Code de la route</span>
                  <span className="font-bold text-[#E5A34C]">{courierStats.criteriaAverages.routeRespect}★</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-zinc-300">Soin du colis thermique</span>
                  <span className="font-bold text-[#E5A34C]">{courierStats.criteriaAverages.foodHandling}★</span>
                </div>
              </div>

              {/* Compliments tags from database */}
              {courierStats.topCompliments && courierStats.topCompliments.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                    Compliments clients enregistrés
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {courierStats.topCompliments.map(({ tag, count }) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-semibold"
                      >
                        ✓ {tag} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Professional Certifications & Equipment */}
            <div className="bg-[#1C1D21] border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                <FileCheck size={16} className="text-[#D9943B]" />
                <span>Normes & Équipements Professionnels</span>
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                  <span className="text-zinc-300">Caisson isotherme scellé</span>
                  <span className="text-[#00B578] font-bold">Conforme</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                  <span className="text-zinc-300">Permis & Assurance Conforme (Ahmed Rachedi)</span>
                  <span className="text-[#00B578] font-bold">À jour</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                  <span className="text-zinc-300">Assistance Téléphonique 24h</span>
                  <span className="text-zinc-400 font-mono">+213 31 47 00 00</span>
                </div>
              </div>
            </div>

            {/* Switch Back to Customer View */}
            <button
              onClick={onBackToCustomer}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Retour à l'Espace Client
            </button>
          </div>
        )}
      </main>

      {/* Courier Bundle Toast Alert */}
      {bundleAlertToast && (
        <div className="fixed top-14 inset-x-4 max-w-[400px] mx-auto z-50 bg-[#D9943B] text-[#071E26] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-[#EADBCE]/30 text-xs font-black animate-in fade-in slide-in-from-top duration-200">
          <Sparkles size={16} className="text-[#071E26] shrink-0" />
          <span>{bundleAlertToast}</span>
        </div>
      )}

      {/* DEDICATED COURIER BOTTOM NAVIGATION BAR */}
      <CourierBottomNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        availableCount={availableMissions.length}
        hasActiveOrder={Boolean(activeOrder)}
        batchCount={2}
        hasActiveBatch={acceptedBundles.length > 0 || activeTab === 'batch'}
        unreadCount={courierThreads.filter((t) => t.unread).length}
      />
    </div>
  );
};
