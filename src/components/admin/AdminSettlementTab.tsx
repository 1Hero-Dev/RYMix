import React, { useState } from 'react';
import { Order } from '../../types';
import {
  Banknote,
  TrendingUp,
  Download,
  Calendar,
  FileCheck,
  Building,
  CheckCircle,
  AlertCircle,
  Receipt,
  Printer,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  orders: Order[];
}

export const AdminSettlementTab: React.FC<Props> = ({ orders }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'WEEK' | 'ALL'>('TODAY');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Financial Computations (Excluding CANCELLED orders from GMV & net payable)
  const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
  const totalGMV = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalSubtotal = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalDeliveryFees = validOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
  const collectedCOD = orders
    .filter((o) => o.paymentStatus === 'COLLECTED')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCOD = orders
    .filter((o) => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  // Merchant breakdown (Only active/delivered non-cancelled orders count towards merchant payout)
  const storeSettlements = validOrders.reduce((acc, order) => {
    if (!acc[order.storeId]) {
      acc[order.storeId] = {
        storeName: order.storeName,
        orderCount: 0,
        subtotalDZD: 0,
        commissionDZD: 0, // 0% Launch Promotion in Ahmed Rachedi
        netPayableDZD: 0,
      };
    }
    acc[order.storeId].orderCount += 1;
    acc[order.storeId].subtotalDZD += order.subtotal;
    acc[order.storeId].commissionDZD += 0; // 0% Launch promotion
    acc[order.storeId].netPayableDZD += order.subtotal;
    return acc;
  }, {} as Record<string, { storeName: string; orderCount: number; subtotalDZD: number; commissionDZD: number; netPayableDZD: number }>);

  const handleExportReport = () => {
    const reportData = {
      platform: 'Ahmed Rachedi Express Delivery System',
      auditDate: new Date().toISOString(),
      summary: {
        totalGMV,
        totalSubtotal,
        totalDeliveryFees,
        collectedCOD,
        pendingCOD,
      },
      merchantSettlements: Object.values(storeSettlements),
      ordersSummary: orders.map((o) => ({
        orderNumber: o.orderNumber,
        store: o.storeName,
        total: o.total,
        paymentStatus: o.paymentStatus,
        status: o.status,
        createdAt: o.createdAt,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-financier-ahmed-rachedi-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Export */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote size={20} className="text-[#D9943B]" />
          <div>
            <h3 className="font-bold text-xs text-zinc-900">
              Audit Financier & Clôture Comptable (DZD)
            </h3>
            <p className="text-[10px] text-zinc-400">
              Traçabilité intégrale des flux d'espèces (COD) à Ahmed Rachedi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-zinc-800 font-bold text-xs rounded-xl transition-all"
          >
            <Download size={14} />
            <span>Exporter Rapport (JSON)</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-500 block">Volume d'Affaires (GMV)</span>
          <span className="text-xl font-black text-zinc-900">{totalGMV.toLocaleString()} DZD</span>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">{orders.length} commandes</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">Espèces Réellement Encaissées</span>
          <span className="text-xl font-black text-emerald-600">{collectedCOD.toLocaleString()} DZD</span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">Reçues par les livreurs</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 block">Encaissements en Attente</span>
          <span className="text-xl font-black text-amber-600">{pendingCOD.toLocaleString()} DZD</span>
          <span className="text-[10px] text-amber-700 mt-0.5 block">En cours de livraison</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-[#D91A67] block">Revenus Livraison Plateforme</span>
          <span className="text-xl font-black text-[#D91A67]">{totalDeliveryFees.toLocaleString()} DZD</span>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">0% com. commerçants (Lancement)</span>
        </div>
      </div>

      {/* Merchant Payouts Ledger */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden">
        <div className="p-3.5 bg-neutral-50/80 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building size={16} className="text-zinc-600" />
            <h4 className="font-bold text-xs text-zinc-900">
              Règlement Net par Commerce Partenaire (Politique 0% Commission Lancement)
            </h4>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
            Offre Spéciale Ahmed Rachedi
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-neutral-100">
          {Object.entries(storeSettlements).map(([storeId, storeData]: [string, any]) => (
            <div key={storeId} className="p-3.5 space-y-2 hover:bg-neutral-50/60 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-zinc-900">{storeData.storeName}</span>
                <span className="text-[11px] text-zinc-500 font-medium">{storeData.orderCount} commandes</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Ventes Brutes</span>
                  <span className="font-mono font-bold text-zinc-700">{storeData.subtotalDZD.toLocaleString()} DZD</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">Net à Reverser (0% com.)</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    {storeData.netPayableDZD.toLocaleString()} DZD
                  </span>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={() =>
                    setSelectedReceipt({
                      storeName: storeData.storeName,
                      orderCount: storeData.orderCount,
                      amountDZD: storeData.netPayableDZD,
                      date: new Date().toLocaleDateString('fr-DZ'),
                    })
                  }
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-[#D9943B] hover:text-[#071E26] font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Receipt size={12} />
                  <span>Voir Bordereau</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-zinc-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-3">Commerce / Restaurant</th>
                <th className="p-3">Commandes</th>
                <th className="p-3">Ventes Brutes (DZD)</th>
                <th className="p-3">Commission Plateforme</th>
                <th className="p-3">Net À Reverser au Commerçant</th>
                <th className="p-3 text-right">Justificatif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {Object.entries(storeSettlements).map(([storeId, storeData]: [string, any]) => (
                <tr key={storeId} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="p-3 font-bold text-zinc-900">{storeData.storeName}</td>
                  <td className="p-3 text-zinc-600">{storeData.orderCount} cmd</td>
                  <td className="p-3 font-mono font-bold text-zinc-900">
                    {storeData.subtotalDZD.toLocaleString()} DZD
                  </td>
                  <td className="p-3 text-emerald-600 font-bold">
                    0 DZD (0%)
                  </td>
                  <td className="p-3 font-mono font-extrabold text-zinc-900">
                    {storeData.netPayableDZD.toLocaleString()} DZD
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() =>
                        setSelectedReceipt({
                          storeName: storeData.storeName,
                          orderCount: storeData.orderCount,
                          amountDZD: storeData.netPayableDZD,
                          date: new Date().toLocaleDateString('fr-DZ'),
                        })
                      }
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-[#D9943B] hover:text-[#071E26] font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Receipt size={12} />
                      <span>Bordereau</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: MERCHANT SETTLEMENT RECEIPT */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <FileCheck size={28} />
            </div>

            <div>
              <h3 className="font-black text-base text-zinc-900">Bordereau de Clôture Commerçant</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Ahmed Rachedi Express Delivery System</p>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Établissement:</span>
                <span className="font-bold text-zinc-900">{selectedReceipt.storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Nombre de commandes:</span>
                <span className="font-bold text-zinc-900">{selectedReceipt.orderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Taux de commission:</span>
                <span className="font-bold text-emerald-600">0% (Campagne Lancement)</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-200 text-sm">
                <span className="text-zinc-700 font-bold">Total Net à Verser:</span>
                <span className="font-black text-emerald-700">{selectedReceipt.amountDZD.toLocaleString()} DZD</span>
              </div>
            </div>

            <div className="border border-dashed border-neutral-300 p-2 rounded-lg text-[10px] text-zinc-500">
              Tampon Administratif • Direction des Opérations Ahmed Rachedi
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-colors"
            >
              Fermer le Bordereau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
