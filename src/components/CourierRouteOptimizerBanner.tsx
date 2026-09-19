import React, { useState } from 'react';
import {
  Sparkles,
  Navigation,
  MapPin,
  Clock,
  Coins,
  CheckCircle2,
  TrendingUp,
  X,
  Layers,
  Store,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { OptimizedRouteBundle, Order } from '../types';
import { findOptimizedNearbyDeliveries, MILA_READY_DELIVERIES_POOL } from '../utils/courierRouteOptimizer';

interface Props {
  activeOrder: Order | null;
  courierDestination?: [number, number]; // [lat, lng] of courier's destination (e.g. Cité El Bassatine, Ahmed Rachedi)
  courierCurrentPosition?: [number, number];
  onAcceptBundle: (bundle: OptimizedRouteBundle) => void;
}

export const CourierRouteOptimizerBanner: React.FC<Props> = ({
  activeOrder,
  courierDestination = [36.39124, 6.12848], // Cité El Bassatine, Ahmed Rachedi
  courierCurrentPosition = [36.39485, 6.13162],
  onAcceptBundle,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dismissedBundleIds, setDismissedBundleIds] = useState<string[]>([]);
  const [acceptedBundleIds, setAcceptedBundleIds] = useState<string[]>([]);
  const [selectedBundleForDetail, setSelectedBundleForDetail] = useState<OptimizedRouteBundle | null>(null);

  // Find bundles optimized for this destination
  const destTuple: [number, number] = (courierDestination || [36.39124, 6.12848]) as [number, number];
  const curPosTuple: [number, number] = (courierCurrentPosition || [36.39485, 6.13162]) as [number, number];

  const matchedBundles = findOptimizedNearbyDeliveries(
    destTuple,
    curPosTuple
  ).filter((b) => !dismissedBundleIds.includes(b.id) && !acceptedBundleIds.includes(b.id));

  if (matchedBundles.length === 0) return null;

  const topBundle = matchedBundles[0];

  const handleAccept = (bundle: OptimizedRouteBundle) => {
    setAcceptedBundleIds((prev) => [...prev, bundle.id]);
    onAcceptBundle(bundle);
    setIsModalOpen(false);
  };

  const handleDismiss = (bundleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedBundleIds((prev) => [...prev, bundleId]);
  };

  return (
    <>
      {/* Dynamic Notification Ribbon for the Courier */}
      <div
        id="courier-route-optimizer-banner"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071E26] via-[#0A2B35] to-[#114250] border-2 border-[#D9943B]/60 p-3.5 shadow-lg transition-all animate-in fade-in slide-in-from-top duration-300"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-[#D9943B]/20 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-black shrink-0 shadow-md">
              <Sparkles size={18} className="animate-spin-slow" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#D9943B] text-[#071E26] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ⚡ Optimiseur de Tournée Proche
                </span>
                <span className="bg-[#D9943B]/20 text-[#E5A34C] border border-[#D9943B]/40 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  Synergie {topBundle.matchScorePercent}%
                </span>
              </div>

              <h4 className="font-extrabold text-xs text-white mt-1 leading-snug">
                Livraison prête chez <span className="text-[#D9943B]">{topBundle.storeName}</span>
              </h4>

              <p className="text-[11px] text-[#EADBCE] mt-0.5">
                Destination client à seulement <strong className="text-[#D9943B] font-bold">{topBundle.customerDistanceMeters}m</strong> de votre livraison actuelle ({topBundle.customerDestination}) !
              </p>

              {/* Fast Stats Row */}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-[#648692] flex-wrap">
                <span className="flex items-center gap-1 text-[#D9943B] font-extrabold">
                  <Coins size={12} />
                  <span>+{topBundle.bundleBonusPayoutDZD} DZD Net</span>
                </span>
                <span className="flex items-center gap-1 text-[#EADBCE]">
                  <Clock size={12} className="text-[#D9943B]" />
                  <span>+{topBundle.estimatedExtraMinutes} min détour</span>
                </span>
                <span className="flex items-center gap-1 text-[#EADBCE]">
                  <Navigation size={12} className="text-[#648692]" />
                  <span>Détour {topBundle.corridorDetourMeters}m</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => handleDismiss(topBundle.id, e)}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-[#648692] hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
            title="Ignorer pour le moment"
          >
            <X size={13} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => handleAccept(topBundle)}
            className="flex-1 h-9 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>Accepter & Grouper (+{topBundle.bundleBonusPayoutDZD} DZD)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedBundleForDetail(topBundle);
              setIsModalOpen(true);
            }}
            className="px-3 h-9 bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <span>Détails ({matchedBundles.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Detail & Multi-Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#071E26]/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#0A2B35] border border-[#EADBCE]/20 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="bg-[#071E26] p-4 border-b border-[#EADBCE]/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-bold">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    <span className="sm:hidden">Optimiseur Trajet</span>
                    <span className="hidden sm:inline">Optimiseur de Trajet & Livraisons Groupées</span>
                  </h3>
                  <span className="text-[11px] text-[#648692]">
                    Ahmed Rachedi • {matchedBundles.length} opportunités proches détectées
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#648692] hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div className="bg-[#071E26]/60 border border-[#D9943B]/30 rounded-xl p-3 text-[#EADBCE]">
                <p className="leading-relaxed">
                  💡 <strong>Algorithme de corridor Ahmed Rachedi :</strong> Ces commandes sont prêtes à être récupérées et leurs adresses de livraison sont situées dans le même pâté d'immeubles que votre client actuel. Vous gagnez plus sans allonger votre temps de course !
                </p>
              </div>

              <div className="space-y-3">
                {matchedBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="bg-[#071E26]/90 rounded-2xl p-3.5 border border-[#EADBCE]/15 space-y-3 hover:border-[#D9943B]/60 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-sm">
                            {bundle.orderNumber}
                          </span>
                          <span className="bg-[#D9943B]/20 text-[#E5A34C] text-[10px] font-bold px-1.5 py-0.2 rounded">
                            {bundle.urgencyTag}
                          </span>
                          <span className="bg-[#D91A67]/20 text-[#F2478C] text-[10px] font-bold px-1.5 py-0.2 rounded">
                            Synergie {bundle.matchScorePercent}%
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[#EADBCE] mt-1 flex items-center gap-1">
                          <Store size={13} className="text-[#D9943B]" />
                          <span>{bundle.storeName}</span>
                        </h4>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#D9943B] block">
                          +{bundle.bundleBonusPayoutDZD} DZD
                        </span>
                        <span className="text-[10px] text-[#648692]">100% Net Livreur</span>
                      </div>
                    </div>

                    {/* Corridor Roadmap Visualizer */}
                    <div className="bg-[#0A0D10]/50 rounded-xl p-2.5 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center gap-2 text-[#EADBCE]">
                        <span className="w-2 h-2 rounded-full bg-[#D9943B]"></span>
                        <span className="truncate">Retrait : {bundle.storeAddress} (à {bundle.storeDistanceMeters}m)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#EADBCE]">
                        <span className="w-2 h-2 rounded-full bg-[#D91A67]"></span>
                        <span className="truncate">Dépose : {bundle.customerDestination}</span>
                      </div>
                      <div className="text-[10px] text-[#E5A34C] font-sans pl-4">
                        ↳ Écart avec livraison actuelle : <strong>seulement {bundle.customerDistanceMeters}m</strong> ({bundle.reason})
                      </div>
                    </div>

                    <div className="text-[#648692] text-[11px]">
                      Articles : {bundle.itemsSummary}
                    </div>

                    {/* Accept button */}
                    <button
                      type="button"
                      onClick={() => handleAccept(bundle)}
                      className="w-full h-10 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>Accepter cette commande groupée (+{bundle.bundleBonusPayoutDZD} DZD)</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="bg-[#071E26] p-3 border-t border-[#EADBCE]/15 text-center text-[#648692] text-[11px]">
              Gain combiné potentiel : <strong className="text-[#D9943B]">+730 DZD</strong> pour ~6 min de temps cumulé.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
