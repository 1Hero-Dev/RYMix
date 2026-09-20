import React, { useState, useEffect } from 'react';
import { Order, MenuItem, MerchantTab } from '../types';
import { MerchantBottomNavBar } from './MerchantBottomNavBar';
import { MOCK_STORES } from '../data/mockData';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { merchantRatingsDB } from '../db/localDatabase';
import { LazyImage } from './common/LazyImage';
import { apiGateway } from '../services/apiGateway';
import { adminService, ADMIN_UPDATED_EVENT } from '../services/adminService';

/**
 * Identity used for the in-browser demo gateway only.
 * Not credentials: the server never sees or trusts this.
 */
const SIMULATED_MERCHANT = {
  userId: 'merchant-beni-haroun',
  name: 'Chef Beni Haroun',
  role: 'MERCHANT' as const,
  token: '',
};
import {
  ChefHat,
  Printer,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Plus,
  DollarSign,
  Store as StoreIcon,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Check,
  MessageSquare,
  Send,
  ArrowLeft,
  Bike,
  User,
  Headphones,
  Power,
  Star,
  Award,
} from 'lucide-react';

interface Props {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onBackToCustomer: () => void;
}

export const MerchantAppView: React.FC<Props> = ({
  orders,
  onUpdateOrderStatus,
  onBackToCustomer,
}) => {
  const { merchantReviews } = useLocalDatabase();
  const storeReviews = merchantRatingsDB.getReviewsForStore('store-beni-haroun');
  const storeStats = merchantRatingsDB.getStoreStats('store-beni-haroun');
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<MerchantTab>('orders');
  const [orderStage, setOrderStage] = useState<'pending' | 'preparing' | 'ready'>('preparing');
  const [dailyTurnover, setDailyTurnover] = useState(52400);

  // Local menu items synchronized with admin store catalog
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const adminStores = adminService.getStores();
    return adminStores[0]?.items || MOCK_STORES[0].items;
  });
  const [printSuccessNotice, setPrintSuccessNotice] = useState<string | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<{ orderNumber: string; total: number; customer: string } | null>(null);

  // Sync menu when modified by Admin
  useEffect(() => {
    const handleAdminSync = () => {
      const adminStores = adminService.getStores();
      if (adminStores[0]?.items) {
        setMenuItems([...adminStores[0].items]);
      }
    };
    window.addEventListener(ADMIN_UPDATED_EVENT, handleAdminSync);
    return () => window.removeEventListener(ADMIN_UPDATED_EVENT, handleAdminSync);
  }, []);

  // Inbound order push subscription (Recommendation N6, C1)
  useEffect(() => {
    const unsub = apiGateway.subscribeMerchantOrders('store-beni-haroun', (order) => {
      if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
        setIncomingAlert({
          orderNumber: order.orderNumber,
          total: order.total,
          customer: order.delivery?.dropoff?.recipientName || 'Client Ahmed Rachedi',
        });
      }
    });
    return () => unsub();
  }, []);

  // Merchant messaging threads
  const [merchantThreads, setMerchantThreads] = useState([
    {
      id: 'mthread-courier',
      senderName: 'Walid M. (Livreur)',
      role: 'Coursier Ahmed Rachedi',
      orderRef: 'Commande #AR-42',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnLgieeCF8ANxDxGqfJBxx4kjN-psqMb4MO9qTa3aoO0Qsz5aYMyWF-4meTl3-YluN6pO1WvE3z8q13EjhO4ylotuROjN2F7b3cGzY6InATavSGNRiY81Abt6msgXrjxk1hJZh3ivc3Qg62zoChrbudeY-GLLB23Axh3UpzfYfLXjdMxaZU-7HXMBbw9EyBfXunbj3n_WZXmeMexp59kbQmk5YHH5YXHBP2O0vbMoPila0sJJxBx5A',
      lastText: 'Je suis garé devant le restaurant, je monte récupérer la commande.',
      time: '12:41',
      unread: true,
      messages: [
        { id: '1', sender: 'them', text: 'Salam Chef ! Je suis affecté à la commande #HB-42.', time: '12:34' },
        { id: '2', sender: 'me', text: 'Salam Walid ! Ça cuit, encore 3 minutes sur la braise.', time: '12:36' },
        { id: '3', sender: 'them', text: 'Je suis garé devant le restaurant, je monte récupérer la commande.', time: '12:41' },
      ],
    },
    {
      id: 'mthread-customer',
      senderName: 'Amine B. (Client)',
      role: 'Client Ahmed Rachedi',
      orderRef: 'Commande #AR-42 • Cité El Bassatine',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuN2_w-EBNtEXJguBVUeD5bfr4lhFYP9v-b1VFSGROFgx6RXqoF5GL9ooQUB3VjQoQ4Vf6aJyJvt4-UM1Zq1temtjmArdLxFCleb3mp8EFzcpHJsuMXGOHdLa6fuol7ilUBCci6mfacs12VyQWsAZNHp0pkoYUGqyZNTkYh30tf011opO1qtvgoPeMkIhM_eGtTVj7ra-ec0R_7Fy9TD3CWRApTQszxxQXb5hf_wx7SD5qVWzZs1OO',
      lastText: 'Bien reçu chef, merci beaucoup pour votre rapidité !',
      time: '12:30',
      unread: false,
      messages: [
        { id: '1', sender: 'them', text: 'Bonjour, pouvez-vous mettre la harissa à part s\'il vous plaît ?', time: '12:28' },
        { id: '2', sender: 'me', text: 'Bonjour Amine ! C\'est bien noté, harissa mise dans un petit pot séparé.', time: '12:29' },
        { id: '3', sender: 'them', text: 'Bien reçu chef, merci beaucoup pour votre rapidité !', time: '12:30' },
      ],
    },
    {
      id: 'mthread-support',
      senderName: 'Support Partenaires Ahmed Rachedi',
      role: 'Support',
      orderRef: 'Assistance Commerçant',
      avatar: '',
      lastText: 'Zéro commission appliquée sur l\'ensemble de vos 18 ventes du jour.',
      time: '11:15',
      unread: false,
      messages: [
        { id: '1', sender: 'them', text: 'Bonjour Restaurant Beni Haroun, votre statut En Ligne fonctionne parfaitement à Ahmed Rachedi.', time: '09:00' },
        { id: '2', sender: 'them', text: 'Zéro commission appliquée sur l\'ensemble de vos 18 ventes du jour.', time: '11:15' },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const currentThread = merchantThreads.find((t) => t.id === activeThreadId);

  const handleSendReply = () => {
    if (!replyInput.trim() || !activeThreadId) return;
    const newMsg = {
      id: `mmsg-${Date.now()}`,
      sender: 'me',
      text: replyInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMerchantThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastText: newMsg.text,
              time: newMsg.time,
              unread: false,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
    setReplyInput('');
  };

  const handleQuickSend = (text: string) => {
    if (!activeThreadId) return;
    const newMsg = {
      id: `mmsg-${Date.now()}`,
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMerchantThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastText: newMsg.text,
              time: newMsg.time,
              unread: false,
              messages: [...t.messages, newMsg],
            }
          : t
      )
    );
  };

  const toggleItemAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const nextState = !item.isAvailable;
          // Local demo only; real availability changes must be persisted
          // server-side against the merchant's verified store membership.
          apiGateway.updateStoreItemAvailability(SIMULATED_MERCHANT, 'store-beni-haroun', itemId, nextState);
          return { ...item, isAvailable: nextState };
        }
        return item;
      })
    );
  };

  const handlePrintTicket = (orderNumber: string) => {
    setPrintSuccessNotice(`Ticket #${orderNumber} envoyé à l'imprimante cuisine`);
    setTimeout(() => setPrintSuccessNotice(null), 3000);
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter(
    (o) => o.status === 'READY' || o.status === 'PICKED_UP' || o.status === 'DELIVERING'
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] text-[#1C1B1B] pb-24">
      {/* Merchant Top Status Bar */}
      <header className="bg-[#1A1D20] text-white px-3.5 py-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-extrabold shadow-sm">
              <ChefHat size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm">Restaurant Beni Haroun</h1>
                <span className="bg-[#00B578] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                  Ahmed Rachedi
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Terminal Commerçant • Rue Principale (CW 152)</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            title={isOpen ? 'Restaurant Ouvert' : 'Restaurant Fermé'}
            aria-label={isOpen ? 'Restaurant Ouvert' : 'Restaurant Fermé'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isOpen ? 'bg-[#00B578] text-white' : 'bg-red-600 text-white'
            }`}
          >
            <Power size={13} strokeWidth={2} />
            <span className="hidden min-[360px]:inline">{isOpen ? 'Ouvert' : 'Fermé'}</span>
          </button>
        </div>

        {/* Turnover & Sales Indicators */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center text-xs">
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Chiffre d'Affaires</span>
            <span className="font-extrabold text-[#D9943B] text-sm">{dailyTurnover} DZD</span>
          </div>
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Commandes Rachedi</span>
            <span className="font-bold text-white text-sm">42 repas</span>
          </div>
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Frais Plateforme</span>
            <span className="font-bold text-[#00B578] text-sm">0 DZD (Gratuit)</span>
          </div>
        </div>
      </header>

      {/* Inbound Realtime Order Alert (Recommendation N6, C1) */}
      {incomingAlert && (
        <div className="bg-gradient-to-r from-amber-600 to-[#D9943B] text-[#071E26] px-4 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="font-extrabold text-xs">
              NOUVELLE COMMANDE #{incomingAlert.orderNumber} • {incomingAlert.total} DZD ({incomingAlert.customer})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOrderStage('pending');
                setIncomingAlert(null);
              }}
              className="bg-[#071E26] text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-black cursor-pointer"
            >
              Traiter en cuisine
            </button>
            <button
              onClick={() => setIncomingAlert(null)}
              className="text-xs font-bold underline px-1 text-[#071E26] cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Ticket Notification */}
      {printSuccessNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 text-center flex items-center justify-center gap-1.5 transition-all">
          <Printer size={14} strokeWidth={2} />
          <span>{printSuccessNotice}</span>
        </div>
      )}

      {/* Main Tab Views */}
      <main className="p-3.5 space-y-3 flex-1">
        {/* TAB 1: KITCHEN ORDERS KANBAN */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {/* Stage sub-nav - Unified icons and compact on narrow screens */}
            <div className="bg-white rounded-xl p-1 shadow-xs border border-neutral-200 flex justify-around">
              <button
                onClick={() => setOrderStage('pending')}
                title="Commandes à valider"
                aria-label="Commandes à valider"
                className={`py-2 px-2.5 sm:px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  orderStage === 'pending'
                    ? 'bg-[#D9943B] text-[#071E26] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Clock size={14} strokeWidth={2} />
                <span className="hidden min-[360px]:inline">À Valider</span>
                <span className="bg-[#071E26] text-white text-[9px] px-1.5 py-0.2 rounded-full">
                  {pendingOrders.length}
                </span>
              </button>

              <button
                onClick={() => setOrderStage('preparing')}
                title="Commandes en cuisine"
                aria-label="Commandes en cuisine"
                className={`py-2 px-2.5 sm:px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  orderStage === 'preparing'
                    ? 'bg-[#D9943B] text-[#071E26] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <ChefHat size={14} strokeWidth={2} />
                <span className="hidden min-[360px]:inline">En Cuisine</span>
                <span className="bg-[#00B578] text-white text-[9px] px-1.5 py-0.2 rounded-full">
                  {preparingOrders.length}
                </span>
              </button>

              <button
                onClick={() => setOrderStage('ready')}
                title="Commandes prêtes pour le livreur"
                aria-label="Commandes prêtes pour le livreur"
                className={`py-2 px-2.5 sm:px-3 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  orderStage === 'ready'
                    ? 'bg-[#D9943B] text-[#071E26] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <CheckCircle2 size={14} strokeWidth={2} />
                <span className="hidden min-[360px]:inline">Prêtes</span>
                <span className="bg-zinc-700 text-white text-[9px] px-1.5 py-0.2 rounded-full">
                  {readyOrders.length}
                </span>
              </button>
            </div>

            {/* Orders Feed */}
            {(() => {
              const currentStageOrders =
                orderStage === 'pending'
                  ? pendingOrders
                  : orderStage === 'preparing'
                  ? preparingOrders
                  : readyOrders;

              if (currentStageOrders.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center space-y-2">
                    <Clock size={32} className="mx-auto text-zinc-300" />
                    <h3 className="font-bold text-sm text-zinc-800">
                      {orderStage === 'pending'
                        ? 'Aucune commande en attente'
                        : orderStage === 'preparing'
                        ? 'Aucune commande en cuisine'
                        : 'Aucune commande prête'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {orderStage === 'pending'
                        ? 'Les nouvelles commandes des clients d\'Ahmed Rachedi apparaîtront ici.'
                        : orderStage === 'preparing'
                        ? 'Lancez la préparation des commandes confirmées.'
                        : 'Les commandes prêtes pour le retrait par coursier apparaîtront ici.'}
                    </p>
                  </div>
                );
              }

              return currentStageOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-[#1C1B1B]">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-zinc-400">{ord.createdAt}</span>
                    </div>

                    <span className="bg-[#D91A67]/10 text-[#D91A67] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Espèces : {ord.total} DZD
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="bg-neutral-50 rounded-xl p-2.5 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-zinc-900">
                          <span>
                            {it.quantity}× {it.name}
                          </span>
                          <span>{it.basePrice * it.quantity} DZD</span>
                        </div>

                        {it.options.length > 0 && (
                          <div className="text-[11px] text-zinc-600 font-medium">
                            {it.options.map((o) => `${o.groupName}: ${o.optionName}`).join(' | ')}
                          </div>
                        )}

                        {it.chefRemark && (
                          <div className="bg-amber-100/70 text-amber-900 text-[11px] font-bold p-1 rounded">
                            ⚠️ Consigne client : {it.chefRemark}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Courier Info */}
                  <div className="flex items-center justify-between text-xs text-zinc-600 pt-1">
                    <span>
                      Livreur : <strong className="text-zinc-900">{ord.courierName || 'Walid M. (Ahmed Rachedi)'}</strong>
                    </span>
                    <span className="text-emerald-700 font-bold">{ord.status}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => handlePrintTicket(ord.orderNumber)}
                      className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-zinc-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>Ticket Cuisine</span>
                    </button>

                    {ord.status === 'PENDING' && (
                      <button
                        onClick={() => onUpdateOrderStatus(ord.id, 'CONFIRMED')}
                        className="flex-1 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] text-xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        <span>Accepter la Commande</span>
                      </button>
                    )}

                    {ord.status === 'CONFIRMED' && (
                      <button
                        onClick={() => onUpdateOrderStatus(ord.id, 'PREPARING')}
                        className="flex-1 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] text-xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <ChefHat size={15} />
                        <span>Lancer en Cuisine</span>
                      </button>
                    )}

                    {ord.status === 'PREPARING' && (
                      <button
                        onClick={() => onUpdateOrderStatus(ord.id, 'READY')}
                        className="flex-1 bg-[#00B578] hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        <span>Prête pour le Coursier</span>
                      </button>
                    )}

                    {ord.status === 'READY' && (
                      <button
                        onClick={() => onUpdateOrderStatus(ord.id, 'PICKED_UP')}
                        className="flex-1 bg-[#D9943B] hover:bg-[#E5A34C] active:scale-[0.98] text-[#071E26] text-xs font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        <span>Remis au Coursier</span>
                      </button>
                    )}

                    {(ord.status === 'PICKED_UP' || ord.status === 'DELIVERING') && (
                      <div className="flex-1 bg-emerald-50 text-[#00B578] border border-emerald-200 text-xs font-bold py-2 rounded-xl text-center">
                        En cours de livraison
                      </div>
                    )}

                    {ord.status === 'DELIVERED' && (
                      <div className="flex-1 bg-zinc-100 text-zinc-700 text-xs font-bold py-2 rounded-xl text-center">
                        Livrée avec succès
                      </div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* TAB 2: MENU & STOCK MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-zinc-900">Gestion des Disponibilités & Ruptures</h3>
                <p className="text-[11px] text-zinc-500">Désactivez un plat en 1 clic pour éviter les annulations à Ahmed Rachedi</p>
              </div>
              <span className="text-xs font-bold text-[#00B578] bg-emerald-50 px-2 py-0.5 rounded-full">
                {menuItems.filter((i) => i.isAvailable).length} En Vente
              </span>
            </div>

            <div className="space-y-2">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 ${
                    item.isAvailable ? 'border-neutral-200' : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    <LazyImage
                      src={item.imageUrl}
                      alt={item.name}
                      placeholderType="food"
                      targetWidth={140}
                      className={`w-full h-full object-cover ${
                        !item.isAvailable && 'grayscale opacity-60'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-zinc-900 truncate">{item.name}</h4>
                      {item.badge && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1 rounded shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-xs text-[#00B578] block mt-0.5">
                      {item.price} DZD
                    </span>
                    <span className="text-[10px] text-zinc-400">{item.category}</span>
                  </div>

                  <button
                    onClick={() => toggleItemAvailability(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ${
                      item.isAvailable
                        ? 'bg-emerald-50 text-[#00B578] border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <Check size={13} />
                        <span>En Stock</span>
                      </>
                    ) : (
                      <span>Rupture</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES RESTAURANT (Livreurs, Clients, Support Ahmed Rachedi) */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            {currentThread ? (
              /* Active Chat Thread */
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col min-h-[460px]">
                {/* Chat Top Bar */}
                <div className="bg-neutral-50 p-3 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setActiveThreadId(null)}
                      className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-zinc-700 hover:text-black"
                      aria-label="Retour"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-zinc-900">{currentThread.senderName}</h4>
                        <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.2 rounded">
                          {currentThread.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{currentThread.orderRef}</span>
                    </div>
                  </div>

                  <a
                    href="tel:+213555889900"
                    className="w-8 h-8 rounded-full bg-[#00B578] text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                    aria-label="Appeler"
                  >
                    <Phone size={15} />
                  </a>
                </div>

                {/* Messages Bubbles */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[290px] no-scrollbar bg-[#FBFBFA]">
                  {currentThread.messages.map((m) => {
                    const isMe = m.sender === 'me';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                            isMe
                              ? 'bg-[#1C1B1B] text-white font-medium rounded-br-xs'
                              : 'bg-white text-zinc-900 border border-neutral-200 shadow-xs rounded-bl-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-zinc-400 mt-0.5 px-1">{m.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Kitchen Presets */}
                <div className="px-3 py-1.5 bg-neutral-100 border-t border-neutral-200 flex gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => handleQuickSend('👨‍🍳 En cours de cuisson, prêt dans 3 min !')}
                    className="text-[10px] bg-white border border-neutral-200 text-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-neutral-50 shadow-xs transition-colors"
                  >
                    👨‍🍳 Prêt dans 3 min
                  </button>
                  <button
                    onClick={() => handleQuickSend('✅ Commande prête au comptoir retrait.')}
                    className="text-[10px] bg-white border border-neutral-200 text-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-neutral-50 shadow-xs transition-colors"
                  >
                    ✅ Prête au comptoir
                  </button>
                  <button
                    onClick={() => handleQuickSend('🏷️ Ticket cuisine imprimé et validé.')}
                    className="text-[10px] bg-white border border-neutral-200 text-zinc-800 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-neutral-50 shadow-xs transition-colors"
                  >
                    🏷️ Validé en cuisine
                  </button>
                </div>

                {/* Merchant Input */}
                <div className="p-2.5 bg-white border-t border-neutral-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Message restaurant (Livreur / Client)..."
                    className="flex-1 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#00B578]"
                  />
                  <button
                    onClick={handleSendReply}
                    className="w-8 h-8 rounded-full bg-[#00B578] text-white flex items-center justify-center font-bold shadow-xs active:scale-90 transition-transform"
                    aria-label="Envoyer"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Threads List View */
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-neutral-200 p-3.5 flex items-center justify-between shadow-xs">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900">Messagerie Restaurant Ahmed Rachedi</h3>
                    <p className="text-[11px] text-zinc-500">Échanges avec les livreurs en route & vos clients</p>
                  </div>
                  <span className="bg-[#00B578]/10 text-[#00B578] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                    1 Nouveau
                  </span>
                </div>

                <div className="space-y-2">
                  {merchantThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThreadId(thread.id)}
                      className="bg-white hover:bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-all shadow-xs active:scale-[0.99]"
                    >
                      <div className="relative shrink-0">
                        {thread.avatar ? (
                          <div className="w-11 h-11 rounded-full overflow-hidden border border-neutral-200">
                            <LazyImage
                              src={thread.avatar}
                              alt={thread.senderName}
                              placeholderType="avatar"
                              targetWidth={90}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-neutral-900 text-[#D9943B] flex items-center justify-center font-extrabold text-xs">
                            <Headphones size={20} />
                          </div>
                        )}
                        {thread.unread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full btn-gradient-tertiary border-2 border-white"></span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-zinc-900 truncate">
                            {thread.senderName}
                          </h4>
                          <span className="text-[10px] text-zinc-400">{thread.time}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          {thread.orderRef}
                        </span>
                        <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                          {thread.lastText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYTICS & TURNOVER (ZÉRO FRAIS - 100% GRATUIT) */}
        {activeTab === 'analytics' && (
          <div className="space-y-3">
            {/* Financial Summary Card */}
            <div className="bg-gradient-to-br from-[#1A1D20] to-[#25282C] text-white rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-semibold">Caisse du Jour (Ahmed Rachedi)</span>
                <span className="bg-[#D9943B] text-[#071E26] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  100% Pour Votre Commerce
                </span>
              </div>

              <div>
                <span className="text-3xl font-extrabold text-[#D9943B]">{dailyTurnover} DZD</span>
                <p className="text-xs text-zinc-400 mt-0.5">
                  <span className="sm:hidden">Encaissements COD & commandes réglées</span>
                  <span className="hidden sm:inline">Encaissements espèces à la livraison & commandes réglées</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-zinc-400 text-[10px] block">Panier Moyen Rachedi</span>
                  <span className="font-bold text-white text-sm">1,240 DZD</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <span className="text-zinc-400 text-[10px] block">Économies Commission</span>
                  <span className="font-bold text-[#00B578] text-sm">+7,860 DZD (0%)</span>
                </div>
              </div>
            </div>

            {/* Zero Commission Statement */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
              <Sparkles size={20} className="text-[#00B578] shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-emerald-950">Engagement : Gratuit & Professionnel</h4>
                <p className="text-emerald-800 mt-0.5 leading-relaxed">
                  Contrairement aux plateformes avec des commissions de 20%, notre plateforme offre une solution 100% gratuite et solidaire aux restaurateurs et commerçants d'Ahmed Rachedi.
                </p>
              </div>
            </div>

            {/* Top sellers in Ahmed Rachedi */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] space-y-3">
              <h4 className="text-xs font-bold text-zinc-900">Plats les plus demandés à Ahmed Rachedi</h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50">
                  <span className="font-semibold text-zinc-800">Menu Maxi Chawarma Poulet Braisé</span>
                  <span className="font-extrabold text-zinc-900">24 ventes (18,000 DZD)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50">
                  <span className="font-semibold text-zinc-800">Filet Poisson Beni Haroun Grillé</span>
                  <span className="font-extrabold text-zinc-900">12 ventes (11,400 DZD)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50">
                  <span className="font-semibold text-zinc-800">Cherbet Citron Fraîche Locale</span>
                  <span className="font-extrabold text-zinc-900">35 ventes (7,000 DZD)</span>
                </div>
              </div>
            </div>

            {/* Live Database Customer Reviews Section */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Award size={15} className="text-amber-500" />
                    <span>Avis Clients Vérifiés (Ahmed Rachedi)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">Notes enregistrées dans la base de données</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-200 font-extrabold text-xs">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>{storeStats.averageRating} / 5</span>
                  <span className="text-[10px] text-zinc-400 font-normal">({storeStats.reviewCount})</span>
                </div>
              </div>

              {/* Criteria Averages Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                <div className="p-2 bg-neutral-50 rounded-xl">
                  <span className="text-zinc-500 block text-[10px]">Goût & Fraîcheur</span>
                  <span className="font-extrabold text-zinc-900">{storeStats.criteriaAverages.foodTaste}★</span>
                </div>
                <div className="p-2 bg-neutral-50 rounded-xl">
                  <span className="text-zinc-500 block text-[10px]">Emballage</span>
                  <span className="font-extrabold text-zinc-900">{storeStats.criteriaAverages.packaging}★</span>
                </div>
                <div className="p-2 bg-neutral-50 rounded-xl">
                  <span className="text-zinc-500 block text-[10px]">Rapidité</span>
                  <span className="font-extrabold text-zinc-900">{storeStats.criteriaAverages.speed}★</span>
                </div>
                <div className="p-2 bg-neutral-50 rounded-xl">
                  <span className="text-zinc-500 block text-[10px]">Générosité</span>
                  <span className="font-extrabold text-zinc-900">{storeStats.criteriaAverages.portionSize}★</span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-2 pt-1 border-t border-neutral-100">
                {storeReviews.map((rev) => (
                  <div key={rev.id} className="p-2.5 bg-neutral-50/60 rounded-xl border border-black/5 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900">{rev.customerName}</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                          Achat Vérifié
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold">{rev.overallRating}★</span>
                    </div>
                    <p className="text-zinc-600 text-[11px] italic">"{rev.comment}"</p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {rev.tags.map((t) => (
                        <span key={t} className="text-[9px] bg-white border border-zinc-200 text-zinc-600 px-1.5 py-0.2 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STORE SETTINGS & PROFILE */}
        {activeTab === 'store' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-extrabold text-xl shadow-xs">
                  <StoreIcon size={28} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900">Restaurant Beni Haroun - Ahmed Rachedi</h3>
                  <p className="text-xs text-zinc-500">Spécialités Poissons d'Eau Douce & Grillades</p>
                  <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    Commerçant Vérifié Ahmed Rachedi
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-neutral-100">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-[#D9943B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-800">Adresse de préparation :</span>
                    <p className="text-zinc-600">Rue Principale (CW 152), Ahmed Rachedi Centre</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#00B578] shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-800">Téléphone Cuisine :</span>
                    <span className="text-zinc-600 font-mono ml-1">+213 31 47 11 22</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Printer size={14} className="text-zinc-500 shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-800">Imprimante Thermique :</span>
                    <span className="text-emerald-700 font-semibold ml-1">Connectée (ESC/POS 80mm)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onBackToCustomer}
              className="w-full py-3 bg-neutral-200 hover:bg-neutral-300 text-zinc-800 rounded-xl text-xs font-bold transition-colors"
            >
              Retour à l'Espace Client
            </button>
          </div>
        )}
      </main>

      {/* DEDICATED MERCHANT BOTTOM NAVIGATION BAR */}
      <MerchantBottomNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingOrders.length}
        unreadCount={merchantThreads.filter((t) => t.unread).length}
      />
    </div>
  );
};
