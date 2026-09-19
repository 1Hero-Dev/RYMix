import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bike,
  Store,
  ShoppingBag,
  Shield,
  ArrowRight,
  RefreshCw,
  Send,
  MapPin,
} from 'lucide-react';
import { useFirebaseAuth, UserRole } from '../firebase/AuthContext';
import { MILA_NEIGHBORHOODS } from '../data/mockData';
import { RymGazelleIcon } from './RymGazelleIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  initialRole?: UserRole;
  onSuccess?: () => void;
}

type AuthMethod = 'phone' | 'email';

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  initialRole = 'customer',
  onSuccess,
}) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtpAndSignIn,
    resetPassword,
    switchRole,
  } = useFirebaseAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [role, setRole] = useState<UserRole>(initialRole);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [commune, setCommune] = useState('Cité El Bassatine');

  // Phone OTP Flow State
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  if (!isOpen) return null;

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setErrorMessage('Veuillez saisir un numéro de téléphone algérien valide (ex: 0550 12 34 56 ou 06/07).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPhoneOtp(phone);
      setSuccessMessage(res.message);
      if (res.simulatedCode) {
        setSimulatedCode(res.simulatedCode);
      }
      setOtpStep('verify');
      setResendCooldown(60);

      // Countdown timer for resend
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de l\'envoi du SMS via la passerelle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage('Veuillez saisir le code à 6 chiffres reçu par SMS.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyPhoneOtpAndSignIn(phone, otpCode, displayName || undefined, role, commune);
      setSuccessMessage('Connexion réussie ! Bienvenue sur RYM Super-App.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Code de vérification erroné.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Les deux mots de passe ne correspondent pas.');
        return;
      }
      if (!displayName.trim()) {
        setErrorMessage('Veuillez renseigner votre nom complet.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        setSuccessMessage('Connexion réussie ! Heureux de vous revoir.');
      } else {
        await signUpWithEmail(email, password, displayName, role, phone, 'Ahmed Rachedi', commune);
        setSuccessMessage('Compte créé avec succès ! Bienvenue dans la communauté Ahmed Rachedi.');
      }
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Identifiants incorrects. Vérifiez votre email et mot de passe.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMessage('Cet email est déjà associé à un compte. Veuillez vous connecter.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('Mot de passe trop faible (minimum 6 caractères).');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('Adresse email invalide.');
      } else {
        setErrorMessage(err?.message || 'Une erreur est survenue lors de l\'authentification.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle(role);
      setSuccessMessage('Connexion Google réussie !');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage('Erreur lors de la connexion Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Entrez votre adresse email ci-dessus pour réinitialiser votre mot de passe.');
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setForgotPasswordSent(true);
      setSuccessMessage(`Un lien de réinitialisation a été envoyé à ${email}.`);
    } catch (err: any) {
      setErrorMessage('Impossible d\'envoyer l\'email. Vérifiez l\'adresse saisie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoSwitch = async (demoRole: UserRole) => {
    setIsSubmitting(true);
    await switchRole(demoRole);
    setSuccessMessage(`Session activée en mode ${demoRole === 'customer' ? 'Client' : demoRole === 'driver' ? 'Coursier' : demoRole === 'shop' ? 'Commerçant' : 'Admin'} !`);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-black/[0.06] overflow-hidden my-auto flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#071E26] via-[#0A2B35] to-[#114250] text-white p-5 relative border-b border-[#EADBCE]/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95 cursor-pointer"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D9943B] animate-pulse"></span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D9943B] bg-[#D9943B]/10 px-2 py-0.5 rounded-full border border-[#D9943B]/30">
              Ahmed Rachedi • Passerelle Ouverte
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <RymGazelleIcon size={24} className="shrink-0" />
            <span>{mode === 'signin' ? 'Connexion à RYM' : 'Créer votre compte'}</span>
            <span className="text-xs bg-[#D9943B] text-[#071E26] font-black px-1.5 py-0.5 rounded">DZ</span>
          </h2>
          <p className="text-xs text-[#EADBCE] mt-1">
            {mode === 'signin'
              ? 'Accédez à vos commandes, adresses et avantages de fidélité à Ahmed Rachedi.'
              : 'Rejoignez la première Super-App locale sans frais ni commissions intermédiaires.'}
          </p>

          {/* Mode Switcher Tabs (Connexion vs Inscription) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-white/10 rounded-2xl mt-4 text-xs font-bold">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
                setOtpStep('request');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#0A2B35] shadow-sm'
                  : 'text-[#EADBCE] hover:text-white hover:bg-white/5'
              }`}
            >
              Se Connecter
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
                setOtpStep('request');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#D9943B] text-[#071E26] shadow-sm'
                  : 'text-[#EADBCE] hover:text-white hover:bg-white/5'
              }`}
            >
              S'inscrire
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status & Alerts */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Method Selector: SMS vs Email */}
          <div className="flex rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                method === 'phone'
                  ? 'bg-white text-zinc-900 shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Phone size={13} className="text-[#00B578]" />
              <span>SMS SIM Algérie (OTP)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                method === 'email'
                  ? 'bg-white text-zinc-900 shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Mail size={13} className="text-blue-600" />
              <span>Email & Mot de passe</span>
            </button>
          </div>

          {/* Role selector if signing up */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                Je m'inscris en tant que :
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'customer'
                      ? 'border-[#0A2B35] bg-[#0A2B35] text-white font-bold'
                      : 'border-[#EADBCE] bg-white text-[#648692] hover:border-[#0A2B35]'
                  }`}
                >
                  <ShoppingBag size={16} className={role === 'customer' ? 'text-[#D9943B]' : 'text-[#648692]'} />
                  <span className="text-[11px]">Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'driver'
                      ? 'border-[#D9943B] bg-[#F7EBD9] text-[#0A2B35] font-bold'
                      : 'border-[#EADBCE] bg-white text-[#648692] hover:border-[#D9943B]'
                  }`}
                >
                  <Bike size={16} className={role === 'driver' ? 'text-[#D9943B]' : 'text-[#648692]'} />
                  <span className="text-[11px]">Coursier 43</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('shop')}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    role === 'shop'
                      ? 'border-[#D91A67] bg-[#D91A67]/10 text-[#D91A67] font-bold'
                      : 'border-[#EADBCE] bg-white text-[#648692] hover:border-[#D91A67]'
                  }`}
                >
                  <Store size={16} className={role === 'shop' ? 'text-[#D91A67]' : 'text-[#648692]'} />
                  <span className="text-[11px]">Commerçant</span>
                </button>
              </div>
            </div>
          )}

          {/* METHOD 1: Phone SMS OTP (Using Android HTTP-SMS Gateway) */}
          {method === 'phone' && (
            <div className="space-y-3">
              {otpStep === 'request' ? (
                <form onSubmit={handlePhoneSendOtp} className="space-y-3">
                  {mode === 'signup' && (
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">Nom complet</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Ex: Amine Benali"
                          required
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:border-[#00B578]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-600">Numéro de mobile algérien</label>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <span>Mobilis 06</span>
                        <span>•</span>
                        <span>Djezzy 07</span>
                        <span>•</span>
                        <span>Ooredoo 05</span>
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-zinc-600 border-r border-zinc-200 pr-2">
                        <span>🇩🇿</span>
                        <span>+213</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="550 12 34 56"
                        required
                        className="w-full pl-22 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#00B578]"
                      />
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">Quartier à Ahmed Rachedi</label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <select
                          value={commune}
                          onChange={(e) => setCommune(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:border-[#00B578]"
                        >
                          {MILA_NEIGHBORHOODS.map((n) => (
                            <option key={n.id} value={n.name}>
                              {n.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#F8F4EC] border border-[#EADBCE] rounded-xl p-2.5 text-[11px] text-[#0A2B35] flex items-start gap-2">
                    <Sparkles size={14} className="text-[#D9943B] shrink-0 mt-0.5" />
                    <span>
                      Envoi d'un code SMS sécurisé via la passerelle Android locale <strong>0 DZD</strong>.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#D9943B] hover:bg-[#B8731E] text-[#071E26] rounded-xl font-bold text-xs shadow-md shadow-[#D9943B]/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    <span>Envoyer le code par SMS</span>
                  </button>
                </form>
              ) : (
                /* OTP Verification Step */
                <form onSubmit={handlePhoneVerifyOtp} className="space-y-3">
                  <div className="text-center p-3 bg-[#F8F4EC] rounded-2xl border border-[#EADBCE]">
                    <p className="text-xs text-[#0A2B35]">
                      Code envoyé au <strong className="text-[#071E26]">{phone}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-[11px] text-[#D9943B] hover:underline font-bold mt-1 cursor-pointer"
                    >
                      Modifier le numéro
                    </button>
                  </div>

                  {simulatedCode && (
                    <div className="p-2.5 bg-[#F7EBD9] border border-[#D9943B]/40 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#0A2B35] font-medium">Code détecté sur passerelle : </span>
                        <strong className="text-[#B8731E] font-mono tracking-widest text-sm font-black">
                          {simulatedCode}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpCode(simulatedCode)}
                        className="px-2 py-1 bg-[#D9943B] text-[#071E26] rounded font-bold text-[10px] hover:bg-[#B8731E] cursor-pointer"
                      >
                        Insérer
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-semibold text-[#0A2B35] mb-1 block">
                      Code de confirmation (6 chiffres)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="1 2 3 4 5 6"
                      autoFocus
                      required
                      className="w-full text-center tracking-[0.4em] font-mono text-lg font-extrabold py-2.5 bg-[#F8F4EC] rounded-xl border border-[#EADBCE] focus:bg-white focus:outline-none focus:border-[#D9943B]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#D9943B] hover:bg-[#B8731E] text-[#071E26] rounded-xl font-bold text-xs shadow-md shadow-[#D9943B]/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>Valider et se connecter</span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={handlePhoneSendOtp}
                      className="hover:text-zinc-900 font-semibold disabled:opacity-40"
                    >
                      Renvoyer le SMS {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
                    </button>
                    <span className="text-[10px] text-zinc-400">Code maître démo : 123456</span>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* METHOD 2: Email & Password */}
          {method === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">Nom & Prénom</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Charaf Eddine Boudehous"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">Adresse Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: rym@ahmedrachedi43.dz"
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-zinc-600">Mot de passe</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">Quartier de résidence (Ahmed Rachedi)</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:border-zinc-900"
                    >
                      {MILA_NEIGHBORHOODS.map((n) => (
                        <option key={n.id} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#0A2B35] hover:bg-[#114250] text-[#D9943B] rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <ArrowRight size={14} />
                )}
                <span>{mode === 'signin' ? 'Se connecter avec Email' : 'Créer mon compte RYM'}</span>
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#EADBCE] w-full"></div>
            <span className="bg-white px-3 text-[11px] text-[#648692] font-semibold uppercase">ou</span>
          </div>

          {/* Google Sign In 1-Click */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 bg-white border border-[#EADBCE] hover:bg-[#F8F4EC] rounded-xl font-bold text-xs text-[#071E26] flex items-center justify-center gap-2.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuer avec Google</span>
          </button>

          {/* Quick Demo Role Profiles for immediate trial */}
          <div className="pt-2 border-t border-[#EADBCE]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#648692] uppercase tracking-wider">
                Profils de Test Rapide (Wilaya 43)
              </span>
              <span className="text-[9px] bg-[#F8F4EC] text-[#0A2B35] px-1.5 py-0.2 rounded font-semibold">1 Clic</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoSwitch('customer')}
                className="p-1.5 rounded-lg bg-[#0A2B35] hover:bg-[#114250] text-[#D9943B] text-[11px] font-semibold text-center truncate active:scale-95 cursor-pointer"
              >
                👤 Client
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSwitch('driver')}
                className="p-1.5 rounded-lg bg-[#F7EBD9] hover:bg-[#EADBCE] text-[#B8731E] text-[11px] font-semibold text-center truncate active:scale-95 cursor-pointer"
              >
                🛵 Coursier
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSwitch('shop')}
                className="p-1.5 rounded-lg bg-[#D91A67]/10 hover:bg-[#D91A67]/20 text-[#D91A67] text-[11px] font-semibold text-center truncate active:scale-95 cursor-pointer"
              >
                🏪 Resto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
