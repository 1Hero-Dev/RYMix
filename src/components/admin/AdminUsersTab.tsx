import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import { UserRole } from '../../types';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Star,
  Award,
  Phone,
  Mail,
  MapPin,
  X,
  Check,
  Edit2,
  Gift,
} from 'lucide-react';

interface Props {
  users: Array<any>;
  onUsersUpdated: () => void;
}

export const AdminUsersTab: React.FC<Props> = ({ users, onUsersUpdated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [managingPointsUser, setManagingPointsUser] = useState<any | null>(null);

  // Points update state
  const [pointsDelta, setPointsDelta] = useState<number>(100);
  const [pointsReason, setPointsReason] = useState('Geste commercial Ahmed Rachedi');

  // New User state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+213 ');
  const [newRole, setNewRole] = useState<UserRole>('customer');
  const [newCommune, setNewCommune] = useState('Ahmed Rachedi');

  const normalizedUsers = users.map((u) => ({
    id: u.uid || u.id,
    name: u.displayName || u.name || 'Utilisateur',
    email: u.email || '',
    phone: u.phone || '',
    role: (u.role || 'customer') as UserRole,
    commune: u.commune || 'Ahmed Rachedi',
    points: u.points || 150,
    tier: u.tier || 'BRONZE',
  }));

  const filteredUsers = normalizedUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, targetRole: UserRole) => {
    adminService.updateUserRole(userId, targetRole);
    onUsersUpdated();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    adminService.addUser({
      displayName: newName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      commune: newCommune,
    });

    setNewName('');
    setNewEmail('');
    setShowAddUserModal(false);
    onUsersUpdated();
  };

  const handleAdjustPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingPointsUser) return;

    adminService.adjustUserPoints(Number(pointsDelta) || 0, pointsReason);
    setManagingPointsUser(null);
    onUsersUpdated();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">ADMINISTRATEUR</span>;
      case 'driver':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">LIVREUR</span>;
      case 'shop':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200">COMMERÇANT</span>;
      case 'customer':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800">CLIENT</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur par nom, email, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-[#D9943B]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 font-medium text-zinc-700 focus:outline-none"
          >
            <option value="ALL">Tous les rôles ({users.length})</option>
            <option value="admin">Administrateurs</option>
            <option value="customer">Clients</option>
            <option value="driver">Livreurs</option>
            <option value="shop">Commerçants</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
        >
          <Plus size={15} />
          <span>Créer un Compte Utilisateur</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-zinc-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Coordonnées</th>
                <th className="p-3">Commune</th>
                <th className="p-3">Rôle Système</th>
                <th className="p-3">Fidélité & Points</th>
                <th className="p-3 text-right">Modifier Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 text-zinc-700 font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{u.name}</div>
                        <span className="text-[10px] text-zinc-400">ID: {u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-zinc-800">{u.email}</div>
                    <div className="text-[10px] font-mono text-zinc-400">{u.phone}</div>
                  </td>
                  <td className="p-3 text-zinc-600 font-medium">
                    {u.commune || 'Ahmed Rachedi'}
                  </td>
                  <td className="p-3">{getRoleBadge(u.role)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="font-bold text-zinc-900">{u.points || 0} pts</span>
                        <span className="text-[10px] text-amber-700 block">Club {u.tier || 'BRONZE'}</span>
                      </div>
                      <button
                        onClick={() => setManagingPointsUser(u)}
                        className="p-1 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                        title="Ajuster points de fidélité"
                      >
                        <Gift size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 font-semibold text-zinc-700"
                    >
                      <option value="admin">Administrateur</option>
                      <option value="customer">Client</option>
                      <option value="driver">Livreur</option>
                      <option value="shop">Commerçant</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#D9943B]" />
                <h3 className="font-bold text-sm">Ajouter un Utilisateur</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Karim Bensalem"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Adresse Email *</label>
                <input
                  type="email"
                  required
                  placeholder="karim@exemple.dz"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Téléphone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+213 55..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">Rôle Initial</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  >
                    <option value="customer">Client</option>
                    <option value="driver">Livreur</option>
                    <option value="shop">Commerçant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Commune de Résidence</label>
                <input
                  type="text"
                  value={newCommune}
                  onChange={(e) => setNewCommune(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D9943B] font-bold text-xs rounded-xl text-[#071E26] hover:brightness-105"
                >
                  Créer l'Utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST USER POINTS */}
      {managingPointsUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={18} className="text-[#D9943B]" />
                <h3 className="font-bold text-sm">Gérer Points de Fidélité</h3>
              </div>
              <button
                onClick={() => setManagingPointsUser(null)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white/70"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="p-4 space-y-3">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>{managingPointsUser.name}</strong> • Solde actuel: <strong>{managingPointsUser.points || 0} pts</strong>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Ajustement (+ pour créditer, - pour déduire)
                </label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Motif / Justification</label>
                <input
                  type="text"
                  required
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManagingPointsUser(null)}
                  className="px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-neutral-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D9943B] font-bold text-xs rounded-xl text-[#071E26]"
                >
                  Appliquer la Modification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
