import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, NetworkQuality, AdminTab, Store } from '../types';
import { adminService } from '../services/adminService';
import {
  ShieldAlert,
  Bike,
  Store as StoreIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  DollarSign,
  Radio,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
  Compass,
  Flame,
  MessageSquare,
  Database,
  Users,
  Ticket,
  Sliders,
  PhoneCall,
  ClipboardList,
  Layers,
  LayoutDashboard,
} from 'lucide-react';
import { ALLOWED_TRANSITIONS, canTransitionOrder, rankCouriersForDispatch, LAUNCH_MAX_RADIUS_METERS } from '../utils/orderStateMachine';
import { getLocalTelemetrySnapshot, LocalCourierTelemetryPing } from '../utils/localRealtimeSimulator';
import { DatabaseInspectorModal } from './DatabaseInspectorModal';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminStoresTab } from './admin/AdminStoresTab';
import { AdminOrdersTab } from './admin/AdminOrdersTab';
import { AdminFleetTab } from './admin/AdminFleetTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminPromosTab } from './admin/AdminPromosTab';
import { AdminSettlementTab } from './admin/AdminSettlementTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminArchitectureTab } from './admin/AdminArchitectureTab';
import { AdminManualOrderModal } from './admin/AdminManualOrderModal';

interface Props {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  networkQuality: NetworkQuality;
  onSetNetworkQuality: (quality: NetworkQuality) => void;
  onOpenTechStack: () => void;
  onOpenFirebase?: () => void;
  onOpenHttpSms?: () => void;
  onAddNewOrder?: (newOrder: Order) => void;
}

