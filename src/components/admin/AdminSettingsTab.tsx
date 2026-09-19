import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import { PlatformOperationalSettings } from '../../types';
import {
  Sliders,
  Bell,
  AlertTriangle,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Save,
  Send,
  Database,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface Props {
  settings: PlatformOperationalSettings;
  onSettingsUpdated: () => void;
}

export const AdminSettingsTab: React.FC<Props> = ({ settings, onSettingsUpdated }) => {
  const [formState, setFormState] = useState<PlatformOperationalSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Broadcast modal state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'ALL' | 'DRIVERS' | 'MERCHANTS'>('ALL');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Cloud sync state
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [firestoreSyncMessage, setFirestoreSyncMessage] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    adminService.updateSettings(formState);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onSettingsUpdated();
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    adminService.broadcastAnnouncement(broadcastTitle, broadcastMessage, broadcastAudience);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  const handleSyncFirestore = async () => {
    setIsSyncingFirestore(true);
    setFirestoreSyncMessage(null);
    try {
      const res = await adminService.syncAllToFirestore();
      if (res.success) {
        setFirestoreSyncMessage(`✓ Synchronisation réussie vers Cloud Firestore (${res.syncedAt})`);
      } else {
        setFirestoreSyncMessage(`Échec: ${res.error}`);
      }
    } catch (err: any) {
      setFirestoreSyncMessage(`Erreur: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Save banner alert */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Paramètres opérationnels mis à jour et immédiatement appliqués aux commandes !</span>
        </div>
      )}

      {/* Emergency Kill Switch (Maintenance Mode) */}
      <div className={`p-4 rounded-2xl border transition-all ${
        formState.maintenanceMode
          ? 'bg-rose-50 border-rose-300'
          : 'bg-white border-black/[0.06] shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${
              formState.maintenanceMode ? 'bg-rose-100 text-rose-700' : 'bg-neutral-100 text-zinc-700'
            }`}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-zinc-900">
                Interrupteur d'Urgence / Mode Maintenance (Kill Switch)
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Suspend temporairement toute passation de commande sur le périmètre d'Ahmed Rachedi (ex: intempéries, coupure réseau).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const updated = !formState.maintenanceMode;
              setFormState({ ...formState, maintenanceMode: updated });
              adminService.updateSettings({ maintenanceMode: updated });
              onSettingsUpdated();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs ${
              formState.maintenanceMode
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-neutral-100 hover:bg-rose-100 hover:text-rose-800 text-zinc-700'
            }`}
          >
            {formState.maintenanceMode ? 'SERVICE SUSPENDU (Cliquer pour Réactiver)' : 'Activer le Mode Maintenance'}
          </button>
        </div>

        {formState.maintenanceMode && (
          <div className="mt-3 pt-3 border-t border-rose-200 text-xs text-rose-800 font-semibold">
            ⚠️ Le service est actuellement suspendu. Les clients ne peuvent pas valider de panier.
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Sliders size={18} className="text-[#D9943B]" />
          <h3 className="font-bold text-xs text-zinc-900">
            Périmètre d'Activité & Paramètres Tarifaires
          </h3>
        </div>

        {/* Launch Radius Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-zinc-800">
              Rayon de Lancement Opérationnel : <strong>{formState.maxDeliveryRadiusKm} km</strong> ({formState.maxDeliveryRadiusKm * 1000} mètres)
            </label>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              Périmètre Strict Ahmed Rachedi
            </span>
          </div>

          <input
            type="range"
            min="1.0"
            max="8.0"
            step="0.5"
            value={formState.maxDeliveryRadiusKm}
            onChange={(e) => setFormState({ ...formState, maxDeliveryRadiusKm: parseFloat(e.target.value) })}
            className="w-full accent-[#D9943B] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>1,0 km (Hyper-Centre)</span>
            <span className="font-bold text-zinc-700">2,0 km (Standard Lancement)</span>
            <span>8,0 km (Grand Ahmed Rachedi)</span>
          </div>
        </div>

        {/* Pricing Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Frais de Livraison de Base
            </label>
            <div className="relative">
              <input
                type="number"
                value={formState.baseDeliveryFeeDZD}
                onChange={(e) => setFormState({ ...formState, baseDeliveryFeeDZD: Number(e.target.value) })}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
              />
              <span className="absolute right-3 top-2.5 text-xs text-zinc-400">DZD</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Seuil Livraison Offerte
            </label>
            <div className="relative">
              <input
                type="number"
                value={formState.freeDeliveryThresholdDZD}
                onChange={(e) => setFormState({ ...formState, freeDeliveryThresholdDZD: Number(e.target.value) })}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
              />
              <span className="absolute right-3 top-2.5 text-xs text-zinc-400">DZD</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Frais d'Emballage Standard
            </label>
            <div className="relative">
              <input
                type="number"
                value={formState.packagingFeeDZD}
                onChange={(e) => setFormState({ ...formState, packagingFeeDZD: Number(e.target.value) })}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
              />
              <span className="absolute right-3 top-2.5 text-xs text-zinc-400">DZD</span>
            </div>
          </div>
        </div>

        {/* Surge & Announcement Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Multiplicateur Forte Demande (Surge)
            </label>
            <select
              value={formState.surgeMultiplier}
              onChange={(e) => setFormState({ ...formState, surgeMultiplier: parseFloat(e.target.value) })}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium"
            >
              <option value="1.0">1.0x — Tarif Normal</option>
              <option value="1.2">1.2x — Affluence Modérée (+20%)</option>
              <option value="1.5">1.5x — Pic de Soirée (+50%)</option>
              <option value="2.0">2.0x — Conditions Météo Difficiles (2x)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Bannière d'Annonce Client
            </label>
            <input
              type="text"
              placeholder="Ex: Lancement officiel à Ahmed Rachedi ! -150 DZD avec le code RACHEDI"
              value={formState.announcementBannerText}
              onChange={(e) => setFormState({ ...formState, announcementBannerText: e.target.value })}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D9943B] hover:brightness-105 active:scale-95 text-[#071E26] font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Save size={15} />
            <span>{isSaving ? 'Enregistrement...' : 'Sauvegarder les Paramètres'}</span>
          </button>
        </div>
      </form>

      {/* Broadcast Announcement Tool */}
      <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <Bell size={18} className="text-[#D91A67]" />
          <div>
            <h3 className="font-bold text-xs text-zinc-900">
              Diffusion de Notification Push & Alerte Directe
            </h3>
            <p className="text-[10px] text-zinc-400">
              Diffusez instantanément un message opérationnel à tous les acteurs
            </p>
          </div>
        </div>

        {broadcastSuccess && (
          <div className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Notification diffusée avec succès aux destinataires sélectionnés !</span>
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Titre de l'Alerte *</label>
              <input
                type="text"
                required
                placeholder="Ex: Flash Info Ahmed Rachedi"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Audience Cible</label>
              <select
                value={broadcastAudience}
                onChange={(e) => setBroadcastAudience(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium"
              >
                <option value="ALL">Tous les Utilisateurs</option>
                <option value="DRIVERS">Livreurs Uniquement</option>
                <option value="MERCHANTS">Commerçants Uniquement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Corps du Message *</label>
            <textarea
              rows={2}
              required
              placeholder="Ex: Chers utilisateurs, nouvelle pizzeria partenaire disponible dès aujourd'hui sur l'avenue principale !"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              <Send size={13} />
              <span>Diffuser l'Alerte Immédiatement</span>
            </button>
          </div>
        </form>
      </div>

      {/* Cloud Firestore Persistence Status */}
      <div className="bg-white p-4 rounded-2xl border border-black/[0.06] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Cloud size={20} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-zinc-900">
              Synchronisation Base Cloud Firestore
            </h4>
            <p className="text-[10px] text-zinc-400 font-mono">
              DB: ai-studio-rymahmedrachedi-3c9ca2d6-69e7-45e5-a80b-86814f37a184
            </p>
            {firestoreSyncMessage && (
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                {firestoreSyncMessage}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSyncFirestore}
          disabled={isSyncingFirestore}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
        >
          <RefreshCw size={13} className={isSyncingFirestore ? 'animate-spin' : ''} />
          <span>{isSyncingFirestore ? 'Synchronisation...' : 'Synchroniser vers le Cloud'}</span>
        </button>
      </div>
    </div>
  );
};
