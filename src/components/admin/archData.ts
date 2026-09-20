/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Architecture Review Report (Revision 2) & Target Architecture Data
 * Grounded in the C4 Architecture Audit & Remediation Guide
 */

export interface AuditFindingRev2 {
  id: string;
  category: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  group: 'REVISION_1' | 'NEW_FINDING' | 'OBSERVATION';
  problem: string;
  solution: string;
  enforcement: string;
  status: 'RESOLVED' | 'ENFORCED';
}

export interface EvolutionItem {
  component: string;
  currentRole: string;
  targetAction: string;
  layer: string;
  status: 'IMPLEMENTED' | 'ENFORCED';
}

export interface TargetFlowStep {
  step: number;
  title: string;
  actor: string;
  protocol: 'HTTPS' | 'WSS' | 'EVENT_BUS' | 'INTERNAL' | 'ACID_PG';
  description: string;
  from: string;
  to: string;
  stateTransition?: string;
  payloadPreview: string;
}

export interface RoadmapPhase {
  phase: number;
  name: string;
  targetHorizon: string;
  goals: string[];
  findingsClosed: string[];
  doneWhen: string[];
}

export interface ConnectionRecord {
  id: number;
  source: string;
  target: string;
  label: string;
  protocol: string;
  assessment: string;
  resolution: string;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  number: number;
  badge: string;
  components: {
    name: string;
    tech: string;
    role: string;
    protocol: string;
    security: string;
  }[];
}

/* =========================================================================
 * 1. 35 AUDIT FINDINGS (C1-L4, N1-N6, A1-A6)
 * ========================================================================= */

