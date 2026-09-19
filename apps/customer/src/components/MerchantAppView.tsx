import React, { useState } from 'react';
import { Order, MenuItem } from '../types';
import {
  Store,
  ChefHat,
  Bell,
  Printer,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Flame,
} from 'lucide-react';

interface Props {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onBackToCustomer: () => void;
}

export const MerchantAppView: React.FC<Props> = ({
  orders,
  onUpdateOrderStatus,
  onBackToCustomer,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('preparing');
  const [dailyTurnover, setDailyTurnover] = useState(48650);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING' || o.status === 'READY');
  const deliveringOrders = orders.filter((o) => o.status === 'DELIVERING' || o.status === 'DELIVERED');

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-20">
      {/* Merchant Top Bar */}
      <header className="bg-[#1F2124] text-white px-3.5 py-3 shadow-md sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D9943B] text-[#1C1B1B] flex items-center justify-center font-extrabold shadow-sm">
              <ChefHat size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm">Le Palmier - Grillades d'Alger</h1>
                <span className="bg-[#00B578] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                  En Service
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Terminal Commerçant RYM • Val d'Hydra</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isOpen ? 'bg-[#00B578] text-white' : 'bg-red-600 text-white'
            }`}
          >
            {isOpen ? 'Ouvert' : 'Fermé'}
          </button>
        </div>

        {/* Turnover & Sales Indicators */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center text-xs">
          <div>
            <span className="text-zinc-400 text-[10px] block">Chiffre d'Affaires</span>
            <span className="font-extrabold text-[#D9943B] text-sm">{dailyTurnover} DZD</span>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px] block">Commandes Jour</span>
            <span className="font-bold text-white text-sm">38 repas</span>
          </div>
          <div>
            <span className="text-zinc-400 text-[10px] block">Temps Moyen Cuisine</span>
            <span className="font-bold text-[#00B578] text-sm">8.5 min</span>
          </div>
        </div>
      </header>

      {/* Kanban Stage Tabs */}
      <div className="bg-white px-3.5 border-b border-neutral-200 flex justify-around">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'pending' ? 'text-[#1C1B1B] border-b-2 border-[#D9943B]' : 'text-zinc-400'
          }`}
        >
          <span>À Valider</span>
          <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
            {pendingOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('preparing')}
          className={`py-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'preparing' ? 'text-[#1C1B1B] border-b-2 border-[#D9943B]' : 'text-zinc-400'
          }`}
        >
          <span>En Cuisine / En Route</span>
          <span className="bg-[#00B578] text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
            {preparingOrders.length + deliveringOrders.length}
          </span>
        </button>
      </div>

      {/* Orders Stream */}
      <div className="p-3.5 space-y-3">
        {orders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-xs space-y-3"
          >
            {/* Order Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-[#1C1B1B]">{ord.orderNumber}</span>
                <span className="text-[10px] text-zinc-400">{ord.createdAt}</span>
              </div>

              <span className="bg-orange-50 text-[#FF5722] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                COD : {ord.total} DZD
              </span>
            </div>

            {/* Items List for Kitchen */}
            <div className="space-y-2">
              {ord.items.map((it, idx) => (
                <div key={idx} className="bg-neutral-50 rounded-xl p-2.5 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-zinc-900">
                    <span>{it.quantity}× {it.name}</span>
                    <span>{it.basePrice * it.quantity} DZD</span>
                  </div>

                  {it.options.length > 0 && (
                    <div className="text-[11px] text-zinc-600 font-medium">
                      {it.options.map((o) => `${o.groupName}: ${o.optionName}`).join(' | ')}
                    </div>
                  )}

                  {it.chefRemark && (
                    <div className="bg-amber-100/70 text-amber-900 text-[11px] font-bold p-1 rounded">
                      ⚠️ Note client : {it.chefRemark}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Courier Assignment */}
            <div className="flex items-center justify-between text-xs text-zinc-600 pt-1">
              <span>Livreur assigné : <strong className="text-zinc-900">{ord.courierName}</strong></span>
              <span className="text-emerald-700 font-semibold">{ord.status}</span>
            </div>

            {/* Merchant Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <button
                onClick={() => alert(`Impression du ticket cuisine #${ord.orderNumber}...`)}
                className="flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-zinc-700 text-xs font-bold px-3 py-2 rounded-xl"
              >
                <Printer size={14} />
                <span>Ticket</span>
              </button>

              <button
                onClick={() => onUpdateOrderStatus(ord.id, 'READY')}
                className="flex-1 bg-[#D9943B] hover:brightness-105 active:scale-[0.98] text-[#1C1B1B] text-xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 size={15} />
                <span>Commande Prête pour Coursier</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
