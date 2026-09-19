import React from 'react';
import { MerchantTab } from '../types';
import { ChefHat, UtensilsCrossed, MessageSquare, BarChart3, Store } from 'lucide-react';

interface Props {
  activeTab: MerchantTab;
  onSelectTab: (tab: MerchantTab) => void;
  pendingCount: number;
  unreadCount?: number;
}

export const MerchantBottomNavBar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  pendingCount,
  unreadCount = 1,
}) => {
  const tabs = [
    {
      id: 'orders' as MerchantTab,
      label: 'Commandes',
      icon: ChefHat,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'menu' as MerchantTab,
      label: 'Menu',
      icon: UtensilsCrossed,
    },
    {
      id: 'messages' as MerchantTab,
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'analytics' as MerchantTab,
      label: 'Finances',
      icon: BarChart3,
    },
    {
      id: 'store' as MerchantTab,
      label: 'Boutique',
      icon: Store,
    },
  ];

  return (
    <nav
      aria-label="Navigation Commerçant Ahmed Rachedi"
      className="fixed bottom-0 left-0 right-0 w-full max-w-5xl mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-[#EADBCE] shadow-[0px_-2px_12px_rgba(7,30,38,0.06)] flex justify-around items-center px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
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
              isActive ? 'text-[#0A2B35]' : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#D9943B] text-[#071E26] shadow-xs scale-105' : 'hover:bg-[#F8F4EC] text-[#0A2B35]'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} className={isActive ? 'text-[#071E26]' : 'text-[#0A2B35]'} />
              </div>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 btn-gradient-tertiary text-white text-[9px] font-extrabold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>

            <span
              className={`text-[9.5px] min-[360px]:text-[10px] mt-0.5 tracking-tight hidden min-[330px]:block truncate max-w-[56px] min-[360px]:max-w-[64px] ${
                isActive ? 'font-bold text-[#0A2B35]' : 'font-medium'
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
