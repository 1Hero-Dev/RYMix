import React, { useState } from 'react';
import {
  ShieldCheck,
  Flame,
  UserCheck,
  Database,
  Navigation,
  Bell,
  UploadCloud,
  Code2,
  CheckCircle2,
  X,
  LogIn,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useFirebaseAuth, UserRole } from '../firebase/AuthContext';
import firebaseConfig from '../../firebase-applet-config.json';
import { sendPushNotification } from '../firebase/firebaseServices';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, profile, role, switchRole, signInWithGoogle, signOut } = useFirebaseAuth();
  const [testPushSent, setTestPushSent] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle(role);
    } catch (e) {
      console.warn('Google Sign in note:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleTestPush = () => {
    sendPushNotification(
      'all',
      'RYM Express Ahmed Rachedi (FCM)',
      'Test de notification push en temps réel reçu avec succès sur Wilaya 43 !'
    );
    setTestPushSent(true);
    setTimeout(() => setTestPushSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18191E] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-zinc-950 font-black shadow-md">
              <Flame size={22} className="fill-current text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Firebase Suite Cloud</h3>
                <span className="text-[10px] bg-emerald-500/20 text-[#00B578] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Spark Plan Connecté
                </span>
              </div>
              <p className="text-xs text-zinc-400">Projet : {firebaseConfig.projectId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Active Account & Role Switcher */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <UserCheck size={15} className="text-[#D9943B]" />
                <span>Authentification Multi-Rôles</span>
              </span>
              {currentUser ? (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Google Connecté
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400">Profil de session</span>
              )}
            </div>

            <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-lg border border-white/5">
              <div>
                <p className="font-bold text-white text-sm">{profile?.displayName || 'Amine Benali'}</p>
                <p className="text-[11px] text-zinc-400">{profile?.email}</p>
                <span className="inline-block mt-1 text-[10px] bg-[#D9943B]/20 text-[#E5A34C] px-2 py-0.5 rounded font-bold uppercase">
                  Rôle : {role}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {currentUser ? (
                  <button
                    onClick={signOut}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <LogOut size={13} /> Déconnexion
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="px-3 py-1.5 bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <LogIn size={13} />
                    {isSigningIn ? 'Connexion...' : 'Google Sign-In'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Role Switcher */}
            <div>
              <span className="text-[11px] text-zinc-400 font-semibold block mb-1.5">
                Basculer le rôle de test :
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {(['customer', 'driver', 'shop', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`py-1.5 px-1 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
                      role === r
                        ? 'bg-[#D9943B] text-[#071E26] border-[#D9943B] shadow-sm'
                        : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {r === 'customer' && 'Client'}
                    {r === 'driver' && 'Livreur'}
                    {r === 'shop' && 'Commerce'}
                    {r === 'admin' && 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Services Grid */}
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#D9943B]" />
              <span>Services Firebase Opérationnels</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {/* Cloud Firestore */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Database size={14} className="text-amber-400" />
                    <span>Cloud Firestore</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                    Actif
                  </span>
                </div>
                <p className="text-zinc-400 text-[10px]">
                  DB ID : {firebaseConfig.firestoreDatabaseId.slice(0, 18)}...
                </p>
                <p className="text-zinc-500 text-[9px]">Collections : users, orders, ratings, loyalty</p>
              </div>

              {/* Real-time Driver GPS */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Navigation size={14} className="text-emerald-400" />
                    <span>Télémétrie Livreur</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                    Live GPS
                  </span>
                </div>
                <p className="text-zinc-400 text-[10px]">Flux GPS temps réel sur carte Ahmed Rachedi</p>
                <p className="text-zinc-500 text-[9px]">Lat/Lng, cap, vitesse, ID commande</p>
              </div>

              {/* Cloud Storage */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <UploadCloud size={14} className="text-blue-400" />
                    <span>Cloud Storage</span>
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                    Prêt
                  </span>
                </div>
                <p className="text-zinc-400 text-[10px]">Bucket : {firebaseConfig.storageBucket}</p>
                <p className="text-zinc-500 text-[9px]">Photos preuves de livraison scellées</p>
              </div>

              {/* Push Messaging FCM */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Bell size={14} className="text-purple-400" />
                    <span>Push Notifications</span>
                  </span>
                  <button
                    onClick={handleTestPush}
                    className="text-[9px] bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-2 py-0.5 rounded font-bold transition-colors"
                  >
                    {testPushSent ? '✓ Envoyé !' : 'Tester'}
                  </button>
                </div>
                <p className="text-zinc-400 text-[10px]">
                  FCM Sender ID : {firebaseConfig.messagingSenderId}
                </p>
                <p className="text-zinc-500 text-[9px]">Alertes de statut client/livreur/commerce</p>
              </div>
            </div>
          </div>

          {/* Cloud Functions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Code2 size={14} className="text-amber-400" />
                <span>Cloud Functions TypeScript</span>
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                functions/src/index.ts
              </span>
            </div>
            <ul className="space-y-1 text-[10px] text-zinc-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>
                  <strong>onOrderCreated</strong> : Notification push temps réel vers commerçants & livreurs.
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>
                  <strong>onOrderStatusChanged</strong> : Calcul automatique des points de fidélité lors de la livraison.
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>
                  <strong>onRatingCreated</strong> : Recalcul dynamique des moyennes commerçants & coursiers.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/40 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] font-bold rounded-lg text-xs active:scale-95 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
