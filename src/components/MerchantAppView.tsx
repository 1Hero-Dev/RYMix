import React, { useState, useEffect, useMemo } from 'react';
import { Order, MenuItem, MerchantTab, BusinessCategory, Store } from '../types';
import { MerchantBottomNavBar } from './MerchantBottomNavBar';
import { MOCK_STORES } from '../data/mockData';
import { useLocalDatabase } from '../db/useLocalDatabase';
import { merchantRatingsDB } from '../db/localDatabase';
import { LazyImage } from './common/LazyImage';
import { apiGateway } from '../services/apiGateway';
import { adminService, ADMIN_UPDATED_EVENT } from '../services/adminService';
import { BUSINESS_CATEGORIES, getBusinessCategoryConfig } from '../data/businessCategories';
import { MerchantOnboardingModal } from './merchant/MerchantOnboardingModal';
import { ProductEditorModal } from './merchant/ProductEditorModal';

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
  Boxes,
  ShoppingBasket,
  Search,
  Filter,
  Edit3,
  Trash2,
  Package,
  Layers,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
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
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<MerchantTab>('orders');
  const [orderStage, setOrderStage] = useState<'pending' | 'preparing' | 'ready'>('preparing');
  const [dailyTurnover, setDailyTurnover] = useState(52400);

  // Store Management & Category Configuration
  const [stores, setStores] = useState<Store[]>(() => adminService.getStores());
  const [selectedStoreId, setSelectedStoreId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('rym_merchant_store_id');
      const all = adminService.getStores();
      if (saved && all.some((s) => s.id === saved)) return saved;
    } catch {}
    const all = adminService.getStores();
    return all[0]?.id || 'store-beni-haroun';
  });

  const currentStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId) || stores[0] || MOCK_STORES[0];
  }, [stores, selectedStoreId]);

  // Determine current business category
  const currentCategory: BusinessCategory = useMemo(() => {
    if (currentStore?.businessCategory) return currentStore.businessCategory;
    const cat = currentStore?.category || '';
    if (cat.includes('Épicerie') || cat.includes('Alimentation')) return 'grocery';
    if (cat.includes('Boulangerie') || cat.includes('Pâtisserie')) return 'bakery';
    if (cat.includes('Pharmacie')) return 'pharmacy';
    if (cat.includes('Boucherie') || cat.includes('Volailles')) return 'butcher';
    if (cat.includes('Artisanat') || cat.includes('Cadeaux')) return 'artisan';
    return 'restaurant';
  }, [currentStore]);

  const categoryConfig = useMemo(() => {
    return getBusinessCategoryConfig(currentCategory);
  }, [currentCategory]);

  const storeReviews = merchantRatingsDB.getReviewsForStore(currentStore?.id || 'store-beni-haroun');
  const storeStats = merchantRatingsDB.getStoreStats(currentStore?.id || 'store-beni-haroun');

  // Menu/Inventory items of current store
  const menuItems = useMemo(() => {
    return currentStore?.items || [];
  }, [currentStore]);

  const lowStockCount = useMemo(() => {
    return menuItems.filter((i) => (i.stockQuantity ?? 99) <= (i.stockThreshold || 5)).length;
  }, [menuItems]);

  // Modals state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Catalog search and filter state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedAisle, setSelectedAisle] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  const [printSuccessNotice, setPrintSuccessNotice] = useState<string | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<{ orderNumber: string; total: number; customer: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync stores when modified in Admin
  useEffect(() => {
    const handleAdminSync = () => {
      const freshStores = adminService.getStores();
      setStores([...freshStores]);
    };
    window.addEventListener(ADMIN_UPDATED_EVENT, handleAdminSync);
    return () => window.removeEventListener(ADMIN_UPDATED_EVENT, handleAdminSync);
  }, []);

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    try {
      localStorage.setItem('rym_merchant_store_id', storeId);
    } catch {}
    showToast(`Boutique basculée : ${stores.find((s) => s.id === storeId)?.name || 'Sélectionnée'}`);
  };

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
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    const nextState = !item.isAvailable;
    adminService.toggleMenuItemStock(currentStore.id, itemId, nextState);
    const updatedStores = adminService.getStores();
    setStores([...updatedStores]);
    showToast(`Disponibilité mise à jour : ${item.name} est maintenant ${nextState ? 'en vente' : 'en rupture'}`);
  };

  const handleQuickRestock = (itemId: string, addQty: number) => {
    const item = menuItems.find((i) => i.id === itemId);
    if (!item) return;
    const currentQty = item.stockQuantity ?? 0;
    const newQty = currentQty + addQty;
    adminService.updateMenuItem(currentStore.id, itemId, {
      stockQuantity: newQty,
      isAvailable: newQty > 0,
    });
    const updatedStores = adminService.getStores();
    setStores([...updatedStores]);
    showToast(`📦 Réapprovisionnement : +${addQty} ${item.unit || 'unités'} ajoutées à "${item.name}" (Total: ${newQty})`);
  };

  const handleOpenAddProduct = () => {
    setEditingItem(null);
    setIsProductEditorOpen(true);
  };

  const handleOpenEditProduct = (item: MenuItem) => {
    setEditingItem(item);
    setIsProductEditorOpen(true);
  };

  const handleDeleteProduct = (itemId: string, itemName: string) => {
    if (confirm(`Confirmez-vous la suppression de "${itemName}" du catalogue ?`)) {
      adminService.deleteMenuItem(currentStore.id, itemId);
      const updatedStores = adminService.getStores();
      setStores([...updatedStores]);
      showToast(`Article "${itemName}" supprimé avec succès`);
    }
  };

  const handleSaveProduct = (itemData: Partial<MenuItem>) => {
    if (editingItem) {
      adminService.updateMenuItem(currentStore.id, editingItem.id, itemData);
      showToast(`Fiche "${itemData.name}" mise à jour avec succès !`);
    } else {
      adminService.addMenuItem(currentStore.id, {
        name: itemData.name || 'Nouveau Produit',
        description: itemData.description || '',
        price: itemData.price || 0,
        category: itemData.category || 'Général',
        ...itemData,
      });
      showToast(`✨ Nouveau produit "${itemData.name}" publié et visible par les clients d'Ahmed Rachedi !`);
    }
    const updatedStores = adminService.getStores();
    setStores([...updatedStores]);
  };

  const handleStoreCreated = (newStore: Store) => {
    setSelectedStoreId(newStore.id);
    try {
      localStorage.setItem('rym_merchant_store_id', newStore.id);
    } catch {}
    const updatedStores = adminService.getStores();
    setStores([...updatedStores]);
    setActiveTab('menu');
    showToast(`🎉 Commerce "${newStore.name}" configuré avec succès ! Espace adapté pour ${newStore.category}.`);
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

  const CategoryIconComponent = useMemo(() => {
    switch (currentCategory) {
      case 'grocery':
        return ShoppingBasket;
      case 'bakery':
        return Package;
      case 'pharmacy':
        return ShieldCheck;
      case 'butcher':
        return Layers;
      case 'artisan':
        return Sparkles;
      case 'restaurant':
      default:
        return ChefHat;
    }
  }, [currentCategory]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F6F7F9] text-[#1C1B1B] pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#071E26] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={14} className="text-[#00B578]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Merchant Top Status Bar */}
      <header className="bg-[#1A1D20] text-white px-3.5 py-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-extrabold shadow-sm shrink-0">
              <CategoryIconComponent size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-bold text-sm truncate max-w-[180px] sm:max-w-xs">{currentStore.name}</h1>
                <span className="bg-[#00B578] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                  {categoryConfig.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Terminal {categoryConfig.name} • {currentStore.address || 'Ahmed Rachedi Centre (CW 152)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              title={isOpen ? 'Boutique Ouverte' : 'Boutique Fermée'}
              aria-label={isOpen ? 'Boutique Ouverte' : 'Boutique Fermée'}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isOpen ? 'bg-[#00B578] text-white' : 'bg-red-600 text-white'
              }`}
            >
              <Power size={13} strokeWidth={2} />
              <span className="hidden min-[360px]:inline">{isOpen ? 'Ouvert' : 'Fermé'}</span>
            </button>
          </div>
        </div>

        {/* Store Switcher Quick Bar */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/10 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
            Commerces :
          </span>
          {stores.map((s) => {
            const isSelected = s.id === currentStore.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectStore(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#D9943B] text-[#071E26] shadow-sm'
                    : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[9px] opacity-75 font-normal">({s.category?.split(' ')[0]})</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/40 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus size={12} />
            <span>Nouveau Commerce</span>
          </button>
        </div>

        {/* Turnover & Platform Indicators */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 text-center text-xs">
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Ventes du Jour</span>
            <span className="font-extrabold text-[#D9943B] text-sm">{dailyTurnover} DZD</span>
          </div>
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Commandes Rachedi</span>
            <span className="font-bold text-white text-sm">42 livraisons</span>
          </div>
          <div className="bg-white/5 rounded-lg py-1 px-1">
            <span className="text-zinc-400 text-[10px] block">Commission Locale</span>
            <span className="font-bold text-[#00B578] text-sm">0% (Soutien 100%)</span>
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

        {/* TAB 2: CATEGORY-TAILORED CATALOG & INVENTORY TOOLS */}
        {activeTab === 'menu' && (
          <div className="space-y-3">
            {/* Category Header & Publishing Action */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
                  <CategoryIconComponent size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-900">
                      {categoryConfig.labels.catalogTitle}
                    </h3>
                    <span className="text-[10px] font-extrabold bg-[#00B578]/15 text-[#00875A] px-2 py-0.5 rounded-full">
                      {categoryConfig.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {currentCategory === 'grocery'
                      ? 'Suivi des stocks par rayon, seuils d’alerte et réapprovisionnement instantané'
                      : currentCategory === 'restaurant'
                      ? 'Gestion de la carte, temps de préparation, niveaux de piquant et ruptures'
                      : 'Outils spécialisés configurés pour votre commerce à Ahmed Rachedi'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="bg-[#00B578] hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>{categoryConfig.labels.addProduct}</span>
              </button>
            </div>

            {/* Category-Tailored Dynamic KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-xs">
                <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
                  {currentCategory === 'grocery' ? 'Articles en Rayon' : 'Plats à la Carte'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-extrabold text-zinc-900">{menuItems.length}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">références</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-xs">
                <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
                  {currentCategory === 'grocery' ? 'Stock Actif' : 'En Vente Directe'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-extrabold text-[#00B578]">
                    {menuItems.filter((i) => i.isAvailable).length}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">disponibles</span>
                </div>
              </div>

              {currentCategory === 'grocery' ? (
                <div className={`rounded-xl p-3 border shadow-xs ${
                  lowStockCount > 0 ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-black/[0.06]'
                }`}>
                  <span className="text-[10px] text-amber-900 font-semibold block uppercase">
                    Alertes Rupture (&le;5)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-xl font-extrabold ${lowStockCount > 0 ? 'text-amber-800' : 'text-zinc-900'}`}>
                      {lowStockCount}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">produits critiques</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-xs">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
                    Temps Moyen Prépa
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-[#D9943B]">15-20</span>
                    <span className="text-[10px] text-zinc-500 font-medium">minutes</span>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-xs">
                <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
                  {currentCategory === 'grocery' ? 'Rayons Actifs' : 'Catégories Menu'}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-extrabold text-zinc-900">
                    {currentStore.menuCategories.length}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">sections</span>
                </div>
              </div>
            </div>

            {/* Grocery Low Stock Alert Banner */}
            {currentCategory === 'grocery' && lowStockCount > 0 && (
              <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-3 flex items-start sm:items-center justify-between gap-3 text-amber-950">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="text-amber-800 shrink-0 mt-0.5 sm:mt-0" size={18} />
                  <div>
                    <h4 className="font-extrabold text-xs">
                      Alerte Inventaire : {lowStockCount} article(s) sous le seuil minimum de sécurité !
                    </h4>
                    <p className="text-[11px] text-amber-900">
                      Utilisez les boutons de réassort rapide (+5, +20, +50) ci-dessous pour maintenir la disponibilité aux clients d’Ahmed Rachedi.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
                  className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer shrink-0"
                >
                  {stockStatusFilter === 'low' ? 'Voir tout' : 'Filtrer stock bas'}
                </button>
              </div>
            )}

            {/* Search & Category Filter Controls */}
            <div className="bg-white rounded-2xl p-3 border border-black/[0.06] shadow-xs space-y-2.5">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={
                    currentCategory === 'grocery'
                      ? 'Rechercher par nom, code-barre (SKU) ou rayon...'
                      : 'Rechercher un plat, ingrédient ou formule...'
                  }
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00B578]"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => {
                    setSelectedAisle('all');
                    setStockStatusFilter('all');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedAisle === 'all' && stockStatusFilter === 'all'
                      ? 'bg-[#1A1D20] text-white'
                      : 'bg-neutral-100 text-zinc-600 hover:bg-neutral-200'
                  }`}
                >
                  Tous ({menuItems.length})
                </button>

                {currentCategory === 'grocery' && (
                  <button
                    onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                      stockStatusFilter === 'low'
                        ? 'bg-amber-700 text-white'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    <span>⚠️ Stock Bas</span>
                    {lowStockCount > 0 && (
                      <span className="bg-amber-900 text-white text-[9px] px-1.5 rounded-full">
                        {lowStockCount}
                      </span>
                    )}
                  </button>
                )}

                {currentStore.menuCategories.map((cat) => {
                  const isSelected = selectedAisle === cat;
                  const count = menuItems.filter((i) => i.category === cat || i.aisle === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedAisle(cat);
                        setStockStatusFilter('all');
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#00B578] text-white'
                          : 'bg-neutral-100 text-zinc-600 hover:bg-neutral-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tailored Product Feed */}
            <div className="space-y-2.5">
              {(() => {
                const filtered = menuItems.filter((item) => {
                  if (catalogSearch.trim()) {
                    const q = catalogSearch.toLowerCase().trim();
                    const matchName = item.name.toLowerCase().includes(q);
                    const matchDesc = item.description?.toLowerCase().includes(q);
                    const matchSku = item.sku?.toLowerCase().includes(q);
                    const matchCat = item.category?.toLowerCase().includes(q);
                    const matchAisle = item.aisle?.toLowerCase().includes(q);
                    if (!matchName && !matchDesc && !matchSku && !matchCat && !matchAisle) return false;
                  }
                  if (selectedAisle !== 'all' && item.category !== selectedAisle && item.aisle !== selectedAisle) {
                    return false;
                  }
                  if (stockStatusFilter === 'low') {
                    const threshold = item.stockThreshold || 5;
                    return (item.stockQuantity ?? 99) <= threshold;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-neutral-300 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 text-zinc-400 mx-auto flex items-center justify-center">
                        <Boxes size={24} />
                      </div>
                      <p className="text-xs font-bold text-zinc-700">Aucun produit ne correspond aux filtres</p>
                      <button
                        onClick={handleOpenAddProduct}
                        className="text-xs bg-[#00B578] text-white font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>{categoryConfig.labels.addProduct}</span>
                      </button>
                    </div>
                  );
                }

                return filtered.map((item) => {
                  const isLow = (item.stockQuantity ?? 99) <= (item.stockThreshold || 5);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        !item.isAvailable
                          ? 'border-red-200 bg-red-50/10'
                          : isLow && currentCategory === 'grocery'
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-neutral-200/90'
                      }`}
                    >
                      {/* Left: Product Image & Meta */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                          <LazyImage
                            src={item.imageUrl}
                            alt={item.name}
                            placeholderType="food"
                            targetWidth={160}
                            className={`w-full h-full object-cover ${
                              !item.isAvailable && 'grayscale opacity-60'
                            }`}
                          />
                          {item.badge && (
                            <span className="absolute top-1 left-1 bg-[#D9943B] text-[#071E26] text-[8px] font-extrabold px-1 rounded shadow-xs">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-zinc-900 truncate">{item.name}</h4>
                            <span className="text-[10px] text-zinc-400 bg-neutral-100 px-1.5 py-0.2 rounded shrink-0">
                              {item.category}
                            </span>
                            {item.aisle && (
                              <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-medium shrink-0">
                                Rayon : {item.aisle}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>

                          {/* Category-Tailored Dynamic Badges & Publishing Details */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {/* Grocery Tailored Attributes */}
                            {currentCategory === 'grocery' && (
                              <>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                    (item.stockQuantity ?? 0) === 0
                                      ? 'bg-red-100 text-red-700 border border-red-200'
                                      : isLow
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  📦 Stock : {item.stockQuantity ?? 0} {item.unit || 'unités'}
                                </span>

                                {item.sku && (
                                  <span className="text-[9px] font-mono text-zinc-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                    SKU: {item.sku}
                                  </span>
                                )}

                                {item.expirationDate && (
                                  <span className="text-[9px] text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                                    DLC: {item.expirationDate}
                                  </span>
                                )}
                              </>
                            )}

                            {/* Restaurant Tailored Attributes */}
                            {currentCategory === 'restaurant' && (
                              <>
                                {item.prepTimeMinutes && (
                                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    ⏱️ {item.prepTimeMinutes} min prépa
                                  </span>
                                )}
                                {item.isSpicy && (
                                  <span className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    🌶️ {item.spiceLevel === 'extra_hot' ? 'Très Piquant' : 'Piquant Harissa'}
                                  </span>
                                )}
                              </>
                            )}

                            {/* Pharmacy Tailored Attributes */}
                            {currentCategory === 'pharmacy' && item.isPrescriptionRequired && (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                                📋 Ordonnance Requise
                              </span>
                            )}

                            {/* Butcher Tailored Attributes */}
                            {currentCategory === 'butcher' && item.originHalal && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                                🥩 100% Halal Certifié
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing, Quick Restock, Availability & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                        {/* Price Display */}
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-sm text-zinc-900 block">
                            {item.price} DZD
                          </span>
                          {item.unit && currentCategory === 'grocery' && (
                            <span className="text-[9px] text-zinc-400">/ {item.unit}</span>
                          )}
                        </div>

                        {/* Quick Restock Buttons (for Grocery) */}
                        {currentCategory === 'grocery' && (
                          <div className="flex items-center gap-1 shrink-0 bg-neutral-50 p-1 rounded-xl border border-neutral-200">
                            <span className="text-[9px] text-zinc-400 font-bold px-1 uppercase">
                              + Stock :
                            </span>
                            <button
                              onClick={() => handleQuickRestock(item.id, 5)}
                              className="px-1.5 py-0.5 bg-white hover:bg-emerald-50 hover:text-[#00B578] border border-neutral-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                              title="Ajouter 5 unités au stock"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleQuickRestock(item.id, 20)}
                              className="px-1.5 py-0.5 bg-white hover:bg-emerald-50 hover:text-[#00B578] border border-neutral-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                              title="Ajouter 20 unités au stock"
                            >
                              +20
                            </button>
                            <button
                              onClick={() => handleQuickRestock(item.id, 50)}
                              className="px-1.5 py-0.5 bg-white hover:bg-emerald-50 hover:text-[#00B578] border border-neutral-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                              title="Ajouter 50 unités au stock"
                            >
                              +50
                            </button>
                          </div>
                        )}

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => toggleItemAvailability(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                            item.isAvailable
                              ? 'bg-emerald-50 text-[#00875A] border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {item.isAvailable ? (
                            <>
                              <Check size={13} strokeWidth={2.5} />
                              <span>En Vente</span>
                            </>
                          ) : (
                            <span>Rupture</span>
                          )}
                        </button>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditProduct(item)}
                            title="Modifier ce produit"
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-zinc-700 transition-colors cursor-pointer"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            title="Supprimer ce produit"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
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

        {/* TAB 4: STORE SETTINGS & CATEGORY CONFIGURATION */}
        {activeTab === 'store' && (
          <div className="space-y-3">
            {/* Active Store Profile & Tailored Category Card */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0">
                  <CategoryIconComponent size={28} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm text-zinc-900 truncate">{currentStore.name}</h3>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      {categoryConfig.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                    {currentStore.description || 'Commerce local partenaire certifié Ahmed Rachedi'}
                  </p>
                </div>
              </div>

              {/* Category-Tailored Active Tools Checklist */}
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-800 uppercase tracking-wide">
                    Outils activés pour ce profil ({categoryConfig.name}) :
                  </span>
                  <span className="text-[10px] font-extrabold text-[#00875A] bg-emerald-100/70 px-2 py-0.2 rounded-full">
                    Sur-Mesure
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-700">
                  {categoryConfig.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-[#00B578] shrink-0" />
                      <span className="text-[11px]">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Details */}
              <div className="space-y-2 text-xs pt-1 border-t border-neutral-100">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-[#D9943B] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-800">Localisation commerciale :</span>
                    <p className="text-zinc-600">{currentStore.address || 'Rue Principale (CW 152), Ahmed Rachedi Centre'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#00B578] shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-800">Ligne directe :</span>
                    <span className="text-zinc-600 font-mono ml-1">{currentStore.phone || '+213 31 47 11 22'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Printer size={14} className="text-zinc-500 shrink-0" />
                  <div>
                    <span className="font-bold text-zinc-800">Équipement Terminal :</span>
                    <span className="text-emerald-700 font-semibold ml-1">Connecté (Impression thermique & dispatch coursier)</span>
                  </div>
                </div>
              </div>

              {/* Reconfiguration & Onboarding CTA */}
              <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="flex-1 py-2.5 bg-neutral-900 hover:bg-black active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <StoreIcon size={14} />
                  <span>Changer de catégorie / Créer un commerce</span>
                </button>
                <button
                  onClick={handleOpenAddProduct}
                  className="flex-1 py-2.5 bg-[#00B578] hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>{categoryConfig.labels.addProduct}</span>
                </button>
              </div>
            </div>

            {/* Store Directory Switcher Card */}
            <div className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-xs space-y-2.5">
              <h4 className="font-bold text-xs text-zinc-900">Mes Commerces à Ahmed Rachedi ({stores.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stores.map((st) => {
                  const isCurrent = st.id === currentStore.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStore(st.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-[#00B578] bg-emerald-50/40 shadow-xs'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-900 truncate">{st.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-[#00B578] text-white font-extrabold px-1.5 py-0.2 rounded">
                            Actif
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{st.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={onBackToCustomer}
              className="w-full py-3 bg-neutral-200 hover:bg-neutral-300 text-zinc-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Retour à l'Espace Client
            </button>
          </div>
        )}
      </main>

      {/* DEDICATED MERCHANT BOTTOM NAVIGATION BAR WITH DYNAMIC CATEGORY */}
      <MerchantBottomNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingOrders.length}
        unreadCount={merchantThreads.filter((t) => t.unread).length}
        businessCategory={currentCategory}
      />

      {/* MODAL 1: DYNAMIC MERCHANT ONBOARDING & CATEGORY CONFIGURATION */}
      <MerchantOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStoreCreated={handleStoreCreated}
      />

      {/* MODAL 2: TAILORED PRODUCT PUBLISHING & INVENTORY EDITOR */}
      <ProductEditorModal
        isOpen={isProductEditorOpen}
        onClose={() => setIsProductEditorOpen(false)}
        onSave={handleSaveProduct}
        initialItem={editingItem}
        businessCategory={currentCategory}
        existingCategories={currentStore.menuCategories}
      />
    </div>
  );
};
