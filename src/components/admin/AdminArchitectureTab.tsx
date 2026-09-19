/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Admin Architecture & System Boundaries Tab (RYM V2 Authoritative Architecture)
 * Implements the 10 Core Architectural Changes:
 * 1. Single Authoritative Go Dispatch Subsystem
 * 2. Go Realtime Subsystem Decomposition (websocket, presence, tracking, dispatch, telemetry)
 * 3. Client Local Cache / Offline Store explicitly labeled and bounded
 * 4. Authoritative PostgreSQL as Durable Primary Transaction Database
 * 5. FCM Push Notification Adapter in Event/Integration Layer
 * 6. Service-oriented Capabilities representation
 * 7. Client UI requests actions via API (no client-driven status transitions)
 * 8. WebSocket Gateway integrated inside Go Realtime Platform
 * 9. Unified Fulfillment Pipeline (Dispatch -> Candidate -> Scoring -> Assignment -> Batch -> Route)
 * 10. Clear separation between Operational State, Realtime State, and Historical Telemetry
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Cpu,
  ArrowRight,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Utensils,
  Calculator,
  Navigation,
  Activity,
  Boxes,
  Zap,
  Database,
  Server,
  Radio,
  GitMerge,
  FileText,
  Check,
} from 'lucide-react';
import { outboxEventBus } from '../../events/outboxEventBus';
import { OutboxEventRecord } from '../../types';
import { calculateAuthoritativePrice } from '../../domain/pricingEngine';