export const AUDIT_FINDINGS_REV2: AuditFindingRev2[] = [
  // --- NEW FINDINGS (N1 to N6) ---
  {
    id: 'N1',
    category: 'CRITICAL',
    title: 'Ecosystem Shell utilisé par tous les rôles avec transition d\'état directe',
    group: 'NEW_FINDING',
    problem: 'Le composant Ecosystem Shell possédait des arêtes directes vers Order Lifecycle, Firebase et Store Service. N\'importe quel acteur dans l\'application pouvait déclencher des transitions d\'état arbitraires sans contrôle RBAC côté serveur.',
    solution: 'L\'Ecosystem Shell est désormais restreint à un rôle d\'hôte UI pur (navigation, sessions, thème). Toutes les transitions d\'état passent obligatoirement par l\'API Gateway / BFF avec vérification stricte du jeton JWT et des claims de rôle.',
    enforcement: 'src/services/apiGateway.ts (authorize & requestOrderTransition)',
    status: 'ENFORCED',
  },
  {
    id: 'N2',
    category: 'CRITICAL',
    title: 'Deux chemins d\'écriture concurrents et persistance non garantie',
    group: 'NEW_FINDING',
    problem: 'Concurrence entre le chemin A (Order API via Merchant/Admin) et le chemin B (Shell via Order Lifecycle). Les clients écrivaient directement dans Firebase sans validation ACID, menant à des désynchronisations d\'état.',
    solution: 'Règle stricte du "Single Writer" : un Order Service unique (fusionnant Order API, Order Application et Order Lifecycle) est le seul et unique scripteur. Les écritures client dans Firebase sont éliminées ; Firebase devient une projection miroir en lecture seule alimentée par le serveur après commit ACID.',
    enforcement: 'src/services/apiGateway.ts & src/events/outboxEventBus.ts',
    status: 'ENFORCED',
  },
  {
    id: 'N3',
    category: 'CRITICAL',
    title: 'Domaine Commerce exécuté côté client sans frontière de confiance',
    group: 'NEW_FINDING',
    problem: 'La tarification, le panier et la soumission de paiement étaient exécutés dans le bundle client, violant la frontière de sécurité (possibilité pour un client malveillant d\'altérer les prix ou les frais de livraison).',
    solution: 'Frontière de confiance hermétique : le moteur de prix (pricingEngine.ts) est 100% autoritaire côté serveur. Le client transmet uniquement les IDs d\'articles et quantités ; le serveur recalcule et verrouille le sous-total, les frais de livraison, l\'emballage et les réductions.',
    enforcement: 'src/domain/pricingEngine.ts & src/services/apiGateway.ts',
    status: 'ENFORCED',
  },
  {
    id: 'N4',
    category: 'HIGH',
    title: 'Grand livre de fidélité persisté dans une base locale sans garantie',
    group: 'NEW_FINDING',
    problem: 'Le solde et l\'historique des points de fidélité étaient stockés dans le stockage local du navigateur (Local Database), vulnérable aux suppressions de cache, au rejeu et à la manipulation.',
    solution: 'Le grand livre de fidélité (Loyalty Ledger) est géré en append-only dans la base de données relationnelle serveur. Il est incrémenté de manière asynchrone par l\'événement "order.delivered" de l\'Outbox et réversible en cas de remboursement.',
    enforcement: 'src/events/outboxEventBus.ts & src/db/localDatabase.ts (dégradé en cache)',
    status: 'ENFORCED',
  },
  {
    id: 'N5',
    category: 'HIGH',
    title: 'Boucle de mission coursier à sens unique (sans acceptation ni déclinaison)',
    group: 'NEW_FINDING',
    problem: 'Le Realtime Service poussait des ordres aux coursiers mais il n\'existait aucun chemin en retour pour accepter, refuser, signaler l\'arrivée en boutique, la prise en charge ou la remise.',
    solution: 'Boucle bidirectionnelle complète : l\'API Gateway émet des baux d\'offre (TTL 60s) via le dispatch Go. L\'application coursier dispose des commandes : courierAcceptOffer, courierDeclineOffer et courierAdvanceStatus (PICKED_UP, DELIVERING, ARRIVED, DELIVERED).',
    enforcement: 'src/services/apiGateway.ts & src/components/CourierAppView.tsx',
    status: 'ENFORCED',
  },
  {
    id: 'N6',
    category: 'HIGH',
    title: 'Commerçant sans canal entrant temps réel ni gestion de catalogue',
    group: 'NEW_FINDING',
    problem: 'Le commerçant ne disposait que d\'une liaison sortante "gère les commandes" sans push d\'alerte entrant lors de nouvelles commandes et sans moyen de gérer les ruptures de stock ou temps de préparation.',
    solution: 'Canal entrant WebSocket dédié aux commandes du commerce avec sonnette d\'alerte et compte à rebours. Endpoints de gestion de catalogue intégrés (updateStoreItemAvailability, updateStorePrepTime) synchronisés en temps réel.',
    enforcement: 'src/services/apiGateway.ts (subscribeMerchantOrders) & src/components/MerchantAppView.tsx',
    status: 'ENFORCED',
  },

  // --- REVISION 1 FINDINGS (C1 to L4) ---
  {
    id: 'C1',
    category: 'CRITICAL',
    title: 'Portail Commerçant non connecté au flux de commandes',
    group: 'REVISION_1',
    problem: 'Le commerçant n\'avait aucun canal d\'écoute ni de transition autoritaire pour accepter ou préparer les commandes.',
    solution: 'Canal bidirectionnel complet via l\'API Gateway (subscribeMerchantOrders, updateOrderStatus, catalogue).',
    enforcement: 'src/services/apiGateway.ts',
    status: 'RESOLVED',
  },
  {
    id: 'C2',
    category: 'CRITICAL',
    title: 'Système de Dispatch non connecté aux coursiers',
    group: 'REVISION_1',
    problem: 'Le moteur de dispatch en Go générait des baux d\'offres dans le vide sans souscription coursier.',
    solution: 'Canal de push d\'offres avec expiration 60s et boutons interactifs d\'acceptation/refus dans l\'app coursier.',
    enforcement: 'src/components/CourierAppView.tsx & src/services/apiGateway.ts',
    status: 'RESOLVED',
  },
  {
    id: 'C3',
    category: 'CRITICAL',
    title: 'Console Administrateur isolée des opérations en direct',
    group: 'REVISION_1',
    problem: 'L\'administrateur ne pouvait ni surveiller la flotte ni réassigner de courses en cas de blocage.',
    solution: 'Onglet Architecture et Live Ops complet avec vue d\'ensemble, journal d\'audit et intervention d\'urgence.',
    enforcement: 'src/services/adminService.ts & src/components/admin/AdminArchitectureTab.tsx',
    status: 'RESOLVED',
  },
  {
    id: 'C4',
    category: 'CRITICAL',
    title: 'Paiements déclenchés directement depuis l\'écran client',
    group: 'REVISION_1',
    problem: 'L\'interface client appelait des SDK de paiement sans intent de paiement vérifié côté serveur.',
    solution: 'Création d\'intent de paiement sécurisée côté serveur, méthodes tokenisées et confirmation par webhook asynchrone.',
    enforcement: 'src/services/apiGateway.ts (confirmPaymentWebhook) & PaymentServiceRegistry',
    status: 'RESOLVED',
  },
  {
    id: 'C5',
    category: 'CRITICAL',
    title: 'Calcul de tarification vulnérable dans le code client',
    group: 'REVISION_1',
    problem: 'Le client calculait les totaux, remises et frais kilométriques de façon autonome.',
    solution: 'Moteur de tarification autoritaire côté serveur (pricingEngine.ts) garantissant l\'exactitude des calculs.',
    enforcement: 'src/domain/pricingEngine.ts',
    status: 'RESOLVED',
  },
  {
    id: 'C6',
    category: 'CRITICAL',
    title: 'Cycle de vie des commandes sans propriétaire unique',
    group: 'REVISION_1',
    problem: 'Multiples fichiers de transition d\'état dispersés sans persistance transactionnelle garantie.',
    solution: 'Machine à états unifiée dans OrderApplicationService avec table de transition validée et journal d\'audit.',
    enforcement: 'src/services/orderApplicationService.ts & src/domain/orderLifecycle.ts',
    status: 'RESOLVED',
  },
  {
    id: 'H1',
    category: 'HIGH',
    title: 'Application Client monolithique "God Client"',
    group: 'REVISION_1',
    problem: 'L\'application cliente contenait la logique métier, la persistance et le routage de messages.',
    solution: 'Remplacement par un API Gateway / BFF propre ; l\'app cliente ne fait que rendre les vues et envoyer des commandes.',
    enforcement: 'src/services/apiGateway.ts',
    status: 'RESOLVED',
  },
  {
    id: 'H2',
    category: 'HIGH',
    title: 'Couches de données superposées et conflictuelles',
    group: 'REVISION_1',
    problem: 'Coexistence confuse entre Local Database, Firestore et Prisma sans source de vérité claire.',
    solution: 'PostgreSQL désigné comme source de vérité unique, Redis pour le temps réel chaud, Firestore en miroir serveur.',
    enforcement: 'src/services/apiGateway.ts & outboxEventBus.ts',
    status: 'RESOLVED',
  },
  {
    id: 'H3',
    category: 'HIGH',
    title: 'Backend API était une impasse sans consommateurs',
    group: 'REVISION_1',
    problem: 'L\'API Backend figurait sur le diagramme mais était contournée par les applications clientes.',
    solution: 'Tous les clients consomment exclusivement les endpoints de l\'API Gateway / BFF.',
    enforcement: 'src/services/apiGateway.ts',
    status: 'RESOLVED',
  },
  {
    id: 'H4',
    category: 'HIGH',
    title: 'Fulfillment non relié au domaine Commerce',
    group: 'REVISION_1',
    problem: 'La préparation de commande ne déclenchait pas automatiquement la recherche de coursier.',
    solution: 'L\'événement "order.ready" déclenche immédiatement l\'algorithme de dispatch Go via l\'Outbox.',
    enforcement: 'src/services/apiGateway.ts',
    status: 'RESOLVED',
  },
  {
    id: 'H5',
    category: 'HIGH',
    title: 'Absence de chemin de suivi temps réel pour le client',
    group: 'REVISION_1',
    problem: 'Le client ne pouvait pas s\'abonner aux deltas de position GPS du coursier sans lire toute la commande.',
    solution: 'Canaux WebSocket par commande avec deltas légers (latitude, longitude, cap, vitesse, ETA restante).',
    enforcement: 'src/events/outboxEventBus.ts (emitCourierLocationDelta)',
    status: 'RESOLVED',
  },
  {
    id: 'H6',
    category: 'HIGH',
    title: 'Absence d\'authentification, d\'identité et de rôles (RBAC)',
    group: 'REVISION_1',
    problem: 'Aucune barrière de sécurité entre les rôles (client, commerçant, coursier, admin).',
    solution: 'Vérification stricte de session UserSession avec contrôle d\'accès basé sur les rôles sur chaque méthode.',
    enforcement: 'src/services/apiGateway.ts (authorize)',
    status: 'RESOLVED',
  },
  {
    id: 'M1',
    category: 'MEDIUM',
    title: 'Tournées groupées et Optimiseur d\'itinéraires orphelins',
    group: 'REVISION_1',
    problem: 'Les composants de batching n\'étaient pas intégrés dans le flux opérationnel.',
    solution: 'Intégration dans le sous-système de livraison Go et affichage contextuel dans l\'app coursier.',
    enforcement: 'src/components/CourierBatchRouteView.tsx & CourierAppView.tsx',
    status: 'RESOLVED',
  },
  {
    id: 'M2',
    category: 'MEDIUM',
    title: 'Noms de composants inconsistants et références de fichiers',
    group: 'REVISION_1',
    problem: 'Mélange de noms de fichiers et de concepts C4 abstraits créant de la confusion.',
    solution: 'Harmonisation rigoureuse selon le modèle C4 Container/Component dans tout le projet.',
    enforcement: 'src/services/orderApplicationService.ts',
    status: 'RESOLVED',
  },
  {
    id: 'M3',
    category: 'MEDIUM',
    title: 'Programme de fidélité couplé de manière synchrone',
    group: 'REVISION_1',
    problem: 'Le calcul de fidélité bloquait la finalisation de la commande.',
    solution: 'Découplage asynchrone via souscription d\'événement Outbox "order.delivered".',
    enforcement: 'src/events/outboxEventBus.ts',
    status: 'RESOLVED',
  },
  {
    id: 'M4',
    category: 'MEDIUM',
    title: 'Notifications floues et non orchestrées',
    group: 'REVISION_1',
    problem: 'Pas de service centralisé d\'envoi de notifications push ou SMS selon les statuts.',
    solution: 'Service de notification serveur piloté par les événements du bus de domaine.',
    enforcement: 'src/firebase/firebaseServices.ts',
    status: 'RESOLVED',
  },
  {
    id: 'M5',
    category: 'MEDIUM',
    title: 'Fournisseur de carte appelé directement par le client',
    group: 'REVISION_1',
    problem: 'Clés d\'API cartographiques exposées et calculs d\'itinéraires exécutés sur le téléphone.',
    solution: 'Calculs de distance et d\'ETA exécutés côté serveur dans le service Delivery ; client limité à l\'affichage des tuiles.',
    enforcement: 'src/domain/pricingEngine.ts (distance calculation)',
    status: 'RESOLVED',
  },
  {
    id: 'M6',
    category: 'MEDIUM',
    title: 'Frontière floue du Store Service',
    group: 'REVISION_1',
    problem: 'Le Store Service n\'avait pas de persistance dédiée pour les horaires et le catalogue.',
    solution: 'Endpoints d\'administration de catalogue avec mise à jour immédiate du cache de disponibilité.',
    enforcement: 'src/services/apiGateway.ts (updateStoreItemAvailability)',
    status: 'RESOLVED',
  },
  {
    id: 'L1',
    category: 'LOW',
    title: 'Absence de légende pour les types de liaisons',
    group: 'REVISION_1',
    problem: 'Les protocoles de communication n\'étaient pas différenciés visuellement.',
    solution: 'Légende explicite standardisée : HTTPS (commandes), WSS (temps réel), Event Bus (asynchrone), ACID PG (transactionnel).',
    enforcement: 'src/components/admin/AdminArchitectureTab.tsx',
    status: 'RESOLVED',
  },
  {
    id: 'L2',
    category: 'LOW',
    title: 'Lignes croisées et mise en page encombrée',
    group: 'REVISION_1',
    problem: 'Lignes traversant tout le diagramme sans ordre hiérarchique.',
    solution: 'Organisation en 7 couches distinctes de haut en bas sans enchevêtrement.',
    enforcement: 'Figure 2 Architecture Cible',
    status: 'RESOLVED',
  },
  {
    id: 'L3',
    category: 'LOW',
    title: 'Taille inconsistante des personas',
    group: 'REVISION_1',
    problem: 'Représentation asymétrique des clients, commerçants, coursiers et administrateurs.',
    solution: 'Normalisation visuelle des 4 personas dans la couche 1 Client.',
    enforcement: 'Figure 2 Architecture Cible',
    status: 'RESOLVED',
  },
  {
    id: 'L4',
    category: 'LOW',
    title: 'Absence de vue déploiement et stockage physique',
    group: 'REVISION_1',
    problem: 'Pas de distinction claire entre processus stateless, bases de données et brokers.',
    solution: 'Définition explicite des conteneurs d\'exécution et magasins de données (Postgres, Redis, Outbox).',
    enforcement: 'Figure 2 & Section 9.1',
    status: 'RESOLVED',
  },

  // --- ADDITIONAL OBSERVATIONS (A1 to A6) ---
  {
    id: 'A1',
    category: 'MEDIUM',
    title: 'Prisma est un ORM, pas un magasin de données physique',
    group: 'OBSERVATION',
    problem: 'Le diagramme labellisait "Prisma" comme base de données, masquant le véritable SGBD sous-jacent.',
    solution: 'PostgreSQL est explicitement documenté comme source de vérité ACID pour toutes les entités durables.',
    enforcement: 'src/components/admin/archData.ts',
    status: 'ENFORCED',
  },
  {
    id: 'A2',
    category: 'MEDIUM',
    title: 'Websocket Hub était une impasse contournée',
    group: 'OBSERVATION',
    problem: 'Le composant Websocket Hub n\'avait qu\'une arête d\'entrée et aucune diffusion vers les clients.',
    solution: 'Websocket Hub connecté à l\'ensemble des 4 applications (Client, Commerçant, Coursier, Admin) avec canaux par commande.',
    enforcement: 'src/services/apiGateway.ts & Figure 2',
    status: 'ENFORCED',
  },
  {
    id: 'A3',
    category: 'MEDIUM',
    title: 'Sous-système de Fulfillment déconnecté en interne',
    group: 'OBSERVATION',
    problem: 'Le suivi GPS, le moteur de dispatch et la persistance Redis ne communiquaient pas entre eux.',
    solution: 'Liaison directe : GPS Ingest met à jour l\'index spatial Redis, Dispatch lit la présence et assigne le meilleur coursier.',
    enforcement: 'src/services/apiGateway.ts (assignNearestCourierToGoDispatch)',
    status: 'ENFORCED',
  },
  {
    id: 'A4',
    category: 'MEDIUM',
    title: 'Écran UI (CheckoutScreen.tsx) positionné dans la couche Domaine',
    group: 'OBSERVATION',
    problem: 'Un fichier de présentation React était catégorisé comme composant de logique métier.',
    solution: 'Séparation stricte : CheckoutScreen.tsx est un composant de présentation client ; la logique d\'orchestration réside dans submitCheckout sur l\'API Gateway.',
    enforcement: 'src/components/CheckoutScreen.tsx & src/services/apiGateway.ts',
    status: 'ENFORCED',
  },
  {
    id: 'A5',
    category: 'LOW',
    title: 'Realtime Service était un orchestrateur omnipotent (God Object)',
    group: 'OBSERVATION',
    problem: 'Un service unique gérait le dispatch, les WebSockets, la télémétrie et la détection d\'anomalies.',
    solution: 'Découpage modulaire : Realtime Gateway (WSS), Dispatch Engine (Go), Location Tracking (Go) interconnectés via le bus d\'événements.',
    enforcement: 'Figure 2 Architecture Cible',
    status: 'ENFORCED',
  },
  {
    id: 'A6',
    category: 'LOW',
    title: 'Flux transversaux modélisés par de longues arêtes enveloppantes',
    group: 'OBSERVATION',
    problem: 'Les notifications et journaux d\'audit créaient des fils illisibles sur le schéma.',
    solution: 'Modélisation propre via Event Bus asynchrone (Transactional Outbox) et Service de Notifications découplé.',
    enforcement: 'src/events/outboxEventBus.ts & Figure 2',
    status: 'ENFORCED',
  },
];

