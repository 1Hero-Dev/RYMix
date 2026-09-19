import React, { useState } from 'react';
import { Order, PurchasingHistoryRecord } from '../types';
import { LazyImage } from './common/LazyImage';
import {
  ArrowLeft,
  Clock,
  Bike,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  RotateCcw,
  MapPin,
  Star,
  Receipt,
  Sparkles,
  Award,
} from 'lucide-react';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { OrderRatingModal } from './OrderRatingModal';
import { DigitalReceiptModal } from './DigitalReceiptModal';

interface Props {
  activeOrder: Order | null;
  pastOrders: Order[];
  onSelectOrderToTrack: (order: Order) => void;
  onReorder: (order: Order) => void;
  onOrderRated?: (orderId: string, rating: number) => void;
}

export const OrdersListScreen: React.FC<Props> = ({
  activeOrder,
  pastOrders,
  onSelectOrderToTrack,
  onReorder,
  onOrderRated,
}) => {
  const { purchasingHistory } = useLocalDatabase();

  const [selectedOrderForRating, setSelectedOrderForRating] = useState<
    Order | PurchasingHistoryRecord | null
  >(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<
    Order | PurchasingHistoryRecord | null
  >(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [isAllStretched, setIsAllStretched] = useState<boolean>(true);

  const toggleOrderStretch = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: prev[orderId] !== undefined ? !prev[orderId] : !isAllStretched,
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F4EC] pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-[#EADBCE] shadow-xs">
        <div>
          <h1 className="font-bold text-[16px] text-[#0A2B35]">
            <span className="sm:hidden">Commandes</span>
            <span className="hidden sm:inline">Historique des Commandes</span>
          </h1>
          <span className="text-[10px] text-[#648692] font-medium">
            Base d'achats & fidélité • Ahmed Rachedi
          </span>
        </div>
        <span className="text-xs bg-[#F7EBD9] text-[#0A2B35] font-extrabold px-2.5 py-1 rounded-full border border-[#EADBCE]">
          <span className="sm:hidden">{purchasingHistory.length}</span>
          <span className="hidden sm:inline">{purchasingHistory.length} archivées</span>
        </span>
      </header>

      <div className="p-3.5 space-y-4">
        {/* Active Order Hero Card (Live in progress) */}
        {activeOrder && activeOrder.status !== 'DELIVERED' && (
          <div className="bg-white rounded-2xl p-4 border-2 border-[#D9943B] shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9943B] animate-pulse"></span>
                <span className="font-extrabold text-xs text-[#0A2B35]">COMMANDE EN COURS</span>
              </div>
              <span className="text-[10px] bg-[#F7EBD9] text-[#0A2B35] font-extrabold px-2 py-0.5 rounded-full border border-[#EADBCE]">
                {activeOrder.orderNumber}
              </span>
            </div>

            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F8F4EC] shrink-0 border border-[#EADBCE]">
                <LazyImage
                  src={activeOrder.storeImageUrl}
                  alt={activeOrder.storeName}
                  placeholderType="store"
                  targetWidth={140}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#0A2B35] truncate">{activeOrder.storeName}</h3>
                <div className="flex items-center gap-1 text-xs text-[#0A2B35] font-bold mt-0.5">
                  <Bike size={14} className="text-[#D9943B]" />
                  <span>En route avec {activeOrder.courierName} ({activeOrder.estimatedDeliveryTime})</span>
                </div>
                <div className="text-[11px] text-[#648692] mt-0.5">
                  {activeOrder.items.length} article(s) • Total :{' '}
                  <span className="font-bold text-[#D91A67]">{activeOrder.total} DZD (espèces)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="orders-screen-track-map-btn"
                onClick={() => onSelectOrderToTrack(activeOrder)}
                className="flex-1 h-10 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.99] text-[#071E26] rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-xs transition-transform cursor-pointer"
              >
                <span>Carte en direct</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Past Orders Section */}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#648692]">
                Commandes Précédentes Enregistrées
              </h2>
              <span className="text-[10px] bg-[#EADBCE] text-[#0A2B35] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {pastOrders.length}
              </span>
            </div>

            <button
              id="orders-toggle-stretch-all-btn"
              onClick={() => {
                const next = !isAllStretched;
                setIsAllStretched(next);
                const newMap: Record<string, boolean> = {};
                pastOrders.forEach((o) => {
                  newMap[o.id] = next;
                });
                setExpandedOrderIds(newMap);
              }}
              className="text-[11px] font-bold text-[#0A2B35] bg-[#F7EBD9] hover:bg-[#EADBCE] border border-[#EADBCE] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isAllStretched ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isAllStretched ? 'Réduire la liste' : 'Étirer la liste'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {pastOrders.map((order) => {
              // Find if this order is in the purchasing history database
              const dbRecord = purchasingHistory.find(
                (p) => p.id === order.id || p.orderNumber === order.orderNumber
              );
              const isRated = dbRecord ? dbRecord.isRatedMerchant && dbRecord.isRatedCourier : false;
              const points = dbRecord ? dbRecord.pointsEarned : Math.round(order.total / 10);
              const isExpanded =
                expandedOrderIds[order.id] !== undefined
                  ? expandedOrderIds[order.id]
                  : isAllStretched;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs space-y-2.5 transition-all"
                >
                  <div
                    onClick={() => toggleOrderStretch(order.id)}
                    className="flex items-center justify-between cursor-pointer group"
                    title={isExpanded ? 'Cliquer pour réduire' : 'Cliquer pour étirer'}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#F8F4EC] shrink-0 border border-[#EADBCE]">
                        <LazyImage
                          src={order.storeImageUrl}
                          alt={order.storeName}
                          placeholderType="store"
                          targetWidth={90}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-[#0A2B35] group-hover:text-[#D9943B] transition-colors">
                            {order.storeName}
                          </h4>
                          <span className="text-[9px] font-mono bg-[#F8F4EC] text-[#0A2B35] border border-[#EADBCE] px-1.5 py-0.2 rounded">
                            {order.orderNumber}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#648692] block mt-0.5">{order.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] bg-[#F8F4EC] text-[#0A2B35] border border-[#EADBCE] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-[#D9943B]" />
                          {order.status === 'DELIVERED' ? 'Livrée' : order.status}
                        </span>
                        <span className="text-[9px] font-extrabold text-[#0A2B35] bg-[#F7EBD9] px-1.5 py-0.2 rounded border border-[#EADBCE]">
                          +{points} pts
                        </span>
                      </div>

                      <span className="p-1 text-[#648692] group-hover:text-[#0A2B35] transition-colors">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </span>
                    </div>
                  </div>

                  {/* Stretched/Expanded Content */}
                  {isExpanded && (
                    <>
                      {/* Items summary */}
                      <div className="text-xs text-zinc-600 space-y-0.5 pl-2 border-l-2 border-[#EADBCE] animate-in fade-in">
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="truncate max-w-[200px] text-[#0A2B35]">
                              {it.quantity}× {it.name || (it as any).productNameSnapshot || 'Article'}
                            </span>
                            <span className="font-medium text-[#0A2B35]">
                              {(it.basePrice || (it as any).unitPriceSnapshot || 0) * it.quantity} DZD
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial Total */}
                      <div className="pt-2 border-t border-[#EADBCE]/60 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-[#648692]">Total réglé : </span>
                          <span className="font-extrabold text-[#0A2B35]">{order.total} DZD</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Rating Button */}
                          <button
                            onClick={() => setSelectedOrderForRating(dbRecord || order)}
                            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                              isRated
                                ? 'bg-[#F7EBD9] text-[#0A2B35] border-[#D9943B]'
                                : 'bg-white hover:bg-[#F8F4EC] text-[#0A2B35] border-[#EADBCE]'
                            }`}
                          >
                            <Star
                              size={12}
                              className={isRated ? 'text-[#D9943B] fill-[#D9943B]' : 'text-[#648692]'}
                            />
                            <span>{isRated ? 'Évalué (5★)' : 'Noter (+50 pts)'}</span>
                          </button>

                          {/* Receipt Button */}
                          <button
                            onClick={() => setSelectedOrderForReceipt(dbRecord || order)}
                            title="Voir le reçu d'achat numérique"
                            className="flex items-center gap-1 bg-[#F8F4EC] hover:bg-[#EADBCE] border border-[#EADBCE] text-[#0A2B35] text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors active:scale-95 cursor-pointer"
                          >
                            <Receipt size={12} className="text-[#0A2B35]" />
                            <span>Reçu</span>
                          </button>

                          {/* Reorder Button */}
                          <button
                            onClick={() => onReorder(order)}
                            className="flex items-center gap-1 bg-[#0A2B35] hover:bg-[#114250] text-[#D9943B] text-[11px] font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer"
                          >
                            <RotateCcw size={12} />
                            <span>Recommander</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <OrderRatingModal
        isOpen={Boolean(selectedOrderForRating)}
        order={selectedOrderForRating}
        onClose={() => setSelectedOrderForRating(null)}
        onSubmitted={(data) => {
          if (selectedOrderForRating && onOrderRated) {
            onOrderRated(selectedOrderForRating.id, data.merchantRating);
          }
        }}
      />

      <DigitalReceiptModal
        isOpen={Boolean(selectedOrderForReceipt)}
        order={selectedOrderForReceipt}
        onClose={() => setSelectedOrderForReceipt(null)}
      />
    </div>
  );
};
