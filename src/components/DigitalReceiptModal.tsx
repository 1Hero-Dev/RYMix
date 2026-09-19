import React from 'react';
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Store,
  Bike,
  Sparkles,
  Download,
} from 'lucide-react';
import { PurchasingHistoryRecord, Order } from '../types';

interface Props {
  isOpen: boolean;
  order: PurchasingHistoryRecord | Order | null;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<Props> = ({ isOpen, order, onClose }) => {
  if (!isOpen || !order) return null;

  const receiptNum =
    (order as PurchasingHistoryRecord).receiptNumber ||
    `REC-MILA-2026-${order.orderNumber.replace('#HB-', '')}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      id="digital-receipt-modal-overlay"
      className="fixed inset-0 z-50 bg-[#071E26]/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200"
    >
      <div
        id="digital-receipt-modal-card"
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-[#EADBCE]"
      >
        {/* Header Strip */}
        <div className="bg-[#071E26] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#D9943B] text-[#071E26]">
              <FileText size={16} />
            </span>
            <div>
              <span className="text-[10px] font-bold text-[#648692] uppercase tracking-widest block">
                Base de données Achats Ahmed Rachedi
              </span>
              <h2 className="font-extrabold text-sm text-white">Reçu d'Achat Numérique</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs bg-[#F8F4EC]/60">
          {/* Official Stamp & Brand Box */}
          <div className="bg-white p-4 rounded-2xl border border-[#EADBCE] shadow-xs text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 border-2 border-[#D9943B] text-[#D9943B] font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-sm rotate-6 opacity-90">
              PAYÉ • ESPÈCES
            </div>

            <h3 className="font-black text-base tracking-tight text-[#0A2B35]">
              RYM SUPER-APP AHMED RACHEDI
            </h3>
            <p className="text-[10px] text-[#648692] mt-0.5 font-medium">
              Plateforme de commande & livraison locale • Ahmed Rachedi
            </p>
            <div className="mt-2 pt-2 border-t border-dashed border-[#EADBCE] font-mono text-[11px] text-[#0A2B35]">
              <span>N° Justificatif : </span>
              <strong className="text-[#071E26]">{receiptNum}</strong>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EADBCE] space-y-2">
            <div className="flex justify-between items-center text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[#648692]" />
                <span>Date & Heure</span>
              </span>
              <span className="font-bold text-[#0A2B35]">{order.createdAt}</span>
            </div>

            <div className="flex justify-between items-center text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Store size={13} className="text-[#648692]" />
                <span>Commerçant</span>
              </span>
              <span className="font-bold text-[#0A2B35] truncate max-w-[180px]">
                {order.storeName}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Bike size={13} className="text-[#648692]" />
                <span>Livreur</span>
              </span>
              <span className="font-bold text-[#0A2B35]">
                {order.courierName?.replace(/\s*\([^)]*\)/g, '').trim() || 'Walid M.'}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-600">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-[#648692]" />
                <span>Adresse de livraison</span>
              </span>
              <span className="font-semibold text-[#0A2B35] text-right truncate max-w-[180px]">
                {order.deliveryAddress?.street || 'Rue Principale 1er Novembre, Ahmed Rachedi'}
              </span>
            </div>
          </div>

          {/* Itemized Articles Table */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EADBCE] space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#648692] pb-1 border-b border-[#EADBCE]/50">
              Détail des Articles Commandés
            </h4>

            <div className="divide-y divide-[#EADBCE]/40 space-y-1.5">
              {order.items.map((it, idx) => (
                <div key={idx} className="pt-1.5 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-[#0A2B35] block">
                      {it.quantity}× {it.name}
                    </span>
                    {it.options && it.options.length > 0 && (
                      <span className="text-[10px] text-[#648692] block">
                        {it.options.map((o) => o.optionName).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-[#0A2B35]">
                    {it.basePrice * it.quantity} DZD
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="pt-2.5 border-t border-dashed border-[#EADBCE] space-y-1 text-[#648692]">
              <div className="flex justify-between text-[11px]">
                <span>Sous-total articles</span>
                <span className="font-mono text-[#0A2B35]">{order.subtotal} DZD</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Frais de livraison (Ahmed Rachedi)</span>
                <span className="font-mono text-[#0A2B35]">{order.deliveryFee} DZD</span>
              </div>
              {order.packagingFee > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>Frais d'emballage thermique</span>
                  <span className="font-mono text-[#0A2B35]">{order.packagingFee} DZD</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-[11px] text-[#D9943B] font-bold">
                  <span>Remise déduite</span>
                  <span className="font-mono">-{order.discount} DZD</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#EADBCE] flex justify-between items-baseline text-sm font-black text-[#0A2B35]">
                <span>TOTAL TTC RÉGLÉ</span>
                <span className="font-mono text-base text-[#D91A67]">{order.total} DZD</span>
              </div>
            </div>
          </div>

          {/* Fidelity Points Awarded Strip */}
          <div className="p-3 bg-[#F7EBD9] rounded-2xl border border-[#EADBCE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[#D9943B] text-[#071E26]">
                <Sparkles size={14} />
              </span>
              <div>
                <span className="text-[11px] font-extrabold text-[#0A2B35] block">
                  Points Fidélité Terroir Ahmed Rachedi
                </span>
                <span className="text-[10px] text-[#648692]">
                  Enregistré dans votre base fidélité
                </span>
              </div>
            </div>
            <span className="font-extrabold text-xs text-[#0A2B35] bg-white px-2 py-0.5 rounded-md border border-[#EADBCE]">
              +{(order as PurchasingHistoryRecord).pointsEarned || Math.round(order.total / 10)} pts
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-white border-t border-[#EADBCE] flex items-center justify-between gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 h-10 bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] border border-[#EADBCE] rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer size={15} />
            <span className="sm:hidden">Imprimer</span>
            <span className="hidden sm:inline">Imprimer / PDF</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 bg-[#0A2B35] hover:bg-[#114250] text-[#D9943B] rounded-xl flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