/* =========================================================================
 * 2. EVOLUTION PATH OF 15 COMPONENTS (Section 9.2)
 * ========================================================================= */

export const EVOLUTION_PATH_ITEMS: EvolutionItem[] = [
  {
    component: 'Ecosystem Shell',
    currentRole: 'Hôte multi-rôles appelant directement le cycle de vie, Store Service et Firebase',
    targetAction: 'Restreint à l\'hébergement UI (navigation, sessions, thèmes). Appelle l\'API Gateway avec RBAC.',
    layer: 'Layer 1: Persona Clients',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Customer App',
    currentRole: 'God client hébergeant panier, checkout, tarification et suivi direct',
    targetAction: 'Client UI pur. Transmet des commandes HTTPS à l\'API Gateway et écoute WSS.',
    layer: 'Layer 1: Persona Clients',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Merchant Portal',
    currentRole: 'Vue isolée sans push d\'alerte entrant ni gestion de catalogue',
    targetAction: 'Connecté à l\'API Gateway : push entrant de commandes, gestion des stocks et temps de préparation.',
    layer: 'Layer 1: Persona Clients',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Courier App',
    currentRole: 'Écouteur passif sans actions en retour vers le dispatch',
    targetAction: 'Connecté à l\'API Gateway : baux d\'offres 60s, acceptation, refus, avancement du trajet.',
    layer: 'Layer 1: Persona Clients',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Admin Console',
    currentRole: 'Console isolée sans supervision des opérations ni journal d\'audit',
    targetAction: 'Supervision temps réel, inspection des baux de dispatch, surpassement d\'urgence et audit.',
    layer: 'Layer 1: Persona Clients',
    status: 'IMPLEMENTED',
  },
  {
    component: 'API Gateway / BFF',
    currentRole: 'Impasse non appelée par les clients dans le diagramme initial',
    targetAction: 'Point d\'entrée HTTPS unique pour toutes les commandes et requêtes, validant auth, RBAC et baux.',
    layer: 'Layer 2: Edge',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Order API / Lifecycle',
    currentRole: 'Trois composants éclatés (Order API, Order Application, Order Lifecycle) avec conflits d\'écriture',
    targetAction: 'Fusionnés en un Order Service unique, seul détenteur de la machine à états et scripteur PostgreSQL.',
    layer: 'Layer 3: Core Services',
    status: 'IMPLEMENTED',
  },
  {
    component: 'CheckoutScreen.tsx',
    currentRole: 'Écran UI positionné par erreur dans la couche Domaine',
    targetAction: 'Maintenu dans la couche présentation cliente ; orchestration confiée à submitCheckout côté serveur.',
    layer: 'Layer 1: Persona Clients',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Pricing Engine',
    currentRole: 'Calculs de prix et remises côté client',
    targetAction: 'Moteur 100% autoritaire côté serveur validant subtotaux, frais kilométriques et codes promo.',
    layer: 'Layer 3: Core Services',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Payment Processing',
    currentRole: 'Paiements initiés depuis l\'interface sans intent serveur',
    targetAction: 'Service serveur créant des intents sécurisés, méthodes tokenisées et confirmation webhook.',
    layer: 'Layer 3: Core Services',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Loyalty Ledger',
    currentRole: 'Persisté dans Local Database sans atomicité',
    targetAction: 'Grand livre append-only dans PostgreSQL, incrémenté de manière asynchrone par l\'Outbox.',
    layer: 'Layer 3: Core Services',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Dispatch Engine (Go)',
    currentRole: 'Générait des offres non connectées aux coursiers',
    targetAction: 'Service Go dédié émettant des offres avec baux 60s, sélectionnant les coursiers optimaux via Redis.',
    layer: 'Layer 4: Delivery Services',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Websocket Hub',
    currentRole: 'Impasse isolée sans diffusion client',
    targetAction: 'Passerelle temps réel diffusant les deltas de suivi aux 4 personas par canal de commande.',
    layer: 'Layer 2: Edge',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Prisma / Base de données',
    currentRole: 'Labellisé "Prisma" sans préciser le SGBD',
    targetAction: 'PostgreSQL explicite comme source de vérité durable ; Redis pour l\'état chaud des coursiers.',
    layer: 'Layer 6: Data & Storage',
    status: 'IMPLEMENTED',
  },
  {
    component: 'Firebase Firestore',
    currentRole: 'Écritures directes et concurrentes depuis les clients',
    targetAction: 'Projection miroir en lecture seule alimentée exclusivement par le serveur après commit ACID.',
    layer: 'Layer 6: Data & Storage',
    status: 'IMPLEMENTED',
  },
];

