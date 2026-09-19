import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, MessageSquare, Settings } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: '/', label: 'Tableau', icon: LayoutDashboard },
    { id: '/catalog', label: 'Menu', icon: ShoppingBag },
    { id: '/messages', label: 'Messages', icon: MessageSquare, badge: 3 },
    { id: '/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="absolute bottom-0 w-full bg-white border-t border-black/[0.04] px-4 py-2 pb-5 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.id || (tab.id !== '/' && location.pathname.startsWith(tab.id));

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className="flex flex-col items-center justify-center gap-1 min-w-[64px] relative"
          >
            <div className="relative">
              <Icon
                size={22}
                className={`transition-all duration-300 ${
                  isActive ? 'text-[#1C1B1B] fill-[#D9943B]' : 'text-zinc-400'
                }`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {tab.badge && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#FF5722] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-bold transition-colors ${
                isActive ? 'text-[#1C1B1B]' : 'text-zinc-500 font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};