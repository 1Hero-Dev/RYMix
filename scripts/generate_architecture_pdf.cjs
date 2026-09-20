const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(__dirname, '../public/rym_architecture_system_diagram.pdf');

// Ensure destination directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
  bufferPages: true,
  autoFirstPage: true,
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Colors
const TEAL_DARK = '#071E26';
const TEAL_CARD = '#0D333F';
const TEAL_BORDER = '#1B4D5C';
const AMBER_GOLD = '#D9943B';
const EMERALD_GREEN = '#00B578';
const EMERALD_DARK = '#053828';
const CORAL_ACCENT = '#E5534B';
const TEXT_MUTED = '#6B7280';
const TEXT_MAIN = '#111827';
const BG_PAGE = '#F9FAFB';
const BG_CARD_LIGHT = '#FFFFFF';

function drawHeader(title, subtitle, pageNum, totalPages = 4) {
  // Top Banner
  doc.rect(40, 30, 515, 42).fill(TEAL_DARK);
  
  // Gold accent bar
  doc.rect(40, 72, 515, 3).fill(AMBER_GOLD);

  // Logo & App Name
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text('RYM LIVRAISON', 52, 40);
  doc.fillColor(AMBER_GOLD).font('Helvetica').fontSize(9).text('Ahmed Rachedi - Wilaya 43 de Mila (Algérie)', 52, 56);

  // Document Title & Page
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text(title, 260, 40, { align: 'right', width: 280 });
  doc.fillColor('#9CA3AF').font('Helvetica').fontSize(8).text(`${subtitle} | Page ${pageNum}/${totalPages}`, 260, 56, { align: 'right', width: 280 });
}

function drawFooter(pageNum, totalPages = 4) {
  doc.rect(40, 785, 515, 1).fill('#E5E7EB');
  doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(7.5)
    .text('RYM Platform Specifications - Architecture C4 / DDD / Offline-First Resilience - Confidentiel & Operationnel', 40, 793, { width: 400 });
  doc.fillColor(AMBER_GOLD).font('Helvetica-Bold').fontSize(7.5)
    .text(`Documentation Technique v2.4`, 440, 793, { align: 'right', width: 115 });
}

// ============================================================================
// PAGE 1: VUE D'ENSEMBLE & TOPOLOGIE SYSTÈME (C4 NIVEAU 2)
// ============================================================================

drawHeader('TOPOLOGIE SYSTÈME & PORTEFEUILLE ACTEURS', 'Architecture C4 Conteneurs', 1);

let y = 90;

// Intro block
doc.rect(40, y, 515, 38).fillAndStroke('#F0FDF4', '#86EFAC');
doc.fillColor('#166534').font('Helvetica-Bold').fontSize(10).text('SYNTHÈSE DE LA SOLUTION HYPERLOCALE', 52, y + 8);
doc.fillColor('#374151').font('Helvetica').fontSize(8).text(
  'Architecture distribuée multi-portails adaptée aux contraintes réseau d\'Algérie (3G/4G instable). ' +
  'Single-Writer pattern sur Firestore avec réconciliation locale IndexedDB et fallback GSM SMS autonome.',
  52, y + 21, { width: 495 }
);

y += 50;

// Section Title
doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(12).text('1. Portails Frontaux & Personas Acteurs', 40, y);
doc.rect(40, y + 15, 180, 2).fill(AMBER_GOLD);

y += 24;

// 4 Actor Cards
const actors = [
  {
    role: 'Client (Consumer)',
    tech: 'React 18 PWA Mobile',
    color: '#0284C7',
    bg: '#E0F2FE',
    desc: 'Catalogue commerçants, panier, géoloc Mila, suivi temps réel, fidélité & avis.'
  },
  {
    role: 'Commerçant (Merchant POS)',
    tech: 'Web POS Cuisine / Tablettes',
    color: '#D97706',
    bg: '#FEF3C7',
    desc: 'Alertes commandes sonores, gestion stocks, validation temps préparation.'
  },
  {
    role: 'Livreur (Courier GPS)',
    tech: 'PWA Mobile Haute Mobilité',
    color: '#059669',
    bg: '#D1FAE5',
    desc: 'Radar missions, navigation Leaflet/OSM, scanner QR code retrait/livraison, COD.'
  },
  {
    role: 'Superviseur (Admin Ops)',
    tech: 'Console Desktop Super Admin',
    color: '#7C3AED',
    bg: '#EDE9FE',
    desc: 'Dispatching manuel, compensation litiges, clôture caisse COD, monitoring GSM.'
  }
];

