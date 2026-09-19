import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import {
  LocalCourierTelemetryPing,
  MILA_CENTER_GPS,
  localDispatchEngine,
} from '../../utils/localRealtimeSimulator';
import {
  Bike,
  Plus,
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Banknote,
  Send,
  RefreshCw,
  Sliders,
  X,
  FileText,
} from 'lucide-react';

interface Props {
  couriers: LocalCourierTelemetryPing[];
  onFleetUpdated: () => void;
}

export const AdminFleetTab: React.FC<Props> = ({ couriers, onFleetUpdated }) => {
  const [showAddCourierModal, setShowAddCourierModal] = useState(false);
  const [settlingCourier, setSettlingCourier] = useState<LocalCourierTelemetryPing | null>(null);
  const [settledSlip, setSettledSlip] = useState<{
    receiptNumber: string;
    courierName: string;
    amountDZD: number;
    timestamp: string;
  } | null>(null);

  // New Courier Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+213 55');
  const [newVehicle, setNewVehicle] = useState('Scooter SYM 125cc');
  const [newRating, setNewRating] = useState(4.9);

  // Quick Teleport simulator modal state
  const [teleportCourier, setTeleportCourier] = useState<LocalCourierTelemetryPing | null>(null);

  const totalCouriers = couriers.length;
  const onlineCouriers = couriers.filter((c) => c.freshness !== 'OFFLINE').length;
  const inRadiusCouriers = couriers.filter((c) => c.eligible2KmRadius).length;

  const handleToggleStatus = (courierId: string, currentStatus: string) => {
    const isOnline = currentStatus !== 'OFFLINE';
    adminService.toggleCourierOnline(courierId, !isOnline);
    onFleetUpdated();
  };

  const handleCreateCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    adminService.addCourier({
      name: newName,
      phone: newPhone,
      vehicle: newVehicle,
      rating: Number(newRating) || 4.9,
    });

    setNewName('');
    setShowAddCourierModal(false);
    onFleetUpdated();
  };

  const handleConfirmSettlement = (courier: LocalCourierTelemetryPing) => {
    // Generate settlement receipt slip
    const receiptNumber = `ST-AR-${Date.now().toString().slice(-6)}`;
    const amount = 3500; // Simulated COD total for demo shift
    setSettledSlip({
      receiptNumber,
      courierName: courier.name,
      amountDZD: amount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setSettlingCourier(null);
  };

  return (
    <div className="space-y-4">
      {/* Fleet KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-500 block">Flotte Enregistrée</span>
          <span className="text-xl font-black text-zinc-900">{totalCouriers} livreurs</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 block">Livreurs En Ligne</span>
          <span className="text-xl font-black text-emerald-600">{onlineCouriers} actifs</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-[#D91A67] block">Zone Active 2,0 km</span>
          <span className="text-xl font-black text-[#D91A67]">{inRadiusCouriers} dans le rayon</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-500 block">Temps Moyen ETA</span>
          <span className="text-xl font-black text-zinc-900">18 min</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-emerald-500 animate-pulse" />
          <span className="font-bold text-xs text-zinc-800">
            Télémétrie GPS Live (Centre Ahmed Rachedi • GPS: 36.4503, 6.2649)
          </span>
        </div>

        <button
          onClick={() => setShowAddCourierModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
        >
          <Plus size={15} />
          <span>Enrôler un Livreur</span>
        </button>
      </div>

      {/* Couriers Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-zinc-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-3">Livreur</th>
                <th className="p-3">Véhicule & Téléphone</th>
                <th className="p-3">Vitesse & Cap</th>
                <th className="p-3">Distance Centre</th>
                <th className="p-3">Rayon Lancement</th>
                <th className="p-3">Statut Réseau</th>
                <th className="p-3 text-right">Actions Opérations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {couriers.map((c) => {
                const isOnline = c.freshness !== 'OFFLINE';
                return (
                  <tr key={c.courierId} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900">{c.name}</div>
                          <span className="text-[10px] text-zinc-400">★ {c.rating} • {c.activeOrders} course active</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-zinc-800">{c.vehicle}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{c.phone}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <div>{c.speedKmh} km/h</div>
                      <span className="text-[10px] text-zinc-400">Cap: {c.headingDeg}°</span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-zinc-800">{c.distanceToMilaCenterMeters} m</div>
                      <span className="text-[10px] text-zinc-400">du centre-ville</span>
                    </td>
                    <td className="p-3">
                      {c.eligible2KmRadius ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Éligible (&lt; 2 km)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Hors Zone (&gt; 2 km)
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          isOnline ? 'bg-emerald-500 text-white' : 'bg-neutral-300 text-zinc-700'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(c.courierId, c.freshness)}
                          className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-zinc-800 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          {isOnline ? 'Déconnecter' : 'Connecter'}
                        </button>

                        <button
                          onClick={() => setSettlingCourier(c)}
                          className="px-2 py-1 bg-[#D9943B] hover:brightness-105 text-[#071E26] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Banknote size={12} />
                          <span>Clôturer Caisse</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD COURIER */}
      {showAddCourierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike size={18} className="text-[#D9943B]" />
                <h3 className="font-bold text-sm">Enrôler un Nouveau Livreur</h3>
              </div>
              <button
                onClick={() => setShowAddCourierModal(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCourier} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Yacine Brahimi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Numéro de Téléphone *</label>
                <input
                  type="text"
                  required
                  placeholder="+213 55..."
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Type de Véhicule</label>
                  <select
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#D9943B]"
                  >
                    <option value="Scooter SYM Jet 14 (125cc)">Scooter SYM 125cc</option>
                    <option value="Peugeot Tweet 125">Peugeot Tweet 125</option>
                    <option value="Moto Yamaha 125">Moto 125cc</option>
                    <option value="Voiture Citadine">Véhicule Citadin</option>
                    <option value="Vélo Électrique">Vélo Électrique</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Note Initiale</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourierModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs"
                >
                  Valider l'Enrôlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SETTLE COURIER COD CASH */}
      {settlingCourier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-[#D9943B]" />
                <h3 className="font-bold text-sm">Clôture Caisse & Encaissement COD</h3>
              </div>
              <button
                onClick={() => setSettlingCourier(null)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold">Livreur: {settlingCourier.name}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Vérifiez le montant physique en dinars algériens (DZD) remis par le livreur avant de confirmer la clôture de service.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Courses livrées aujourd'hui:</span>
                  <span className="font-bold text-zinc-900">4 livraisons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Total Espèces perçues:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">3 500 DZD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Pourboires livreur (100% conservés):</span>
                  <span className="font-bold text-zinc-900">300 DZD</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSettlingCourier(null)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleConfirmSettlement(settlingCourier)}
                  className="px-4 py-2 bg-[#D9943B] font-bold text-xs rounded-xl text-[#071E26] hover:brightness-105"
                >
                  Confirmer l'Encaissement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SETTLEMENT DIGITAL RECEIPT */}
      {settledSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h3 className="font-black text-base text-zinc-900">Bordereau d'Encaissement Validé</h3>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Réf: {settledSlip.receiptNumber}</p>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Livreur:</span>
                <span className="font-bold text-zinc-900">{settledSlip.courierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Montant Encaissé:</span>
                <span className="font-black text-emerald-700">{settledSlip.amountDZD.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Heure Clôture:</span>
                <span className="font-mono text-zinc-900">{settledSlip.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Zone d'opération:</span>
                <span className="font-semibold text-zinc-900">Ahmed Rachedi Centre</span>
              </div>
            </div>

            <button
              onClick={() => setSettledSlip(null)}
              className="w-full py-2.5 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-black transition-colors"
            >
              Fermer le Reçu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
