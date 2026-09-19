import React, { useState } from 'react';
import { Order, OrderStatus, Store } from '../../types';
import { adminService } from '../../services/adminService';
import {
  Search,
  Filter,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  User,
  Store as StoreIcon,
  Banknote,
  ShieldAlert,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { LocalCourierTelemetryPing } from '../../utils/localRealtimeSimulator';

interface Props {
  orders: Order[];
  stores: Store[];
  couriers: LocalCourierTelemetryPing[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onRefreshOrders: () => void;
  onOpenManualOrderModal: () => void;
}

export const AdminOrdersTab: React.FC<Props> = ({
  orders,
  stores,
  couriers,
  onUpdateOrderStatus,
  onRefreshOrders,
  onOpenManualOrderModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<OrderStatus>('CONFIRMED');
  const [adminNote, setAdminNote] = useState('');
  const [reassignCourierId, setReassignCourierId] = useState('');

  // Filtering
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryAddress.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryAddress.phone.includes(searchQuery) ||
      o.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const uncollectedCashTotal = orders
    .filter((o) => o.paymentStatus === 'UNPAID' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const handleApplyOverride = (orderId: string) => {
    onUpdateOrderStatus(orderId, overrideStatus);
    setSelectedOrder((prev) => (prev && prev.id === orderId ? { ...prev, status: overrideStatus } : prev));
    setAdminNote('');
  };

  const handleTogglePaymentStatus = (order: Order) => {
    const newStatus = order.paymentStatus === 'COLLECTED' ? 'UNPAID' : 'COLLECTED';
    order.paymentStatus = newStatus;
    setSelectedOrder({ ...order, paymentStatus: newStatus });
    onRefreshOrders();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">EN ATTENTE</span>;
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900">CONFIRMÉE</span>;
      case 'PREPARING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900">EN CUISINE</span>;
      case 'READY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-900">PRÊTE</span>;
      case 'ASSIGNED':
      case 'DELIVERING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-zinc-950">EN LIVRAISON</span>;
      case 'DELIVERED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900">LIVRÉE</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900">ANNULÉE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-neutral-100 text-neutral-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-500 block">Total Commandes</span>
          <span className="text-xl font-black text-zinc-900">{orders.length}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 block">En Cours (Live)</span>
          <span className="text-xl font-black text-amber-600">{activeOrdersCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">Livrées</span>
          <span className="text-xl font-black text-emerald-600">{deliveredCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-500 block">Espèces à Encaisser</span>
          <span className="text-xl font-black text-zinc-900">{uncollectedCashTotal.toLocaleString()} DZD</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Recherche par n° commande, client, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#D9943B]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 font-medium text-zinc-700"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="PREPARING">En préparation</option>
            <option value="DELIVERING">En livraison</option>
            <option value="DELIVERED">Livrées</option>
            <option value="CANCELLED">Annulées</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 font-medium text-zinc-700"
          >
            <option value="ALL">Tous paiements</option>
            <option value="UNPAID">Non encaissé (En attente)</option>
            <option value="COLLECTED">Encaissé (COD OK)</option>
          </select>
        </div>

        <button
          onClick={onOpenManualOrderModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
        >
          <PhoneCall size={15} />
          <span>Nouvelle Commande Téléphonique</span>
        </button>
      </div>

      {/* Orders View: Responsive Cards for Mobile, Full Table for Desktop */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-neutral-100">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-zinc-400 text-xs">
              Aucune commande trouvée selon vos filtres de recherche.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-3.5 space-y-2 hover:bg-neutral-50/60 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-zinc-900">
                    <span>{order.orderNumber}</span>
                    <span className="text-[10px] text-zinc-400 font-normal font-sans">({order.createdAt})</span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex items-start justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900 truncate">{order.deliveryAddress.recipientName}</div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {order.deliveryAddress.commune} • {order.deliveryAddress.street}
                    </div>
                    <a
                      href={`tel:${order.deliveryAddress.phone}`}
                      className="text-[10px] font-mono text-amber-800 font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <PhoneCall size={10} />
                      {order.deliveryAddress.phone}
                    </a>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-zinc-900 text-sm">{order.total.toLocaleString()} DZD</div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                        order.paymentStatus === 'COLLECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {order.paymentStatus === 'COLLECTED' ? 'ENCAISSÉ' : 'À PERCEVOIR'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px] text-zinc-600">
                  <div className="flex items-center gap-1 truncate max-w-[170px]">
                    <StoreIcon size={12} className="text-zinc-400 shrink-0" />
                    <span className="font-medium truncate">{order.storeName}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setOverrideStatus(order.status);
                    }}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-[#D9943B] hover:text-[#071E26] font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Eye size={12} />
                    <span>Gérer</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-zinc-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-3">Commande</th>
                <th className="p-3">Client & Adresse</th>
                <th className="p-3">Commerce</th>
                <th className="p-3">Livreur Assigné</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Total (COD)</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-zinc-400">
                    Aucune commande trouvée selon vos filtres de recherche.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-zinc-900">
                      <div>{order.orderNumber}</div>
                      <span className="text-[10px] text-zinc-400 font-normal">{order.createdAt}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-zinc-900">{order.deliveryAddress.recipientName}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                        {order.deliveryAddress.commune} • {order.deliveryAddress.street}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">{order.deliveryAddress.phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-zinc-800">{order.storeName}</div>
                      <div className="text-[11px] text-zinc-400">{order.items.length} articles</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                        <Truck size={13} className="text-zinc-400" />
                        <span>{order.courierName || 'Non assigné'}</span>
                      </div>
                    </td>
                    <td className="p-3">{getStatusBadge(order.status)}</td>
                    <td className="p-3">
                      <div className="font-extrabold text-zinc-900">{order.total.toLocaleString()} DZD</div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          order.paymentStatus === 'COLLECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {order.paymentStatus === 'COLLECTED' ? 'ENCAISSÉ' : 'À PERCEVOIR'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setOverrideStatus(order.status);
                        }}
                        className="px-2.5 py-1.5 bg-neutral-100 hover:bg-[#D9943B] hover:text-[#071E26] font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>Gérer</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS & OVERRIDE DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#D9943B]" />
                <div>
                  <h3 className="font-bold text-sm">Contrôle Commande {selectedOrder.orderNumber}</h3>
                  <p className="text-[10px] text-zinc-300">Supervision Administrateur Ahmed Rachedi</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Order Status Override Panel */}
              <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <ShieldAlert size={15} />
                  <span>Passer outre le cycle d'état (Override Admin)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  En tant qu'administrateur, vous pouvez forcer la transition vers n'importe quel état en cas d'imprévu terrain ou d'appel client.
                </p>

                <div className="flex items-center gap-2">
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value as OrderStatus)}
                    className="flex-1 text-xs bg-white border border-amber-300 rounded-xl px-2.5 py-2 font-bold text-zinc-900"
                  >
                    <option value="CONFIRMED">CONFIRMED (Confirmée)</option>
                    <option value="PREPARING">PREPARING (En cuisine)</option>
                    <option value="READY">READY (Prête pour enlèvement)</option>
                    <option value="DELIVERING">DELIVERING (En cours de route)</option>
                    <option value="DELIVERED">DELIVERED (Livrée au client)</option>
                    <option value="CANCELLED">CANCELLED (Annulée par Admin)</option>
                  </select>

                  <button
                    onClick={() => handleApplyOverride(selectedOrder.id)}
                    className="px-3.5 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    Appliquer Statut
                  </button>
                </div>
              </div>

              {/* Payment Status Toggle */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">Règlement Espèces (COD)</span>
                  <span className="text-[11px] text-zinc-500">
                    Montant total: <strong>{selectedOrder.total.toLocaleString()} DZD</strong> • Statut:{' '}
                    <span className="font-bold">{selectedOrder.paymentStatus}</span>
                  </span>
                </div>

                <button
                  onClick={() => handleTogglePaymentStatus(selectedOrder)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedOrder.paymentStatus === 'COLLECTED'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-amber-400 text-zinc-950 hover:bg-amber-500'
                  }`}
                >
                  {selectedOrder.paymentStatus === 'COLLECTED'
                    ? '✓ Encaissé (Basculer vers Non Encaissé)'
                    : 'Marquer comme Encaissé'}
                </button>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-800 block">Contenu du Panier</span>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1.5">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-0.5 border-b border-neutral-200/60 last:border-0">
                      <span className="text-zinc-700">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-mono font-bold text-zinc-900">
                        {(item.price * item.quantity).toLocaleString()} DZD
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between text-xs font-bold text-zinc-900">
                    <span>Sous-total:</span>
                    <span>{selectedOrder.subtotal.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Frais de livraison:</span>
                    <span>{selectedOrder.deliveryFee} DZD</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Remise Promo:</span>
                      <span>-{selectedOrder.discount} DZD</span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-neutral-300 flex justify-between text-sm font-extrabold text-[#1C1B1B]">
                    <span>Total Général:</span>
                    <span>{selectedOrder.total.toLocaleString()} DZD</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Contact */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-800 block">Coordonnées de Livraison</span>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1 text-zinc-700">
                  <p><strong>Destinataire:</strong> {selectedOrder.deliveryAddress.recipientName}</p>
                  <p><strong>Téléphone:</strong> {selectedOrder.deliveryAddress.phone}</p>
                  <p><strong>Commune / Ville:</strong> {selectedOrder.deliveryAddress.commune}</p>
                  <p><strong>Rue & Bâtiment:</strong> {selectedOrder.deliveryAddress.street}</p>
                  <p><strong>Repère Local:</strong> {selectedOrder.deliveryAddress.landmark}</p>
                  {selectedOrder.deliveryAddress.deliveryNotes && (
                    <p className="text-amber-800 font-medium"><strong>Instructions:</strong> {selectedOrder.deliveryAddress.deliveryNotes}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-neutral-100 border-t border-neutral-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
