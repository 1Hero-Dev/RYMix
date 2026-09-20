/**
 * Order Lifecycle Domain — Rich State Machine & Transition Rules
 * 
 * Relocated from src/domain/orderLifecycle.ts (unchanged — pure logic)
 * Implements strict state machine transitions with role authorization.
 */

export type ActorRole = 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'SYSTEM' | 'ADMIN';

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY'
  | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERING'
  | 'ARRIVED' | 'CUSTOMER_CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface TransitionRule {
  allowedTargets: OrderStatus[];
  authorizedRoles: ActorRole[];
  requiresReason?: boolean;
  description: string;
}

/**
 * Strict Order State Machine Matrix with Role Authorization.
 * Guarantees that clients cannot skip required operational steps.
 */
export const ORDER_LIFECYCLE_RULES: Record<OrderStatus, TransitionRule> = {
  PENDING: {
    allowedTargets: ['CONFIRMED', 'CANCELLED'],
    authorizedRoles: ['MERCHANT', 'SYSTEM', 'ADMIN', 'CUSTOMER'],
    description: 'Nouvelle commande en attente d\'acceptation par le commerçant ou annulation client.',
  },
  CONFIRMED: {
    allowedTargets: ['PREPARING', 'CANCELLED'],
    authorizedRoles: ['MERCHANT', 'SYSTEM', 'ADMIN'],
    description: 'Commande acceptée par le commerce. Passe en cuisine / préparation.',
  },
  PREPARING: {
    allowedTargets: ['READY', 'CANCELLED'],
    authorizedRoles: ['MERCHANT', 'SYSTEM', 'ADMIN'],
    description: 'En cours de préparation (cuisine) ou de picking (courses). Passe à prête.',
  },
  READY: {
    allowedTargets: ['ASSIGNED', 'PICKED_UP', 'CANCELLED'],
    authorizedRoles: ['MERCHANT', 'COURIER', 'SYSTEM', 'ADMIN'],
    description: 'Colis emballé et prêt en boutique pour enlèvement livreur.',
  },
  ASSIGNED: {
    allowedTargets: ['PICKED_UP', 'CANCELLED'],
    authorizedRoles: ['COURIER', 'SYSTEM', 'ADMIN'],
    description: 'Livreur assigné et en route vers le commerce.',
  },
  PICKED_UP: {
    allowedTargets: ['DELIVERING', 'CANCELLED'],
    authorizedRoles: ['COURIER', 'SYSTEM', 'ADMIN'],
    description: 'Colis récupéré par le livreur, départ vers l\'adresse client.',
  },
  DELIVERING: {
    allowedTargets: ['ARRIVED', 'CUSTOMER_CONFIRMED', 'DELIVERED', 'CANCELLED'],
    authorizedRoles: ['COURIER', 'SYSTEM', 'ADMIN'],
    description: 'En transit vers le client à Ahmed Rachedi.',
  },
  ARRIVED: {
    allowedTargets: ['CUSTOMER_CONFIRMED', 'DELIVERED'],
    authorizedRoles: ['COURIER', 'CUSTOMER', 'SYSTEM', 'ADMIN'],
    description: 'Livreur arrivé au pied de l\'immeuble ou au point de repère.',
  },
  CUSTOMER_CONFIRMED: {
    allowedTargets: ['DELIVERED'],
    authorizedRoles: ['CUSTOMER', 'COURIER', 'SYSTEM', 'ADMIN'],
    description: 'Client a validé la réception du colis.',
  },
  DELIVERED: {
    allowedTargets: [],
    authorizedRoles: [],
    description: 'Livraison achevée et paiement réglé.',
  },
  CANCELLED: {
    allowedTargets: [],
    authorizedRoles: [],
    description: 'Commande annulée et archivée.',
  },
};

/**
 * Validates whether a transition from fromStatus to toStatus is permitted for the given role.
 */
export function validateOrderTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  actorRole: ActorRole
): { valid: boolean; reason?: string } {
  const rule = ORDER_LIFECYCLE_RULES[fromStatus];
  if (!rule) {
    return { valid: false, reason: `Statut d'origine inconnu: ${fromStatus}` };
  }

  if (!rule.allowedTargets.includes(toStatus)) {
    return {
      valid: false,
      reason: `Transition illégale de '${fromStatus}' vers '${toStatus}'. Cibles autorisées: ${rule.allowedTargets.join(', ') || 'Aucune (état terminal)'}.`,
    };
  }

  // System & Admin have root override rights
  if (actorRole === 'SYSTEM' || actorRole === 'ADMIN') {
    return { valid: true };
  }

  if (!rule.authorizedRoles.includes(actorRole)) {
    return {
      valid: false,
      reason: `Le rôle '${actorRole}' n'a pas les droits pour passer l'état de '${fromStatus}' à '${toStatus}'.`,
    };
  }

  return { valid: true };
}

/**
 * Cancellation Policy & Evaluation
 */
export function evaluateCancellationPolicy(
  orderStatus: OrderStatus,
  requesterRole: ActorRole
): {
  allowedImmediately: boolean;
  requiresStoreApproval: boolean;
  requiresAdminIntervention: boolean;
  explanation: string;
} {
  switch (orderStatus) {
    case 'PENDING':
      return {
        allowedImmediately: true,
        requiresStoreApproval: false,
        requiresAdminIntervention: false,
        explanation: 'Annulation immédiate autorisée sans frais.',
      };
    case 'CONFIRMED':
      return {
        allowedImmediately: true,
        requiresStoreApproval: false,
        requiresAdminIntervention: false,
        explanation: requesterRole === 'CUSTOMER'
          ? 'Annulation client acceptée avant le lancement de la cuisine.'
          : 'Annulation autorisée par le commerçant ou le système.',
      };
    case 'PREPARING':
      return {
        allowedImmediately: requesterRole === 'MERCHANT' || requesterRole === 'ADMIN',
        requiresStoreApproval: requesterRole === 'CUSTOMER',
        requiresAdminIntervention: false,
        explanation: requesterRole === 'CUSTOMER'
          ? 'La cuisine a commencé. Une demande d\'annulation a été transmise au commerçant.'
          : 'Annulation confirmée par le commerce.',
      };
    case 'READY':
    case 'ASSIGNED':
    case 'PICKED_UP':
    case 'DELIVERING':
    case 'ARRIVED':
      return {
        allowedImmediately: requesterRole === 'ADMIN',
        requiresStoreApproval: false,
        requiresAdminIntervention: true,
        explanation: 'Colis déjà pris en charge par le livreur. Nécessite l\'arbitrage du dispatch central.',
      };
    default:
      return {
        allowedImmediately: false,
        requiresStoreApproval: false,
        requiresAdminIntervention: false,
        explanation: 'Statut terminal; aucune annulation possible.',
      };
  }
}
