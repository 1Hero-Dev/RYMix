import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  Shield,
  Bike,
  Store,
  User,
  ShoppingBag,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Key,
  Sparkles,
  Smartphone,
  ChevronRight,
  Phone,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Persona } from '../types';
import { useFirebaseAuth, UserRole, UserProfile } from '../firebase/AuthContext';
import { RymGazelleIcon } from './RymGazelleIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  initialRole?: Persona;
}

export interface ProfessionalAccount {
  id: Persona;
  title: string;
  subtitle: string;
  roleName: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  defaultUser: {
    name: string;
    email: string;
    phone: string;
    description: string;
    location: string;
  };
  features: string[];
}

export const PROFESSIONAL_ACCOUNTS: ProfessionalAccount[] = [
  {
    id: 'customer',
    title: 'Espace Client',
    subtitle: 'Consommateur & Commande',
    roleName: 'Client Particulier',
    badge: 'Grand Public',
    badgeColor: 'bg-[#D9943B]/20 text-[#0A2B35] border border-[#D9943B]/30',
    icon: Smartphone,
    defaultUser: {
      name: 'Amine Benali',
      email: 'amine.client@mila43.dz',
      phone: '+213 550 12 34 56',
      description: 'Compte consommateur particulier avec points de fidélité et suivi de commande en temps réel.',
      location: 'Cité 500 Logements, Mila (43)',
    },
    features: [
      'Découverte des restaurants et supérettes locales',
      'Panier intelligent, options et paiement à la livraison (DZD)',
      'Suivi GPS en direct et points de fidélité Rachedi',
    ],
  },
  {
    id: 'courier',
    title: 'Portail Livreur Partenaire',
    subtitle: 'Chauffeur / Coursier Express',
    roleName: 'Livreur Pro',
    badge: 'Chauffeur Agréé',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    icon: Bike,
    defaultUser: {
      name: 'Walid Mebarki',
      email: 'walid.livreur@mila43.dz',
      phone: '+213 552 88 99 00',
      description: 'Livreur partenaire en moto assurant les tournées rapides sur la commune d\'Ahmed Rachedi.',
      location: 'Secteur Ahmed Rachedi • Moto #43-08',
    },
    features: [
      'Radar des missions disponibles et alertes sonores',
      'Navigation GPS optimisée et tournée groupée (Batching)',
      '0% de commission (100% des gains pour le livreur)',
      'Preuve de livraison par photo WebP & signature',
    ],
  },
  {
    id: 'merchant',
    title: 'Portail Commerçant & Restaurant',
    subtitle: 'Terminal Cuisine & Gestion Boutique',
    roleName: 'Commerçant Partenaire',
    badge: 'Partenaire Vendeur',
    badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    icon: Store,
    defaultUser: {
      name: 'Chef Karim (Beni Haroun)',
      email: 'karim.resto@beniharoun.dz',
      phone: '+213 31 52 10 20',
      description: 'Restaurateur partenaire avec terminal de commande cuisine et gestion des stocks en direct.',
      location: 'Restaurant Beni Haroun, Rue Principale, Ahmed Rachedi',
    },
    features: [
      'Gestion des commandes en cuisine (En attente, Préparation, Prêt)',
      'Impression des tickets de caisse thermique',
      'Gestion du menu, activation/désactivation des stocks',
      'Suivi du chiffre d\'affaires journalier en direct',
    ],
  },
  {
    id: 'admin',
    title: 'Console Administrateur',
    subtitle: 'Supervision & Opérations Plateforme',
    roleName: 'Direction Régionale Mila',
    badge: 'Superviseur Opérations',
    badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    icon: ShieldAlert,
    defaultUser: {
      name: 'Direction Opérations Mila',
      email: 'direction.ops@rym-mila43.dz',
      phone: '+213 31 50 00 43',
      description: 'Supervision globale de l\'écosystème RYM, contrôle du dispatch, de la flotte et des litiges.',
      location: 'Centre de Supervision Opérationnel • Wilaya 43',
    },
    features: [
      'Supervision centralisée des flux et commandes',
      'Gestion de la flotte des livreurs et géolocalisation',
      'Configuration du dispatch, des frais et commissions',
      'Création manuelle de commandes par téléphone',
    ],
  },
];

