import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { httpSmsService } from '../services/httpSmsService';

export type UserRole = 'customer' | 'driver' | 'shop' | 'admin';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export interface NativeNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  vibrate?: number[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  wilaya: string;
  commune?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  signInWithGoogle: (desiredRole?: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    phone?: string,
    wilaya?: string,
    commune?: string
  ) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; simulatedCode?: string; message: string }>;
  verifyPhoneOtpAndSignIn: (
    phone: string,
    otpCode: string,
    displayName?: string,
    role?: UserRole,
    commune?: string
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  // Native Notifications Service
  notificationPermission: NotificationPermissionStatus;
  isNotificationSupported: boolean;
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<NotificationPermissionStatus>;
  setNotificationsEnabled: (enabled: boolean) => void;
  sendNativeNotification: (title: string, options?: NativeNotificationOptions) => Promise<boolean>;
}

const STORAGE_KEY_CUSTOM_SESSION = 'rym_custom_user_session_v1';
const OTP_STORAGE_KEY = 'rym_temp_phone_otp_v1';

export const DEFAULT_DEMO_PROFILE: UserProfile = {
  uid: 'cust-amine-43',
  email: 'amine.client@mila43.dz',
  displayName: 'Amine Benali',
  role: 'customer',
  phone: '+213 550 12 34 56',
  wilaya: 'Mila (Wilaya 43)',
  commune: 'Mila Centre',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DEMO_PROFILE;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Native Notifications Service state
  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
      return Notification.permission as NotificationPermissionStatus;
    } catch {
      return 'default';
    }
  });

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('rym_native_notifications_enabled');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  // Sync profile to localStorage for persistence across reloads
  useEffect(() => {
    if (profile) {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_SESSION, JSON.stringify(profile));
      } catch {}
    }
  }, [profile]);

  // Monitor notification permission and register service worker if granted
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      setNotificationPermission(Notification.permission as NotificationPermissionStatus);
    } catch {}

    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if ('permissions' in navigator && navigator.permissions.query) {
      try {
        navigator.permissions
          .query({ name: 'notifications' as PermissionName })
          .then((status) => {
            status.onchange = () => {
              setNotificationPermission(Notification.permission as NotificationPermissionStatus);
            };
          })
          .catch(() => {});
      } catch {}
    }
  }, []);

  // Web Audio chime for non-intrusive sound feedback
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // First pleasant chime tone (587.33 Hz - D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second harmonious tone (880 Hz - A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {}
  };

  // Request browser native notification permission
  const requestNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission as NotificationPermissionStatus);

      if (permission === 'granted') {
        setNotificationsEnabledState(true);
        try {
          localStorage.setItem('rym_native_notifications_enabled', 'true');
        } catch {}

        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/sw.js');
          } catch {}
        }

        // Immediate confirmation notification
        sendNativeNotification('🔔 RYM Ahmed Rachedi 43 - Notifications activées !', {
          body: 'Vous recevrez les alertes de vos commandes même lorsque l\'application est en arrière-plan.',
          tag: 'rym-welcome',
        });
      }
      return permission as NotificationPermissionStatus;
    } catch (err) {
      console.warn('Notification permission request error:', err);
      setNotificationPermission('denied');
      return 'denied';
    }
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    try {
      localStorage.setItem('rym_native_notifications_enabled', String(enabled));
    } catch {}
  };

  // Dispatch native notification (supporting background tabs & OS notification center)
  const sendNativeNotification = async (
    title: string,
    options?: NativeNotificationOptions
  ): Promise<boolean> => {
    if (!notificationsEnabled) return false;

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(options?.vibrate || [150, 70, 150]);
      } catch {}
    }

    // Audio chime if not muted
    if (!options?.silent) {
      playNotificationChime();
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const defaultIcon = 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=192&q=80&fm=webp';
    const defaultBadge = 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=96&q=80&fm=webp';
    const notifOptions: NotificationOptions = {
      body: options?.body || '',
      icon: options?.icon || defaultIcon,
      badge: options?.badge || defaultBadge,
      tag: options?.tag || `order-status-${Date.now()}`,
      data: options?.data || { timestamp: Date.now() },
      requireInteraction: options?.requireInteraction ?? false,
      silent: options?.silent ?? false,
    };

    try {
      // 1. Service Worker showNotification if ready (best for mobile browsers & PWA)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && 'showNotification' in reg) {
            await reg.showNotification(title, notifOptions);
            return true;
          }
        } catch {}
      }

      // 2. Standard Window Notification
      const notif = new Notification(title, notifOptions);
      notif.onclick = () => {
        try {
          window.focus();
        } catch {}
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Browser native notification dispatch warning:', err);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || `${fbUser.uid}@mila43.dz`,
              displayName: fbUser.displayName || 'Utilisateur Mila',
              photoURL: fbUser.photoURL || undefined,
              role: (profile?.role as UserRole) || 'customer',
              phone: profile?.phone || '+213 550 00 00 00',
              wilaya: 'Mila (Wilaya 43)',
              commune: 'Mila Centre',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (e) {
              console.warn('Firestore setDoc notice on auth init:', e);
            }
            setProfile(newProfile);
          }
        } catch (err) {
          console.warn('Could not sync user profile from Firestore:', err);
          setProfile({
            uid: fbUser.uid,
            email: fbUser.email || 'user@mila43.dz',
            displayName: fbUser.displayName || 'Utilisateur Mila',
            role: profile?.role || 'customer',
            wilaya: 'Mila 43',
            commune: 'Mila Centre',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Sign In With Google Popup
  const signInWithGoogle = async (desiredRole: UserRole = 'customer') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const userDocRef = doc(db, 'users', fbUser.uid);

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || `${fbUser.uid}@mila43.dz`,
        displayName: fbUser.displayName || 'Utilisateur Mila',
        photoURL: fbUser.photoURL || undefined,
        role: desiredRole,
        phone: profile?.phone || '+213 550 00 00 00',
        wilaya: 'Mila (Wilaya 43)',
        commune: 'Mila Centre',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(userDocRef, newProfile, { merge: true });
      } catch (err) {
        console.warn('Firestore setDoc notice on Google Sign-In:', err);
      }
      setProfile(newProfile);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  // 2. Sign In with Email & Password
  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = userCred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);

      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          const fallbackProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || email,
            displayName: fbUser.displayName || email.split('@')[0],
            role: 'customer',
            wilaya: 'Mila (Wilaya 43)',
            commune: 'Mila Centre',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, fallbackProfile);
          setProfile(fallbackProfile);
        }
      } catch (e) {
        console.warn('Firestore doc read error:', e);
      }
    } catch (error: any) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  // 3. Sign Up with Email & Password
  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    role: UserRole = 'customer',
    phone?: string,
    wilaya = 'Mila (Wilaya 43)',
    commune = 'Mila Centre'
  ) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = userCred.user;

      try {
        await updateProfile(fbUser, { displayName: displayName.trim() });
      } catch {}

      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || email.trim(),
        displayName: displayName.trim() || 'Utilisateur Mila',
        role,
        phone: phone ? httpSmsService.normalizeAlgerianPhone(phone) : '+213 550 00 00 00',
        wilaya,
        commune,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(userDocRef, newProfile);
      } catch (e) {
        console.warn('Firestore setDoc notice on SignUp:', e);
      }

      setProfile(newProfile);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // 4. Send Phone OTP via Open-Source HTTP-SMS Android Gateway
  const sendPhoneOtp = async (rawPhone: string) => {
    const normalized = httpSmsService.normalizeAlgerianPhone(rawPhone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in session for verification
    const otpData = {
      phone: normalized,
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    };
    try {
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
    } catch {}

    const res = await httpSmsService.sendOtp(normalized, code);

    return {
      success: true,
      simulatedCode: code, // Provided for easy demo/testing if gateway is in simulation mode
      message:
        res.status === 'SENT'
          ? `Code envoyé par SMS au ${normalized} via la carte SIM Android.`
          : `Code généré : ${code} (Journalisé dans la passerelle HTTP-SMS).`,
    };
  };

  // 5. Verify Phone OTP & Sign In / Sign Up
  const verifyPhoneOtpAndSignIn = async (
    rawPhone: string,
    otpCode: string,
    displayName?: string,
    desiredRole: UserRole = 'customer',
    commune = 'Mila Centre'
  ) => {
    const normalized = httpSmsService.normalizeAlgerianPhone(rawPhone);
    let storedOtp: { phone: string; code: string; expiresAt: number } | null = null;

    try {
      const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
      if (raw) storedOtp = JSON.parse(raw);
    } catch {}

    const isMatch = storedOtp && storedOtp.phone === normalized && storedOtp.code === otpCode.trim();
    // Allow master demo code for testing ease: 123456
    const isMasterCode = otpCode.trim() === '123456' || otpCode.trim() === '000000';

    if (!isMatch && !isMasterCode) {
      throw new Error('Code de vérification SMS invalide ou expiré.');
    }

    // Clean up used OTP
    try {
      sessionStorage.removeItem(OTP_STORAGE_KEY);
    } catch {}

    // Generate unique UID based on normalized phone
    const cleanPhoneDigits = normalized.replace(/\D/g, '');
    const phoneUid = `phone-dz-${cleanPhoneDigits}`;
    const userEmail = `${cleanPhoneDigits}@phone.rym.dz`;

    const userDocRef = doc(db, 'users', phoneUid);
    let existingProfile: UserProfile | null = null;

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        existingProfile = snap.data() as UserProfile;
      }
    } catch {}

    const finalProfile: UserProfile = existingProfile || {
      uid: phoneUid,
      email: userEmail,
      displayName: displayName?.trim() || `Utilisateur ${normalized.slice(-4)}`,
      role: desiredRole,
      phone: normalized,
      wilaya: 'Mila (Wilaya 43)',
      commune,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(userDocRef, finalProfile, { merge: true });
    } catch (e) {
      console.warn('Firestore save phone profile error:', e);
    }

    setProfile(finalProfile);
  };

  // 6. Reset Password Email
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // 7. Sign Out
  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.warn('Sign Out notice:', error);
    }
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_SESSION);
    } catch {}
    setProfile(DEFAULT_DEMO_PROFILE);
    setCurrentUser(null);
  };

  // 8. Switch Role
  const switchRole = async (newRole: UserRole) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      role: newRole,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('Error updating role in Firestore:', e);
      }
    }
  };

  // 9. Update User Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);

    const uid = currentUser?.uid || profile.uid;
    if (uid) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, updated, { merge: true });
      } catch (e) {
        console.warn('Firestore updateUserProfile error:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        role: profile?.role || 'customer',
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneOtp,
        verifyPhoneOtpAndSignIn,
        resetPassword,
        signOut,
        switchRole,
        updateUserProfile,
        // Native Notifications Service
        notificationPermission,
        isNotificationSupported,
        notificationsEnabled,
        requestNotificationPermission,
        setNotificationsEnabled,
        sendNativeNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = useFirebaseAuth;