actors.forEach((act, idx) => {
  const xBox = 40 + (idx % 2) * 262;
  const yBox = y + Math.floor(idx / 2) * 62;
  
  doc.rect(xBox, yBox, 252, 54).fillAndStroke(act.bg, act.color);
  doc.fillColor(act.color).font('Helvetica-Bold').fontSize(9.5).text(act.role, xBox + 10, yBox + 7);
  doc.fillColor('#6B7280').font('Helvetica-Bold').fontSize(7.5).text(`[ ${act.tech} ]`, xBox + 10, yBox + 20);
  doc.fillColor('#374151').font('Helvetica').fontSize(7.5).text(act.desc, xBox + 10, yBox + 31, { width: 232 });
});

y += 135;

// Backend & Gateway Diagram Box
doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(12).text('2. Cœur Applicatif & Couche d\'Orchestration (BFF / API Gateway)', 40, y);
doc.rect(40, y + 15, 320, 2).fill(AMBER_GOLD);

y += 24;

// Central Gateway Box
doc.rect(40, y, 515, 95).fillAndStroke('#0A2B35', AMBER_GOLD);
doc.fillColor('#F9FAFB').font('Helvetica-Bold').fontSize(11).text('GATEWAY CENTRALISÉE / BFF RYM (Express.js + Vite)', 55, y + 10);
doc.fillColor(AMBER_GOLD).font('Helvetica').fontSize(8).text('Orchestration métier, protection des secrets, validation Single-Writer & Anti-Tamper', 55, y + 24);

// Inside Gateway: 3 sub-modules
const gwModules = [
  { title: 'Contrôleur RBAC & Auth', sub: 'Validation tokens Firebase, contrôle d\'accès par rôle (Customer, Courier, Merchant, Admin)' },
  { title: 'State Machine Engine', sub: 'Transitions autorisées strictes, intégrité des horodatages et signatures QR de retrait' },
  { title: 'Gestionnaire Télémétrie & Logs', sub: 'Surveillance état réseau 3G/4G, logs d\'erreurs, audit trail des encaissements COD' }
];

gwModules.forEach((m, idx) => {
  const gx = 55 + idx * 163;
  doc.rect(gx, y + 38, 155, 48).fillAndStroke('#114250', '#2563EB');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8).text(m.title, gx + 6, y + 44, { width: 143 });
  doc.fillColor('#D1D5DB').font('Helvetica').fontSize(6.5).text(m.sub, gx + 6, y + 56, { width: 143 });
});

y += 110;

// Section 3: Data & Integrations
doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(12).text('3. Persistance & Passerelles Externes', 40, y);
doc.rect(40, y + 15, 200, 2).fill(AMBER_GOLD);

y += 24;

const extServices = [
  {
    name: 'Google Cloud Firestore',
    type: 'Persistance Cloud Temps Réel',
    color: '#D97706',
    items: ['Collections users, orders, stores, reviews', 'Snapshot listeners pour push temps réel', 'Règles de sécurité firestore.rules strictes']
  },
  {
    name: 'Passerelle HTTP-SMS (Open-Source)',
    type: 'Notification GSM Locale (Algérie)',
    color: '#059669',
    items: ['Modem GSM / Téléphone passerelle Android local', 'Délivrance garantie même sans connexion Internet', 'Alertes critiques commerçants & code OTP client']
  },
  {
    name: 'Leaflet / OpenStreetMap & Gemini AI',
    type: 'Cartographie & IA Recommandations',
    color: '#2563EB',
    items: ['Tracés GPS et points repères Mila sans frais Google Maps', 'Moteur de suggestions et analyse d\'avis par Gemini AI', 'Mode hors-ligne avec tuiles préchargées']
  }
];

