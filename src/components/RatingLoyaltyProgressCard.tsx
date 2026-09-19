import React, { useState, useEffect } from 'react';
import {
  Star,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Gift,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { CustomerFidelityProfile, MerchantReview, CourierReview } from '../types';

interface Props {
  fidelityProfile: CustomerFidelityProfile;
  merchantReviews: MerchantReview[];
  courierReviews: CourierReview[];
  currentUserId?: string;
  onOpenFidelityModal?: () => void;
  onOpenPointsHistory?: () => void;
}

export const RatingLoyaltyProgressCard: React.FC<Props> = ({
  fidelityProfile,
  merchantReviews,
  courierReviews,
  currentUserId = 'user-amine-43',
  onOpenFidelityModal,
  onOpenPointsHistory,
}) => {
  // 1. Calculate points accumulated specifically from ratings and reviews
  const ratingTransactions = fidelityProfile.transactions.filter(
    (t) =>
      t.type === 'BONUS_REVIEW' ||
      t.description.toLowerCase().includes('avis') ||
      t.description.toLowerCase().includes('note') ||
      t.description.toLowerCase().includes('évalu') ||
      t.description.toLowerCase().includes('rating')
  );

  const pointsFromTxns = ratingTransactions.reduce(
    (acc, t) => acc + (t.points > 0 ? t.points : 0),
    0
  );

  // Count user-submitted reviews in local DB
  const userReviewsCount =
    merchantReviews.filter(
      (r) => r.customerId === currentUserId || r.customerId === 'cust-amine-43'
    ).length +
    courierReviews.filter(
      (r) => r.customerId === currentUserId || r.customerId === 'cust-amine-43'
    ).length;

  // Rating points (minimum 50 from initial seed review, or higher as user rates)
  const ratingPoints = Math.max(pointsFromTxns, userReviewsCount * 50, 50);
  const totalReviewsCount = Math.max(ratingTransactions.length, userReviewsCount, 1);

  // 2. Define Milestones
  const milestones = [
    { target: 100, reward: "Bon d'achat 100 DZD", level: 'Palier Découverte' },
    { target: 250, reward: "Bon d'achat 200 DZD", level: 'Palier Connaisseur' },
    { target: 500, reward: "Bon 300 DZD & Badge Étoile", level: 'Palier Expert Ahmed Rachedi' },
    { target: 1000, reward: 'Statut VIP Baraka Évaluateur', level: 'Palier Ambassadeur' },
  ];

  const currentMilestone =
    milestones.find((m) => m.target > ratingPoints) || milestones[milestones.length - 1];
  const targetPoints = currentMilestone.target;
  const remainingPoints = Math.max(0, targetPoints - ratingPoints);
  const targetPercentage = Math.min(100, Math.round((ratingPoints / targetPoints) * 100));

  // 3. Animated progress state for smooth Tailwind CSS rendering
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);

  useEffect(() => {
    // Smooth entry animation via Tailwind duration-1000
    const timer = setTimeout(() => {
      setAnimatedProgress(targetPercentage);
    }, 120);
    return () => clearTimeout(timer);
  }, [targetPercentage]);

  // 4. SVG Circular Geometry
  const size = 112;
  const strokeWidth = 9;
  const center = size / 2;
  const radius = center - strokeWidth - 2; // ~45px
  const circumference = 2 * Math.PI * radius; // ~282.74px
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div
      id="rating-loyalty-progress-card"
      className="card-gradient-warm rounded-2xl p-4 border border-[#EADBCE] shadow-xs hover:border-[#D9943B]/60 transition-colors"
    >
      {/* Header Label */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl btn-gradient-primary flex items-center justify-center font-bold shadow-xs">
            <Award size={18} className="text-[#071E26]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1C1B1B] flex items-center gap-1.5">
              <span>Points Fidélité des Avis</span>
              <span className="badge-gradient-soft-primary text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-[#D9943B]/30">
                +50 pts/avis
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500">
              Cumulés en évaluant vos repas et coursiers à Ahmed Rachedi
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenFidelityModal && onOpenFidelityModal()}
          className="btn-gradient-primary text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-0.5 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <span>Échanger</span>
          <ChevronRight size={13} className="text-[#071E26]" />
        </button>
      </div>

      {/* Main Content: Circular Progress Bar + Details */}
      <div className="flex items-center gap-4 bg-white/80 p-3 rounded-xl border border-[#EADBCE]">
        {/* Animated Circular Progress Bar */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
            role="progressbar"
            aria-valuenow={animatedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <defs>
              <linearGradient id="ratingCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D9943B" />
                <stop offset="60%" stopColor="#E5A34C" />
                <stop offset="100%" stopColor="#D91A67" />
              </linearGradient>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-amber-100/70"
            />

            {/* Foreground Animated Progress Circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#ratingCircleGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Content overlay in center of the circular progress indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Star size={13} className="text-[#D9943B] fill-[#D9943B] drop-shadow-xs animate-pulse" />
              <span className="text-[10px] font-black text-[#B8731E]">{animatedProgress}%</span>
            </div>
            <span className="text-xl font-black text-[#1C1B1B] leading-none tracking-tight">
              {ratingPoints}
            </span>
            <span className="text-[8px] font-black uppercase text-[#B8731E] tracking-wider mt-0.5">
              PTS AVIS
            </span>
          </div>
        </div>

        {/* Milestone & Metrics Column */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-900 truncate">
              {currentMilestone.level}
            </span>
            <span className="badge-gradient-soft-primary text-[11px] font-bold px-1.5 py-0.2 rounded border border-[#D9943B]/30">
              {ratingPoints} / {targetPoints} pts
            </span>
          </div>

          <div className="text-[11px] text-zinc-600 leading-snug">
            {remainingPoints > 0 ? (
              <span>
                Plus que <strong className="text-zinc-900">{remainingPoints} pts</strong> ({Math.ceil(remainingPoints / 50)} avis) pour débloquer :
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Objectif atteint !
              </span>
            )}
            <div className="font-extrabold text-amber-900 mt-0.5 flex items-center gap-1">
              <Gift size={12} className="text-amber-600 flex-shrink-0" />
              <span className="truncate">{currentMilestone.reward}</span>
            </div>
          </div>

          {/* Micro stats strip */}
          <div className="flex items-center gap-2 pt-1 border-t border-amber-200/50 text-[10px] text-zinc-500">
            <div className="flex items-center gap-1">
              <MessageSquare size={11} className="text-amber-600" />
              <span><strong>{totalReviewsCount}</strong> avis vérifiés</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <TrendingUp size={11} className="text-[#00B578]" />
              <span><strong>+50 pts</strong>/course</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Proof Toggle Strip */}
      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-black/[0.04] text-[11px]">
        <button
          type="button"
          onClick={() => setShowHistoryDetail(!showHistoryDetail)}
          className="text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-1 transition-colors"
        >
          <Sparkles size={12} className="text-amber-500" />
          <span>{showHistoryDetail ? 'Masquer le détail' : 'Historique des points avis'}</span>
          <ChevronRight
            size={12}
            className={`transition-transform duration-200 ${showHistoryDetail ? 'rotate-90' : ''}`}
          />
        </button>

        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 size={10} />
          <span>Synchronisé en direct</span>
        </span>
      </div>

      {/* Expandable History Drawer */}
      {showHistoryDetail && (
        <div className="mt-2.5 bg-zinc-50 rounded-xl p-2.5 border border-zinc-200/70 space-y-2 animate-in fade-in duration-200">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Dernières récompenses de notation
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {ratingTransactions.length > 0 ? (
              ratingTransactions.slice(0, 4).map((txn) => (
                <div
                  key={txn.id}
                  className="bg-white p-2 rounded-lg border border-zinc-200/60 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-zinc-900 truncate text-[11px]">
                      {txn.description}
                    </p>
                    <span className="text-[9px] text-zinc-400">{txn.timestamp}</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex-shrink-0">
                    +{txn.points} pts
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-white p-2 rounded-lg border border-zinc-200/60 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-zinc-900 text-[11px]">
                    Avis vérifié déposé sur le coursier Walid M.
                  </p>
                  <span className="text-[9px] text-zinc-400">Il y a 2 jours</span>
                </div>
                <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  +50 pts
                </span>
              </div>
            )}
          </div>

          {onOpenPointsHistory && (
            <div className="pt-1.5 border-t border-zinc-200/60 flex justify-end">
              <button
                type="button"
                onClick={onOpenPointsHistory}
                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition-colors"
              >
                <span>Historique complet des points (purchasingHistoryDB) →</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
