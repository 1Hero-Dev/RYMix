import React from 'react';
import { Wifi, WifiOff, RefreshCw, ShieldCheck } from 'lucide-react';
import { NetworkQuality } from '../types';

interface Props {
  networkQuality: NetworkQuality;
  isSyncing?: boolean;
  onManualRetry?: () => void;
  orderNumber?: string;
}

export const NetworkStatusBanner: React.FC<Props> = ({
  networkQuality,
  isSyncing,
  onManualRetry,
  orderNumber,
}) => {
  if (networkQuality === 'ONLINE') return null;

  return (
    <div
      className={`px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors shadow-xs ${
        networkQuality === 'DEGRADED'
          ? 'bg-amber-500 text-amber-950 border-b border-amber-600/30'
          : 'bg-rose-600 text-white border-b border-rose-700'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {networkQuality === 'DEGRADED' ? (
          <Wifi size={15} className="animate-pulse shrink-0" />
        ) : (
          <WifiOff size={15} className="shrink-0" />
        )}

        <div className="truncate">
          {networkQuality === 'DEGRADED' ? (
            <span>
              Réseau faible à Ahmed Rachedi • {orderNumber ? `Commande ${orderNumber} sécurisée` : 'Données synchronisées'}
            </span>
          ) : (
            <span>
              Hors-ligne • Synchronisation automatique dès rétablissement du réseau
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {isSyncing ? (
          <RefreshCw size={13} className="animate-spin text-current" />
        ) : (
          onManualRetry && (
            <button
              onClick={onManualRetry}
              className="text-[10px] bg-black/15 hover:bg-black/25 px-2 py-0.5 rounded-full font-bold transition-all"
            >
              Actualiser
            </button>
          )
        )}
      </div>
    </div>
  );
};