/* =========================================================================
 * 3. TARGET ORDER FLOW: 8 SEQUENTIAL STEPS (Section 9.3)
 * ========================================================================= */

export const TARGET_FLOW_STEPS: TargetFlowStep[] = [
  {
    step: 1,
    title: 'Quote Cart (Devis de panier)',
    actor: 'Client (Customer App)',
    protocol: 'HTTPS',
    from: 'Customer App',
    to: 'Pricing Service via API Gateway',
    description: 'Le client transmet les IDs d\'articles, quantités, adresse de livraison et code promo. Le Pricing Service calcule et retourne le devis verrouillé.',
    payloadPreview: '{ items: [{ id: "grill-mix", qty: 2 }], commune: "Ahmed Rachedi", voucher: "BIENVENUE" }',
  },
  {
    step: 2,
    title: 'Submit Order & Payment Intent',
    actor: 'Client (Customer App)',
    protocol: 'HTTPS',
    from: 'Customer App',
    to: 'API Gateway / BFF',
    stateTransition: 'Création -> PENDING',
    description: 'Le client valide le devis. L\'API Gateway valide l\'idempotence, réserve le paiement (ou COD) et appelle l\'Order Service dans une transaction unique.',
    payloadPreview: '{ quoteId: "q-4389", paymentMethod: "COD", idempotencyKey: "idem-8831" }',
  },
  {
    step: 3,
    title: 'Order Created & Merchant Notified',
    actor: 'Order Service & Notification Service',
    protocol: 'EVENT_BUS',
    from: 'Order Service (Outbox)',
    to: 'Merchant Portal via WebSocket',
    stateTransition: 'PENDING',
    description: 'L\'Order Service persiste la commande dans PostgreSQL et émet l\'événement "order.placed" dans l\'Outbox. Le WebSocket Hub pousse la commande sur la tablette du commerçant avec une sonnerie.',
    payloadPreview: 'event: order.placed { orderId: "ord-904", totalDZD: 1680, itemsCount: 3 }',
  },
  {
    step: 4,
    title: 'Merchant Confirms & Prepares',
    actor: 'Commerçant (Merchant Portal)',
    protocol: 'HTTPS',
    from: 'Merchant Portal',
    to: 'Order Service via API Gateway',
    stateTransition: 'PENDING -> CONFIRMED -> PREPARING',
    description: 'Le commerçant accepte la commande et indique le temps de cuisson estimé (ex. 15 min). La commande passe à PREPARING.',
    payloadPreview: '{ orderId: "ord-904", targetStatus: "PREPARING", estimatedPrepMin: 15 }',
  },
  {
    step: 5,
    title: 'Order Ready & Courier Dispatched',
    actor: 'Commerçant & Dispatch Engine (Go)',
    protocol: 'INTERNAL',
    from: 'Merchant Portal -> Order Service',
    to: 'Dispatch Engine (Go)',
    stateTransition: 'PREPARING -> READY -> ASSIGNED',
    description: 'Le commerçant clique "Prête". L\'événement "order.ready" est émis. Le Dispatch Engine Go interroge Redis pour identifier les coursiers disponibles à proximité et émet un bail d\'offre.',
    payloadPreview: '{ orderId: "ord-904", candidateCouriers: ["courier-walid-43"], leaseTimeoutSec: 60 }',
  },
  {
    step: 6,
    title: 'Courier Accepts & Picks Up',
    actor: 'Coursier (Courier App)',
    protocol: 'HTTPS',
    from: 'Courier App',
    to: 'API Gateway / Order Service',
    stateTransition: 'ASSIGNED -> PICKED_UP',
    description: 'Le coursier reçoit la notification, clique "Accepter" sous 60s, se rend en boutique et confirme la récupération de la commande.',
    payloadPreview: '{ offerId: "off-771", courierId: "courier-walid-43", targetStatus: "PICKED_UP" }',
  },
  {
    step: 7,
    title: 'En Route & Live Tracking',
    actor: 'Coursier & Realtime Gateway',
    protocol: 'WSS',
    from: 'Courier App GPS',
    to: 'Customer App & Admin Console',
    stateTransition: 'DELIVERING -> ARRIVED',
    description: 'L\'app coursier émet des deltas GPS légers toutes les 5s. Le WebSocket Hub les diffuse sur le canal de commande du client avec mise à jour fluide de l\'ETA.',
    payloadPreview: 'delta: { orderId: "ord-904", lat: 36.4528, lng: 6.2675, heading: 42, etaMin: 6 }',
  },
  {
    step: 8,
    title: 'Delivery & Payment Collected',
    actor: 'Coursier & Order Service',
    protocol: 'HTTPS',
    from: 'Courier App',
    to: 'Order Service via API Gateway',
    stateTransition: 'ARRIVED -> DELIVERED',
    description: 'Le coursier remet la commande, encaisse le montant COD et valide la livraison. L\'Outbox émet "order.delivered", crédite les points de fidélité et notifie le client.',
    payloadPreview: '{ orderId: "ord-904", paymentStatus: "COLLECTED", proofNote: "Remis en main propre" }',
  },
];

