import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  HelpCircle,
  Navigation,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Bike,
  Sparkles,
} from 'lucide-react';

interface Props {
  order: Order;
  onBack: () => void;
  onOpenChat: () => void;
  onSimulateStatusAdvance?: () => void;
}

export const LiveOrderTrackingScreen: React.FC<Props> = ({
  order,
  onBack,
  onOpenChat,
  onSimulateStatusAdvance,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [courierPosition, setCourierPosition] = useState({ x: 48, y: 52 });
  const [simulatedEtaMinutes, setSimulatedEtaMinutes] = useState(8);

  // Animate the courier scooter moving toward customer destination
  useEffect(() => {
    const interval = setInterval(() => {
      setCourierPosition((prev) => {
        // Move towards target (x: 75, y: 70)
        const targetX = 75;
        const targetY = 70;
        const nextX = prev.x < targetX ? prev.x + 0.8 : 45;
        const nextY = prev.y < targetY ? prev.y + 0.6 : 40;
        return { x: nextX, y: nextY };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const milestones = [
    { label: 'Reçue', time: '12:28', done: true, active: false },
    { label: 'Cuisine', time: '12:31', done: true, active: false },
    { label: 'Récupérée', time: '12:37', done: true, active: false },
    { label: 'En route', time: '12:38', done: false, active: true },
    { label: 'Livrée', time: '~12:45', done: false, active: false },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] pb-20 relative">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-black/[0.04] shadow-xs">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-700 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="font-bold text-[14px] text-[#1C1B1B]">Suivi en Direct RYM</h1>
          <span className="text-[10px] text-zinc-500 font-medium">{order.orderNumber} • Alger</span>
        </div>
        <button
          onClick={() => alert('Assistance RYM disponible 24h/7 par téléphone au 023 45 67 89')}
          aria-label="Aide"
          className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-zinc-600 active:scale-95"
        >
          <HelpCircle size={18} />
        </button>
      </header>

      {/* Interactive Map Visual Stage */}
      <div className="relative w-full h-[300px] bg-[#E5E9EC] overflow-hidden border-b border-neutral-200">
        {/* Stylized Vector Map Roads & Buildings */}
        <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Roads */}
          <path d="M -20 80 Q 120 100 240 70 T 450 110" stroke="#CBD5E1" strokeWidth="24" fill="none" />
          <path d="M 120 -20 L 140 320" stroke="#CBD5E1" strokeWidth="18" fill="none" />
          <path d="M 40 220 C 180 180, 260 260, 420 200" stroke="#FFFFFF" strokeWidth="22" fill="none" />
          <path d="M 280 -20 Q 250 160 300 320" stroke="#FFFFFF" strokeWidth="16" fill="none" />

          {/* Planned Delivery GPS Route Line */}
          <path
            d="M 80 80 L 140 120 L 220 180 L 320 220"
            stroke="#00B578"
            strokeWidth="5"
            strokeDasharray="6 4"
            fill="none"
          />
        </svg>

        {/* Store Pin (Origin) */}
        <div className="absolute top-[60px] left-[65px] flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-[#1C1B1B] text-white flex items-center justify-center shadow-lg border-2 border-white">
            <span className="text-[10px] font-bold">RESTO</span>
          </div>
          <span className="bg-white/90 text-zinc-800 text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs mt-0.5">
            Le Palmier
          </span>
        </div>

        {/* Customer Destination Pin */}
        <div className="absolute top-[200px] left-[300px] flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-[#FF5722] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
            <MapPin size={18} />
          </div>
          <span className="bg-white/90 text-zinc-900 text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs mt-0.5">
            Maison (Hydra)
          </span>
        </div>

        {/* Moving Courier Scooter Marker */}
        <div
          className="absolute transition-all duration-1000 ease-linear flex flex-col items-center z-10"
          style={{ top: `${courierPosition.y}%`, left: `${courierPosition.x}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#D9943B] text-zinc-900 flex items-center justify-center shadow-xl border-2 border-white pulse-ring-active">
              <Bike size={20} className="text-[#1C1B1B]" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00B578] border-2 border-white"></span>
          </div>
          <div className="bg-[#1C1B1B] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md mt-1 flex items-center gap-1 whitespace-nowrap">
            <span>Karim B. (650m)</span>
          </div>
        </div>

        {/* Live ETA Floating Banner */}
        <div className="absolute top-3 inset-x-3 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg border border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
              <Navigation size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[13px] text-[#1C1B1B]">Arrivée estimée dans ~{simulatedEtaMinutes} mins</span>
                <span className="bg-[#00B578] text-white text-[8px] font-extrabold px-1 rounded">EN ROUTE</span>
              </div>
              <p className="text-[10px] text-zinc-500">Le livreur se dirige vers Val d'Hydra via Bd Sidi Yahia</p>
            </div>
          </div>

          {onSimulateStatusAdvance && (
            <button
              onClick={onSimulateStatusAdvance}
              className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded-lg border border-amber-200"
            >
              Simuler
            </button>
          )}
        </div>
      </div>

      <div className="p-3.5 space-y-3 -mt-3 relative z-20">
        {/* Milestone Timeline Bar */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs">
          <div className="flex justify-between items-center relative">
            {/* Connecting Bar */}
            <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-neutral-200 -z-0">
              <div className="h-full bg-[#00B578] w-[75%] transition-all"></div>
            </div>

            {milestones.map((ms, idx) => (
              <div key={idx} className="flex flex-col items-center z-10 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                    ms.done
                      ? 'bg-[#00B578] text-white border-white shadow-xs'
                      : ms.active
                      ? 'bg-[#D9943B] text-zinc-900 border-white ring-2 ring-[#D9943B] animate-pulse font-extrabold'
                      : 'bg-white text-zinc-400 border-neutral-200'
                  }`}
                >
                  {ms.done ? <CheckCircle2 size={14} /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] mt-1 text-center font-medium ${
                    ms.active ? 'font-bold text-[#1C1B1B]' : 'text-zinc-500'
                  }`}
                >
                  {ms.label}
                </span>
                <span className="text-[9px] text-zinc-400 leading-none">{ms.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Courier Profile Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={order.courierAvatar}
                  alt={order.courierName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-300"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00B578] border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">
                  ✓
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[14px] text-[#1C1B1B]">{order.courierName}</h3>
                  <span className="bg-[#D9943B] text-[#1C1B1B] text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                    Livreur Or ★ {order.courierRating}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {order.courierVehicle} • 3 420 courses livrées
                </p>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${order.courierPhone}`}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-zinc-800 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Appeler le livreur"
              >
                <Phone size={17} />
              </a>
              <button
                onClick={onOpenChat}
                className="w-9 h-9 rounded-full bg-[#D9943B] hover:brightness-105 text-[#1C1B1B] flex items-center justify-center active:scale-95 transition-transform shadow-xs relative"
                aria-label="Chatter avec le livreur"
              >
                <MessageCircle size={17} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF5722]"></span>
              </button>
            </div>
          </div>

          {/* Quick Canned Messages for Algerian Courier */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100">
            <span className="text-[10px] text-zinc-400 font-semibold block mb-1.5">
              Messages rapides au livreur :
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={onOpenChat}
                className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-zinc-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
              >
                🔔 Sonner à l'interphone B14
              </button>
              <button
                onClick={onOpenChat}
                className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-zinc-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
              >
                💵 J'ai la monnaie exacte (1200 DZD)
              </button>
              <button
                onClick={onOpenChat}
                className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-zinc-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
              >
                📦 Laisser au concierge si absent
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Address & Landmark Reminder */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-[#FF5722] shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#1C1B1B]">Destination : {order.deliveryAddress.commune}</span>
                <span className="text-[10px] text-zinc-400">({order.deliveryAddress.label})</span>
              </div>
              <p className="text-xs text-zinc-700 mt-0.5">
                {order.deliveryAddress.street}, {order.deliveryAddress.building}
              </p>
              <p className="text-[11px] text-[#B02F00] font-semibold mt-1">
                📍 Repère : {order.deliveryAddress.landmark}
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Order Receipt Summary */}
        <div className="bg-white rounded-2xl p-3.5 border border-black/[0.04] shadow-xs">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <span className="font-bold text-[13px] text-[#1C1B1B]">{order.storeName}</span>
              <div className="text-[11px] text-zinc-500">
                {order.items.length} article(s) • Total :{' '}
                <span className="font-bold text-[#FF5722]">{order.total} DZD (Espèces / COD)</span>
              </div>
            </div>
            {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showDetails && (
            <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2 text-xs">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <div className="flex-1 pr-2">
                    <span className="text-zinc-800 font-medium">
                      {it.quantity}× {it.name}
                    </span>
                    {it.options.length > 0 && (
                      <p className="text-[10px] text-zinc-400">
                        {it.options.map((o) => o.optionName).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-zinc-900">{it.basePrice * it.quantity} DZD</span>
                </div>
              ))}

              <div className="pt-2 border-t border-neutral-100 space-y-1 text-zinc-500 text-[11px]">
                <div className="flex justify-between">
                  <span>Livraison express</span>
                  <span>{order.deliveryFee} DZD</span>
                </div>
                <div className="flex justify-between">
                  <span>Emballage isotherme</span>
                  <span>{order.packagingFee} DZD</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs text-[#1C1B1B] pt-1">
                  <span>Montant à remettre au livreur</span>
                  <span className="text-[#FF5722]">{order.total} DZD</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