extServices.forEach((srv, idx) => {
  const sx = 40 + idx * 175;
  doc.rect(sx, y, 168, 85).fillAndStroke('#FFFFFF', '#D1D5DB');
  doc.rect(sx, y, 168, 18).fill(srv.color);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5).text(srv.name, sx + 6, y + 4, { width: 156 });
  doc.fillColor('#4B5563').font('Helvetica-Oblique').fontSize(6.5).text(srv.type, sx + 6, y + 22);

  srv.items.forEach((it, itIdx) => {
    doc.fillColor('#1F2937').font('Helvetica').fontSize(6.5).text(`* ${it}`, sx + 6, y + 34 + itIdx * 15, { width: 156 });
  });
});

// Summary note
doc.rect(40, y + 96, 515, 28).fillAndStroke('#FEF3C7', AMBER_GOLD);
doc.fillColor('#92400E').font('Helvetica-Bold').fontSize(7.5)
  .text('POINT CLÉ D\'ARCHITECTURE : ', 50, y + 102, { continued: true })
  .font('Helvetica').text('Tous les terminaux fonctionnent sur une base locale Dexie (IndexedDB) avec file d\'attente Outbox synchronisée de manière asynchrone dès rétablissement du réseau.');

drawFooter(1);

// ============================================================================
// PAGE 2: MACHINE À ÉTATS & FLUX DES COMMANDES (ORDER STATE LIFECYCLE)
// ============================================================================

doc.addPage();
drawHeader('CYCLE DE VIE DES COMMANDES & RÈGLES D\'AUTORISATION', 'Machine à États Strictes (DDD)', 2);

y = 90;

doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(11).text('MACHINE À ÉTATS UNIDIRECTIONNELLE STRICTE', 40, y);
doc.fillColor(TEXT_MUTED).font('Helvetica').fontSize(8).text(
  'Chaque commande transite obligatoirement par ces statuts normalisés. Toute régression de statut est rejetée par le backend.',
  40, y + 14
);

y += 32;

const states = [
  {
    code: 'PENDING',
    label: '1. En attente',
    actor: 'Client',
    actorColor: '#0284C7',
    trigger: 'Validation du panier',
    action: 'Création document Firestore, alerte sonore POS restaurant.'
  },
  {
    code: 'ACCEPTED',
    label: '2. Acceptée',
    actor: 'Commerçant',
    actorColor: '#D97706',
    trigger: 'Confirmation restaurant',
    action: 'Estimation délai préparation (ex: 20 min), notif push au client.'
  },
  {
    code: 'PREPARING',
    label: '3. En préparation',
    actor: 'Commerçant',
    actorColor: '#D97706',
    trigger: 'Lancement en cuisine',
    action: 'Diffusion de la course sur le radar des livreurs disponibles.'
  },
  {
    code: 'READY_FOR_PICKUP',
    label: '4. Prête au retrait',
    actor: 'Commerçant',
    actorColor: '#D97706',
    trigger: 'Commande emballée',
    action: 'Génération du QR Code commerçant pour remise sécurisée.'
  },
  {
    code: 'DISPATCHED',
    label: '5. Livreur Assigné',
    actor: 'Livreur / Admin',
    actorColor: '#059669',
    trigger: 'Livreur accepte la course',
    action: 'Itinéraire GPS vers le restaurant, temps d\'arrivée estimé.'
  },
  {
    code: 'IN_TRANSIT',
    label: '6. En cours de livraison',
    actor: 'Livreur',
    actorColor: '#059669',
    trigger: 'Scan QR retrait validé',
    action: 'Téléguidage vers l\'adresse client (Mila), appel vocal / SMS.'
  },
  {
    code: 'DELIVERED',
    label: '7. Livrée & Clôturée',
    actor: 'Livreur & Client',
    actorColor: '#166534',
    trigger: 'Scan QR client + Encaiss. COD',
    action: 'Attribution points fidélité (10 pts/100 DZD), enregistrement caisse COD.'
  }
];

