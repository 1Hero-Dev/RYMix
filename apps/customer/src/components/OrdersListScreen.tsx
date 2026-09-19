import React from 'react';
import { Order } from '../types';
import { ArrowLeft, Clock, Bike, CheckCircle2, ChevronRight, RotateCcw, MapPin } from 'lucide-react';

interface Props {
  activeOrder: Order | null;
  pastOrders: Order[];
  onSelectOrderToTrack: (order: Order) => void;
  onReorder: (order: Order) => void;
}

export const OrdersListScreen: React.FC<Props> = ({
  activeOrder,
  pastOrders,
  onSelectOrderToTrack,
  onReorder,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <h1 className="font-bold text-[16px] text-[#1C1B1B]">Mes Commandes RYM</h1>
        <span className="text-xs text-zinc-400 font-medium">Historique & Suivi</span>
      </header>

      <div className="p-3.5 space-y-4">
        {/* Active Order Hero Card (Live in progress) */}
        {activeOrder && (
          <div className="bg-white rounded-2xl p-4 border-2 border-[#D9943B] shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00B578] animate-pulse"></span>
                <span className="font-extrabold text-xs text-[#1C1B1B]">COMMANDE EN COURS</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                {activeOrder.orderNumber}
              </span>
            </div>

            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-black/5">
                <img
                  src={activeOrder.storeImageUrl}
                  alt={activeOrder.storeName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#1C1B1B] truncate">{activeOrder.storeName}</h3>
                <div className="flex items-center gap-1 text-xs text-emerald-700 font-bold mt-0.5">
                  <Bike size={14} />
                  <span>En route avec {activeOrder.courierName} ({activeOrder.estimatedDeliveryTime})</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {activeOrder.items.length} article(s) • Total :{' '}
                  <span className="font-bold text-[#FF5722]">{activeOrder.total} DZD (COD)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectOrderToTrack(activeOrder)}
              className="w-full h-10 bg-[#D9943B] hover:brightness-105 active:scale-[0.99] text-[#1C1B1B] rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-xs transition-transform"
            >
              <span>Suivre le livreur sur la carte en direct</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Past Orders Section */}
        <div>
          <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-2 px-1">
            Commandes Précédentes
          </h2>

          <div className="space-y-3">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={order.storeImageUrl}
                      alt={order.storeName}
                      className="w-8 h-8 rounded-lg object-cover border border-black/5"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-[#1C1B1B]">{order.storeName}</h4>
                      <span className="text-[10px] text-zinc-400">{order.createdAt}</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-neutral-100 text-zinc-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-[#00B578]" />
                    {order.status === 'DELIVERED' ? 'Livrée' : order.status}
                  </span>
                </div>

                <div className="text-xs text-zinc-600 space-y-0.5 pl-10">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="truncate max-w-[200px]">
                        {it.quantity}× {it.name}
                      </span>
                      <span className="font-medium text-zinc-800">{it.basePrice * it.quantity} DZD</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-zinc-400">Total réglé (COD) : </span>
                    <span className="font-extrabold text-[#1C1B1B]">{order.total} DZD</span>
                  </div>

                  <button
                    onClick={() => onReorder(order)}
                    className="flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-zinc-800 text-[11px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-all"
                  >
                    <RotateCcw size={12} />
                    <span>Recommander</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
