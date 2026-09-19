import React, { useState, useEffect } from 'react';
import { useAuth, NotificationPermissionStatus } from '../firebase/AuthContext';
import {
  X,
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Volume2,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Send,
  Timer,
} from 'lucide-react';
import { PushNotificationPayload } from '../firebase/firebaseServices';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recentNotifications?: PushNotificationPayload[];
  activeOrderNumber?: string;
}

export const NotificationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  recentNotifications = [],
  activeOrderNumber,
}) => {
  const {
    notificationPermission,
    isNotificationSupported,
    notificationsEnabled,
    requestNotificationPermission,
    setNotificationsEnabled,
    sendNativeNotification,
  } = useAuth();

  const [countdown, setCountdown] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      // Trigger background test notification
      const orderNum = activeOrderNumber || 'RYM-9482';
      sendNativeNotification(`🛵 RYM Ahmed Rachedi : Commande #${orderNum}`, {
        body: `Alerte d'arrière-plan réussie ! Votre coursier RYM approche de votre adresse à Ahmed Rachedi.`,
        tag: `test-${Date.now()}`,
        requireInteraction: true,
      });
      setFeedbackMessage('Alerte native envoyée ! Vérifiez le centre de notifications de votre système.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
    return () => clearTimeout(timer);
  }, [countdown, activeOrderNumber, sendNativeNotification]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const res = await requestNotificationPermission();
      if (res === 'granted') {
        setFeedbackMessage('Permissions accordées ! Vous recevrez des alertes en temps réel.');
      } else if (res === 'denied') {
        setFeedbackMessage('Notifications refusées dans le navigateur.');
      }
    } finally {
      setIsRequesting(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleStartCountdownTest = () => {
    setCountdown(4);
    setFeedbackMessage('Basculez maintenant vers un autre onglet ou réduisez la fenêtre !');
  };

  const handleQuickStatusTest = (statusName: string, desc: string) => {
    const orderNum = activeOrderNumber || 'HBA-9482';
    sendNativeNotification(`Commande #${orderNum} - ${statusName}`, {
      body: desc,
      tag: `order-demo-${orderNum}`,
      requireInteraction: true,
    });
    setFeedbackMessage(`Alerte envoyée : "${statusName}"`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-black/5">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <BellRing size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-[#1C1B1B]">
                Alertes & Notifications Natives
              </h2>
              <p className="text-[11px] text-zinc-500">
                Suivi de commande en temps réel & arrière-plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-200 flex items-center justify-center text-zinc-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Feedback banner */}
          {feedbackMessage && (
            <div className="bg-zinc-900 text-white p-3 rounded-2xl text-[11px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <Sparkles size={16} className="text-[#D9943B] shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Countdown overlay banner */}
          {countdown !== null && (
            <div className="bg-amber-500 text-zinc-950 p-3.5 rounded-2xl font-bold flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <Timer size={18} />
                <span>Déclenchement dans {countdown}s... Changez d'onglet !</span>
              </div>
              <button
                onClick={() => setCountdown(null)}
                className="text-[10px] bg-black/20 hover:bg-black/30 px-2 py-1 rounded-lg"
              >
                Annuler
              </button>
            </div>
          )}

          {/* Permission Status Hero Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              notificationPermission === 'granted'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : notificationPermission === 'denied'
                ? 'bg-red-50/70 border-red-200 text-red-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {notificationPermission === 'granted' ? (
                  <ShieldCheck size={20} className="text-emerald-600" />
                ) : notificationPermission === 'denied' ? (
                  <BellOff size={20} className="text-red-500" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600" />
                )}
                <span className="font-bold text-xs uppercase tracking-wide">
                  {notificationPermission === 'granted'
                    ? 'Autorisation Native Accordée'
                    : notificationPermission === 'denied'
                    ? 'Notifications Bloquées'
                    : !isNotificationSupported
                    ? 'Non Supporté'
                    : 'Autorisation Requise'}
                </span>
              </div>

              {notificationPermission === 'granted' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              )}
            </div>

            <p className="text-[11px] leading-relaxed mb-3 opacity-90">
              {notificationPermission === 'granted'
                ? 'Les alertes natives de statut (cuisine, coursier en route, livreur arrivé) vous seront notifiées directement sur le bureau ou l\'écran de verrouillage même quand l\'application est minimisée.'
                : notificationPermission === 'denied'
                ? 'Votre navigateur bloque les notifications pour ce site. Veuillez cliquer sur l\'icône de cadenas ou de réglages à gauche de la barre d\'adresse pour réautoriser les notifications.'
                : 'Autorisez les notifications pour ne manquer aucune étape clé de votre livraison à Ahmed Rachedi même en naviguant sur d\'autres applications.'}
            </p>

            {notificationPermission !== 'granted' && isNotificationSupported && (
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs"
              >
                <Bell size={14} className="text-[#D9943B]" />
                <span>
                  {isRequesting ? 'Demande en cours...' : 'Autoriser les notifications natives'}
                </span>
              </button>
            )}

            {notificationPermission === 'granted' && (
              <div className="flex gap-2">
                <button
                  onClick={handleStartCountdownTest}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <Timer size={13} />
                  <span>Tester en arrière-plan (4s)</span>
                </button>
                <button
                  onClick={() =>
                    sendNativeNotification('🔔 Alerte immédiate RYM', {
                      body: 'Test de notification native réussi en premier plan !',
                      tag: 'test-now',
                    })
                  }
                  className="bg-white hover:bg-neutral-100 text-emerald-900 border border-emerald-300 font-bold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1 active:scale-98 transition-all"
                >
                  <span>Tester maintenant</span>
                </button>
              </div>
            )}
          </div>

          {/* Background Delivery Highlights */}
          <div className="bg-neutral-50 rounded-2xl p-3 border border-black/5 space-y-2">
            <h3 className="font-bold text-[11px] text-zinc-900 flex items-center gap-1.5">
              <Smartphone size={14} className="text-amber-600" />
              Fonctionnement en Arrière-Plan (Ahmed Rachedi)
            </h3>
            <ul className="space-y-1.5 text-[11px] text-zinc-600">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Écran éteint ou onglet masqué</strong> : réception sonore et visuelle dès que le livreur change de statut.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Clic interactif</strong> : cliquer sur la notification réactive automatiquement l'onglet et affiche le radar GPS.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Vibration & Carillon doux</strong> : retour haptique et carillon audio doux via Web Audio API.
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="border-t border-neutral-100 pt-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
              Tester les étapes de statut de commande
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleQuickStatusTest(
                    'En cours de livraison 🛵',
                    'Le coursier a récupéré votre commande et roule vers votre adresse.'
                  )
                }
                className="p-2 bg-white border border-neutral-200 hover:border-amber-300 rounded-xl text-left transition-all active:scale-98"
              >
                <span className="block font-bold text-[11px] text-zinc-900">🛵 En livraison</span>
                <span className="text-[10px] text-zinc-500">Alerte livreur en route</span>
              </button>
              <button
                onClick={() =>
                  handleQuickStatusTest(
                    'Livreur arrivé à votre porte ! 📍',
                    'Votre coursier est en bas de votre immeuble à Ahmed Rachedi.'
                  )
                }
                className="p-2 bg-white border border-neutral-200 hover:border-amber-300 rounded-xl text-left transition-all active:scale-98"
              >
                <span className="block font-bold text-[11px] text-zinc-900">📍 Livreur arrivé</span>
                <span className="text-[10px] text-zinc-500">Alerte remise en main</span>
              </button>
            </div>
          </div>

          {/* Recent notifications history */}
          {recentNotifications.length > 0 && (
            <div className="border-t border-neutral-100 pt-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Historique des notifications récentes ({recentNotifications.length})
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-[11px] text-zinc-900">{n.title}</div>
                      <div className="text-[10px] text-zinc-600">{n.body}</div>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                      {n.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 flex items-center gap-1">
            <Volume2 size={13} />
            Web Audio & Notifications API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 font-bold text-zinc-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