export const AdminArchitectureTab: React.FC = () => {
  const [outboxStats, setOutboxStats] = useState(() => outboxEventBus.getOutboxStats());
  const [isFlushing, setIsFlushing] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<number>(4); // Default to Data & Persistence
  const [showDiagram, setShowDiagram] = useState<boolean>(true);

  // Pricing Engine interactive playground state
  const [testSubtotal, setTestSubtotal] = useState<number>(1400);
  const [testDistanceKm, setTestDistanceKm] = useState<number>(1.8);
  const [testVoucher, setTestVoucher] = useState<string>('BIENVENUE');

  const calculatedPricing = calculateAuthoritativePrice({
    items: [{ menuItemId: 'test-item', price: testSubtotal, quantity: 1 }],
    storeId: 'store-romana',
    distanceMeters: Math.round(testDistanceKm * 1000),
    voucherCode: testVoucher,
  });

  const refreshStats = () => {
    setOutboxStats(outboxEventBus.getOutboxStats());
  };

  useEffect(() => {
    const unsub = outboxEventBus.subscribe('*', () => {
      refreshStats();
    });
    return () => unsub();
  }, []);

  const handleManualFlush = async () => {
    setIsFlushing(true);
    await outboxEventBus.flushOutbox();
    refreshStats();
    setIsFlushing(false);
  };

  const handleEmitTestEvent = () => {
    outboxEventBus.emitCourierLocationDelta(
      'order-test-telemetry',
      'courier-walid',
      36.4682 + (Math.random() - 0.5) * 0.005,
      6.2895 + (Math.random() - 0.5) * 0.005,
      120,
      32,
      11
    );
    refreshStats();
  };

  const ARCHITECTURAL_LAYERS = [
    {
      num: '01',
      name: 'APPLICATIONS',
      role: 'Expériences Clients & Personas (UI)',
      tech: 'Customer App, Courier App, Merchant App, Admin Operations',
      description: 'Interfaces de présentation strictes. L\'application client ne prend AUCUNE décision autoritaire : elle soumet des requêtes d\'actions (ex: POST /orders/:id/action) au serveur.',
      status: 'AUTORITAIRE',
      color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
    },
    {
      num: '02',
      name: 'API PLATFORM',
      role: 'Passerelle & Modules Métier',
      tech: 'Auth, Stores, Discovery, Checkout, Orders, Pricing, Promotions, Loyalty, Scheduling, Notifications',
      description: 'Point d\'entrée unique HTTPS/WSS avec validation des sessions JWT, rate limiting et routage des requêtes vers les services de domaine.',
      status: 'ACTIF',
      color: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
    },
    {
      num: '03',
      name: 'APPLICATION SERVICES',
      role: 'Orchestration & Événements Métier',
      tech: 'OrderApplicationService, Idempotency Cache, Outbox Event Dispatcher',
      description: 'Cerveau central coordonnant les commandes. Émet des événements de domaine stricts (Order Event -> Realtime, Notification, Dispatch, Analytics, Audit).',
      status: 'ACTIF',
      color: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
    },
    {
      num: '04',
      name: 'DOMAIN RULES',
      role: 'Règles Métier & Machines à États',
      tech: 'OrderLifecycle (11 États), PricingEngine, DeliveryPolicy & FulfillmentRules',
      description: 'Machine à états autoritaire interdisant les sauts illégaux. Politiques de livraison et calcul de tarification serveur infalsifiable.',
      status: 'ACTIF',
      color: 'border-purple-500/40 bg-purple-500/5 text-purple-400',
    },
    {
      num: '05',
      name: 'DATA & PERSISTENCE',
      role: 'PostgreSQL Autoritaire & Cache Client',
      tech: 'PostgreSQL (Prisma ORM) + Client Local Cache / Offline Store',
      description: 'Séparation nette : PostgreSQL détient l\'unique vérité durable (Users, Stores, Orders, Payments, Audit). Le Local Storage client est un cache de commodité non-autoritaire.',
      status: 'AUTORITAIRE',
      color: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
    },
    {
      num: '06',
      name: 'GO REALTIME PLATFORM',
      role: 'Télémétrie & État Éphémère Haute Vitesse',
      tech: 'Go Daemon (websocket, presence, tracking, telemetry)',
      description: 'Micro-daemon Go dédié à faible allocation mémoire. Gère la passerelle WebSocket, la présence livreurs (heartbeats) et le streaming GPS adaptatif (20s/5s/3s).',
      status: 'ACTIF',
      color: 'border-rose-500/40 bg-rose-500/5 text-rose-400',
    },
    {
      num: '07',
      name: 'UNIFIED DISPATCH SYSTEM',
      role: 'Pipeline d\'Exécution & Assignation Unique',
      tech: 'Go Dispatch (Candidate -> Scorer -> Assignment -> Batch -> Route)',
      description: 'Unique moteur de dispatch autoritaire : Sélection des candidats par rayon, scoring multi-critères, génération d\'offres, gestionnaire de lots et ordonnancement d\'arrêts.',
      status: 'AUTORITAIRE',
      color: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400',
    },
    {
      num: '08',
      name: 'INTEGRATION & ADAPTERS',
      role: 'Connecteurs Tiers Spécialisés',
      tech: 'FCM Push Notification Adapter, Maps Adapter, Telecom SMS Gateway, Payment COD',
      description: 'FCM en tant qu\'adaptateur de notifications push transactionnelles, Leaflet/OSM pour la cartographie, passerelle SMS Djezzy/Mobilis et encaissement COD.',
      status: 'ACTIF',
      color: 'border-orange-500/40 bg-orange-500/5 text-orange-400',
    },
    {
      num: '09',
      name: 'TELEMETRY & AUDIT STORE',
      role: 'Séparation États & Journal d\'Audit Immuable',
      tech: 'Presence State, Realtime Fast State, Sampled Telemetry Store & Append-only Outbox',
      description: 'Distinction absolue entre État Opérationnel (ONLINE/AVAILABLE), État Réel (mémoire vive), Télémétrie Échantillonnée (batterie/réseau) et Journal d\'Audit immuable.',
      status: 'ACTIF',
      color: 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300',
    },
  ];

  const OWNERSHIP_MATRIX = [
    {
      entity: 'État de Commande (Order State)',
      owner: 'API + PostgreSQL',
      secondary: 'Firestore Mirror / Client Cache',
      rule: 'L\'API autorise et exécute les transitions via OrderLifecycle. Le client ne fait que requêter.',
    },
    {
      entity: 'État du Paiement & COD',
      owner: 'Domaine Paiement + PostgreSQL',
      secondary: 'Livreur Carnet COD Local',
      rule: 'Rapprochement des espèces lors de la clôture de service. Immuable après encaissement.',
    },
    {
      entity: 'Tarification & Frais de Livraison',
      owner: 'PricingEngine (Serveur)',
      secondary: 'Affichage UI (estimatif)',
      rule: 'Recalcul serveur obligatoire lors du checkout; aucun montant client n\'est accepté.',
    },
    {
      entity: 'Validité Codes Promo & Vouchers',
      owner: 'Domaine Promotions + PostgreSQL',
      secondary: 'Cache local pour validation visuelle',
      rule: 'Règles d\'anti-cumul strictes vérifiées dans la transaction de création.',
    },
    {
      entity: 'Position GPS Courante Coursier',
      owner: 'Go Realtime Platform (Mémoire)',
      secondary: 'Aucune (état éphémère haute fréquence)',
      rule: 'GPS diffusé par WebSockets; jamais persisté par tick dans la base relationnelle.',
    },
    {
      entity: 'Historique Télémétrie Coursier',
      owner: 'Telemetry Store (Échantillons)',
      secondary: 'Jalon de livraison PostgreSQL',
      rule: 'Échantillonnage espacé (batterie, latence, vitesse); pas d\'enregistrement continu.',
    },
    {
      entity: 'Décision d\'Assignation / Dispatch',
      owner: 'Go Dispatch Subsystem',
      secondary: 'Outbox Event Log',
      rule: 'Un seul cerveau d\'attribution basé sur le scoring déterministe et le rayon de 2,0 km.',
    },
    {
      entity: 'Séquence des Arrêts de Tournée',
      owner: 'Route Optimizer (sous Batch Manager)',
      secondary: 'Affichage Application Coursier',
      rule: 'Détermine l\'ordre optimal de passage (Collecte avant Livraison) sans décider l\'attribution.',
    },
    {
      entity: 'État de l\'Interface (UI State)',
      owner: 'Client Local (React State / Storage)',
      secondary: 'Session Storage',
      rule: 'Strictement cosmétique et interactif. Jamais de vérité métier dans le client.',
    },
    {
      entity: 'Distribution Notifications Push',
      owner: 'FCM Push Notification Adapter',
      secondary: 'Web Notification API',
      rule: 'Consomme les événements de l\'Outbox et relaie les alertes aux appareils mobiles.',
    },
    {
      entity: 'Piste d\'Audit et Historique',
      owner: 'Outbox Event Bus + PostgreSQL Ledger',
      secondary: 'Journal Local',
      rule: 'Journal immuable append-only pour la traçabilité des opérations à Ahmed Rachedi.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/60 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck size={14} />
              Revue d'Architecture V2 & Appropriations Validées
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Architecture Découplée RYM V2 — Règle de l'Unique Propriétaire
            </h2>
            <p className="text-sm text-zinc-400 max-w-3xl mt-1">
              "Chaque élément d'état et chaque décision importante doit avoir exactement un seul propriétaire."
              Unification du dispatch sous Go, PostgreSQL comme socle durable autoritaire, cache client borné et adaptateur FCM dédié.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDiagram(!showDiagram)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-600 rounded-xl text-xs font-bold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <GitMerge size={14} className="text-cyan-400" />
              {showDiagram ? 'Masquer Schéma' : 'Voir Schéma V2'}
            </button>
            <button
              onClick={handleManualFlush}
              disabled={isFlushing}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-600 rounded-xl text-xs font-bold text-zinc-200 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} className={isFlushing ? 'animate-spin text-emerald-400' : ''} />
              Vider Outbox
            </button>
            <button
              onClick={handleEmitTestEvent}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-emerald-900/30"
            >
              <Zap size={14} />
              Émettre Delta GPS
            </button>
          </div>
        </div>
      </div>

      {/* Target V2 Architecture Diagram Block */}
      {showDiagram && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 font-mono text-xs overflow-x-auto shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Server size={16} />
              <span>DIAGRAMME D'ARCHITECTURE CIBLE RYM V2 (AUTHORITATIVE FLOW)</span>
            </div>
            <span className="text-[11px] text-zinc-500">Flux d'événements stricts & frontières de persistance</span>
          </div>

          <pre className="text-zinc-300 leading-relaxed whitespace-pre font-mono text-[11px] bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
{`                         ┌───────────────────────────────┐
                         │          UTILISATEURS         │
                         │                               │
                         │ Client  Livreur Commerçant Admin│
                         └───────────────┬───────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────────┐
              │                 APPLICATIONS                 │
              │  (Requêtes d'actions via API • Présentation)  │
              │ Customer │ Courier │ Merchant │ Admin        │
              └────────────────────┬─────────────────────────┘
                                   │
                              HTTPS / WSS
                                   │
              ┌────────────────────▼─────────────────────────┐
              │                  API PLATFORM                │
              │                                              │
              │ Auth │ Stores │ Discovery │ Checkout         │
              │ Orders │ Pricing │ Promotions │ Loyalty      │
              │ Scheduling │ Notifications │ Admin           │
              └────────────────────┬─────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   PostgreSQL    │
                          │                 │
                          │ Durable State   │
                          │ Source Unique   │
                          └─────────────────┘


       ┌─────────────────────────────────────────────────────┐
       │                GO REALTIME PLATFORM                  │
       │                                                     │
       │ WebSocket Gateway │ Presence │ GPS │ Tracking       │
       │                                                     │
       │                 DISPATCH SYSTEM                     │
       │              ┌──────────────────┐                   │
       │              │ Eligibility      │                   │
       │              │ Scoring          │                   │
       │              │ Assignment       │                   │
       │              │ Batch Manager    │                   │
       │              │ Route Optimizer  │                   │
       │              │ ETA Engine       │                   │
       │              └──────────────────┘                   │
       └──────────────────────┬──────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             Current State          Telemetry
             / Presence             / Metrics
             (Mémoire Vive)         (Échantillons)


                     EVENT / INTEGRATION LAYER
                               │
          ┌───────────────────┼────────────────────┐
          ▼                   ▼                    ▼
       FCM Push             Maps                 Payments
       Adapter             Adapter               Adapter
     (Notifications)    (Leaflet / OSM)       (Cash / COD)`}
          </pre>
        </div>
      )}

      {/* Grid: 9 Logical Boundaries */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="text-emerald-400" size={20} />
            <h3 className="text-base font-bold text-white">
              Les 9 Couches Systèmes Découplées
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Cliquez sur une couche pour explorer son rôle et ses garanties</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ARCHITECTURAL_LAYERS.map((layer, idx) => {
            const isSelected = selectedLayer === idx;
            return (
              <div
                key={layer.num}
                onClick={() => setSelectedLayer(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${layer.color} shadow-lg ring-1 ring-emerald-500/50 scale-[1.01]`
                    : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black tracking-widest text-zinc-500 font-mono">
                      {layer.num}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {layer.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-0.5">{layer.name}</h4>
                  <p className="text-xs font-medium text-zinc-400 mb-2">{layer.role}</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{layer.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="truncate font-mono">{layer.tech}</span>
                  <ArrowRight size={12} className="shrink-0 text-zinc-600 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Single Source of Truth Ownership Matrix */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <div>
              <h3 className="text-base font-bold text-white">
                Matrice d'Appropriation Unique (Single Owner Principle)
              </h3>
              <p className="text-xs text-zinc-400">Chaque état critique et décision a un seul propriétaire d'autorité</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            100% Découplé
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono">
                <th className="py-2.5 px-3">Domaine / Entité d'État</th>
                <th className="py-2.5 px-3">Propriétaire Autoritaire</th>
                <th className="py-2.5 px-3">Stockage Secondaire / Cache</th>
                <th className="py-2.5 px-3">Règle d'Invariant Formelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {OWNERSHIP_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">{row.entity}</td>
                  <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">{row.owner}</td>
                  <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">{row.secondary}</td>
                  <td className="py-3 px-3 text-zinc-300 text-[11px] leading-relaxed">{row.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Live Outbox Monitor & Authoritative Pricing Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outbox & Event Bus Monitor */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold text-white">
                  Moniteur Transactionnel Outbox & Événements
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-zinc-800 rounded-lg text-zinc-300 font-mono">
                  Total: {outboxStats.total}
                </span>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono">
                  Distribués: {outboxStats.dispatched}
                </span>
                {outboxStats.pending > 0 && (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-mono">
                    En attente: {outboxStats.pending}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Chaque mise à jour d'état de commande s'enregistre dans l'Outbox avant distribution asynchrone garantie vers Realtime, FCM et Analytics.
            </p>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {outboxStats.recentEvents.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-950/40 rounded-2xl border border-zinc-800/60">
                  Aucun événement dans l'Outbox pour le moment.
                </div>
              ) : (
                outboxStats.recentEvents.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-mono font-bold text-white block truncate">
                          {rec.event.type}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {rec.event.aggregateType} • {rec.event.actor.role} ({rec.event.actor.name})
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {rec.status}
                      </span>
                      <span className="block text-[10px] text-zinc-500 mt-0.5">
                        {new Date(rec.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Deltas légers conformes au standard JSON-RPC</span>
            <button
              onClick={refreshStats}
              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              Actualiser la file
            </button>
          </div>
        </div>

        {/* Authoritative Pricing Engine Playground */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="text-amber-400" size={18} />
                <h3 className="text-sm font-bold text-white">
                  Moteur de Tarification Serveur Autoritaire
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
                {calculatedPricing.zoneName}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Calcul mathématique strict côté domaine (aucun total calculé côté client n'est persistant) :
            </p>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Sous-total Articles (DZD)
                </label>
                <input
                  type="number"
                  step="100"
                  value={testSubtotal}
                  onChange={(e) => setTestSubtotal(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Distance Trajet (km)
                </label>
                <input
                  type="number"
                  step="0.2"
                  value={testDistanceKm}
                  onChange={(e) => setTestDistanceKm(Math.max(0.2, Number(e.target.value)))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Calculated Breakdown Display */}
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-300">
                <span>Sous-total articles :</span>
                <span>{calculatedPricing.itemsSubtotalDZD} DZD</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Frais de livraison ({testDistanceKm} km) :</span>
                <span className={calculatedPricing.deliveryFeeDZD === 0 ? 'text-emerald-400 font-bold' : ''}>
                  {calculatedPricing.deliveryFeeDZD === 0 ? 'GRATUIT' : `${calculatedPricing.deliveryFeeDZD} DZD`}
                </span>
              </div>
              {calculatedPricing.smallOrderFeeDZD > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Frais petite commande (&lt; 500 DZD) :</span>
                  <span>+{calculatedPricing.smallOrderFeeDZD} DZD</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400">
                <span>Frais d'emballage isotherme :</span>
                <span>+{calculatedPricing.packagingFeeDZD} DZD</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Frais de service plateforme :</span>
                <span>+{calculatedPricing.platformServiceFeeDZD} DZD</span>
              </div>
              {calculatedPricing.discountDZD > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Remise Promo ({testVoucher}) :</span>
                  <span>-{calculatedPricing.discountDZD} DZD</span>
                </div>
              )}
              <div className="pt-2 border-t border-zinc-800 flex justify-between text-white font-bold text-sm">
                <span>Total Final Facturé au Client :</span>
                <span className="text-emerald-400">{calculatedPricing.finalCustomerTotalDZD} DZD</span>
              </div>
            </div>
          </div>

          {/* Internal Economics Breakdown */}
          <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block">Commerçant Net</span>
              <span className="font-bold text-zinc-200">{calculatedPricing.merchantPayoutDZD} DZD</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block">Gain Livreur</span>
              <span className="font-bold text-zinc-200">{calculatedPricing.courierEarningsDZD} DZD</span>
            </div>
            <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 block">Marge Brute</span>
              <span className="font-bold text-emerald-400">{calculatedPricing.platformNetRevenueDZD} DZD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
