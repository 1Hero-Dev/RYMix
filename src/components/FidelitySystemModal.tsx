import React, { useState } from 'react';
import {
  X,
  Crown,
  Sparkles,
  Award,
  Ticket,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Info,
  Gift,
  Copy,
} from 'lucide-react';
import { useLocalDatabase } from '../db/useLocalDatabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenPointsHistory?: () => void;
}

export const FidelitySystemModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenPointsHistory,
}) => {
  const { fidelityProfile, claimVoucher } = useLocalDatabase();
  const [activeTab, setActiveTab] = useState<'overview' | 'vouchers' | 'history'>('overview');
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaim = (def: {
    title: string;
    discountDZD: number;
    pointsCost: number;
    minSpendDZD: number;
  }) => {
    const res = claimVoucher(def);
    setRedeemFeedback(res.message);
    setTimeout(() => setRedeemFeedback(null), 3000);
  };

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Progress to next tier
  const isVipBaraka = fidelityProfile.tier === 'VIP_BARAKA';
  const targetPoints = isVipBaraka ? 5000 : fidelityProfile.tier === 'GOLD' ? 2500 : 1000;
  const currentLifetime = fidelityProfile.lifetimeEarned;
  const progressPercent = Math.min(100, Math.round((currentLifetime / targetPoints) * 100));

  const availableVoucherPacks = [
    { title: 'Bon Terroir Ahmed Rachedi 100 DZD', discountDZD: 100, pointsCost: 100, minSpendDZD: 600 },
    { title: 'Bon Terroir Ahmed Rachedi 200 DZD', discountDZD: 200, pointsCost: 200, minSpendDZD: 1000 },
    { title: 'Bon Gourmand Ahmed Rachedi 300 DZD', discountDZD: 300, pointsCost: 300, minSpendDZD: 1500 },
    { title: 'Bon VIP Baraka 500 DZD', discountDZD: 500, pointsCost: 500, minSpendDZD: 2200 },
  ];

  return (
    <div
      id="fidelity-modal-overlay"
      className="fixed inset-0 z-50 bg-[#071E26]/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200"
    >
      <div
        id="fidelity-modal-card"
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-[#EADBCE]"
      >
        {/* Header Strip */}
        <div className="card-gradient-hero p-4 text-[#071E26] relative">
          <button
            id="close-fidelity-modal-btn"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl btn-gradient-tertiary text-white shadow-xs">
              <Crown size={20} />
            </span>
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#071E26]/80">
                Programme de Fidélité Ahmed Rachedi
              </span>
              <h2 className="text-xl font-black text-[#071E26]">Points & Avantages Ahmed Rachedi</h2>
            </div>
          </div>

          {/* Balance card */}
          <div className="mt-3 bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm flex items-center justify-between border border-[#EADBCE]">
            <div>
              <span className="text-[11px] font-bold text-[#648692]">Solde disponible</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-[#0A2B35]">
                  {fidelityProfile.pointsBalance}
                </span>
                <span className="text-xs font-bold text-[#D9943B]">Points Terroir</span>
              </div>
              <span className="text-[10px] text-[#648692] font-medium">
                Équivalent à ≈ {fidelityProfile.pointsBalance} DZD de réductions
              </span>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 badge-gradient-primary text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                <Sparkles size={12} className="text-[#071E26]" />
                {fidelityProfile.tier} ({fidelityProfile.pointsMultiplier}x)
              </span>
              <span className="block text-[10px] text-[#648692] mt-1 font-semibold">
                +25% bonus sur chaque commande
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EADBCE] bg-[#F8F4EC]/70 px-4 pt-2">
          <button
            id="fidelity-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#D9943B] text-[#0A2B35]'
                : 'border-transparent text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            id="fidelity-tab-vouchers"
            onClick={() => setActiveTab('vouchers')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'vouchers'
                ? 'border-[#D9943B] text-[#0A2B35]'
                : 'border-transparent text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <span>Bons & Échange</span>
            <span className="badge-gradient-soft-primary text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
              {fidelityProfile.vouchers.filter((v) => !v.isUsed).length}
            </span>
          </button>
          <button
            id="fidelity-tab-history"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#D9943B] text-[#0A2B35]'
                : 'border-transparent text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            Historique ({fidelityProfile.transactions.length})
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {redeemFeedback && (
            <div className="bg-[#F7EBD9] border border-[#D9943B] text-[#0A2B35] text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-[#D9943B] shrink-0" />
              <span>{redeemFeedback}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-3.5">
              {/* Tier Progress Card */}
              <div className="bg-[#F8F4EC] rounded-2xl p-3.5 border border-[#EADBCE] space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#0A2B35]">
                    <Award size={16} className="text-[#D9943B]" />
                    <span>Progression vers {isVipBaraka ? 'VIP Maximum' : 'VIP Baraka'}</span>
                  </div>
                  <span className="font-extrabold text-[#D9943B]">{progressPercent}%</span>
                </div>

                <div className="w-full bg-[#EADBCE] h-2 rounded-full overflow-hidden">
                  <div
                    className="btn-gradient-fusion h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-[#648692] font-medium">
                  <span>Cumul à vie : {fidelityProfile.lifetimeEarned} pts</span>
                  <span>Objectif : {targetPoints} pts</span>
                </div>
              </div>

              {/* How it Works Rules */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#EADBCE] shadow-xs space-y-2.5">
                <h3 className="font-bold text-xs text-[#0A2B35] flex items-center gap-1.5">
                  <Info size={15} className="text-[#D9943B]" />
                  <span>Comment cumuler des points à Ahmed Rachedi ?</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#F7EBD9]/60 border border-[#EADBCE]">
                    <span className="w-5 h-5 rounded-full bg-[#D9943B] text-[#071E26] font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-[#0A2B35] block">Commandes locales</span>
                      <span className="text-[#648692] text-[11px]">
                        Gagnez 1 point pour chaque 10 DZD dépensés chez les commerçants d'Ahmed Rachedi (avec booster 1.25x en Gold).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#F8F4EC] border border-[#EADBCE]">
                    <span className="w-5 h-5 rounded-full bg-[#0A2B35] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-[#0A2B35] block">Évaluations vérifiées (+50 pts & +30 pts)</span>
                      <span className="text-[#648692] text-[11px]">
                        Attribuez des étoiles au restaurant et au livreur après réception pour débloquer des points immédiats.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-[#F7EBD9]/60 border border-[#EADBCE]">
                    <span className="w-5 h-5 rounded-full btn-gradient-tertiary text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-[#0A2B35] block">Bons d’achat instantanés</span>
                      <span className="text-[#648692] text-[11px]">
                        Convertissez vos points en bons d'achat de 100 à 500 DZD déductibles directement au paiement.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action to Vouchers */}
              <button
                id="view-vouchers-cta-btn"
                onClick={() => setActiveTab('vouchers')}
                className="w-full h-11 bg-[#0A2B35] hover:bg-[#114250] active:scale-[0.99] text-[#D9943B] rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Ticket size={16} />
                <span>Convertir mes points en bons d’achat →</span>
              </button>
            </div>
          )}

          {/* TAB 2: VOUCHERS & REDEMPTION */}
          {activeTab === 'vouchers' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#648692] mb-2">
                  Bons disponibles à l'échange
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableVoucherPacks.map((pack, idx) => {
                    const canAfford = fidelityProfile.pointsBalance >= pack.pointsCost;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                          canAfford
                            ? 'bg-[#F7EBD9]/40 border-[#EADBCE] shadow-xs'
                            : 'bg-[#F8F4EC] border-[#EADBCE] opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-extrabold text-[#0A2B35]">
                              {pack.title}
                            </span>
                            <span className="badge-gradient-tertiary text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
                              -{Math.round((pack.discountDZD / pack.minSpendDZD) * 100)}%
                            </span>
                          </div>
                          <p className="text-[10px] text-[#648692] mt-1">
                            Valable dès {pack.minSpendDZD} DZD d'achats à Ahmed Rachedi
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#EADBCE]/60 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#0A2B35]">
                            {pack.pointsCost} pts
                          </span>
                          <button
                            id={`redeem-voucher-btn-${pack.pointsCost}`}
                            disabled={!canAfford}
                            onClick={() => handleClaim(pack)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-extrabold transition-transform active:scale-95 cursor-pointer ${
                              canAfford
                                ? 'btn-gradient-primary shadow-xs'
                                : 'bg-[#EADBCE] text-[#648692] cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'Échanger' : 'Manque de pts'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* My active vouchers */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Mes Bons Enregistrés
                </h3>

                {fidelityProfile.vouchers.length === 0 ? (
                  <div className="text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400 text-xs">
                    Aucun bon pour le moment. Échangez vos points ci-dessus !
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fidelityProfile.vouchers.map((v) => (
                      <div
                        key={v.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between ${
                          v.isUsed
                            ? 'bg-zinc-50 border-zinc-200 opacity-60'
                            : 'bg-white border-emerald-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              v.isUsed
                                ? 'bg-zinc-200 text-zinc-500'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <Ticket size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-900">{v.title}</span>
                              {v.isUsed ? (
                                <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.2 rounded font-bold">
                                  Utilisé
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                  Actif
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 block font-mono mt-0.5">
                              Code : {v.code} • Expire le {v.expiresAt}
                            </span>
                          </div>
                        </div>

                        {!v.isUsed && (
                          <button
                            onClick={() => handleCopyCode(v.code)}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Copy size={12} />
                            <span>{copiedCode === v.code ? 'Copié !' : 'Copier'}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Journal des transactions fidélité
                </h3>
                {onOpenPointsHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPointsHistory();
                    }}
                    className="text-[11px] text-amber-800 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Détail par commande (DB) →</span>
                  </button>
                )}
              </div>

              {onOpenPointsHistory && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenPointsHistory();
                  }}
                  className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-600" />
                    <div>
                      <p className="font-bold text-xs text-amber-950">
                        Historique certifié des commandes
                      </p>
                      <p className="text-[10px] text-amber-800">
                        Consulter chaque article acheté et le calcul exact des points
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-amber-700" />
                </div>
              )}

              {fidelityProfile.transactions.map((tx) => {
                const isEarn = tx.points > 0;
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-white border border-black/5 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isEarn
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isEarn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-900 block">{tx.description}</span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {tx.timestamp}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-extrabold ${
                        isEarn ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isEarn ? `+${tx.points}` : tx.points} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom footer button */}
        <div className="p-3 bg-[#F8F4EC] border-t border-[#EADBCE] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0A2B35] hover:bg-[#114250] text-[#D9943B] text-xs font-bold transition-transform active:scale-95 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