export const AdminAppView: React.FC<Props> = ({
  orders,
  onUpdateOrderStatus,
  networkQuality,
  onSetNetworkQuality,
  onOpenTechStack,
  onOpenFirebase,
  onOpenHttpSms,
  onAddNewOrder,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showDbInspector, setShowDbInspector] = useState(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);

  // Synchronized state from adminService
  const [stores, setStores] = useState<Store[]>(() => adminService.getStores());
  const [couriers, setCouriers] = useState<LocalCourierTelemetryPing[]>(() => getLocalTelemetrySnapshot());
  const [users, setUsers] = useState(() => adminService.getUsers());
  const [promos, setPromos] = useState(() => adminService.getPromoCodes());
  const [settings, setSettings] = useState(() => adminService.getSettings());

  const refreshStores = () => setStores([...adminService.getStores()]);
  const refreshFleet = () => setCouriers([...getLocalTelemetrySnapshot()]);
  const refreshUsers = () => setUsers([...adminService.getUsers()]);
  const refreshPromos = () => setPromos([...adminService.getPromoCodes()]);
  const refreshSettings = () => setSettings({ ...adminService.getSettings() });
  const refreshOrders = () => {
    refreshStores();
    refreshFleet();
  };

  // Update couriers periodically or on mount
  useEffect(() => {
    const timer = setInterval(() => {
      setCouriers(getLocalTelemetrySnapshot());
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Metrics computation
  const totalCodCollected = orders
    .filter((o) => o.paymentStatus === 'COLLECTED')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCodToCollect = orders
    .filter((o) => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const activeDeliveriesCount = orders.filter(
    (o) => o.status === 'ASSIGNED' || o.status === 'PICKED_UP' || o.status === 'DELIVERING'
  ).length;

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryAddress.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOrderCreated = (newOrder: Order) => {
    if (onAddNewOrder) {
      onAddNewOrder(newOrder);
    }
    setSelectedOrderId(newOrder.id);
    setActiveTab('orders');
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#0F1113] text-zinc-100 antialiased">
      {/* Top Operations Header */}
      <header className="border-b border-zinc-800 bg-[#16181B] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-black shadow-xs">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                Console d'Administration & Gestion Complète
              </h1>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                Ahmed Rachedi
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Contrôle total • Rayon {settings.maxDeliveryRadiusKm} km • Commandes, Commerces, Flotte, Utilisateurs & Finances
            </p>
          </div>
        </div>

        {/* Action Buttons & Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowManualOrderModal(true)}
            className="flex items-center gap-1.5 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all"
          >
            <PhoneCall size={14} />
            <span>Commande Téléphonique</span>
          </button>

          {/* Network Quality Simulator */}
          <div className="flex items-center bg-zinc-900 border border-zinc-700/60 rounded-lg p-1 text-xs">
            <span className="text-[11px] text-zinc-400 px-1.5 font-medium hidden sm:inline">Réseau :</span>
            {(['ONLINE', 'DEGRADED', 'OFFLINE'] as NetworkQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => onSetNetworkQuality(q)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  networkQuality === q
                    ? q === 'ONLINE'
                      ? 'bg-emerald-600 text-white'
                      : q === 'DEGRADED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {q === 'ONLINE' ? '4G' : q === 'DEGRADED' ? 'Edge' : 'Off'}
              </button>
            ))}
          </div>

          {onOpenFirebase && (
            <button
              onClick={onOpenFirebase}
              title="Console Firebase Cloud Suite"
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/30 transition-colors"
            >
              <Flame size={14} className="text-amber-500 fill-amber-500/30" />
              <span className="hidden sm:inline">Firebase</span>
            </button>
          )}

          {onOpenHttpSms && (
            <button
              onClick={onOpenHttpSms}
              title="Passerelle Open-Source HTTP-SMS"
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              <MessageSquare size={14} className="text-[#00B578]" />
              <span className="hidden sm:inline">SMS</span>
            </button>
          )}

          <button
            onClick={() => setShowDbInspector(true)}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Database size={14} className="text-[#D9943B]" />
            <span className="hidden sm:inline">Base Locale</span>
          </button>
        </div>
      </header>

      {/* KPI Operations Bar */}
      <section className="bg-[#121417] border-b border-zinc-800 px-4 sm:px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Missions en transit</span>
            <Bike size={15} className="text-[#D9943B]" />
          </div>
          <div className="text-lg font-extrabold text-white mt-1">{activeDeliveriesCount} en cours</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Sur {couriers.length} livreurs enrôlés</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Encaissements COD (Espèces)</span>
            <DollarSign size={15} className="text-emerald-400" />
          </div>
          <div className="text-lg font-extrabold text-white mt-1">{totalCodCollected.toLocaleString()} DZD</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">À percevoir : {pendingCodToCollect.toLocaleString()} DZD</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Commerces Actifs</span>
            <StoreIcon size={15} className="text-blue-400" />
          </div>
          <div className="text-lg font-extrabold text-white mt-1">
            {stores.filter((s) => s.isOpen).length} / {stores.length} ouverts
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Ahmed Rachedi & Alentours</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Commission Partenaires</span>
            <TrendingUp size={15} className="text-amber-400" />
          </div>
          <div className="text-lg font-extrabold text-white mt-1">0% (Lancement)</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">100% reversé aux commerçants</div>
        </div>
      </section>

      {/* Primary Navigation Tabs */}
      <nav className="px-4 sm:px-6 border-b border-zinc-800 bg-[#141619] flex gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'overview' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard size={14} className="text-[#D9943B]" />
          <span>Hub de Gestion (Général)</span>
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'stores' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <StoreIcon size={14} />
          <span>Commerces & Menus ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'fleet' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Bike size={14} />
          <span>Flotte & Livreurs ({couriers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'orders' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ClipboardList size={14} />
          <span>Commandes ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'dispatch' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Radio size={14} />
          <span>Dispatch Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'users' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users size={14} />
          <span>Utilisateurs & Rôles ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('promos')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'promos' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Ticket size={14} />
          <span>Promotions ({promos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settlement')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'settlement' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <DollarSign size={14} />
          <span>Audit COD</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'border-[#D9943B] text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders size={14} />
          <span>Paramètres Système</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`py-3 px-2 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'architecture' ? 'border-[#00B578] text-white' : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
          }`}
        >
          <Layers size={14} className="text-emerald-400" />
          <span>Architecture & Outbox (9 Couches)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
            DDD
          </span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6">
        {/* 0. EXECUTIVE OVERVIEW & APP-WIDE MANAGEMENT HUB */}
        {activeTab === 'overview' && (
          <AdminOverviewTab
            orders={orders}
            stores={stores}
            couriers={couriers}
            users={users}
            promos={promos}
            settings={settings}
            onNavigateTab={setActiveTab}
            onRefreshStores={refreshStores}
            onRefreshSettings={refreshSettings}
            onOpenManualOrderModal={() => setShowManualOrderModal(true)}
            onOpenTechStack={onOpenTechStack}
            onOpenFirebase={onOpenFirebase}
            onOpenHttpSms={onOpenHttpSms}
            onOpenDbInspector={() => setShowDbInspector(true)}
          />
        )}
        {/* 1. DISPATCH TAB */}
        {activeTab === 'dispatch' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Orders Column */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Recherche commande, restaurant, client..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D9943B]"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="ALL">Tous statuts</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY">READY</option>
                  <option value="DELIVERING">DELIVERING</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-zinc-800/90 border-[#D9943B] ring-1 ring-[#D9943B]'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#D9943B]">{order.orderNumber}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              order.status === 'DELIVERED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : order.status === 'DELIVERING'
                                ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white">{order.total.toLocaleString()} DZD</span>
                      </div>

                      <div className="text-xs text-zinc-300 font-semibold mt-1.5">{order.storeName}</div>
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between mt-1">
                        <span>Client : {order.deliveryAddress.recipientName}</span>
                        <span className="text-zinc-500">COD: {order.paymentStatus}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Order Details & Transition Controller */}
            {selectedOrder ? (
              <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-white">{selectedOrder.orderNumber}</h2>
                      <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                        {selectedOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Enregistré à {selectedOrder.createdAt} • Idempotency Key :{' '}
                      <span className="font-mono text-[10px] text-zinc-500">{selectedOrder.idempotencyKey || 'idemp_auto'}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-zinc-400">Total Commande (COD)</span>
                    <div className="text-2xl font-black text-white">{selectedOrder.total.toLocaleString()} DZD</div>
                  </div>
                </div>

                {/* State Machine Transition Actions */}
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-zinc-300 mb-2 flex items-center justify-between">
                    <span>Transitions Machine à États Autorisées (Audit Trail) :</span>
                    <span className="text-[10px] font-mono text-zinc-500">Validation stricte serveur</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(['CONFIRMED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(
                      (targetStatus) => {
                        const isAllowed = canTransitionOrder(selectedOrder.status, targetStatus);
                        return (
                          <button
                            key={targetStatus}
                            disabled={!isAllowed}
                            onClick={() => onUpdateOrderStatus(selectedOrder.id, targetStatus)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isAllowed
                                ? targetStatus === 'CANCELLED'
                                   ? 'bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-700/60'
                                  : 'bg-[#D9943B] hover:brightness-105 text-[#071E26] shadow-xs'
                                : 'bg-zinc-800/40 text-zinc-600 cursor-not-allowed border border-zinc-800/60'
                            }`}
                          >
                            Passer à {targetStatus}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Address & Local Landmark */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3.5">
                    <div className="text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                      <StoreIcon size={14} className="text-[#D9943B]" />
                      <span>Point d'Enlèvement (Restaurant)</span>
                    </div>
                    <div className="text-sm font-semibold text-white">{selectedOrder.storeName}</div>
                    <div className="text-xs text-zinc-400 mt-1">{selectedOrder.storeCategory} • Ahmed Rachedi</div>
                  </div>

                  <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3.5">
                    <div className="text-xs font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
                      <MapPin size={14} className="text-emerald-400" />
                      <span>Destination Client & Repère</span>
                    </div>
                    <div className="text-sm font-semibold text-white">{selectedOrder.deliveryAddress.commune}</div>
                    <div className="text-xs text-amber-400 font-medium mt-1">
                      Repère : {selectedOrder.deliveryAddress.landmark}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {selectedOrder.deliveryAddress.street} • Tél : {selectedOrder.deliveryAddress.phone}
                    </div>
                  </div>
                </div>

                {/* Immutable Purchase Snapshots */}
                <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4">
                  <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center justify-between">
                    <span>Audit des Articles (Snapshots Immutables)</span>
                    <span className="text-[10px] text-zinc-500">Indépendant des modifications catalogue</span>
                  </div>

                  <div className="divide-y divide-zinc-800/60">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-white">{item.productNameSnapshot || item.name}</span>
                          <span className="text-zinc-500 ml-2">×{item.quantity}</span>
                          {item.options && item.options.length > 0 && (
                            <div className="text-[10px] text-zinc-400">
                              {item.options.map((o) => o.optionName).join(' · ')}
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-zinc-200">
                          {(item.subtotalSnapshot || item.price * item.quantity).toLocaleString()} DZD
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit History Timeline */}
                <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4">
                  <div className="text-xs font-bold text-zinc-400 mb-2.5 flex items-center gap-1.5">
                    <FileText size={14} />
                    <span>Journal d'Audit des Statuts (OrderStatusHistory) :</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                      selectedOrder.statusHistory.map((hist) => (
                        <div key={hist.id} className="text-xs flex items-center justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500">{hist.timestamp}</span>
                            <span className="font-bold text-amber-400">{hist.toStatus}</span>
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded">
                              {hist.actorRole}: {hist.actorName}
                            </span>
                          </div>
                          <span className="text-zinc-400 text-[11px]">{hist.note}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-500 italic">Historique initialisé avec la commande.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-7 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                  <ClipboardList size={22} />
                </div>
                <h3 className="text-sm font-bold text-white">Sélectionnez une commande</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Choisissez une commande dans la liste de gauche pour visualiser ses détails, adresses et piloter ses transitions d'état.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <AdminOrdersTab
            orders={orders}
            stores={stores}
            couriers={couriers}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onRefreshOrders={refreshOrders}
            onOpenManualOrderModal={() => setShowManualOrderModal(true)}
          />
        )}

        {/* 3. STORES & MENUS MANAGEMENT TAB */}
        {activeTab === 'stores' && (
          <AdminStoresTab
            stores={stores}
            onStoresUpdated={refreshStores}
          />
        )}

        {/* 4. FLEET & TELEMETRY TAB */}
        {activeTab === 'fleet' && (
          <AdminFleetTab
            couriers={couriers}
            onFleetUpdated={refreshFleet}
          />
        )}

        {/* 5. USERS & ROLES TAB */}
        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            onUsersUpdated={refreshUsers}
          />
        )}

        {/* 6. PROMO CODES TAB */}
        {activeTab === 'promos' && (
          <AdminPromosTab
            promos={promos}
            onPromosUpdated={refreshPromos}
          />
        )}

        {/* 7. FINANCIAL SETTLEMENT & COD AUDIT TAB */}
        {activeTab === 'settlement' && (
          <AdminSettlementTab orders={orders} />
        )}

        {/* 8. SYSTEM & OPERATIONAL SETTINGS TAB */}
        {activeTab === 'settings' && (
          <AdminSettingsTab
            settings={settings}
            onSettingsUpdated={refreshSettings}
          />
        )}

        {/* 9. ARCHITECTURE & OUTBOX 9-LAYER BOUNDARIES TAB (Recommendation #20) */}
        {activeTab === 'architecture' && (
          <AdminArchitectureTab />
        )}
      </main>

      {/* Database Inspector Modal for Admin Operations */}
      {showDbInspector && (
        <DatabaseInspectorModal onClose={() => setShowDbInspector(false)} />
      )}

      {/* Manual Direct Phone Order Modal */}
      <AdminManualOrderModal
        isOpen={showManualOrderModal}
        stores={stores}
        onClose={() => setShowManualOrderModal(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};