states.forEach((st, idx) => {
  const boxY = y + idx * 56;
  
  // State step number & pill
  doc.rect(40, boxY, 110, 48).fillAndStroke(st.actorColor, '#1E293B');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5).text(st.label, 45, boxY + 8);
  doc.fillColor('#F1F5F9').font('Helvetica').fontSize(7).text(`Code: ${st.code}`, 45, boxY + 22);
  doc.rect(45, boxY + 33, 98, 11).fill('#FFFFFF');
  doc.fillColor(st.actorColor).font('Helvetica-Bold').fontSize(6.5).text(`Rôle : ${st.actor}`, 48, boxY + 35);

  // Content Box
  doc.rect(156, boxY, 399, 48).fillAndStroke('#FFFFFF', '#E2E8F0');
  
  doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(8).text('Déclencheur (Trigger) :', 166, boxY + 8);
  doc.fillColor('#4B5563').font('Helvetica').fontSize(7.5).text(st.trigger, 260, boxY + 8);

  doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(8).text('Effet Automatique & Sécurité :', 166, boxY + 24);
  doc.fillColor('#1F2937').font('Helvetica').fontSize(7.5).text(st.action, 260, boxY + 24, { width: 285 });

  // Arrow connecting to next state
  if (idx < states.length - 1) {
    doc.strokeColor(AMBER_GOLD).lineWidth(1.5);
    doc.moveTo(95, boxY + 48).lineTo(95, boxY + 56).stroke();
  }
});

y += states.length * 56 + 15;

// Exceptions & Cancelation Box
doc.rect(40, y, 515, 62).fillAndStroke('#FEF2F2', '#FCA5A5');
doc.fillColor('#991B1B').font('Helvetica-Bold').fontSize(9).text('GESTION DES ÉTATS D\'EXCEPTION (BRANCHES DE RUPTURE)', 50, y + 8);

doc.fillColor('#7F1D1D').font('Helvetica-Bold').fontSize(7.5).text('* CANCELLED (Annulée) :', 50, y + 23);
doc.fillColor('#374151').font('Helvetica').fontSize(7).text('Possible uniquement tant que la commande est PENDING. Si déjà en cours de préparation, nécessite l\'arbitrage de l\'administrateur.', 160, y + 23, { width: 380 });

doc.fillColor('#7F1D1D').font('Helvetica-Bold').fontSize(7.5).text('* FAILED_DELIVERY (Échec) :', 50, y + 40);
doc.fillColor('#374151').font('Helvetica').fontSize(7).text('Client injoignable après 3 tentatives d\'appel GSM. La commande est retournée au commerçant et consignée dans le registre litiges COD.', 160, y + 40, { width: 380 });

drawFooter(2);

// ============================================================================
// PAGE 3: ARCHITECTURE LOGICIELLE EN 7 COUCHES (CLEAN ARCHITECTURE / DDD)
// ============================================================================

doc.addPage();
drawHeader('ARCHITECTURE LOGICIELLE EN 7 COUCHES', 'Domain-Driven Design (DDD) & Résilience Réseau', 3);

y = 90;

