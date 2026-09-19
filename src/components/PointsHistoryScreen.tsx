import React, { useState, useMemo } from 'react';
import { LazyImage } from './common/LazyImage';
import {
  ArrowLeft,
  Search,
  Receipt,
  Sparkles,
  ShoppingBag,
  Store,
  Bike,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Coins,
  Crown,
  Tag,
  Star,
  Gift,
  X,
  Printer,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import {
  PurchasingHistoryRecord,
  CustomerFidelityProfile,
  FidelityTransaction,
  CartItem,
} from '../types';
import { useLocalDatabase } from '../db/useLocalDatabase';

interface Props {
  purchasingHistory?: PurchasingHistoryRecord[];
  fidelityProfile?: CustomerFidelityProfile;
  onBack: () => void;
  onOpenFidelityModal?: () => void;
}

export const PointsHistoryScreen: React.FC<Props> = ({
  purchasingHistory: propPurchasingHistory,
  fidelityProfile: propFidelityProfile,
  onBack,
  onOpenFidelityModal,
}) => {
  const localDb = useLocalDatabase();
  const purchasingHistory = propPurchasingHistory || localDb.purchasingHistory;
  const fidelityProfile = propFidelityProfile || localDb.fidelityProfile;

  const [selectedTab, setSelectedTab] = useState<'all' | 'orders' | 'reviews' | 'vouchers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PurchasingHistoryRecord | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // 1. Calculate aggregated loyalty metrics from purchasingHistoryDB
  const totalOrdersPointsEarned = useMemo(() => {
    return purchasingHistory.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
  }, [purchasingHistory]);

  const totalOrdersSpendDZD = useMemo(() => {
    return purchasingHistory.reduce((sum, r) => sum + (r.total || 0), 0);
  }, [purchasingHistory]);

  const averagePointsPerOrder = useMemo(() => {
    if (purchasingHistory.length === 0) return 0;
    return Math.round(totalOrdersPointsEarned / purchasingHistory.length);
  }, [purchasingHistory, totalOrdersPointsEarned]);

  // Non-order bonus points (welcome, reviews, etc.)
  const bonusTransactions = useMemo(() => {
    return fidelityProfile.transactions.filter(
      (t) => t.type !== 'EARN' && t.type !== 'REDEEM'
    );
  }, [fidelityProfile.transactions]);

  const totalBonusPoints = useMemo(() => {
    return bonusTransactions.reduce((sum, t) => sum + (t.points > 0 ? t.points : 0), 0);
  }, [bonusTransactions]);

  // 2. Filter records according to tab and search query
  const filteredPurchases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return purchasingHistory.filter((rec) => {
      if (!q) return true;
      const matchStore = rec.storeName.toLowerCase().includes(q);
      const matchOrder = rec.orderNumber.toLowerCase().includes(q);
      const matchReceipt = rec.receiptNumber.toLowerCase().includes(q);
      const matchItem = rec.items.some((it) => it.name.toLowerCase().includes(q));
      return matchStore || matchOrder || matchReceipt || matchItem;
    });
  }, [purchasingHistory, searchQuery]);

  const filteredNonOrderTxns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fidelityProfile.transactions.filter((tx) => {
      // Exclude EARN if they already correspond to purchasing history
      if (selectedTab === 'orders') return false;
      if (selectedTab === 'reviews' && tx.type !== 'BONUS_REVIEW') return false;
      if (selectedTab === 'vouchers' && tx.type !== 'REDEEM') return false;

      if (!q) return true;
      return tx.description.toLowerCase().includes(q);
    });
  }, [fidelityProfile.transactions, selectedTab, searchQuery]);

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  return (
    <div id="points-history-screen" className="flex-1 flex flex-col bg-neutral-50 min-h-screen">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/[0.05] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="points-history-btn-back"
              onClick={onBack}
              aria-label="Retour au profil"
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-zinc-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-extrabold text-[16px] text-zinc-900 leading-tight flex items-center gap-1.5">
                <span>Historique des points</span>
                <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-300">
                  Wilaya 43
                </span>
              </h1>
              <p className="text-[11px] text-zinc-500">
                Transactions certifiées & détails des commandes (purchasingHistoryDB)
              </p>
            </div>
          </div>

          {onOpenFidelityModal && (
            <button
              id="points-history-btn-redeem"
              onClick={onOpenFidelityModal}
              className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
            >
              <Gift size={13} className="text-amber-700" />
              <span>Échanger</span>
            </button>
          )}
        </div>

        {/* Quick Search Bar */}
        <div className="mt-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="points-history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par commerce, n° de commande, article..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white rounded-xl border border-transparent focus:border-amber-400 focus:outline-none transition-colors text-zinc-900 placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full px-1.5 py-0.5"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            id="tab-all"
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTab === 'all'
                ? 'bg-zinc-900 text-white font-bold'
                : 'bg-neutral-100 text-zinc-600 hover:bg-neutral-200'
            }`}
          >
            Tous les gains
          </button>
          <button
            id="tab-orders"
            onClick={() => setSelectedTab('orders')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedTab === 'orders'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'bg-neutral-100 text-zinc-600 hover:bg-neutral-200'
            }`}
          >
            <ShoppingBag size={12} />
            <span>Commandes livrées ({purchasingHistory.length})</span>
          </button>
          <button
            id="tab-reviews"
            onClick={() => setSelectedTab('reviews')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedTab === 'reviews'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'bg-neutral-100 text-zinc-600 hover:bg-neutral-200'
            }`}
          >
            <Star size={12} />
            <span>Avis vérifiés (+50 pts)</span>
          </button>
          <button
            id="tab-vouchers"
            onClick={() => setSelectedTab('vouchers')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
              selectedTab === 'vouchers'
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'bg-neutral-100 text-zinc-600 hover:bg-neutral-200'
            }`}
          >
            <Tag size={12} />
            <span>Bons échangés</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-3 pb-24">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white p-2.5 rounded-xl border border-black/[0.04] shadow-xs text-center">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
              Solde Actuel
            </span>
            <span className="text-sm font-black text-[#1C1B1B] block mt-0.5">
              {fidelityProfile.pointsBalance}
            </span>
            <span className="text-[9px] text-amber-700 font-semibold">pts Terroir</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-black/[0.04] shadow-xs text-center">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
              Via Achats DB
            </span>
            <span className="text-sm font-black text-emerald-700 block mt-0.5">
              +{totalOrdersPointsEarned}
            </span>
            <span className="text-[9px] text-zinc-500 font-medium">
              {purchasingHistory.length} commandes
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-black/[0.04] shadow-xs text-center">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
              Dépenses Éligibles
            </span>
            <span className="text-sm font-black text-zinc-900 block mt-0.5 truncate">
              {totalOrdersSpendDZD.toLocaleString()}
            </span>
            <span className="text-[9px] text-zinc-500 font-medium">DZD à Rachedi</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-black/[0.04] shadow-xs text-center">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
              Multiplicateur
            </span>
            <span className="text-sm font-black text-amber-800 block mt-0.5">
              {fidelityProfile.pointsMultiplier}x
            </span>
            <span className="text-[9px] text-amber-700 font-bold">{fidelityProfile.tier}</span>
          </div>
        </div>

        {/* Informative Rule Callout */}
        <div className="bg-gradient-to-r from-amber-50/80 via-yellow-50/50 to-white rounded-xl p-3 border border-amber-200/70 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-200/70 flex items-center justify-center text-amber-900 shrink-0 mt-0.5">
            <Coins size={14} />
          </div>
          <div className="text-[11px] text-zinc-700 leading-snug">
            <span className="font-bold text-zinc-900">Règle de cumul purchasingHistoryDB : </span>
            Chaque 10 DZD dépensés sur vos repas et courses à Ahmed Rachedi génère 1 point de base,
            multiplié par votre statut <strong className="text-amber-900">{fidelityProfile.tier} ({fidelityProfile.pointsMultiplier}x)</strong>.
            L'évaluation du repas et du livreur crédite un bonus immédiat de <strong className="text-emerald-700">+50 points</strong> !
          </div>
        </div>

        {/* Section: Purchases from purchasingHistoryDB */}
        {(selectedTab === 'all' || selectedTab === 'orders') && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-amber-600" />
                <span>Commandes ayant généré des points ({filteredPurchases.length})</span>
              </h2>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                purchasingHistoryDB synchronisé
              </span>
            </div>

            {filteredPurchases.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center border border-black/[0.04]">
                <ShoppingBag size={24} className="mx-auto text-zinc-300 mb-1.5" />
                <p className="text-xs font-bold text-zinc-700">Aucune commande trouvée</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Aucune commande ne correspond aux filtres actuels.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPurchases.map((record) => {
                  const isExpanded = expandedOrderId === record.id;
                  const basePointsBeforeMultiplier = Math.floor(record.total / 10);

                  return (
                    <div
                      key={record.id}
                      id={`purchasing-record-${record.id}`}
                      className="bg-white rounded-2xl border border-black/[0.05] shadow-xs overflow-hidden transition-all hover:border-amber-200/80"
                    >
                      {/* Card Header */}
                      <div className="p-3.5 flex items-start justify-between gap-3 border-b border-black/[0.03]">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-black/[0.06]">
                            <LazyImage
                              src={record.storeImageUrl}
                              alt={record.storeName}
                              placeholderType="store"
                              targetWidth={110}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-extrabold text-xs text-zinc-900 truncate">
                                {record.storeName}
                              </h3>
                              <span className="text-[9px] font-bold text-zinc-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                                {record.orderNumber}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {record.storeCategory} • Reçu n° {record.receiptNumber}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Clock size={10} className="text-zinc-400" />
                                {record.deliveredAt || record.orderedAt}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Bike size={10} className="text-zinc-400" />
                                Livré par {record.courierName || 'Walid M.'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Points Badge & Amount */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-lg shadow-2xs">
                            <Sparkles size={11} className="text-amber-600" />
                            +{record.pointsEarned} pts
                          </span>
                          <span className="block text-xs font-extrabold text-zinc-900 mt-1">
                            {record.total} <span className="text-[9px] font-normal text-zinc-500">DZD (COD)</span>
                          </span>
                        </div>
                      </div>

                      {/* Points Generation Formula Breakdown */}
                      <div className="bg-amber-50/40 px-3.5 py-2 border-b border-amber-100/60 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 text-zinc-700">
                          <Coins size={12} className="text-amber-600 shrink-0" />
                          <span>
                            <strong>Calcul fidélité :</strong> {record.total} DZD ÷ 10 ={' '}
                            {basePointsBeforeMultiplier} pts × {fidelityProfile.pointsMultiplier} (Club {fidelityProfile.tier}) ={' '}
                            <strong className="text-amber-900">+{record.pointsEarned} pts</strong>
                          </span>
                        </div>
                        <span className="text-emerald-700 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 flex items-center gap-0.5 text-[9px]">
                          <CheckCircle2 size={10} />
                          Crédité
                        </span>
                      </div>

                      {/* Summary Items Strip */}
                      <div className="px-3.5 py-2.5 text-xs">
                        <div className="flex items-center justify-between text-zinc-600 mb-1.5">
                          <span className="text-[11px] font-semibold text-zinc-700">
                            {record.items.length} article{record.items.length > 1 ? 's' : ''} commandé{record.items.length > 1 ? 's' : ''} :
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExpandOrder(record.id)}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-0.5"
                          >
                            <span>{isExpanded ? 'Masquer détails' : 'Voir les articles'}</span>
                            <ChevronRight
                              size={12}
                              className={`transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {/* Collapsed single line summary */}
                        {!isExpanded && (
                          <p className="text-[11px] text-zinc-500 truncate">
                            {record.items.map((it) => `${it.quantity}x ${it.name}`).join(' • ')}
                          </p>
                        )}

                        {/* Expanded items list */}
                        {isExpanded && (
                          <div className="space-y-1.5 bg-neutral-50/80 p-2.5 rounded-xl border border-black/[0.03] mt-2 animate-in fade-in duration-150">
                            {record.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[11px] text-zinc-700"
                              >
                                <span className="truncate pr-2">
                                  <strong className="text-zinc-900">{item.quantity}x</strong> {item.name}
                                </span>
                                <span className="font-bold shrink-0">
                                  {item.basePrice * item.quantity} DZD
                                </span>
                              </div>
                            ))}

                            <div className="pt-2 mt-2 border-t border-zinc-200/60 flex justify-between text-[10px] text-zinc-500">
                              <span>Sous-total: {record.subtotal} DZD</span>
                              <span>Livraison: {record.deliveryFee} DZD</span>
                              <span>Emballage: {record.packagingFee} DZD</span>
                              {record.discount > 0 && (
                                <span className="text-emerald-700 font-bold">
                                  Remise: -{record.discount} DZD
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-3.5 py-2.5 bg-neutral-50/50 border-t border-black/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                          <span className="font-medium text-zinc-600">
                            Paiement : {record.paymentMethod === 'COD' ? 'Espèces à la livraison (COD)' : record.paymentMethod}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(record)}
                          className="text-[11px] font-bold text-zinc-800 hover:text-zinc-950 bg-white hover:bg-zinc-100 border border-black/[0.08] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                        >
                          <Receipt size={12} className="text-amber-600" />
                          <span>Voir le reçu numérique</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section: Non-Order Bonus Transactions (Reviews, Welcome Bonus, etc.) */}
        {(selectedTab === 'all' || selectedTab === 'reviews' || selectedTab === 'vouchers') && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" />
                <span>Autres bonus & mouvements de points ({filteredNonOrderTxns.length})</span>
              </h2>
            </div>

            <div className="space-y-2">
              {filteredNonOrderTxns.map((tx) => {
                const isPositive = tx.points > 0;
                const isReviewBonus = tx.type === 'BONUS_REVIEW';
                const isWelcomeBonus = tx.type === 'BONUS_WELCOME';

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-white border border-black/[0.05] shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isReviewBonus
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isWelcomeBonus
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : isPositive
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {isReviewBonus ? (
                          <Star size={16} className="text-amber-600 fill-amber-500" />
                        ) : isWelcomeBonus ? (
                          <Crown size={16} className="text-purple-600" />
                        ) : isPositive ? (
                          <TrendingUp size={16} className="text-emerald-600" />
                        ) : (
                          <Tag size={16} className="text-zinc-600" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-xs text-zinc-900 block truncate">
                          {tx.description}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {tx.timestamp}
                          </span>
                          <span>•</span>
                          <span className="uppercase font-semibold tracking-wider text-[9px] text-zinc-500">
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg inline-block ${
                          isPositive
                            ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                            : 'text-amber-800 bg-amber-50 border border-amber-200'
                        }`}
                      >
                        {isPositive ? `+${tx.points}` : tx.points} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Digital Receipt Modal (Purchasing History Inspection) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            id="digital-receipt-modal"
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-black/10 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-[#071E26] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-[#D9943B]" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">Ticket de Caisse Numérique</h3>
                  <p className="text-[10px] text-[#648692]">{selectedReceipt.receiptNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-4 overflow-y-auto space-y-3 text-xs flex-1">
              {/* Official Store & Location Header */}
              <div className="text-center pb-3 border-b border-dashed border-zinc-200">
                <span className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase block">
                  RYM EXPRESS • AHMED RACHEDI, MILA (43)
                </span>
                <h4 className="font-black text-sm text-zinc-900 mt-0.5">
                  {selectedReceipt.storeName}
                </h4>
                <p className="text-[11px] text-zinc-500">{selectedReceipt.storeCategory}</p>
                <div className="mt-1 inline-flex items-center gap-1 bg-neutral-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-mono">
                  <span>Réf : {selectedReceipt.orderNumber}</span>
                  <span>•</span>
                  <span>{selectedReceipt.deliveredAt || selectedReceipt.orderedAt}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                  Détail des consommations
                </span>
                {selectedReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-zinc-900 leading-snug">
                        {item.quantity}x {item.name}
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        {item.basePrice} DZD / unité
                      </span>
                    </div>
                    <span className="font-bold text-zinc-900 shrink-0">
                      {item.basePrice * item.quantity} DZD
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Subtotals */}
              <div className="pt-2 border-t border-dashed border-zinc-200 space-y-1 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>Sous-total articles</span>
                  <span>{selectedReceipt.subtotal} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de livraison Ahmed Rachedi</span>
                  <span>{selectedReceipt.deliveryFee} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Emballage isotherme</span>
                  <span>{selectedReceipt.packagingFee} DZD</span>
                </div>
                {selectedReceipt.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Bon de réduction appliqué</span>
                    <span>-{selectedReceipt.discount} DZD</span>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-300 flex justify-between items-baseline text-sm font-black text-zinc-900">
                  <span>TOTAL RÉGLÉ (COD)</span>
                  <span className="text-base text-zinc-900">{selectedReceipt.total} DZD</span>
                </div>
              </div>

              {/* Fidelity Points Attribution Block */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-600" />
                    Points Terroir Générés
                  </span>
                  <span className="text-xs font-black bg-amber-200/80 px-2 py-0.5 rounded text-amber-900">
                    +{selectedReceipt.pointsEarned} pts
                  </span>
                </div>
                <p className="text-[10px] text-amber-800/90 leading-tight">
                  Crédités sur le compte client de la Wilaya 43 avec le multiplicateur{' '}
                  <strong>{fidelityProfile.tier} ({fidelityProfile.pointsMultiplier}x)</strong>.
                </p>
              </div>

              {/* Delivery info & Signature */}
              <div className="bg-neutral-50 rounded-xl p-2.5 border border-black/[0.03] text-[10px] text-zinc-500 space-y-0.5">
                <div className="flex justify-between">
                  <span>Livreur assigné :</span>
                  <strong className="text-zinc-700">{selectedReceipt.courierName || 'Walid M.'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Statut règlement :</span>
                  <strong className="text-emerald-700 font-bold">ENCAISSÉ EN ESPÈCES</strong>
                </div>
                <div className="flex justify-between">
                  <span>Adresse livraison :</span>
                  <span className="text-zinc-700 truncate max-w-[180px]">
                    {selectedReceipt.deliveryAddress.street}, {selectedReceipt.deliveryAddress.commune}
                  </span>
                </div>
              </div>

              {/* Stamp / Security Hash */}
              <div className="text-center pt-2 text-[9px] text-zinc-400 space-y-0.5 font-mono">
                <p className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
                  <ShieldCheck size={11} /> Reçu certifié conforme purchasingHistoryDB
                </p>
                <p>MILA-43-SECURE-HASH-{selectedReceipt.id}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-neutral-50 border-t border-black/[0.05] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
              >
                Fermer le reçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
