/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Persona,
  CustomerTab,
  Store,
  MenuItem,
  CartItem,
  DeliveryAddress,
  Order,
  OrderStatus,
  ChatMessage,
  AvailableDeliveryPoolOrder,
  NetworkQuality,
} from './types';
import {
  HOMEPAGE_ESSENTIAL_STORES,
  DEFAULT_ADDRESS,
  HOMEPAGE_ACTIVE_ORDER,
} from './data/essentialHomeData';
import {
  getFullStore,
  getAllFullStores,
  getCourierPool,
  getPastOrders,
  getChatMessages,
} from './services/storeService';

// Synchronously loaded lightweight components for the critical customer homepage path
import { PersonaSwitcher } from './components/PersonaSwitcher';
import { ProfessionalPortalHeader } from './components/ProfessionalPortalHeader';
import { ProfessionalAccountsModal } from './components/ProfessionalAccountsModal';
import { HeaderBar } from './components/HeaderBar';
import { BottomNavBar } from './components/BottomNavBar';
import { LazyImage } from './components/common/LazyImage';
import { HomeDiscoveryScreen } from './components/HomeDiscoveryScreen';
import { transitionOrder, getNextSimulatedStatus } from './utils/orderStateMachine';
import { purchasingHistoryDB } from './db/localDatabase';
import { useGlobalHorizontalScroll } from './hooks/useGlobalHorizontalScroll';
import { AuthProvider, UserRole, useAuth } from './firebase/AuthContext';
import {
  syncOrderToFirestore,
  sendPushNotification,
  onPushNotification,
  PushNotificationPayload,
} from './firebase/firebaseServices';
import { NotificationsModal } from './components/NotificationsModal';
import { adminService, ADMIN_UPDATED_EVENT } from './services/adminService';
import { HelpCircle, History, Sparkles, BellRing } from 'lucide-react';