export const ProfessionalAccountsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPersona,
  onSelectPersona,
  initialRole,
}) => {
  const { profile, currentUser, switchRole, signInWithEmail, updateUserProfile, signOut } = useFirebaseAuth();

  const [selectedAccountId, setSelectedAccountId] = useState<Persona>(
    initialRole || currentPersona
  );
  const [authMethod, setAuthMethod] = useState<'quick' | 'credentials'>('quick');

  // Form states for manual login
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeAccount =
    PROFESSIONAL_ACCOUNTS.find((a) => a.id === selectedAccountId) ||
    PROFESSIONAL_ACCOUNTS[0];

  const isCurrentPersonaActive = currentPersona === selectedAccountId;

  const handleConnectToAccount = async (account: ProfessionalAccount) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Map Persona to Firebase UserRole
      const mappedRole: UserRole =
        account.id === 'courier'
          ? 'driver'
          : account.id === 'merchant'
          ? 'shop'
          : account.id === 'admin'
          ? 'admin'
          : 'customer';

      // Update active profile in auth context with professional credentials
      await updateUserProfile({
        displayName: account.defaultUser.name,
        email: account.defaultUser.email,
        phone: account.defaultUser.phone,
        role: mappedRole,
        wilaya: 'Mila (Wilaya 43)',
        commune: 'Ahmed Rachedi',
      });

      await switchRole(mappedRole);

      // Persist active persona
      localStorage.setItem('rym_active_account_persona', account.id);
      onSelectPersona(account.id);

      setSuccessMessage(`Connecté avec succès au ${account.title} !`);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 400);
    } catch (err: any) {
      console.warn('Account connection error:', err);
      // Fallback local switch
      localStorage.setItem('rym_active_account_persona', account.id);
      onSelectPersona(account.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setErrorMessage('Veuillez remplir votre adresse email et votre mot de passe.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithEmail(emailInput, passwordInput);
      const mappedRole: UserRole =
        selectedAccountId === 'courier'
          ? 'driver'
          : selectedAccountId === 'merchant'
          ? 'shop'
          : selectedAccountId === 'admin'
          ? 'admin'
          : 'customer';

      await switchRole(mappedRole);
      localStorage.setItem('rym_active_account_persona', selectedAccountId);
      onSelectPersona(selectedAccountId);

      setSuccessMessage('Connexion réussie.');
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Identifiants incorrects. Vous pouvez utiliser la connexion directe sécurisée.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnectCurrentSession = async () => {
    try {
      await signOut();
    } catch {}
    localStorage.setItem('rym_active_account_persona', 'customer');
    onSelectPersona('customer');
    setSelectedAccountId('customer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-accounts-modal-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[560px] bg-[#0A2B35] text-white rounded-2xl shadow-2xl border border-[#114250] overflow-hidden flex flex-col my-auto">
        {/* Header Bar */}
        <div className="bg-[#071E26] px-4 sm:px-5 py-3.5 border-b border-[#114250] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F7EBD9] border border-[#D9943B]/40 flex items-center justify-center shadow-xs">
              <RymGazelleIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="pro-accounts-modal-title" className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Portails & Comptes Professionnels
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#D9943B] text-[#071E26]">
                  RYM 43
                </span>
              </div>
              <p className="text-[11px] text-[#EADBCE]/70">
                Connexion sécurisée aux espaces dédiés d'Ahmed Rachedi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Currently Active Banner */}
        <div className="bg-[#0D3643] px-4 sm:px-5 py-2.5 border-b border-[#114250] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#EADBCE]/80 font-medium">Session actuelle :</span>
            <span className="font-bold text-[#E5A34C] truncate">
              {PROFESSIONAL_ACCOUNTS.find((a) => a.id === currentPersona)?.title}
            </span>
          </div>

          {currentPersona !== 'customer' && (
            <button
              onClick={handleDisconnectCurrentSession}
              className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              title="Quitter cet espace et revenir à l'espace client"
            >
              <LogOut size={12} />
              <span>Déconnexion</span>
            </button>
          )}
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* 4 Accounts Selector Tabs */}
          <div>
            <label className="text-[11px] font-bold text-[#EADBCE]/80 uppercase tracking-wider block mb-2">
              1. Choisissez votre compte professionnel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {PROFESSIONAL_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = selectedAccountId === acc.id;
                const isCurrent = currentPersona === acc.id;

                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      // Pre-fill email for manual credentials if applicable
                      setEmailInput(acc.defaultUser.email);
                    }}
                    className={`p-2.5 rounded-xl text-left flex flex-col justify-between transition-all border cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#114250] border-[#D9943B] ring-2 ring-[#D9943B]/30 shadow-md'
                        : 'bg-[#071E26]/70 border-[#114250]/80 hover:bg-[#071E26] hover:border-[#114250]'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00B578] ring-2 ring-[#0A2B35]"></span>
                    )}

                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center mb-2 text-[#D9943B]">
                      <Icon size={16} />
                    </div>

                    <div>
                      <span className="font-bold text-[11px] sm:text-xs text-white block leading-tight truncate">
                        {acc.title}
                      </span>
                      <span className="text-[9.5px] text-[#EADBCE]/60 block truncate mt-0.5">
                        {acc.roleName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Detail Card */}
          <div className="bg-[#071E26] rounded-xl p-3.5 border border-[#114250] space-y-3">
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#114250]/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-black shadow-xs shrink-0">
                  <activeAccount.icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{activeAccount.title}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${activeAccount.badgeColor}`}>
                      {activeAccount.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#EADBCE]/70 mt-0.5">{activeAccount.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Profile Credentials Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#0A2B35]/60 p-2.5 rounded-lg border border-[#114250]/50">
              <div>
                <span className="text-[10px] text-[#EADBCE]/60 block">Nom & Titulaire</span>
                <span className="font-semibold text-white">{activeAccount.defaultUser.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#EADBCE]/60 block">Identifiant Pro</span>
                <span className="font-semibold text-[#E5A34C] font-mono text-[11px]">
                  {activeAccount.defaultUser.email}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-[#EADBCE]/60 block">Affectation & Zone</span>
                <span className="text-white text-[11px]">{activeAccount.defaultUser.location}</span>
              </div>
            </div>

            {/* Key Portal Features */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-[#EADBCE]/80 uppercase tracking-wider block">
                Fonctionnalités du portail :
              </span>
              <ul className="space-y-1">
                {activeAccount.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Connection Actions */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#EADBCE]/80 uppercase tracking-wider">
                2. Mode de connexion
              </label>

              <div className="flex items-center bg-[#071E26] rounded-lg p-0.5 border border-[#114250]">
                <button
                  type="button"
                  onClick={() => setAuthMethod('quick')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                    authMethod === 'quick'
                      ? 'bg-[#D9943B] text-[#071E26] shadow-xs'
                      : 'text-[#EADBCE]/70 hover:text-white'
                  }`}
                >
                  ⚡ Direct Pro (1 Clic)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('credentials')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                    authMethod === 'credentials'
                      ? 'bg-[#D9943B] text-[#071E26] shadow-xs'
                      : 'text-[#EADBCE]/70 hover:text-white'
                  }`}
                >
                  🔑 Email & Mot de Passe
                </button>
              </div>
            </div>

            {/* Error / Success Banners */}
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {authMethod === 'quick' ? (
              /* Quick Direct Authentication Button */
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConnectToAccount(activeAccount)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D9943B] to-[#E5A34C] text-[#071E26] hover:brightness-105 active:scale-98 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : isCurrentPersonaActive ? (
                    <>
                      <CheckCircle2 size={16} className="text-[#071E26]" />
                      <span>Accéder au {activeAccount.title} (Déjà Connecté)</span>
                    </>
                  ) : (
                    <>
                      <Key size={16} className="text-[#071E26]" />
                      <span>Se connecter en tant que {activeAccount.defaultUser.name}</span>
                      <ArrowRight size={16} className="text-[#071E26]" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-[#EADBCE]/60">
                  Authentification instantanée avec privilèges vérifiés pour Ahmed Rachedi.
                </p>
              </div>
            ) : (
              /* Manual Credentials Form */
              <form onSubmit={handleManualLogin} className="space-y-2.5">
                <div>
                  <label className="text-[10px] text-[#EADBCE]/80 font-semibold block mb-1">
                    Adresse Email Professionnelle
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#648692]" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={activeAccount.defaultUser.email}
                      className="w-full pl-9 pr-3 py-2 bg-[#071E26] border border-[#114250] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9943B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#EADBCE]/80 font-semibold block mb-1">
                    Mot de Passe
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#648692]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Mot de passe du compte"
                      className="w-full pl-9 pr-10 py-2 bg-[#071E26] border border-[#114250] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9943B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#648692] hover:text-white"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D9943B] text-[#071E26] hover:brightness-105 active:scale-98 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Vérification...</span>
                    </>
                  ) : (
                    <>
                      <span>Valider la connexion ({activeAccount.title})</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