/* =========================================================================
 * 4. PRIORITISED ROADMAP: 5 PHASES (Section 11)
 * ========================================================================= */

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 0,
    name: 'Sécurité et Frontière de Confiance',
    targetHorizon: 'Semaine 1 (Immédiat)',
    goals: [
      'Établir la frontière de confiance hermétique : interdire tout calcul ou décision d\'état par le client.',
      'Désactiver les écritures directes du Shell vers les services de domaine.',
      'Exiger l\'authentification JWT et la validation RBAC sur tous les appels d\'API.',
      'Sécuriser les intents de paiement côté serveur exclusivement.',
    ],
    findingsClosed: ['N1', 'N3', 'H6', 'C4'],
    doneWhen: [
      'Un appel API non authentifié ou avec un rôle inadéquat retourne HTTP 403 Forbidden.',
      'Une tentative de modification de prix dans le payload client est rejetée et le prix recalculé par le serveur est appliqué.',
      'Aucun SDK de paiement externe n\'est contacté sans intent préalablement créé côté serveur.',
    ],
  },
  {
    phase: 1,
    name: 'Intégrité des Commandes & Single Writer',
    targetHorizon: 'Semaine 2',
    goals: [
      'Fusionner Order API, Order Application et Order Lifecycle en un Order Service unique.',
      'Faire de l\'Order Service le scripteur unique de toute transition d\'état dans PostgreSQL.',
      'Supprimer toute écriture directe des clients dans Firebase Firestore.',
      'Activer le pattern Transactional Outbox pour découpler la persistance des événements.',
    ],
    findingsClosed: ['N2', 'C6', 'C5', 'M2'],
    doneWhen: [
      'Toutes les transitions d\'état passent par orderApplicationService.transitionOrder().',
      'Une transition interdite par la matrice d\'états retourne une erreur explicite sans modifier la base.',
      'Chaque transition validée insère un enregistrement PENDING dans la file Outbox et le diffuse aux écouteurs.',
    ],
  },
  {
    phase: 2,
    name: 'Boucles Opérationnelles Coursier & Commerçant',
    targetHorizon: 'Semaine 3',
    goals: [
      'Implémenter la boucle de mission coursier bidirectionnelle (baux 60s, acceptation, refus, avancement de course).',
      'Créer le canal entrant WebSocket pour le commerçant avec alertes sonores et visuelles.',
      'Fournir les endpoints de gestion de catalogue commerçant (disponibilité, ruptures de stock, délais).',
      'Lier le déclenchement du dispatch Go à l\'événement "order.ready".',
    ],
    findingsClosed: ['N5', 'N6', 'C1', 'C2', 'H4'],
    doneWhen: [
      'Une commande marquée "Prête" génère une offre d\'assignation visible immédiatement dans l\'app coursier.',
      'Le coursier peut accepter ou refuser l\'offre, et le statut se met à jour en direct pour le commerçant et le client.',
      'Le commerçant peut marquer un article en rupture de stock et le changement est répercuté instantanément sur le catalogue.',
    ],
  },
  {
    phase: 3,
    name: 'Consolidation des Données et du Temps Réel',
    targetHorizon: 'Semaine 4',
    goals: [
      'Établir PostgreSQL comme source de vérité unique pour toutes les entités durables.',
      'Déplacer le grand livre de fidélité dans PostgreSQL sous forme append-only.',
      'Connecter le WebSocket Hub aux 4 applications clientes avec canaux dédiés par commande.',
      'Structurer les deltas télématiques légers (GPS, cap, vitesse, ETA) sans transfert d\'arbre complet.',
    ],
    findingsClosed: ['H2', 'N4', 'H5', 'A1', 'A2', 'A3'],
    doneWhen: [
      'Le grand livre de fidélité est mis à jour asynchroniquement lors de l\'événement order.delivered.',
      'Le client reçoit des deltas GPS fluides sur WebSocket sans rechargement de page ni surconsommation de bande passante.',
      'Firebase fonctionne exclusivement en miroir de lecture asynchrone alimenté par le serveur.',
    ],
  },
  {
    phase: 4,
    name: 'Observabilité, Finitions & Déploiement',
    targetHorizon: 'Semaine 5',
    goals: [
      'Connecter la Console Administrateur aux métriques temps réel et aux actions d\'urgence.',
      'Standardiser le service de notifications push multi-canaux (FCM, SMS, email).',
      'Documenter l\'architecture de déploiement conteneurisée et les protocoles réseau.',
      'Finaliser la normalisation C4 du diagramme avec légende normalisée et séparation stricte des couches.',
    ],
    findingsClosed: ['C3', 'M4', 'M5', 'M6', 'L1', 'L2', 'L3', 'L4', 'A4', 'A5', 'A6'],
    doneWhen: [
      'L\'administrateur peut visualiser toutes les commandes en cours, l\'état de la file Outbox et le journal d\'audit.',
      'Les notifications push sont générées avec succès pour tous les changements d\'état majeurs.',
      'Le diagramme de la Figure 2 reflète avec exactitude l\'intégralité des 7 couches implémentées.',
    ],
  },
];