const layers = [
  {
    num: 'Couche 1',
    name: 'Présentation & IHM Réactive',
    tech: 'React 18, Tailwind CSS, Lucide Icons, Responsive Mobile-First',
    desc: '4 vues contextuelles isolées, aucun couplage croisé, composants modulaires légers et ergonomiques adaptés à l\'usage tactile sur le terrain.'
  },
  {
    num: 'Couche 2',
    name: 'Application & BFF (Backend-For-Frontend)',
    tech: 'Express.js, API Endpoints, Input Validation, Error Interceptors',
    desc: 'Routage sécurisé, proxification des requêtes API sensibles, découplage entre les modèles de données externes et les écrans clients.'
  },
  {
    num: 'Couche 3',
    name: 'Domaine & Règles Métier Pures',
    tech: 'TypeScript Pure Business Logic, Invariants Métier, Algorithmes',
    desc: 'Calcul des frais de livraison zonés (Mila centre vs périphérie), attribution des paliers fidélité, validation mathématique des totaux DZD.'
  },
  {
    num: 'Couche 4',
    name: 'Persistance Hybride & Cache',
    tech: 'Google Cloud Firestore + Dexie.js (IndexedDB local)',
    desc: 'Architecture Dual-Storage : lecture instantanée locale sous 5ms, synchronisation Firestore asynchrone dès détection du réseau actif.'
  },
  {
    num: 'Couche 5',
    name: 'Sécurité, Identité & RBAC',
    tech: 'Firebase Authentication, Custom Claims, Role-Based Access Control',
    desc: 'Permissions granulaires strictes : seul l\'Admin accède à la caisse COD globale ; les livreurs ne visualisent que leurs courses assignées.'
  },
  {
    num: 'Couche 6',
    name: 'Passerelles d\'Intégration Matérielle & Télécom',
    tech: 'HTTP-SMS Gateway (Android / GSM), Web Push API, Caméra QR Scanner',
    desc: 'Connexion directe avec le matériel physique local sans dépendre de services cloud internationaux coûteux ou bloqués.'
  },
  {
    num: 'Couche 7',
    name: 'Observabilité, Audit & Résilience Réseau Dégradé',
    tech: 'Network Quality Monitor (Offline / 2G / 3G / 4G), Outbox Queue',
    desc: 'Files d\'attente transactionnelles avec retry exponentiel, monitoring de l\'état de la batterie et de la qualité réseau des livreurs.'
  }
];

layers.forEach((layer, idx) => {
  const layerY = y + idx * 56;
  
  // Layer tag
  doc.rect(40, layerY, 85, 48).fillAndStroke(TEAL_DARK, AMBER_GOLD);
  doc.fillColor(AMBER_GOLD).font('Helvetica-Bold').fontSize(8.5).text(layer.num, 45, layerY + 10);
  doc.fillColor('#FFFFFF').font('Helvetica').fontSize(7).text('Niveau ' + (idx + 1), 45, layerY + 24);

  // Content
  doc.rect(130, layerY, 425, 48).fillAndStroke(BG_CARD_LIGHT, '#CBD5E1');
  doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(9).text(layer.name, 140, layerY + 6);
  doc.fillColor('#0284C7').font('Helvetica-Bold').fontSize(7.5).text(`[ ${layer.tech} ]`, 140, layerY + 19);
  doc.fillColor('#4B5563').font('Helvetica').fontSize(7.5).text(layer.desc, 140, layerY + 30, { width: 405 });
});

y += layers.length * 56 + 15;

// Offline resiliency highlight box
doc.rect(40, y, 515, 60).fillAndStroke('#ECFDF5', EMERALD_GREEN);
doc.fillColor(EMERALD_DARK).font('Helvetica-Bold').fontSize(9.5).text('PRINCIPE DU MODE HORS-LIGNE (OFFLINE-FIRST EN ALGÉRIE)', 52, y + 8);
doc.fillColor('#065F46').font('Helvetica').fontSize(8).text(
  'En cas de coupure de réseau ou de tunnel 3G blanc dans la Wilaya de Mila, le livreur continue de scanner et livrer : ' +
  'les événements sont enregistrés dans l\'IndexedDB locale et horodatés cryptographiquement. ' +
  'Dès réapparition du signal, la file Outbox déverse les transactions dans Firestore sans conflit.',
  52, y + 22, { width: 495 }
);

drawFooter(3);

// ============================================================================
// PAGE 4: MODÈLE DE DONNÉES FIRESTORE (ERD) & CODE MERMAID
// ============================================================================

doc.addPage();
drawHeader('MODÈLE DE DONNÉES & CODE MERMAID EXPORTABLE', 'Schéma des Collections Firestore & Script Mermaid', 4);

y = 90;

doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(11).text('SCHÉMA DES ENTITÉS PRINCIPALES (FIRESTORE COLLECTIONS)', 40, y);
doc.rect(40, y + 15, 280, 2).fill(AMBER_GOLD);

y += 24;