// Asynchronously loaded secondary views & heavy modals to dramatically minimize initial bundle size
const StoreDetailScreen = React.lazy(() =>
  import('./components/StoreDetailScreen').then((m) => ({ default: m.StoreDetailScreen }))
);
const DishCustomizationModal = React.lazy(() =>
  import('./components/DishCustomizationModal').then((m) => ({ default: m.DishCustomizationModal }))
);
const CheckoutScreen = React.lazy(() =>
  import('./components/CheckoutScreen').then((m) => ({ default: m.CheckoutScreen }))
);
const LiveOrderTrackingScreen = React.lazy(() =>
  import('./components/LiveOrderTrackingScreen').then((m) => ({ default: m.LiveOrderTrackingScreen }))
);
const LiveChatModal = React.lazy(() =>
  import('./components/LiveChatModal').then((m) => ({ default: m.LiveChatModal }))
);
const GroceryMarketScreen = React.lazy(() =>
  import('./components/GroceryMarketScreen').then((m) => ({ default: m.GroceryMarketScreen }))
);
const OrdersListScreen = React.lazy(() =>
  import('./components/OrdersListScreen').then((m) => ({ default: m.OrdersListScreen }))
);
const UserProfileScreen = React.lazy(() =>
  import('./components/UserProfileScreen').then((m) => ({ default: m.UserProfileScreen }))
);
const DineInGroupDealsScreen = React.lazy(() =>
  import('./components/DineInGroupDealsScreen').then((m) => ({ default: m.DineInGroupDealsScreen }))
);
const FirebaseStatusModal = React.lazy(() =>
  import('./components/FirebaseStatusModal').then((m) => ({ default: m.FirebaseStatusModal }))
);
const HttpSmsConsoleModal = React.lazy(() =>
  import('./components/HttpSmsConsoleModal').then((m) => ({ default: m.HttpSmsConsoleModal }))
);
const AuthModal = React.lazy(() =>
  import('./components/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const CourierAppView = React.lazy(() =>
  import('./components/CourierAppView').then((m) => ({ default: m.CourierAppView }))
);
const MerchantAppView = React.lazy(() =>
  import('./components/MerchantAppView').then((m) => ({ default: m.MerchantAppView }))
);
const AdminAppView = React.lazy(() =>
  import('./components/AdminAppView').then((m) => ({ default: m.AdminAppView }))
);
const TechStackRadarModal = React.lazy(() =>
  import('./components/TechStackRadarModal').then((m) => ({ default: m.TechStackRadarModal }))
);
const OrderRatingModal = React.lazy(() =>
  import('./components/OrderRatingModal').then((m) => ({ default: m.OrderRatingModal }))
);
const CustomerFAQScreen = React.lazy(() =>
  import('./components/CustomerFAQScreen').then((m) => ({ default: m.CustomerFAQScreen }))
);
const PointsHistoryScreen = React.lazy(() =>
  import('./components/PointsHistoryScreen').then((m) => ({ default: m.PointsHistoryScreen }))
);
const FidelitySystemModal = React.lazy(() =>
  import('./components/FidelitySystemModal').then((m) => ({ default: m.FidelitySystemModal }))
);

type CustomerView = 'tabs' | 'store_detail' | 'grocery_market' | 'checkout' | 'order_tracking' | 'faq' | 'points_history';

const LoadingFallback: React.FC<{ label?: string }> = ({ label = 'Chargement...' }) => (
  <div className="flex-1 flex items-center justify-center p-8 text-xs text-zinc-400">
    <div className="w-5 h-5 border-2 border-[#D9943B] border-t-transparent rounded-full animate-spin mr-2" />
    <span>{label}</span>
  </div>
);

function AppContent() {
  // Global horizontal scroll listener enabling mouse wheel & drag scrolling for all horizontal lists
  useGlobalHorizontalScroll();

  // Global Ecosystem States
  const [persona, setPersona] = useState<Persona>(() => {
    try {
      const saved = localStorage.getItem('rym_active_account_persona');
      if (saved && ['customer', 'courier', 'merchant', 'admin'].includes(saved)) {
        return saved as Persona;
      }
    } catch {}
    return 'customer';
  });
  const [showProfessionalAccountsModal, setShowProfessionalAccountsModal] = useState(false);
  const [selectedProRoleInitial, setSelectedProRoleInitial] = useState<Persona | undefined>(undefined);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('ONLINE');
  const [showTechStackModal, setShowTechStackModal] = useState(false);
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  // Default to 'tabs' so the customer lands immediately on the customer homepage
  const [customerView, setCustomerView] = useState<CustomerView>('tabs');

  // Stores & Location - Initialized with lightweight essential homepage data
  const [stores, setStores] = useState<Store[]>(HOMEPAGE_ESSENTIAL_STORES);
  const [selectedLocation, setSelectedLocation] = useState('Cité 500 Logements, Mila (43)');
  const [activeStore, setActiveStore] = useState<Store>(HOMEPAGE_ESSENTIAL_STORES[0]);

  // Cart & Order
  const [cart, setCart] = useState<CartItem[]>([
    {
      menuItemId: 'item-1',
      storeId: 'store-beniharoun',
      storeName: 'Restaurant Beni Haroun - Mila',
      name: 'Menu Maxi Chawarma Poulet Braisé & Frites',
      basePrice: 750,
      quantity: 1,
      imageUrl: HOMEPAGE_ESSENTIAL_STORES[0]?.items[0]?.imageUrl || '',
      options: [
        { groupName: 'Harissa', optionName: 'Harissa Traditionnelle', priceDelta: 0 },
        { groupName: 'Accompagnement', optionName: 'Frites fraîches maison', priceDelta: 0 },
      ],
    },
  ]);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(DEFAULT_ADDRESS);
  const [activeOrder, setActiveOrder] = useState<Order | null>(HOMEPAGE_ACTIVE_ORDER);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<Order[]>([HOMEPAGE_ACTIVE_ORDER]);
  const [courierPool, setCourierPool] = useState<AvailableDeliveryPoolOrder[]>([]);

  // Modals & Chat
  const [customizingDish, setCustomizingDish] = useState<{ dish: MenuItem; storeName: string } | null>(null);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Toast Helper - Defined early to prevent any initialization or TDZ reference errors
  const triggerToast = useCallback((msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  }, []);

  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showHttpSmsModal, setShowHttpSmsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authModalRole, setAuthModalRole] = useState<UserRole>('customer');
  const [ratingModalOrder, setRatingModalOrder] = useState<Order | null>(null);
  const [ratingModalInitialRating, setRatingModalInitialRating] = useState<number>(5);
  const [showFidelityModal, setShowFidelityModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [receivedNotifications, setReceivedNotifications] = useState<PushNotificationPayload[]>([]);

  // Native Notification Service from AuthContext
  const {
    notificationPermission,
    isNotificationSupported,
    notificationsEnabled,
    requestNotificationPermission,
    sendNativeNotification,
  } = useAuth();

  // Lazy-load data when non-homepage views or secondary personas are requested
  useEffect(() => {
    if (persona === 'courier' && courierPool.length === 0) {
      getCourierPool().then(setCourierPool);
    }
    if (persona === 'merchant' || persona === 'admin') {
      getAllFullStores().then(setStores);
    }
  }, [persona, courierPool.length]);

  useEffect(() => {
    if (customerTab === 'orders' && pastOrders.length === 0) {
      getPastOrders().then(setPastOrders);
    }
    if ((customerTab === 'messages' || showLiveChat) && chatMessages.length === 0) {
      getChatMessages().then(setChatMessages);
    }
  }, [customerTab, showLiveChat, pastOrders.length, chatMessages.length]);

  // Listen to Firebase FCM push notifications in-app and dispatch native OS alert
  useEffect(() => {
    const unsubscribe = onPushNotification((notif) => {
      triggerToast(`🔔 ${notif.title}: ${notif.body}`);
      setReceivedNotifications((prev) => [notif, ...prev.slice(0, 19)]);
      sendNativeNotification(notif.title, {
        body: notif.body,
        tag: notif.data?.orderId ? `order-${notif.data.orderId}` : notif.id,
        data: notif.data,
      });
    });
    return () => unsubscribe();
  }, [triggerToast, sendNativeNotification]);

  // Synchronize store updates and settings emitted by adminService
  useEffect(() => {
    const handleAdminStateSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ domain?: string; payload?: any }>;
      const domain = customEvent.detail?.domain;
      if (domain === 'stores' || !domain) {
        setStores([...adminService.getStores()]);
      }
    };
    window.addEventListener(ADMIN_UPDATED_EVENT, handleAdminStateSync);
    return () => window.removeEventListener(ADMIN_UPDATED_EVENT, handleAdminStateSync);
  }, []);

  // Cart Handlers
  const handleAddToCart = useCallback((newItem: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.menuItemId === newItem.menuItemId &&
          JSON.stringify(item.options) === JSON.stringify(newItem.options)
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += newItem.quantity;
        return copy;
      }
      return [...prev, newItem];
    });

    triggerToast(`Ajouté au panier : ${newItem.name} (${newItem.quantity})`);
  }, [triggerToast]);

  const handleUpdateCartQuantity = useCallback((menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  }, []);

  // Order Flow Handlers
  const handleConfirmOrder = useCallback((newOrder: Order) => {
    setActiveOrder(newOrder);
    setMerchantOrders((prev) => [newOrder, ...prev]);
    setPastOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setCustomerView('order_tracking');

    // Persist to local database (Purchasing History & Fidelity Points)
    purchasingHistoryDB.recordPurchaseFromOrder(newOrder);

    // Sync to Cloud Firestore & Dispatch Firebase Push Notification
    syncOrderToFirestore(newOrder);
    sendPushNotification(
      'shop',
      `Nouvelle commande #${newOrder.orderNumber} !`,
      `${newOrder.items.length} articles commandés. Montant : ${newOrder.total} DZD.`
    );

    // Native background notification to customer
    sendNativeNotification(`Commande #${newOrder.orderNumber} confirmée`, {
      body: `Votre commande chez ${newOrder.storeName} a été enregistrée avec succès.`,
      tag: `order-${newOrder.id}`,
      requireInteraction: true,
      data: { orderId: newOrder.id, status: 'CONFIRMED' },
    });

    // Automatically sync a new mission to the Courier Pool
    const newMission = {
      id: `pool-${Date.now()}`,
      orderNumber: newOrder.orderNumber,
      restaurantName: newOrder.storeName,
      restaurantAddress: 'Mila Centre (Place d\'Armes)',
      customerName: newOrder.deliveryAddress.recipientName,
      destinationAddress: `${newOrder.deliveryAddress.street}, ${newOrder.deliveryAddress.commune}`,
      landmark: newOrder.deliveryAddress.landmark,
      distanceKm: 1.1,
      totalAmountDZD: newOrder.total,
      courierFeeDZD: 280,
      itemCount: newOrder.items.length,
      estimatedPreparationMin: 12,
      status: 'available' as const,
    };
    setCourierPool((prev) => [newMission, ...prev]);

    triggerToast(`Commande ${newOrder.orderNumber} confirmée avec succès !`);
  }, [triggerToast]);

  const handleReorder = useCallback((order: Order) => {
    setCart(order.items);
    setCustomerView('checkout');
  }, []);

  // Chat Handlers
  const handleSendMessage = useCallback((text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      senderName: 'Vous',
      senderAvatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDuN2_w-EBNtEXJguBVUeD5bfr4lhFYP9v-b1VFSGROFgx6RXqoF5GL9ooQUB3VjQoQ4Vf6aJyJvt4-UM1Zq1temtjmArdLxFCleb3mp8EFzcpHJsuMXGOHdLa6fuol7ilUBCci6mfacs12VyQWsAZNHp0pkoYUGqyZNTkYh30tf011opO1qtvgoPeMkIhM_eGtTVj7ra-ec0R_7Fy9TD3CWRApTQszxxQXb5hf_wx7SD5qVWzZs1OO',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      const courierReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'courier',
        senderName: 'Walid M.',
        senderAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAnLgieeCF8ANxDxGqfJBxx4kjN-psqMb4MO9qTa3aoO0Qsz5aYMyWF-4meTl3-YluN6pO1WvE3z8q13EjhO4ylotuROjN2F7b3cGzY6InATavSGNRiY81Abt6msgXrjxk1hJZh3ivc3Qg62zoChrbudeY-GLLB23Axh3UpzfYfLXjdMxaZU-7HXMBbw9EyBfXunbj3n_WZXmeMexp59kbQmk5YHH5YXHBP2O0vbMoPila0sJJxBx5A',
        badge: 'Livreur',
        text: 'Bien reçu khoya ! Je suis à 5 minutes de votre adresse à Mila. Le repas arrive bien chaud ! 🛵',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, courierReply]);
    }, 1200);
  }, []);

  // Courier Actions
  const handleAcceptPoolOrder = useCallback((poolId: string) => {
    setCourierPool((prev) =>
      prev.map((item) => (item.id === poolId ? { ...item, status: 'claimed' } : item))
    );
    triggerToast('Mission acceptée ! Rendez-vous au restaurant pour le retrait.');
  }, [triggerToast]);

  const handleAdvanceActiveOrderStep = useCallback(() => {
    if (!activeOrder) return;
    const nextStatus = getNextSimulatedStatus(activeOrder.status);
    if (!nextStatus) {
      triggerToast(`Commande déjà au statut final : ${activeOrder.status}`);
      return;
    }

    const actorRole = persona === 'courier' ? 'COURIER' : persona === 'merchant' ? 'MERCHANT' : 'SYSTEM';
    const actorName =
      persona === 'courier'
        ? (activeOrder.courierName || 'Walid M. (Livreur)')
        : persona === 'merchant'
        ? activeOrder.storeName
        : 'Système Dispatch Mila';

    const note =
      nextStatus === 'DELIVERED'
        ? `Remise de la commande effectuée et paiement de ${activeOrder.total} DZD perçu en espèces.`
        : nextStatus === 'DELIVERING'
        ? `Commande récupérée auprès de ${activeOrder.storeName}, livreur en route vers ${activeOrder.deliveryAddress.commune}.`
        : `Transition d'état: ${nextStatus}`;

    const updated = transitionOrder(
      activeOrder,
      nextStatus,
      { role: actorRole, name: actorName },
      note
    );

    setActiveOrder(updated);
    setMerchantOrders((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o))
    );

    syncOrderToFirestore(updated);
    sendPushNotification('all', `Commande #${updated.orderNumber}`, note);

    // Native background notification to customer with sound and system tray display
    const statusTitles: Record<string, string> = {
      CONFIRMED: `Commande #${updated.orderNumber} confirmée`,
      PREPARING: `En cuisine : ${updated.storeName}`,
      PICKED_UP: `Prise en charge par le livreur`,
      DELIVERING: `Livreur en route vers votre adresse 🛵`,
      ARRIVED: `Le livreur est à votre porte ! 📍`,
      DELIVERED: `Commande #${updated.orderNumber} livrée avec succès ✅`,
      CANCELLED: `Commande #${updated.orderNumber} annulée`,
    };
    sendNativeNotification(statusTitles[nextStatus] || `Mise à jour Commande #${updated.orderNumber}`, {
      body: note,
      tag: `order-${updated.id}`,
      requireInteraction: true,
      data: { orderId: updated.id, status: nextStatus },
    });

    if (nextStatus === 'DELIVERED') {
      setPastOrders((prev) => [updated, ...prev.filter((o) => o.id !== updated.id)]);
      triggerToast('Commande livrée avec succès ! Encaissement espèces validé.');
      if (persona === 'customer') {
        setTimeout(() => {
          setRatingModalOrder(updated);
          setRatingModalInitialRating(5);
        }, 1000);
      }
    } else {
      triggerToast(`Statut mis à jour : ${nextStatus}`);
    }
  }, [activeOrder, persona, triggerToast]);

  const handleJumpToOrderStatus = useCallback(
    (targetStatus: OrderStatus) => {
      if (!activeOrder || activeOrder.status === targetStatus) return;

      const actorRole = persona === 'courier' ? 'COURIER' : persona === 'merchant' ? 'MERCHANT' : 'SYSTEM';
      const actorName =
        persona === 'courier'
          ? (activeOrder.courierName || 'Walid M. (Livreur)')
          : persona === 'merchant'
          ? activeOrder.storeName
          : 'Système Dispatch Mila';

      const note =
        targetStatus === 'DELIVERED'
          ? `Remise de la commande effectuée et paiement de ${activeOrder.total} DZD perçu en espèces.`
          : targetStatus === 'DELIVERING'
          ? `Commande récupérée auprès de ${activeOrder.storeName}, livreur en route vers ${activeOrder.deliveryAddress.commune}.`
          : `Étape : ${targetStatus}`;

      const updated = transitionOrder(
        activeOrder,
        targetStatus,
        { role: actorRole, name: actorName },
        note
      );

      setActiveOrder(updated);
      setMerchantOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );

      syncOrderToFirestore(updated);
      sendPushNotification('all', `Commande #${updated.orderNumber}`, note);

      const statusTitles: Record<string, string> = {
        CONFIRMED: `Commande #${updated.orderNumber} confirmée`,
        PREPARING: `En cuisine : ${updated.storeName}`,
        PICKED_UP: `Prise en charge par le livreur`,
        DELIVERING: `Livreur en route vers votre adresse 🛵`,
        ARRIVED: `Le livreur est à votre porte ! 📍`,
        DELIVERED: `Commande #${updated.orderNumber} livrée avec succès ✅`,
        CANCELLED: `Commande #${updated.orderNumber} annulée`,
      };
      sendNativeNotification(statusTitles[targetStatus] || `Mise à jour Commande #${updated.orderNumber}`, {
        body: note,
        tag: `order-${updated.id}`,
        requireInteraction: true,
        data: { orderId: updated.id, status: targetStatus },
      });

      if (targetStatus === 'DELIVERED') {
        setPastOrders((prev) => [updated, ...prev.filter((o) => o.id !== updated.id)]);
        triggerToast('Commande livrée avec succès ! Encaissement espèces validé.');
        if (persona === 'customer') {
          setTimeout(() => {
            setRatingModalOrder(updated);
            setRatingModalInitialRating(5);
          }, 1000);
        }
      } else {
        triggerToast(`Statut mis à jour : ${targetStatus}`);
      }
    },
    [activeOrder, persona, triggerToast, sendNativeNotification]
  );

  // Merchant & Admin Order State Transitions
  const handleUpdateOrderStatus = useCallback((orderId: string, newStatus: Order['status']) => {
    const targetOrder =
      activeOrder?.id === orderId
        ? activeOrder
        : merchantOrders.find((o) => o.id === orderId) || pastOrders.find((o) => o.id === orderId);

    if (targetOrder) {
      const actorRole = persona === 'admin' ? 'SYSTEM' : 'MERCHANT';
      const actorName = persona === 'admin' ? 'Console Admin Ahmed Rachedi' : targetOrder.storeName;

      const updated = transitionOrder(
        targetOrder,
        newStatus,
        { role: actorRole, name: actorName },
        `Statut commande mis à jour : ${newStatus}`
      );

      setMerchantOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );

      setPastOrders((prev) => {
        const exists = prev.some((o) => o.id === orderId);
        if (exists) {
          return prev.map((o) => (o.id === orderId ? updated : o));
        }
        return [updated, ...prev];
      });

      if (activeOrder && activeOrder.id === orderId) {
        setActiveOrder(updated);
      }

      syncOrderToFirestore(updated);
      sendPushNotification(
        'customer',
        `Commande #${updated.orderNumber}`,
        `Votre commande est maintenant : ${newStatus}`
      );
      sendNativeNotification(`Commande #${updated.orderNumber}`, {
        body: `Votre commande est maintenant : ${newStatus}`,
        tag: `order-${updated.id}`,
        requireInteraction: true,
        data: { orderId: updated.id, status: newStatus },
      });

      triggerToast(`Commande ${targetOrder.orderNumber} mise à jour : ${newStatus}`);
    }
  }, [activeOrder, merchantOrders, pastOrders, persona, triggerToast, sendNativeNotification]);

  // Handler for store selection with lazy detail loading
  const handleSelectStore = useCallback(async (st: Store) => {
    if (st.items && st.items.length > 1) {
      setActiveStore(st);
    } else {
      const full = await getFullStore(st.id);
      setActiveStore(full);
    }
    setCustomerView('store_detail');
  }, []);

  // Handler for dish customization with lazy menu loading
  const handleSelectDishToCustomize = useCallback(async (st: Store, dishId: string) => {
    const full = await getFullStore(st.id);
    const dish = full.items.find((i) => i.id === dishId) || st.items.find((i) => i.id === dishId);
    if (dish) {
      setCustomizingDish({ dish, storeName: full.name });
    }
  }, []);

  const containerMaxWidth = useMemo(() => {
    return persona === 'admin'
      ? 'max-w-6xl'
      : persona === 'merchant'
      ? 'max-w-5xl'
      : 'max-w-[430px]';
  }, [persona]);

  return (
    <div className="min-h-screen bg-[#071F27] flex flex-col items-center justify-start antialiased selection:bg-[#D91A67] selection:text-white">
      {/* Responsive Viewport Container */}
      <div className={`w-full ${containerMaxWidth} min-h-screen bg-[#F8F4EC] shadow-2xl flex flex-col relative overflow-x-hidden transition-all duration-300 border-x border-[#0A2B35]/20`}>
        {/* Professional Portal Header: Displayed only in Professional Workspaces (Courier, Merchant, Admin) */}
        {persona !== 'customer' && (
          <ProfessionalPortalHeader
            currentPersona={persona}
            onChangePersona={(newPersona) => {
              setPersona(newPersona);
              if (newPersona === 'customer') {
                setCustomerView('tabs');
              }
            }}
            onOpenAccountsModal={() => {
              setSelectedProRoleInitial(persona);
              setShowProfessionalAccountsModal(true);
            }}
            onOpenTechStack={() => setShowTechStackModal(true)}
          />
        )}

        {/* ============================================================ */}
        {/* 1. CUSTOMER PERSONA VIEW                                     */}
        {/* ============================================================ */}
        {persona === 'customer' && (
          <div className="flex-1 flex flex-col">
            {/* Customer Sub-Views */}
            {customerView === 'store_detail' && (
              <React.Suspense fallback={<LoadingFallback label="Chargement restaurant..." />}>
                <StoreDetailScreen
                  store={activeStore}
                  onBack={() => setCustomerView('tabs')}
                  cartItems={cart}
                  onOpenDishCustomization={(dishId) => {
                    const dish = activeStore.items.find((i) => i.id === dishId);
                    if (dish) {
                      setCustomizingDish({ dish, storeName: activeStore.name });
                    }
                  }}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onOpenCheckout={() => setCustomerView('checkout')}
                />
              </React.Suspense>
            )}

            {customerView === 'grocery_market' && (
              <React.Suspense fallback={<LoadingFallback label="Chargement marché..." />}>
                <GroceryMarketScreen
                  store={stores[1] || stores[0]}
                  onBack={() => setCustomerView('tabs')}
                  cartItems={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onOpenCheckout={() => setCustomerView('checkout')}
                />
              </React.Suspense>
            )}

            {customerView === 'checkout' && (
              <React.Suspense fallback={<LoadingFallback label="Validation du panier..." />}>
                <CheckoutScreen
                  cartItems={cart}
                  deliveryAddress={deliveryAddress}
                  onUpdateAddress={setDeliveryAddress}
                  onBack={() => setCustomerView('tabs')}
                  onConfirmOrder={handleConfirmOrder}
                  onOpenFAQ={() => setCustomerView('faq')}
                />
              </React.Suspense>
            )}

            {customerView === 'order_tracking' && activeOrder && (
              <React.Suspense fallback={<LoadingFallback label="Chargement suivi & carte..." />}>
                <LiveOrderTrackingScreen
                  order={activeOrder}
                  onBack={() => setCustomerView('tabs')}
                  onOpenChat={() => setShowLiveChat(true)}
                  onSimulateStatusAdvance={handleAdvanceActiveOrderStep}
                  onJumpToStatus={handleJumpToOrderStatus}
                  networkQuality={networkQuality}
                  onOpenRatingModal={(initialRating) => {
                    setRatingModalOrder(activeOrder);
                    setRatingModalInitialRating(initialRating || 5);
                  }}
                />
              </React.Suspense>
            )}

            {customerView === 'faq' && (
              <React.Suspense fallback={<LoadingFallback label="Chargement FAQ..." />}>
                <CustomerFAQScreen
                  onBack={() => setCustomerView('tabs')}
                  onOpenChat={() => setShowLiveChat(true)}
                />
              </React.Suspense>
            )}

            {customerView === 'points_history' && (
              <React.Suspense fallback={<LoadingFallback label="Chargement historique des points..." />}>
                <PointsHistoryScreen
                  onBack={() => setCustomerView('tabs')}
                  onOpenFidelityModal={() => setShowFidelityModal(true)}
                />
              </React.Suspense>
            )}

            {/* Customer Primary Tabs */}
            {customerView === 'tabs' && (
              <div className="flex-1 flex flex-col">
                {/* Header (Only on Home & Discovery) */}
                {(customerTab === 'home' || customerTab === 'discovery') && (
                  <HeaderBar
                    selectedLocation={selectedLocation}
                    onSelectLocation={setSelectedLocation}
                    onOpenNotifications={() => setShowNotificationsModal(true)}
                    onOpenScanner={() => setShowScannerModal(true)}
                    onOpenProfessionalAccounts={() => {
                      setSelectedProRoleInitial(undefined);
                      setShowProfessionalAccountsModal(true);
                    }}
                    onOpenAuth={() => {
                      setAuthModalMode('signin');
                      setShowAuthModal(true);
                    }}
                  />
                )}

                {/* Tab: Home (Primary Customer Homepage) */}
                {customerTab === 'home' && (
                  <HomeDiscoveryScreen
                    stores={stores}
                    onSelectStore={handleSelectStore}
                    onOpenGrocery={() => setCustomerView('grocery_market')}
                    cartItems={cart}
                    onOpenCheckout={() => setCustomerView('checkout')}
                    onOpenAllPromotions={() => {
                      setCustomerTab('discovery');
                      setCustomerView('tabs');
                    }}
                    onSelectDishToCustomize={handleSelectDishToCustomize}
                    activeOrder={activeOrder}
                    onViewOrderTracking={() => setCustomerView('order_tracking')}
                  />
                )}

                {/* Tab: Discovery / Deals */}
                {customerTab === 'discovery' && (
                  <React.Suspense fallback={<LoadingFallback label="Chargement bons plans..." />}>
                    <DineInGroupDealsScreen
                      stores={stores}
                      onSelectStore={handleSelectStore}
                    />
                  </React.Suspense>
                )}

                {/* Tab: Orders */}
                {customerTab === 'orders' && (
                  <React.Suspense fallback={<LoadingFallback label="Chargement historique..." />}>
                    <OrdersListScreen
                      activeOrder={activeOrder}
                      pastOrders={pastOrders}
                      onSelectOrderToTrack={(ord) => {
                        setActiveOrder(ord);
                        setCustomerView('order_tracking');
                      }}
                      onReorder={handleReorder}
                      onOrderRated={(orderId, rating) => {
                        if (activeOrder && activeOrder.id === orderId) {
                          setActiveOrder((prev) => (prev ? { ...prev, isRated: true, rating } : null));
                        }
                        setPastOrders((prev) =>
                          prev.map((o) => (o.id === orderId ? { ...o, isRated: true, rating } : o))
                        );
                        triggerToast('⭐ Avis enregistré avec succès ! +50 points fidélité ajoutés.');
                      }}
                    />
                  </React.Suspense>
                )}

                {/* Tab: Messages */}
                {customerTab === 'messages' && (
                  <div className="flex-1 p-3.5 space-y-3 pb-24">
                    <header className="py-2 border-b border-neutral-100 flex items-center justify-between">
                      <h1 className="font-bold text-[16px]">Messages & Notifications</h1>
                      <span className="text-xs text-[#00B578] font-bold">En ligne</span>
                    </header>

                    {activeOrder && (
                      <div
                        onClick={() => setShowLiveChat(true)}
                        className="bg-white p-3.5 rounded-2xl border border-black/[0.04] shadow-xs flex items-center gap-3 cursor-pointer hover:border-amber-200 transition-all"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-300">
                            <LazyImage
                              src={activeOrder.courierAvatar}
                              alt={activeOrder.courierName}
                              placeholderType="avatar"
                              targetWidth={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00B578] border-2 border-white z-10"></span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-xs text-[#1C1B1B]">{activeOrder.courierName}</h3>
                            <span className="text-[10px] text-zinc-400">12:41</span>
                          </div>
                          <p className="text-xs text-zinc-600 truncate mt-0.5">
                            Parfait khoya, c'est noté ! J'arrive tout de suite. 👍
                          </p>
                          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                            Course en cours #{activeOrder.orderNumber}
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      onClick={() => setShowLiveChat(true)}
                      className="bg-white p-3.5 rounded-2xl border border-black/[0.04] shadow-xs flex items-center gap-3 cursor-pointer hover:border-[#D9943B]/40 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#D9943B] text-[#071F27] flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs">
                        ML
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-xs text-[#1C1B1B]">Support Mila (Wilaya 43)</h3>
                          <span className="text-[10px] text-zinc-400">10:00</span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          Assistance 7j/7 sur toute la ville de Mila : suivi en direct, réclamation, fidélité.
                        </p>
                        <span className="text-[10px] text-[#00B578] font-semibold mt-0.5 block">
                          Service Client Gratuit & Dédié
                        </span>
                      </div>
                    </div>

                    <div
                      id="messages-btn-open-faq"
                      onClick={() => setCustomerView('faq')}
                      className="bg-white p-3.5 rounded-2xl border border-black/[0.04] shadow-xs flex items-center gap-3 cursor-pointer hover:border-amber-200 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs">
                        <HelpCircle size={22} className="text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-xs text-[#1C1B1B]">Foire Aux Questions (FAQ)</h3>
                          <span className="text-[10px] text-amber-900 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded font-bold">Guide</span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          Zones de livraison Mila, tarifs de livraison & paiement à la livraison (COD).
                        </p>
                        <span className="text-[10px] text-amber-800 font-semibold mt-0.5 block">
                          Consulter les réponses instantanées →
                        </span>
                      </div>
                    </div>

                    <div
                      id="messages-btn-open-points-history"
                      onClick={() => setCustomerView('points_history')}
                      className="bg-white p-3.5 rounded-2xl border border-black/[0.04] shadow-xs flex items-center gap-3 cursor-pointer hover:border-amber-200 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs">
                        <History size={22} className="text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-xs text-[#1C1B1B]">Historique des points fidélité</h3>
                          <span className="text-[10px] text-amber-900 bg-amber-100/90 border border-amber-300 px-1.5 py-0.2 rounded font-bold">Terroir</span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          Détail de chaque commande et points générés (purchasingHistoryDB).
                        </p>
                        <span className="text-[10px] text-amber-800 font-semibold mt-0.5 block">
                          Consulter mes points cumulés →
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Profile VIP */}
                {customerTab === 'profile' && (
                  <React.Suspense fallback={<LoadingFallback label="Chargement profil..." />}>
                    <UserProfileScreen
                      onSwitchToCourier={() => {
                        setSelectedProRoleInitial('courier');
                        setShowProfessionalAccountsModal(true);
                      }}
                      onSwitchToMerchant={() => {
                        setSelectedProRoleInitial('merchant');
                        setShowProfessionalAccountsModal(true);
                      }}
                      onOpenProfessionalPortals={(role) => {
                        setSelectedProRoleInitial(role);
                        setShowProfessionalAccountsModal(true);
                      }}
                      onOpenAuth={(initialMode = 'signin') => {
                        setAuthModalMode(initialMode);
                        setShowAuthModal(true);
                      }}
                      onOpenFAQ={() => setCustomerView('faq')}
                      onOpenPointsHistory={() => setCustomerView('points_history')}
                      onOpenNotificationsModal={() => setShowNotificationsModal(true)}
                    />
                  </React.Suspense>
                )}

                {/* Bottom Navigation Bar */}
                <BottomNavBar
                  activeTab={customerTab}
                  onSelectTab={(tab) => {
                    setCustomerTab(tab);
                    setCustomerView('tabs');
                  }}
                  activeOrderCount={activeOrder ? 1 : 0}
                  unreadMessageCount={customerTab === 'messages' ? 0 : (activeOrder ? 1 : 0)}
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. COURIER PERSONA VIEW (Rider App)                          */}
        {/* ============================================================ */}
        {persona === 'courier' && (
          <React.Suspense fallback={<LoadingFallback label="Chargement espace coursier..." />}>
            <CourierAppView
              poolOrders={courierPool}
              activeOrder={activeOrder}
              onAcceptPoolOrder={handleAcceptPoolOrder}
              onAdvanceActiveOrderStep={handleAdvanceActiveOrderStep}
              onBackToCustomer={() => setPersona('customer')}
            />
          </React.Suspense>
        )}

        {/* ============================================================ */}
        {/* 3. MERCHANT PERSONA VIEW (Restaurant Portal)                 */}
        {/* ============================================================ */}
        {persona === 'merchant' && (
          <React.Suspense fallback={<LoadingFallback label="Chargement terminal commerçant..." />}>
            <MerchantAppView
              orders={merchantOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onBackToCustomer={() => setPersona('customer')}
            />
          </React.Suspense>
        )}

        {/* ============================================================ */}
        {/* 4. ADMIN & OPERATIONS CONSOLE                                */}
        {/* ============================================================ */}
        {persona === 'admin' && (
          <React.Suspense fallback={<LoadingFallback label="Chargement console opérationnelle..." />}>
            <AdminAppView
              orders={activeOrder ? [activeOrder, ...pastOrders.filter((o) => o.id !== activeOrder.id)] : pastOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              networkQuality={networkQuality}
              onSetNetworkQuality={setNetworkQuality}
              onOpenTechStack={() => setShowTechStackModal(true)}
              onOpenFirebase={() => setShowFirebaseModal(true)}
              onOpenHttpSms={() => setShowHttpSmsModal(true)}
              onAddNewOrder={(newOrder) => {
                setPastOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
                setMerchantOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
                triggerToast(`Commande téléphonique #${newOrder.orderNumber} créée et assignée !`);
              }}
            />
          </React.Suspense>
        )}

        {/* ============================================================ */}
        {/* GLOBAL MODALS & OVERLAYS (Suspense bounded)                  */}
        {/* ============================================================ */}

        {/* Dish Customization Modal */}
        {customizingDish && (
          <React.Suspense fallback={null}>
            <DishCustomizationModal
              dish={customizingDish.dish}
              storeName={customizingDish.storeName}
              onClose={() => setCustomizingDish(null)}
              onAddToCart={handleAddToCart}
            />
          </React.Suspense>
        )}

        {/* Live Chat Modal */}
        {showLiveChat && activeOrder && (
          <React.Suspense fallback={null}>
            <LiveChatModal
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onClose={() => setShowLiveChat(false)}
              courierName={activeOrder.courierName || 'Karim B.'}
              courierPhone={activeOrder.courierPhone || '+213 555 88 99 00'}
            />
          </React.Suspense>
        )}

        {/* QR Scanner Modal */}
        {showScannerModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 text-center space-y-3">
              <h3 className="font-bold text-base text-[#1C1B1B]">Scanner QR Code</h3>
              <div className="w-48 h-48 mx-auto bg-[#071F27] rounded-2xl flex items-center justify-center relative border-2 border-[#D9943B]">
                <div className="w-36 h-36 border border-dashed border-[#D91A67] animate-pulse rounded-lg"></div>
                <span className="absolute text-[10px] text-zinc-300 bottom-3">
                  Scannez le QR restaurant ou coursier
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Paiement instantané ou commande directe sur table
              </p>
              <button
                onClick={() => setShowScannerModal(false)}
                className="w-full py-2.5 bg-[#D9943B] text-[#071F27] font-bold rounded-full text-xs hover:brightness-105 active:scale-95 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Tech Stack & 2.0 km Radar Modal */}
        {showTechStackModal && (
          <React.Suspense fallback={null}>
            <TechStackRadarModal
              isOpen={showTechStackModal}
              onClose={() => setShowTechStackModal(false)}
            />
          </React.Suspense>
        )}

        {/* Firebase Cloud Suite Spark Modal */}
        {showFirebaseModal && (
          <React.Suspense fallback={null}>
            <FirebaseStatusModal
              isOpen={showFirebaseModal}
              onClose={() => setShowFirebaseModal(false)}
            />
          </React.Suspense>
        )}

        {/* Open-Source HTTP-SMS Gateway Console */}
        {showHttpSmsModal && (
          <React.Suspense fallback={null}>
            <HttpSmsConsoleModal
              isOpen={showHttpSmsModal}
              onClose={() => setShowHttpSmsModal(false)}
            />
          </React.Suspense>
        )}

        {/* Professional Accounts Gateway & Separate Portals Authentication Modal */}
        {showProfessionalAccountsModal && (
          <ProfessionalAccountsModal
            isOpen={showProfessionalAccountsModal}
            onClose={() => setShowProfessionalAccountsModal(false)}
            currentPersona={persona}
            onSelectPersona={(newPersona) => {
              setPersona(newPersona);
              if (newPersona === 'customer') {
                setCustomerView('tabs');
              }
            }}
            initialRole={selectedProRoleInitial}
          />
        )}

        {/* User Authentication & Profile Registration Modal */}
        {showAuthModal && (
          <React.Suspense fallback={null}>
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              initialMode={authModalMode}
              initialRole={authModalRole}
              onSuccess={() => triggerToast('Authentification réussie sur RYM !')}
            />
          </React.Suspense>
        )}

        {/* Order Rating & Feedback Modal (Firestore Synchronized) */}
        {ratingModalOrder && (
          <React.Suspense fallback={null}>
            <OrderRatingModal
              isOpen={Boolean(ratingModalOrder)}
              order={ratingModalOrder}
              initialRating={ratingModalInitialRating}
              onClose={() => setRatingModalOrder(null)}
              onSubmitted={(ratingData) => {
                const ratedId = ratingModalOrder.id;
                if (activeOrder && activeOrder.id === ratedId) {
                  setActiveOrder((prev) =>
                    prev ? { ...prev, isRated: true, rating: ratingData.merchantRating } : null
                  );
                }
                setPastOrders((prev) =>
                  prev.map((o) =>
                    o.id === ratedId
                      ? { ...o, isRated: true, rating: ratingData.merchantRating }
                      : o
                  )
                );
                triggerToast('⭐ Avis enregistré avec succès ! +50 points fidélité crédités.');
              }}
            />
          </React.Suspense>
        )}

        {/* Global Fidelity System Modal */}
        {showFidelityModal && (
          <React.Suspense fallback={null}>
            <FidelitySystemModal
              isOpen={showFidelityModal}
              onClose={() => setShowFidelityModal(false)}
              onOpenPointsHistory={() => {
                setShowFidelityModal(false);
                setCustomerView('points_history');
              }}
            />
          </React.Suspense>
        )}

        {/* Notifications Modal */}
        {showNotificationsModal && (
          <NotificationsModal
            isOpen={showNotificationsModal}
            onClose={() => setShowNotificationsModal(false)}
            recentNotifications={receivedNotifications}
          />
        )}

        {/* Notification Toast Alert */}
        {notificationToast && (
          <div className="fixed top-12 inset-x-4 max-w-[380px] mx-auto z-50 bg-[#1C1B1B] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/10 text-xs font-semibold animate-in fade-in slide-in-from-top duration-200">
            <span className="w-2 h-2 rounded-full bg-[#00B578]"></span>
            <span>{notificationToast}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
