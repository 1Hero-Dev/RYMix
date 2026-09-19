import React, { useState } from 'react';
import {
  X,
  Database,
  Crown,
  Store,
  Bike,
  Receipt,
  Download,
  RotateCcw,
  Search,
  CheckCircle2,
  HardDrive,
  Coins,
  Star,
  Sparkles,
} from 'lucide-react';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { databaseAdmin } from '../db/localDatabase';

interface Props {
  isOpen?: boolean;
  onClose: () => void;
}

export const DatabaseInspectorModal: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const {
    fidelityProfile,
    merchantReviews,
    courierReviews,
    purchasingHistory,
    dbSummary,
    resetToSeeds,
  } = useLocalDatabase();

  const [activeTable, setActiveTable] = useState<
    'fidelity' | 'merchants' | 'couriers' | 'purchases' | 'raw_json'
  >('fidelity');
  const [searchFilter, setSearchFilter] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const jsonStr = databaseAdmin.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rym-database-ahmedrachedi43-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback('Base de données exportée avec succès !');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReset = () => {
    resetToSeeds();
    setFeedback('Données réinitialisées aux valeurs par défaut d\'Ahmed Rachedi.');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div
      id="db-inspector-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200"
    >
      <div
        id="db-inspector-card"
        className="bg-[#121316] text-zinc-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-zinc-800"
      >
        {/* Header */}
        <div className="bg-[#18191E] px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#D9943B] text-[#071E26]">
              <Database size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-white">
                  Console d'Administration des Bases de Données
                </h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-800">
                  LOCAL ENGINE V1
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Ahmed Rachedi • Fidélité, Avis Commerçants, Notes Coursiers & Historique Achats
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Database Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#15161A] border-b border-zinc-800/80 text-xs">
          <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Points en circulation</span>
            <span className="font-extrabold text-[#E5A34C] text-sm">
              {dbSummary.fidelityTotalPointsInCirculation} pts
            </span>
          </div>

          <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Avis Commerçants</span>
            <span className="font-extrabold text-[#D9943B] text-sm">
              {dbSummary.merchantReviewsCount} avis ({dbSummary.merchantAverageOverall}★)
            </span>
          </div>

          <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Notes Coursiers</span>
            <span className="font-extrabold text-blue-400 text-sm">
              {dbSummary.courierReviewsCount} notes ({dbSummary.courierAverageOverall}★)
            </span>
          </div>

          <div className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block mb-0.5">Volume d'achats</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              {dbSummary.totalRevenueDZD} DZD
            </span>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-3 pt-2 overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => setActiveTable('fidelity')}
            className={`pb-2 px-2.5 font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTable === 'fidelity'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Crown size={14} />
            <span>Fidélité ({fidelityProfile.transactions.length} txns)</span>
          </button>

          <button
            onClick={() => setActiveTable('merchants')}
            className={`pb-2 px-2.5 font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTable === 'merchants'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Store size={14} />
            <span>Avis Commerçants ({merchantReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTable('couriers')}
            className={`pb-2 px-2.5 font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTable === 'couriers'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bike size={14} />
            <span>Notes Coursiers ({courierReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTable('purchases')}
            className={`pb-2 px-2.5 font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTable === 'purchases'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Receipt size={14} />
            <span>Historique Achats ({purchasingHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTable('raw_json')}
            className={`pb-2 px-2.5 font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTable === 'raw_json'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive size={14} />
            <span>JSON Raw</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="bg-emerald-950 border-b border-emerald-800 text-emerald-300 text-xs px-4 py-2 flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Table Content View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {/* 1. FIDELITY TABLE */}
          {activeTable === 'fidelity' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-1">
                <div className="text-zinc-400">TABLE: customer_fidelity_profiles</div>
                <div className="text-white font-bold">
                  Utilisateur : {fidelityProfile.userName} ({fidelityProfile.phone})
                </div>
                <div className="text-zinc-400">
                  Solde : <strong className="text-amber-400">{fidelityProfile.pointsBalance} pts</strong> • Palier :{' '}
                  <span className="text-emerald-400">{fidelityProfile.tier} ({fidelityProfile.pointsMultiplier}x)</span>
                </div>
                <div className="text-zinc-400">
                  Cumul à vie : {fidelityProfile.lifetimeEarned} pts gagnés / {fidelityProfile.lifetimeSpent} pts utilisés
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-zinc-400 text-[11px] uppercase tracking-wider">
                  Journal des Transactions (fidelity_transactions)
                </div>
                {fidelityProfile.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-zinc-900/70 rounded-xl border border-zinc-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="text-zinc-200 font-sans font-semibold">{tx.description}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {tx.type} • {tx.timestamp} {tx.orderNumber && `• Commande ${tx.orderNumber}`}
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        tx.points > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MERCHANT REVIEWS TABLE */}
          {activeTable === 'merchants' && (
            <div className="space-y-2.5">
              <div className="text-zinc-400 text-[11px] uppercase tracking-wider">
                TABLE: merchant_ratings_and_reviews ({merchantReviews.length} entrées)
              </div>

              {merchantReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start font-sans">
                    <div>
                      <span className="font-bold text-white text-sm">{rev.storeName}</span>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        Commande {rev.orderNumber} • Client: {rev.customerName} • {rev.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-800/80 font-bold">
                      <Star size={12} className="fill-current" />
                      <span>{rev.overallRating}/5</span>
                    </div>
                  </div>

                  <p className="text-zinc-300 font-sans italic">"{rev.comment}"</p>

                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-950 p-2 rounded-lg">
                    <span>Goût: {rev.criteria.foodTaste}★</span>
                    <span>Emballage: {rev.criteria.packaging}★</span>
                    <span>Vitesse: {rev.criteria.speed}★</span>
                    <span>Portion: {rev.criteria.portionSize}★</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {rev.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {rev.merchantReply && (
                    <div className="p-2 bg-amber-950/30 border border-amber-900/50 rounded-xl font-sans text-[11px] text-amber-200">
                      <strong>Réponse du commerçant :</strong> {rev.merchantReply.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 3. COURIER REVIEWS TABLE */}
          {activeTable === 'couriers' && (
            <div className="space-y-2.5">
              <div className="text-zinc-400 text-[11px] uppercase tracking-wider">
                TABLE: courier_ratings_and_tips ({courierReviews.length} entrées)
              </div>

              {courierReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start font-sans">
                    <div>
                      <span className="font-bold text-white text-sm">{rev.courierName}</span>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        Course {rev.orderNumber} • Évalué par: {rev.customerName} • {rev.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {rev.tipAmountDZD > 0 && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-800 font-bold">
                          Pourboire: +{rev.tipAmountDZD} DZD
                        </span>
                      )}
                      <div className="flex items-center gap-1 bg-yellow-950/80 text-yellow-300 px-2 py-0.5 rounded-lg border border-yellow-800/80 font-bold">
                        <Star size={12} className="fill-current" />
                        <span>{rev.rating}/5</span>
                      </div>
                    </div>
                  </div>

                  {rev.feedbackNote && (
                    <p className="text-zinc-300 font-sans italic">"{rev.feedbackNote}"</p>
                  )}

                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-950 p-2 rounded-lg">
                    <span>Ponctualité: {rev.criteria.punctuality}★</span>
                    <span>Politesse: {rev.criteria.politeness}★</span>
                    <span>Code Route: {rev.criteria.routeRespect}★</span>
                    <span>Colis: {rev.criteria.foodHandling}★</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {rev.complimentTags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] bg-zinc-800 text-blue-300 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. PURCHASING HISTORY TABLE */}
          {activeTable === 'purchases' && (
            <div className="space-y-2.5">
              <div className="text-zinc-400 text-[11px] uppercase tracking-wider">
                TABLE: customer_purchasing_history ({purchasingHistory.length} commandes)
              </div>

              {purchasingHistory.map((pur) => (
                <div
                  key={pur.id}
                  className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start font-sans">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{pur.storeName}</span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.2 rounded font-mono">
                          {pur.orderNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        N° Reçu: {pur.receiptNumber} • {pur.orderedAt}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#D91A67] text-sm">{pur.total} DZD</span>
                      <span className="block text-[10px] text-emerald-400 font-mono">
                        +{pur.pointsEarned} pts fidélité
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 font-sans space-y-0.5 pl-2 border-l-2 border-zinc-800">
                    {pur.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {it.quantity}× {it.name}
                        </span>
                        <span className="font-mono text-zinc-300">
                          {it.basePrice * it.quantity} DZD
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800">
                    <span>Livreur: {pur.courierName}</span>
                    <span>
                      Statut Avis: Resto {pur.isRatedMerchant ? '✓' : '✗'} • Livreur{' '}
                      {pur.isRatedCourier ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 5. RAW JSON TABLE */}
          {activeTable === 'raw_json' && (
            <pre className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-[10px] text-emerald-400 overflow-x-auto leading-relaxed">
              {databaseAdmin.exportDatabaseJSON()}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#18191E] border-t border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="h-9 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              <Download size={14} />
              <span>Exporter JSON</span>
            </button>
            <button
              onClick={handleReset}
              className="h-9 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              <RotateCcw size={14} />
              <span>Réinitialiser</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="h-9 px-5 bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer Console
          </button>
        </div>
      </div>
    </div>
  );
};