/* =========================================================================
 * 5. CONNECTION INVENTORY: 30 CONNECTIONS (Appendix A)
 * ========================================================================= */

export const CONNECTION_INVENTORY: ConnectionRecord[] = [
  { id: 1, source: 'Customer App', target: 'API Gateway / BFF', label: 'Commandes & requêtes panier/checkout', protocol: 'HTTPS', assessment: 'Valide et obligatoire', resolution: 'Point d\'entrée unique' },
  { id: 2, source: 'Customer App', target: 'WebSocket Hub', label: 'Souscription suivi commande en direct', protocol: 'WSS', assessment: 'Était manquant (H5)', resolution: 'Canal par commande activé' },
  { id: 3, source: 'Courier App', target: 'API Gateway / BFF', label: 'Acceptation, refus, statut de course', protocol: 'HTTPS', assessment: 'Était manquant (N5, C2)', resolution: 'Boucle bidirectionnelle complétée' },
  { id: 4, source: 'Courier App', target: 'Delivery / Location Tracking', label: 'Émission télémétrie GPS continue', protocol: 'HTTPS / WSS', assessment: 'Valide', resolution: 'Deltas légers toutes les 5s' },
  { id: 5, source: 'Merchant Portal', target: 'API Gateway / BFF', label: 'Acceptation, préparation, catalogue', protocol: 'HTTPS', assessment: 'Était partiel (N6, C1)', resolution: 'Endpoints catalogue & statut connectés' },
  { id: 6, source: 'Merchant Portal', target: 'WebSocket Hub', label: 'Alertes commandes entrantes', protocol: 'WSS', assessment: 'Était manquant (N6)', resolution: 'Push entrant avec sonnette' },
  { id: 7, source: 'Admin App', target: 'API Gateway / BFF', label: 'Supervision, réassignation, audit', protocol: 'HTTPS', assessment: 'Était isolé (C3)', resolution: 'Endpoints d\'administration intégrés' },
  { id: 8, source: 'Admin App', target: 'WebSocket Hub', label: 'Surveillance de la flotte temps réel', protocol: 'WSS', assessment: 'Valide', resolution: 'Flux d\'événements global' },
  { id: 9, source: 'API Gateway / BFF', target: 'Order Service', label: 'Création & transition de commande', protocol: 'Interne', assessment: 'Valide (N2)', resolution: 'Appels de service autoritaires' },
  { id: 10, source: 'API Gateway / BFF', target: 'Pricing Service', label: 'Calcul devis panier verrouillé', protocol: 'Interne', assessment: 'Valide (N3, C5)', resolution: 'Tarification autoritaire 100%' },
  { id: 11, source: 'API Gateway / BFF', target: 'Payment Service', label: 'Création intent & capture', protocol: 'Interne', assessment: 'Valide (C4)', resolution: 'Méthodes tokenisées' },
  { id: 12, source: 'API Gateway / BFF', target: 'Catalog & Store Service', label: 'Consultation & stock', protocol: 'Interne', assessment: 'Valide (M6)', resolution: 'Gestion dynamique' },
  { id: 13, source: 'Order Service', target: 'PostgreSQL Database', label: 'Persistance ACID transactions', protocol: 'ACID PG', assessment: 'Valide (N2, H2)', resolution: 'Source de vérité unique' },
  { id: 14, source: 'Order Service', target: 'Transactional Outbox', label: 'Écriture atomique des événements', protocol: 'ACID PG', assessment: 'Valide (#15)', resolution: 'Découplage transactionnel garanti' },
  { id: 15, source: 'Transactional Outbox', target: 'Event Bus', label: 'Dépilement des événements PENDING', protocol: 'Asynchrone', assessment: 'Valide', resolution: 'Worker d\'arrière-plan résilient' },
  { id: 16, source: 'Event Bus', target: 'Dispatch Engine (Go)', label: 'Événement "order.ready"', protocol: 'Event Bus', assessment: 'Valide (H4)', resolution: 'Déclenchement automatique' },
  { id: 17, source: 'Event Bus', target: 'Notification Service', label: 'Événements majeurs de commande', protocol: 'Event Bus', assessment: 'Valide (M4)', resolution: 'Push multi-destinataires' },
  { id: 18, source: 'Event Bus', target: 'Loyalty Service', label: 'Événement "order.delivered"', protocol: 'Event Bus', assessment: 'Valide (N4, M3)', resolution: 'Crédit asynchrone sécurisé' },
  { id: 19, source: 'Dispatch Engine (Go)', target: 'Redis', label: 'Lecture géolocalisation & présence coursiers', protocol: 'Redis', assessment: 'Valide (A3)', resolution: 'Index spatial GEOSEARCH' },
  { id: 20, source: 'Location Tracking (Go)', target: 'Redis', label: 'Écriture positions GPS temps réel', protocol: 'Redis', assessment: 'Valide (A3)', resolution: 'Mise à jour à haute fréquence' },
  { id: 21, source: 'Dispatch Engine (Go)', target: 'Order Service', label: 'Assignation du coursier retenu', protocol: 'Interne', assessment: 'Valide (C2)', resolution: 'Transition vers ASSIGNED' },
  { id: 22, source: 'Dispatch Engine (Go)', target: 'WebSocket Hub', label: 'Émission du bail d\'offre (TTL 60s)', protocol: 'Interne', assessment: 'Valide (N5)', resolution: 'Alerte coursier ciblé' },
  { id: 23, source: 'Location Tracking (Go)', target: 'WebSocket Hub', label: 'Diffusion deltas GPS aux abonnés', protocol: 'Interne', assessment: 'Valide (H5, A2)', resolution: 'Fan-out instantané' },
  { id: 24, source: 'Payment Service', target: 'Payment Provider (Stripe/Satim)', label: 'Appels API sécurisés tokenisés', protocol: 'HTTPS', assessment: 'Valide (C4)', resolution: 'Secret gardé sur le serveur' },
  { id: 25, source: 'Payment Provider', target: 'API Gateway / BFF', label: 'Webhooks asynchrones de paiement', protocol: 'HTTPS Webhook', assessment: 'Valide (C4)', resolution: 'Confirmation vérifiée' },
  { id: 26, source: 'Notification Service', target: 'FCM / APNs / SMS Gateway', label: 'Envoi notifications push & SMS', protocol: 'HTTPS', assessment: 'Valide (M4)', resolution: 'Services natifs' },
  { id: 27, source: 'Delivery Services (Go)', target: 'Map Provider (Google Maps)', label: 'Géocodage, matrices de distance, ETA', protocol: 'HTTPS', assessment: 'Valide (M5)', resolution: 'Appels serveur protégés' },
  { id: 28, source: 'Event Bus', target: 'Firebase Firestore', label: 'Projection miroir lecture seule', protocol: 'Asynchrone', assessment: 'Valide (N2)', resolution: 'Écritures serveur uniquement' },
  { id: 29, source: 'Identity Service', target: 'API Gateway / BFF', label: 'Validation des jetons et claims de rôle', protocol: 'Interne', assessment: 'Valide (H6)', resolution: 'Contrôle RBAC universel' },
  { id: 30, source: 'Admin Console', target: 'Audit Trail Service', label: 'Lecture des logs d\'audit immuables', protocol: 'HTTPS', assessment: 'Valide (C3)', resolution: 'Historique exhaustif' },
];