const collections = [
  {
    name: 'users/{userId}',
    fields: ['role: "customer" | "courier" | "merchant" | "admin"', 'phone: string, fullName: string, address: string', 'fidelityPoints: number, createdAt: timestamp']
  },
  {
    name: 'orders/{orderId}',
    fields: ['orderNumber: string, customerId: string, storeId: string', 'courierId?: string, status: OrderStatus, items: Array', 'subtotal: number, deliveryFee: number, totalDZD: number', 'paymentMethod: "COD", deliveryQrCode: string']
  },
  {
    name: 'stores/{storeId}',
    fields: ['name: string, category: string, rating: number', 'address: string, isOpen: boolean, phone: string', 'deliveryEstimate: string, minOrder: number']
  },
  {
    name: 'codSettlements/{settlementId}',
    fields: ['courierId: string, orderId: string, amountDZD: number', 'collectedAt: timestamp, reconciledWithAdmin: boolean']
  }
];

collections.forEach((col, idx) => {
  const cx = 40 + (idx % 2) * 262;
  const cy = y + Math.floor(idx / 2) * 72;
  
  doc.rect(cx, cy, 252, 64).fillAndStroke('#F8FAFC', '#94A3B8');
  doc.rect(cx, cy, 252, 16).fill(TEAL_DARK);
  doc.fillColor(AMBER_GOLD).font('Helvetica-Bold').fontSize(8).text(col.name, cx + 8, cy + 4);

  col.fields.forEach((f, fIdx) => {
    doc.fillColor('#334155').font('Courier').fontSize(6.5).text(`- ${f}`, cx + 8, cy + 20 + fIdx * 13, { width: 236 });
  });
});

y += 156;

// Mermaid Code Section
doc.fillColor(TEAL_DARK).font('Helvetica-Bold').fontSize(11).text('CODE SOURCE MERMAID.JS (COPIER-COLLER GITHUB / NOTION)', 40, y);
doc.rect(40, y + 15, 300, 2).fill(AMBER_GOLD);

y += 24;

const mermaidSnippet = [
  'graph TD',
  '  subgraph Frontaux ["Portails Utilisateurs"]',
  '    C[Client PWA] -->|Commande| API[Gateway BFF RYM]',
  '    M[Commercant POS] -->|Validation Prep| API',
  '    L[Livreur Radar GPS] -->|Scan QR / COD| API',
  '    A[Admin Console Ops] -->|Supervision| API',
  '  end',
  '  subgraph Core ["Coeur Systeme & Donnees"]',
  '    API -->|Auth & RBAC| SEC[Firebase Auth / Custom Claims]',
  '    API -->|Single-Writer| DB[(Cloud Firestore)]',
  '    API -->|Fallback Local| IDX[(IndexedDB / Outbox)]',
  '  end',
  '  subgraph Externes ["Passerelles Algerie"]',
  '    API -->|Alerte GSM| SMS[Passerelle HTTP-SMS Locale]',
  '    API -->|Recommandations| AI[Google Gemini API]',
  '    API -->|Geolocalisation| MAP[Leaflet OpenStreetMap]',
  '  end'
];

doc.rect(40, y, 515, 140).fillAndStroke('#0A2B35', AMBER_GOLD);
doc.fillColor('#FCD34D').font('Courier-Bold').fontSize(7.5).text('%% RYM High-Level Architecture Diagram (Mermaid)', 50, y + 8);

mermaidSnippet.forEach((line, lineIdx) => {
  doc.fillColor('#E5E7EB').font('Courier').fontSize(7).text(line, 50, y + 20 + lineIdx * 9);
});

// Final Validation Stamp
y += 150;
doc.rect(40, y, 515, 32).fillAndStroke('#ECFDF5', EMERALD_GREEN);
doc.fillColor(EMERALD_DARK).font('Helvetica-Bold').fontSize(8.5).text('DOCUMENT VALIDÉ - RYM LIVRAISON MILA 43', 52, y + 7);
doc.fillColor('#065F46').font('Helvetica').fontSize(7.5).text(
  'Conforme aux standards de livraison hyperlocale, tolérance aux pannes réseau et sécurité financière COD.',
  52, y + 18
);

drawFooter(4);

doc.end();

writeStream.on('finish', () => {
  console.log(`[SUCCESS] PDF generated at: ${outputPath}`);
});
