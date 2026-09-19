import React from 'react';
import { CourierTab } from '../types';
import { Compass, Navigation, MessageSquare, Wallet, ShieldCheck, Layers } from 'lucide-react';

interface Props {
  activeTab: CourierTab;
  onSelectTab: (tab: CourierTab) => void;
  availableCount: number;
  hasActiveOrder: boolean;
  batchCount?: number;
  hasActiveBatch?: boolean;
  unreadCount?: number;
}

export const CourierBottomNavBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  availableCount,
  hasActiveOrder,
  batchCount = 2,
  hasActiveBatch = false,
  unreadCount = 2,
}) => {
  const tabs = [
    {
      id: 'missions' as CourierTab,
      label: 'Missions',
      icon: Compass,
      badge: availableCount > 0 ? availableCount : undefined,
    },
    {
      id: 'batch' as CourierTab,
      label: 'Tournée',
      icon: Layers,
      badge: batchCount > 0 ? batchCount : undefined,
      pulse: hasActiveBatch,
    },
    {
      id: 'active' as CourierTab,
      label: 'Course',
      icon: Navigation,
      pulse: hasActiveOrder,
    },
    {
      id: 'messages' as CourierTab,
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'earnings' as CourierTab,
      label: 'Gains',
      icon: Wallet,
    },
    {
      id: 'profile' as CourierTab,
      label: 'Profil',
      icon: ShieldCheck,
    },
  ];

  return (
    <nav
      aria-label="Navigation Coursier Ahmed Rachedi"
      className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] mx-auto z-40 bg-[#191A1C]/95 backdrop-blur-md border-t border-white/10 shadow-[0px_-2px_12px_rgba(0,0,0,0.3)] flex justify-around items-center px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            title={tab.label}
            aria-label={tab.label}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 min-h-[44px] transition-transform active:scale-95 relative cursor-pointer ${
              isActive ? 'text-[#D9943B]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#D9943B] text-[#071E26] shadow-xs scale-105' : 'hover:bg-white/10 text-zinc-400'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} className={isActive ? 'text-[#071E26]' : 'text-zinc-400'} />
              </div>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 btn-gradient-tertiary text-white text-[9px] font-extrabold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-[#071E26] shadow-xs">
                  {tab.badge}
                </span>
              )}

              {tab.pulse && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00B578] animate-ping"></span>
              )}
            </div>

            <span
              className={`text-[9px] min-[380px]:text-[10px] mt-0.5 tracking-tight hidden min-[340px]:block truncate max-w-[52px] min-[380px]:max-w-[64px] ${
                isActive ? 'font-bold text-[#D9943B]' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