/* =========================================================================
 * 6. FIGURE 2 RECOMMENDED ARCHITECTURE LAYERS
 * ========================================================================= */

export const FIGURE_2_LAYERS: ArchitectureLayer[] = [
  {
    id: 'layer-1',
    name: 'Layer 1: Persona Clients (Frontends)',
    number: 1,
    badge: 'Clients Légers Découplés',
    components: [
      { name: 'Customer App', tech: 'React / Vite (Mobile & Web)', role: 'Découverte, panier, commande, suivi en direct', protocol: 'HTTPS / WSS vers Gateway', security: 'Session JWT Client' },
      { name: 'Courier App', tech: 'React / PWA (Mobile)', role: 'Baux de livraison 60s, navigation, confirmation', protocol: 'HTTPS / WSS vers Gateway', security: 'Session JWT Coursier' },
      { name: 'Merchant Portal', tech: 'React / Web (Tablette & PC)', role: 'Commandes cuisine, temps de prep, gestion stock', protocol: 'HTTPS / WSS vers Gateway', security: 'Session JWT Commerçant' },
      { name: 'Admin Console', tech: 'React / Web (Desktop sécurisé)', role: 'Supervision live, flotte, réassignation, audit', protocol: 'HTTPS / WSS vers Gateway', security: 'Session JWT Admin + MFA' },
    ],
  },
  {
    id: 'layer-2',
    name: 'Layer 2: Edge & Ingress Layer',
    number: 2,
    badge: 'Frontière de Sécurité Hermétique',
    components: [
      { name: 'API Gateway / BFF', tech: 'Node.js / Express', role: 'Point d\'entrée unique HTTPS, rate limiting, RBAC, routage', protocol: 'HTTPS vers micro-services', security: 'Validation JWT & Claims' },
      { name: 'Realtime Gateway (WebSocket Hub)', tech: 'Node.js / ws', role: 'Canaux de suivi par commande, diffusion deltas GPS', protocol: 'WSS bidirectionnel', security: 'Token handshake' },
      { name: 'Identity & Access (RBAC)', tech: 'Firebase Auth / OIDC', role: 'Authentification, émission des jetons, gestion des rôles', protocol: 'OIDC / JWT standard', security: 'Claims cryptographiques' },
    ],
  },
  {
    id: 'layer-3',
    name: 'Layer 3: Core Domain Services (TypeScript)',
    number: 3,
    badge: 'Cœur Métier & Machine à États',
    components: [
      { name: 'Order Service (Single Writer)', tech: 'TypeScript / Domain Driven', role: 'Machine à états autoritaire, persistance des commandes', protocol: 'Transactionnel ACID', security: 'Seul scripteur de commandes' },
      { name: 'Pricing Service', tech: 'TypeScript Engine', role: 'Tarification autoritaire 100%, devis garantis, remises', protocol: 'Invocations internes', security: 'Zéro calcul client toléré' },
      { name: 'Payment Service', tech: 'TypeScript / Payment Registry', role: 'Gestion des intents, validation COD, webhooks sécurisés', protocol: 'HTTPS vers banques/Stripe', security: 'Secrets gardés sur serveur' },
      { name: 'Catalog & Store Service', tech: 'TypeScript Service', role: 'Gestion des menus, stocks en temps réel, horaires', protocol: 'Interne / Cache mémoire', security: 'Écriture commerçant vérifiée' },
      { name: 'Loyalty Service', tech: 'TypeScript Service', role: 'Grand livre append-only, calcul des points, remises', protocol: 'Consommateur Outbox', security: 'Incrémentation asynchrone' },
      { name: 'Notification Service', tech: 'TypeScript Service', role: 'Push FCM, SMS et emails pilotés par événements', protocol: 'Consommateur Outbox', security: 'Templates centralisés' },
    ],
  },
  {
    id: 'layer-4',
    name: 'Layer 4: Delivery Services (Go Subsystem)',
    number: 4,
    badge: 'Sous-système Haute Performance Go',
    components: [
      { name: 'Dispatch Engine', tech: 'Go (Golang)', role: 'Algorithme d\'attribution, baux 60s, calcul d\'affinité', protocol: 'Interne Go / Redis', security: 'Gestion des baux concurrents' },
      { name: 'Location Tracking', tech: 'Go (Golang)', role: 'Ingestion GPS haute fréquence, lissage de trajectoire', protocol: 'WSS / Redis spatial', security: 'Vérification signature GPS' },
      { name: 'ETA & Routing', tech: 'Go (Golang)', role: 'Calcul des temps de parcours, matrice de distance', protocol: 'HTTPS vers Google Maps', security: 'Quotas et mise en cache' },
      { name: 'Batch Delivery Optimizer', tech: 'Go (Golang)', role: 'Regroupement intelligent des courses par corridor', protocol: 'Interne Go', security: 'Seuils d\'optimisation stricts' },
    ],
  },
  {
    id: 'layer-5',
    name: 'Layer 5: Event Bus & Transactional Outbox',
    number: 5,
    badge: 'Découplage Événementiel & Atomicité',
    components: [
      { name: 'Transactional Outbox Queue', tech: 'PostgreSQL Table + Worker', role: 'Écriture atomique avec la commande, tolérance aux pannes', protocol: 'ACID Transactions', security: 'Zéro perte de message' },
      { name: 'Domain Event Bus', tech: 'Kafka / NATS / EventBus', role: 'Diffusion asynchrone des événements de domaine aux abonnés', protocol: 'Pub/Sub persistant', security: 'Garantie At-Least-Once' },
    ],
  },
  {
    id: 'layer-6',
    name: 'Layer 6: Data & Storage Layer',
    number: 6,
    badge: 'Persistance & Source de Vérité',
    components: [
      { name: 'PostgreSQL Database', tech: 'PostgreSQL 16', role: 'Source de vérité unique (Commandes, Utilisateurs, Menus, Ledger)', protocol: 'SQL relationnel ACID', security: 'Chiffrement repos + transit' },
      { name: 'Redis In-Memory Store', tech: 'Redis 7 (Cluster)', role: 'Index spatial des coursiers, cache chaud, verrous distribués', protocol: 'RESP protocol', security: 'Accès réseau interne privé' },
      { name: 'Firebase Firestore (Optionnel)', tech: 'Cloud Firestore', role: 'Projection miroir temps réel en lecture seule pour clients', protocol: 'SDK Firebase Read-Only', security: 'Règles interdisant l\'écriture' },
    ],
  },
  {
    id: 'layer-7',
    name: 'Layer 7: Cross-Cutting & Observability',
    number: 7,
    badge: 'Observabilité, Audit & Gouvernance',
    components: [
      { name: 'Structured Logging & Tracing', tech: 'OpenTelemetry / Winston', role: 'Traçabilité de bout en bout avec correlation IDs', protocol: 'gRPC / OTLP', security: 'Anonymisation des données PII' },
      { name: 'Live Metrics & Alerting', tech: 'Prometheus / Grafana', role: 'Surveillance latence, SLA de livraison, taux d\'erreur', protocol: 'Pull metrics', security: 'Alertes pagerDuty' },
      { name: 'Immutable Audit Log', tech: 'PostgreSQL Append-Only', role: 'Journal certifié de toutes les transitions et actions admin', protocol: 'Append-only SQL', security: 'Non modifiable' },
    ],
  },
];
