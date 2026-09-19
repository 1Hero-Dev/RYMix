import React, { useState } from 'react';
import { AvailableDeliveryPoolOrder, Order } from '../types';
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
  ShieldAlert,
  ChevronRight,
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
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'pool' | 'active'>('pool');
  const [todayEarnings, setTodayEarnings] = useState(4850);
  const [deliveredCount, setDeliveredCount] = useState(11);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F1F3F6] pb-20">
      {/* Courier Top Status Bar */}
      <header className="bg-[#1C1B1B] text-white px-3.5 py-3 shadow-md sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#D9943B] text-zinc-950 flex items-center justify-center font-extrabold text-sm border-2 border-white">
                KB
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1C1B1B] ${
                  isOnline ? 'bg-[#00B578]' : 'bg-zinc-500'
                }`}
              ></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm">Karim Benali</h1>
                <span className="bg-[#D9943B] text-zinc-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                  RYM Rider Pro
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Zone : Alger (Hydra / Sidi Yahia / Didouche)</p>
            </div>
          </div>

          {/* Online / Offline Switch */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
              isOnline
                ? 'bg-[#00B578] text-white'
                : 'bg-zinc-700 text-zinc-300'
            }`}
          >
            <Power size={13} />
            <span>{isOnline ? 'En Ligne' : 'Hors Ligne'}</span>
          </button>
        </div>

        {/* Courier Performance Strip */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center text-xs">
          <div>
            <span className="text-zinc-400 text-[10px] block">Gains Aujourd'hui</span>
            <span className="font-extrabold text-[#D9943B] text-sm">{todayEarnings} DZD</span>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px] block">Courses Finies</span>
            <span className="font-bold text-white text-sm">{deliveredCount}</span>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px] block">Taux Ponctualité</span>
            <span className="font-bold text-[#00B578] text-sm">99.4%</span>
          </div>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="bg-white px-3.5 border-b border-neutral-200 flex justify-around">
        <button
          onClick={() => setActiveTab('pool')}
          className={`py-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'pool' ? 'text-[#1C1B1B] border-b-2 border-[#D9943B]' : 'text-zinc-400'
          }`}
        >
          <span>Missions Disponibles</span>
          <span className="bg-[#FF5722] text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
            {poolOrders.filter((p) => p.status === 'available').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'active' ? 'text-[#1C1B1B] border-b-2 border-[#D9943B]' : 'text-zinc-400'
          }`}
        >
          <span>Course en Cours</span>
          {activeOrder && (
            <span className="w-2 h-2 rounded-full bg-[#00B578] animate-pulse"></span>
          )}
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        {/* TAB 1: AVAILABLE MISSIONS POOL (Image 11 style) */}
        {activeTab === 'pool' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span>Missions en attente à Alger</span>
              <span className="text-[#00B578] font-bold">Radar actif (Rayon 3km)</span>
            </div>

            {poolOrders.map((mission) => {
              const totalPayout = mission.payoutFeeDZD + mission.rushBonusDZD;

              return (
                <div
                  key={mission.id}
                  className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-xs space-y-3 hover:border-amber-200 transition-all"
                >
                  {/* Payout Header */}
                  <div className="flex items-center justify-between">
                    <span className="bg-orange-50 text-[#FF5722] border border-orange-200/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {mission.urgencyTag}
                    </span>

                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-zinc-500 font-semibold">Rémunération :</span>
                      <span className="text-base font-extrabold text-[#00B578]">{totalPayout} DZD</span>
                      {mission.rushBonusDZD > 0 && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded font-bold">
                          dont +{mission.rushBonusDZD} DZD Prime Rush
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pick & Drop Route */}
                  <div className="space-y-2 text-xs">
                    {/* Store Pickup */}
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-neutral-100 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        1
                      </div>
                      <div>
                        <div className="font-bold text-[#1C1B1B]">{mission.storeName}</div>
                        <span className="text-[11px] text-zinc-500">{mission.storeAddress} ({mission.storeDistance})</span>
                      </div>
                    </div>

                    {/* Customer Drop-off */}
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#00B578] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        2
                      </div>
                      <div>
                        <div className="font-bold text-[#1C1B1B]">{mission.customerDestination}</div>
                        <p className="text-[11px] text-[#B02F00] font-bold">
                          📍 Repère : {mission.customerLandmark}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-neutral-100">
                    <span>{mission.itemsSummary}</span>
                    <span className="font-semibold text-zinc-700">Délai : {mission.deliveryDeadline}</span>
                  </div>

                  <button
                    onClick={() => {
                      onAcceptPoolOrder(mission.id);
                      setActiveTab('active');
                    }}
                    className="w-full h-11 bg-[#D9943B] hover:brightness-105 active:scale-[0.98] text-[#1C1B1B] rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-md transition-transform"
                  >
                    <span>Accepter cette Mission ({totalPayout} DZD)</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: ACTIVE MISSION GPS NAVIGATION (Image 13 style) */}
        {activeTab === 'active' && activeOrder && (
          <div className="space-y-3">
            {/* Live Nav HUD */}
            <div className="bg-[#1C1B1B] text-white rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#00B578] text-white flex items-center justify-center">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Prochaine étape</span>
                    <h3 className="font-extrabold text-sm text-[#D9943B]">
                      Dans 150m, tournez à droite sur Bd Sidi Yahia
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-300">Vitesse: 38 km/h</span>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-zinc-300">
                <span>Distance restante : 650m</span>
                <span className="text-emerald-400 font-bold">Arrivée estimée : ~8 min</span>
              </div>
            </div>

            {/* Customer Details & Cash on Delivery (COD) Alert */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-xs font-bold text-zinc-800">Détails de la Livraison</span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeOrder.orderNumber}
                </span>
              </div>

              {/* Algerian COD Callout */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-[#B02F00]" />
                  <div>
                    <span className="text-xs font-bold text-[#1C1B1B]">Encaissement Espèces (COD)</span>
                    <p className="text-[11px] text-zinc-600">Percevoir auprès du client à la remise</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-[#FF5722]">{activeOrder.total} DZD</span>
                  <span className="text-[10px] text-zinc-500 block">Monnaie à rendre</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900">{activeOrder.deliveryAddress.recipientName}</span>
                  <a
                    href={`tel:${activeOrder.deliveryAddress.phone}`}
                    className="flex items-center gap-1 text-xs font-bold text-[#00B578] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
                  >
                    <Phone size={12} />
                    <span>Appeler le client</span>
                  </a>
                </div>
                <p className="text-zinc-600">
                  {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.building} (Étage {activeOrder.deliveryAddress.floor})
                </p>
                <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200/50 mt-1">
                  <span className="text-[11px] text-[#B02F00] font-extrabold block">
                    📍 Repère algérien : {activeOrder.deliveryAddress.landmark}
                  </span>
                  <span className="text-[10px] text-zinc-600 block mt-0.5">
                    Instructions : {activeOrder.deliveryNotes || 'Sonner à l\'interphone'}
                  </span>
                </div>
              </div>

              {/* Courier Milestone Advance Action Button */}
              <button
                onClick={onAdvanceActiveOrderStep}
                className="w-full h-12 bg-[#00B578] hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-md transition-all"
              >
                <CheckCircle2 size={18} />
                <span>
                  {activeOrder.status === 'DELIVERING'
                    ? 'Confirmer la Remise & Encaissement COD'
                    : 'Valider Étape Suivante'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
