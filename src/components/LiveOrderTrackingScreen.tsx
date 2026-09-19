import React, { useState, useEffect } from 'react';
import { Order, NetworkQuality, OrderStatus } from '../types';
import { NetworkStatusBanner } from './NetworkStatusBanner';
import { RealLeafletMap } from './RealLeafletMap';
import { LazyImage } from './common/LazyImage';
import { useAuth } from '../firebase/AuthContext';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  HelpCircle,
  Navigation,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Bike,
  Sparkles,
  Radio,
  History,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Star,
  Bell,
  BellRing,
  Banknote,
  Play,
  Pause,
  FastForward,
} from 'lucide-react';

interface Props {
  order: Order;
  onBack: () => void;
  onOpenChat: () => void;
  onSimulateStatusAdvance?: () => void;
  onJumpToStatus?: (status: OrderStatus) => void;
  networkQuality?: NetworkQuality;
  onOpenRatingModal?: (initialRating?: number) => void;
}

export const LiveOrderTrackingScreen: React.FC<Props> = ({
  order,
  onBack,
  onOpenChat,
  onSimulateStatusAdvance,
  onJumpToStatus,
  networkQuality = 'ONLINE',
  onOpenRatingModal,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [showDispatchControls, setShowDispatchControls] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [lastGpsUpdateSec, setLastGpsUpdateSec] = useState(1);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const {
    notificationPermission,
    requestNotificationPermission,
    sendNativeNotification,
  } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setLastGpsUpdateSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGpsFreshness = () => {
    if (networkQuality === 'OFFLINE') {
      return { label: 'Position hors-ligne (mise en cache)', color: 'bg-zinc-500', text: 'text-zinc-700' };
    }
    if (networkQuality === 'DEGRADED' || lastGpsUpdateSec > 15) {
      return { label: 'Mise à jour en cours...', color: 'bg-amber-400', text: 'text-amber-700' };
    }
    if (lastGpsUpdateSec <= 15) {
      return { label: 'Signal GPS en direct', color: 'bg-emerald-500', text: 'text-emerald-700' };
    }
    return { label: 'Signal GPS indisponible', color: 'bg-rose-500', text: 'text-rose-700' };
  };

  const freshness = getGpsFreshness();
  const etaRange = order.estimatedDeliveryTimeRange || '6–9 mins';
  const cleanCourierName = order.courierName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Walid M.';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F4EC] pb-20 relative">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-[#EADBCE] shadow-xs">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-8 h-8 rounded-full bg-[#F8F4EC] hover:bg-[#EADBCE] flex items-center justify-center text-[#0A2B35] active:scale-95 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-[#0A2B35]" />
        </button>
        <div className="text-center">
          <h1 className="font-bold text-[14px] text-[#0A2B35]">Suivi en Direct</h1>
          <span className="text-[10px] text-[#648692] font-medium">{order.orderNumber} • Ahmed Rachedi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            aria-label={isMapExpanded ? 'Réduire la carte' : 'Agrandir la carte'}
            className="w-8 h-8 rounded-full bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] border border-[#EADBCE] flex items-center justify-center active:scale-95 transition-colors cursor-pointer"
            title={isMapExpanded ? 'Réduire la carte' : 'Agrandir la carte'}
          >
            {isMapExpanded ? <Minimize2 size={16} className="text-[#0A2B35]" /> : <Maximize2 size={16} className="text-[#0A2B35]" />}
          </button>
          <button
            onClick={() => setShowAuditHistory(true)}
            aria-label="Historique"
            className="w-8 h-8 rounded-full bg-[#F8F4EC] hover:bg-[#EADBCE] flex items-center justify-center text-[#0A2B35] border border-[#EADBCE] active:scale-95 transition-colors cursor-pointer"
            title="Historique des statuts"
          >
            <History size={16} className="text-[#0A2B35]" />
          </button>
        </div>
      </header>

      {/* Low-Bandwidth / Degraded Network Alert Banner */}
      <NetworkStatusBanner networkQuality={networkQuality} orderNumber={order.orderNumber} />

      {/* Real Interactive Map with Actual Roads and Minimal Non-Obstructive Markers */}
      <RealLeafletMap
        orderStatus={order.status}
        courierName={cleanCourierName}
        storeName={order.storeName}
        destinationName={`${order.deliveryAddress.commune} (${order.deliveryAddress.building})`}
        isExpanded={isMapExpanded}
        onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
        etaText={etaRange}
        onSimulateStatusAdvance={onSimulateStatusAdvance}
        onStatusChange={(newStatus) => {
          if (onJumpToStatus) {
            onJumpToStatus(newStatus);
          } else if (onSimulateStatusAdvance) {
            onSimulateStatusAdvance();
          }
        }}
      />

      <div className="p-3.5 space-y-3 relative z-20">
        {/* Milestone Timeline Bar */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs">
          {/* Progress track */}
          <div className="flex justify-between items-center relative">
            <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-neutral-200 -z-0">
              <div
                className="h-full bg-[#D9943B] transition-all duration-500 ease-out"
                style={{
                  width: `${
                    order.status === 'DELIVERED'
                      ? 100
                      : (() => {
                          const currentStepIdx = order.statusTimeline.findIndex((s) => s.current);
                          const total = order.statusTimeline.length;
                          if (currentStepIdx >= 0) {
                            return Math.min(95, Math.max(12, Math.round(((currentStepIdx + 0.5) / total) * 100)));
                          }
                          const completedCount = order.statusTimeline.filter((s) => s.completed).length;
                          return Math.round((completedCount / total) * 100);
                        })()
                  }%`,
                }}
              ></div>
            </div>

            {order.statusTimeline.map((step, idx) => {
              const isDelivered = order.status === 'DELIVERED';
              const isCurrentActive = step.current && !isDelivered;
              const isStepCompleted = isDelivered || (step.completed && !isCurrentActive);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onJumpToStatus?.(step.status)}
                  disabled={!onJumpToStatus}
                  title={onJumpToStatus ? `Cliquer pour passer à : ${step.label}` : step.label}
                  className="flex flex-col items-center z-10 flex-1 group focus:outline-hidden cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                      isCurrentActive
                        ? 'bg-[#D9943B] text-[#071E26] border-white ring-3 ring-[#D9943B]/80 animate-pulse font-black shadow-md scale-110'
                        : isStepCompleted
                        ? 'bg-[#0A2B35] text-white border-white shadow-xs'
                        : 'bg-white text-zinc-400 border-neutral-200 group-hover:border-zinc-400'
                    }`}
                  >
                    {isStepCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1 text-center leading-tight transition-colors ${
                      isCurrentActive
                        ? 'font-black text-[#0A2B35]'
                        : isStepCompleted
                        ? 'font-semibold text-zinc-700'
                        : 'text-zinc-400 font-normal'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`text-[9px] mt-0.5 leading-none ${
                      isCurrentActive ? 'text-[#B8731E] font-bold' : 'text-zinc-400'
                    }`}
                  >
                    {isCurrentActive && step.timestamp === 'En attente' ? 'En cours...' : step.timestamp}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Authentic Real-Time Process Progress Bar */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  order.status === 'DELIVERED'
                    ? 'bg-emerald-500'
                    : order.status === 'DELIVERING'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-zinc-800 block truncate">
                  {order.status === 'DELIVERED'
                    ? 'Commande livrée & réglée à destination'
                    : order.status === 'CUSTOMER_CONFIRMED'
                    ? 'Réception confirmée par vos soins'
                    : order.status === 'ARRIVED'
                    ? 'Livreur arrivé à votre porte (Rayon 20m validé)'
                    : order.status === 'DELIVERING'
                    ? 'Livreur en route • Suivi GPS en direct'
                    : order.status === 'PICKED_UP'
                    ? 'Sac récupéré par le coursier • En transit'
                    : order.status === 'PREPARING'
                    ? 'Préparation en cuisine chez Beni Haroun'
                    : 'Commande confirmée par le restaurant'}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  {order.status === 'DELIVERING'
                    ? 'Position rafraîchie en continu sur les routes d\'Ahmed Rachedi'
                    : 'Processus opérationnel certifié en temps réel'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAuditHistory(true)}
              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-zinc-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
              title="Voir l'historique complet des statuts"
            >
              <History size={12} className="text-[#0A2B35]" />
              <span>Audit</span>
            </button>
          </div>
        </div>

        {/* ARRIVED / CUSTOMER CONFIRMATION ALERT CALLOUT */}
        {(order.status === 'ARRIVED' || order.status === 'CUSTOMER_CONFIRMED') && (
          <div className="rounded-2xl border border-[#D9943B]/40 card-gradient-warm p-4 shadow-md transition-all animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl btn-gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                <MapPin size={22} className="animate-bounce text-[#071E26]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#0A2B35] uppercase tracking-wide">
                    {order.status === 'CUSTOMER_CONFIRMED'
                      ? 'Réception Confirmée par vos soins'
                      : 'Livreur Arrivé sur Place (Rayon 20m validé)'}
                  </span>
                  <span className="badge-gradient-tertiary text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                    {order.status === 'CUSTOMER_CONFIRMED' ? 'Validé ✓' : 'À votre porte'}
                  </span>
                </div>
                <p className="text-xs text-[#0A2B35] mt-1 leading-relaxed">
                  {order.status === 'CUSTOMER_CONFIRMED' ? (
                    <>
                      Votre confirmation de réception a été enregistrée avec succès. Vous pouvez maintenant évaluer le livreur (<strong>{cleanCourierName}</strong>), le restaurant (<strong>{order.storeName}</strong>) et chacun de vos plats !
                    </>
                  ) : (
                    <>
                      Le livreur <strong>{cleanCourierName}</strong> est à votre adresse ({order.deliveryAddress.commune}). Veuillez vérifier vos articles et confirmer la bonne réception de la commande ainsi que le règlement de <strong>{order.total} DZD</strong> en espèces.
                    </>
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {order.status === 'ARRIVED' ? (
                    <button
                      type="button"
                      id="customer-confirm-delivery-btn"
                      onClick={() => {
                        if (onJumpToStatus) {
                          onJumpToStatus('CUSTOMER_CONFIRMED');
                          setTimeout(() => {
                            onJumpToStatus('DELIVERED');
                            setTimeout(() => {
                              onOpenRatingModal?.(5);
                            }, 350);
                          }, 600);
                        } else if (onSimulateStatusAdvance) {
                          onSimulateStatusAdvance();
                          setTimeout(() => {
                            onOpenRatingModal?.(5);
                          }, 350);
                        }
                      }}
                      className="btn-gradient-primary active:scale-95 text-[#071E26] text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 size={16} className="text-[#071E26]" />
                      <span>✓ Confirmer la Réception & Régler ({order.total} DZD)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="customer-rate-now-btn"
                      onClick={() => {
                        if (onJumpToStatus) {
                          onJumpToStatus('DELIVERED');
                        }
                        onOpenRatingModal?.(5);
                      }}
                      className="btn-gradient-primary active:scale-95 text-[#071E26] text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Star size={16} className="fill-[#071E26] text-[#071E26]" />
                      <span>Évaluer le Livreur, Restaurant & Plats (+50 pts)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NATIVE BACKGROUND NOTIFICATIONS CALLOUT */}
        {order.status !== 'DELIVERED' && (
          <div className="rounded-2xl border p-3 transition-all shadow-2xs bg-white border-[#EADBCE]">
            {notificationPermission !== 'granted' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#D9943B]/10 text-[#0A2B35] flex items-center justify-center shrink-0">
                    <BellRing size={16} className="text-[#D9943B]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0A2B35] truncate">
                      Alertes de statut en arrière-plan
                    </div>
                    <div className="text-[10px] text-[#648692] line-clamp-1">
                      Recevez les notifications même si l'appli est fermée ou en arrière-plan.
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const res = await requestNotificationPermission();
                    if (res === 'granted') {
                      setNotifFeedback('Alertes activées !');
                    } else {
                      setNotifFeedback('Non accordé');
                    }
                    setTimeout(() => setNotifFeedback(null), 3000);
                  }}
                  className="bg-[#0A2B35] hover:bg-[#114250] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 active:scale-95 transition-transform shadow-2xs cursor-pointer"
                >
                  Activer
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="truncate">
                    Alertes natives actives (Réception en arrière-plan OK)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setNotifFeedback('Basculez maintenant vers un autre onglet (alerte dans 3s)...');
                    setTimeout(() => {
                      sendNativeNotification(`🛵 Commande #${order.orderNumber}`, {
                        body: `Le livreur ${cleanCourierName} roule vers votre adresse à Ahmed Rachedi.`,
                        tag: `order-${order.id}`,
                        requireInteraction: true,
                      });
                      setNotifFeedback('Notification native envoyée !');
                      setTimeout(() => setNotifFeedback(null), 3000);
                    }, 3000);
                  }}
                  className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  Tester en arrière-plan (3s)
                </button>
              </div>
            )}

            {notifFeedback && (
              <div className="mt-2 text-[10px] font-semibold text-center text-amber-800 bg-amber-50 py-1 rounded-lg animate-in fade-in">
                {notifFeedback}
              </div>
            )}
          </div>
        )}

        {/* POST-DELIVERY RATING & FEEDBACK STEP */}
        {order.status === 'DELIVERED' && (
          <div className="bg-white rounded-2xl p-4 border border-[#EADBCE] shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0A2B35] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#D91A67] uppercase tracking-wider block">
                    Livraison Effectuée • Ahmed Rachedi
                  </span>
                  <h3 className="font-extrabold text-sm text-[#0A2B35]">
                    Votre commande a été livrée !
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-[#F7EBD9] text-[#0A2B35] font-extrabold px-2 py-0.5 rounded-full border border-[#EADBCE] flex items-center gap-1">
                <Sparkles size={11} className="text-[#D9943B]" />
                <span>+50 pts</span>
              </span>
            </div>

            <p className="text-xs text-zinc-600">
              Le paiement de <strong className="text-[#0A2B35]">{order.total} DZD</strong> a été perçu en espèces. Évaluez votre expérience en 3 étapes : <strong>Livreur 🛵</strong>, <strong>Restaurant 🏪</strong> et <strong>Plats 🍽️</strong> (+50 Pts Fidélité).
            </p>

            {order.isRated ? (
              <div className="bg-[#F8F4EC] rounded-xl p-3 border border-[#EADBCE] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#0A2B35] text-white">
                    <CheckCircle2 size={16} className="text-white" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#0A2B35]">Expérience évaluée</span>
                      <span className="text-[10px] font-extrabold bg-[#F7EBD9] text-[#0A2B35] px-1.5 py-0.5 rounded border border-[#EADBCE] flex items-center gap-1">
                        <Star size={10} className="fill-[#D9943B] text-[#D9943B]" />
                        <span>{order.rating || 5}/5</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-[#648692] block flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={11} className="text-[#0A2B35]" />
                      <span>Avis validé et points crédités</span>
                    </span>
                  </div>
                </div>
                {onOpenRatingModal && (
                  <button
                    onClick={() => onOpenRatingModal(order.rating || 5)}
                    className="text-xs font-bold text-[#0A2B35] bg-white hover:bg-[#F8F4EC] px-2.5 py-1.5 rounded-xl border border-[#EADBCE] transition-colors cursor-pointer"
                  >
                    Revoir
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* 1-5 Star Quick Selector */}
                <div className="bg-[#F8F4EC] rounded-xl p-3 border border-[#EADBCE] text-center space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#0A2B35] block">
                    Attribuer une note globale (1 à 5 étoiles) :
                  </span>
                  <div className="flex justify-center items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => onOpenRatingModal && onOpenRatingModal(star)}
                        className="p-1 hover:scale-120 active:scale-95 transition-all group cursor-pointer"
                        title={`${star} étoile${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={28}
                          className="text-[#D9943B] fill-[#D9943B] group-hover:opacity-80 drop-shadow-xs"
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-[#648692] px-2">
                    <span>1★ Décevant</span>
                    <span>3★ Bien</span>
                    <span>5★ Exceptionnel</span>
                  </div>
                </div>

                {onOpenRatingModal && (
                  <button
                    type="button"
                    onClick={() => onOpenRatingModal(5)}
                    className="w-full py-2.5 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.99] text-[#071E26] rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Star size={14} className="fill-[#071E26] text-[#071E26]" />
                    <span className="hidden sm:inline">Évaluer le Livreur, Restaurant & Plats (+50 pts)</span>
                    <span className="sm:hidden">Évaluer (+50 pts)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Courier Profile Card & Direct Channel */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D9943B]">
                  <LazyImage
                    src={order.courierAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnLgieeCF8ANxDxGqfJBxx4kjN-psqMb4MO9qTa3aoO0Qsz5aYMyWF-4meTl3-YluN6pO1WvE3z8q13EjhO4ylotuROjN2F7b3cGzY6InATavSGNRiY81Abt6msgXrjxk1hJZh3ivc3Qg62zoChrbudeY-GLLB23Axh3UpzfYfLXjdMxaZU-7HXMBbw9EyBfXunbj3n_WZXmeMexp59kbQmk5YHH5YXHBP2O0vbMoPila0sJJxBx5A=rw'}
                    alt={order.courierName}
                    placeholderType="avatar"
                    targetWidth={100}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0A2B35] border-2 border-white flex items-center justify-center text-white text-[8px] font-bold z-10">
                  ✓
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[14px] text-[#0A2B35]">{cleanCourierName}</h3>
                  <span className="bg-[#F7EBD9] text-[#0A2B35] border border-[#EADBCE] text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Star size={9} className="fill-[#D9943B] text-[#D9943B]" />
                    <span>{order.courierRating || 4.9}</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#648692] mt-0.5 flex items-center gap-1">
                  <Bike size={12} className="text-[#D9943B] shrink-0" />
                  <span>{order.courierVehicle || 'Scooter SYM'} • Coursier certifié Ahmed Rachedi</span>
                </p>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${order.courierPhone || '+213550123456'}`}
                className="w-9 h-9 rounded-full bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] border border-[#EADBCE] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="Appeler le livreur"
              >
                <Phone size={17} className="text-[#0A2B35]" />
              </a>
              <button
                onClick={onOpenChat}
                className="w-9 h-9 rounded-full bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] flex items-center justify-center active:scale-95 transition-all shadow-xs relative cursor-pointer"
                aria-label="Chatter avec le livreur"
              >
                <MessageCircle size={17} className="text-[#071E26]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full btn-gradient-tertiary"></span>
              </button>
            </div>
          </div>

          {/* Quick Algerian Landmark Canned Notes */}
          <div className="mt-3 pt-2.5 border-t border-[#EADBCE]/60">
            <span className="text-[10px] text-[#648692] font-semibold block mb-1.5">
              Messages rapides au livreur :
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={onOpenChat}
                className="text-[10px] bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] border border-[#EADBCE] px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Bell size={11} className="text-[#D9943B]" />
                <span>Sonner à l'interphone 2ème étage</span>
              </button>
              <button
                onClick={onOpenChat}
                className="text-[10px] bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] border border-[#EADBCE] px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Banknote size={11} className="text-[#D9943B]" />
                <span>Monnaie prête en espèces</span>
              </button>
              <button
                onClick={onOpenChat}
                className="text-[10px] bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] border border-[#EADBCE] px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors"
              >
                <MapPin size={11} className="text-[#D9943B]" />
                <span>En face de la Mosquée Al-Ansar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Structured Delivery Instructions & Landmark Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-[#0A2B35] shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#0A2B35]">
                  Livraison : {order.deliveryAddress.commune}
                </span>
                <span className="text-[10px] bg-[#F8F4EC] text-[#0A2B35] border border-[#EADBCE] px-2 py-0.5 rounded-full font-semibold">
                  {order.deliveryAddress.label}
                </span>
              </div>
              <p className="text-xs text-zinc-700 mt-0.5">
                {order.deliveryAddress.street}, {order.deliveryAddress.building}
              </p>
              <div className="mt-2 bg-[#F7EBD9]/60 border border-[#D9943B]/40 rounded-xl p-2 text-[11px] text-[#0A2B35]">
                <p className="font-bold flex items-center gap-1">
                  <MapPin size={12} className="text-[#B8731E] shrink-0" />
                  <span>Repère local impératif :</span>
                </p>
                <p className="mt-0.5 pl-4 font-semibold text-[#0A2B35]">{order.deliveryAddress.landmark}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Order Receipt & Price Snapshot */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div>
              <span className="font-bold text-[13px] text-[#0A2B35]">{order.storeName}</span>
              <div className="text-[11px] text-[#648692]">
                {order.items.length} article(s) • Total sécurisé :{' '}
                <span className="font-bold text-[#D91A67]">
                  {order.total} DZD (
                  <span className="sm:hidden">COD</span>
                  <span className="hidden sm:inline">Paiement à la livraison</span>)
                </span>
              </div>
            </div>
            {showDetails ? <ChevronUp size={18} className="text-[#0A2B35]" /> : <ChevronDown size={18} className="text-[#0A2B35]" />}
          </button>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-[#EADBCE]/60 space-y-2 text-xs">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <div className="flex-1 pr-2">
                    <span className="text-[#0A2B35] font-medium">
                      {it.quantity}× {it.productNameSnapshot || it.name}
                    </span>
                    {it.options.length > 0 && (
                      <p className="text-[10px] text-[#648692]">
                        {it.options.map((o) => o.optionName).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-[#0A2B35]">
                    {(it.unitPriceSnapshot || it.basePrice) * it.quantity} DZD
                  </span>
                </div>
              ))}

              <div className="pt-2 border-t border-[#EADBCE]/60 space-y-1 text-[#648692] text-[11px]">
                <div className="flex justify-between">
                  <span>Livraison Ahmed Rachedi</span>
                  <span>{order.deliveryFee} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Emballage isotherme</span>
                  <span>{order.packagingFee} DZD</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[#D91A67] font-bold">
                    <span>Remise promotionnelle</span>
                    <span>-{order.discount} DZD</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xs text-[#0A2B35] pt-1">
                  <span>Total à régler en espèces à la livraison</span>
                  <span className="text-[#D91A67] text-sm font-extrabold">{order.total} DZD</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Operational Dispatch Actions (Stakeholder Simulation for Testing) */}
        {onJumpToStatus && (
          <div className="bg-white rounded-2xl p-3 border border-dashed border-[#EADBCE] text-xs">
            <button
              onClick={() => setShowDispatchControls(!showDispatchControls)}
              className="w-full flex items-center justify-between text-left font-bold text-[#0A2B35] text-[11px] cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D9943B]"></span>
                <span className="sm:hidden">Actions Rôles & Dispatch AR</span>
                <span className="hidden sm:inline">Actions Opérationnelles (Dispatch & Rôles Ahmed Rachedi)</span>
              </div>
              <span className="text-[10px] text-[#648692] font-semibold">
                {showDispatchControls ? 'Masquer' : 'Afficher'}
              </span>
            </button>

            {showDispatchControls && (
              <div className="mt-2.5 pt-2.5 border-t border-[#EADBCE]/60 space-y-1.5">
                <p className="text-[10px] text-[#648692] mb-2">
                  Permet de tester manuellement chaque action opérationnelle sans attendre :
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onJumpToStatus('PREPARING')}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-left border transition-all cursor-pointer ${
                      order.status === 'PREPARING'
                        ? 'bg-[#F7EBD9] text-[#0A2B35] border-[#D9943B]'
                        : 'bg-[#F8F4EC] text-[#0A2B35] border-[#EADBCE] hover:bg-[#EADBCE]'
                    }`}
                  >
                    🏪 1. Restaurant en cuisine
                  </button>
                  <button
                    onClick={() => onJumpToStatus('PICKED_UP')}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-left border transition-all cursor-pointer ${
                      order.status === 'PICKED_UP'
                        ? 'bg-[#F7EBD9] text-[#0A2B35] border-[#D9943B]'
                        : 'bg-[#F8F4EC] text-[#0A2B35] border-[#EADBCE] hover:bg-[#EADBCE]'
                    }`}
                  >
                    🛵 2. Livreur prend le colis
                  </button>
                  <button
                    onClick={() => onJumpToStatus('DELIVERING')}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-left border transition-all cursor-pointer ${
                      order.status === 'DELIVERING'
                        ? 'bg-[#0A2B35] text-white border-[#0A2B35]'
                        : 'bg-[#F8F4EC] text-[#0A2B35] border-[#EADBCE] hover:bg-[#EADBCE]'
                    }`}
                  >
                    🛵 3. Livreur en route (GPS)
                  </button>
                  <button
                    onClick={() => onJumpToStatus('ARRIVED')}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-left border transition-all cursor-pointer ${
                      order.status === 'ARRIVED'
                        ? 'bg-[#0A2B35] text-white border-[#0A2B35]'
                        : 'bg-[#F8F4EC] text-[#0A2B35] border-[#EADBCE] hover:bg-[#EADBCE]'
                    }`}
                  >
                    📍 4. Livreur arrivé (20m)
                  </button>
                </div>
                <button
                  onClick={() => {
                    onJumpToStatus('DELIVERED');
                    onOpenRatingModal?.(5);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                    order.status === 'DELIVERED'
                      ? 'bg-[#0A2B35] text-white border-transparent'
                      : 'bg-[#D9943B] text-[#071E26] border-transparent hover:bg-[#E5A34C]'
                  }`}
                >
                  ✓ 5. Remise & Encaissement Espèces Finalisé
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit History Modal (OrderStatusHistory) */}
      {showAuditHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] bg-white rounded-3xl p-5 space-y-3 border border-[#EADBCE] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EADBCE] pb-2.5">
              <div className="flex items-center gap-2">
                <History size={18} className="text-[#0A2B35]" />
                <h3 className="font-bold text-sm text-[#0A2B35]">Historique de la commande</h3>
              </div>
              <button
                onClick={() => setShowAuditHistory(false)}
                className="text-[#648692] hover:text-[#0A2B35] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-[#648692]">
              Suivi chronologique certifié des étapes de préparation et de livraison
            </p>

            <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar">
              {(order.statusHistory && order.statusHistory.length > 0
                ? order.statusHistory
                : [
                    {
                      id: 'h1',
                      toStatus: 'CONFIRMED' as const,
                      timestamp: '12:28',
                      actorRole: 'CUSTOMER' as const,
                      actorName: 'Amine B.',
                      note: 'Commande enregistrée et confirmée',
                    },
                    {
                      id: 'h2',
                      toStatus: 'PREPARING' as const,
                      timestamp: '12:31',
                      actorRole: 'MERCHANT' as const,
                      actorName: 'Beni Haroun Kitchen',
                      note: 'Ticket cuisine imprimé, préparation en cours',
                    },
                    {
                      id: 'h3',
                      toStatus: 'ASSIGNED' as const,
                      timestamp: '12:35',
                      actorRole: 'SYSTEM' as const,
                      actorName: 'Système',
                      note: 'Attribué au coursier Walid M.',
                    },
                    {
                      id: 'h4',
                      toStatus: 'DELIVERING' as const,
                      timestamp: '12:39',
                      actorRole: 'COURIER' as const,
                      actorName: 'Walid M.',
                      note: 'Colis récupéré au restaurant, en route vers votre adresse',
                    },
                  ]
              ).map((h, i) => {
                const roleLabel =
                  h.actorRole === 'CUSTOMER'
                    ? 'Client'
                    : h.actorRole === 'MERCHANT'
                    ? 'Restaurant'
                    : h.actorRole === 'COURIER'
                    ? 'Livreur'
                    : 'Système';

                return (
                  <div key={i} className="p-2.5 bg-[#F8F4EC] rounded-xl border border-[#EADBCE] text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#0A2B35]">{h.toStatus}</span>
                      <span className="text-[10px] text-[#648692]">{h.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-zinc-700 mt-0.5">{h.note}</p>
                    <span className="text-[9px] text-[#D91A67] font-semibold mt-1 block">
                      Mis à jour par : {roleLabel} ({h.actorName})
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowAuditHistory(false)}
              className="w-full py-2.5 bg-[#0A2B35] hover:bg-[#114250] text-white rounded-full text-xs font-bold cursor-pointer transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

