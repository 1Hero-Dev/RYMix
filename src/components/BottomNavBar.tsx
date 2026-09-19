import React, { useMemo } from 'react';
import { CustomerTab } from '../types';
import { Home, Compass, ReceiptText, MessageCircle, User } from 'lucide-react';

interface Props {
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  activeOrderCount?: number;
  unreadMessageCount?: number;
}

export const BottomNavBar: React.FC<Props> = React.memo(({
  activeTab,
  onSelectTab,
  activeOrderCount = 1,
  unreadMessageCount = 1,
}) => {
  const tabs = useMemo(
    () => [
      { id: 'home' as CustomerTab, label: 'Accueil', icon: Home },
      { id: 'discovery' as CustomerTab, label: 'Offres', icon: Compass },
      { id: 'orders' as CustomerTab, label: 'Commandes', icon: ReceiptText, badge: activeOrderCount },
      { id: 'messages' as CustomerTab, label: 'Messages', icon: MessageCircle, badge: unreadMessageCount },
      { id: 'profile' as CustomerTab, label: 'Profil', icon: User },
    ],
    [activeOrderCount, unreadMessageCount]
  );

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] mx-auto z-40 bg-[#FCF9F3]/95 backdrop-blur-lg border-t border-[#EADBCE] shadow-[0px_-2px_14px_rgba(7,30,38,0.06)] flex justify-around items-center px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
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
                  isActive ? 'btn-gradient-tertiary shadow-sm scale-105 text-white' : 'hover:bg-[#F2E8DA] text-[#0A2B35]'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} className={isActive ? 'text-white' : 'text-[#0A2B35]'} />
              </div>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 btn-gradient-tertiary text-white text-[9px] font-extrabold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className={`text-[9.5px] min-[360px]:text-[10px] mt-0.5 tracking-tight hidden min-[330px]:block truncate max-w-[56px] min-[360px]:max-w-[64px] ${isActive ? 'font-extrabold text-[#D91A67]' : 'font-medium text-[#648692]'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});
