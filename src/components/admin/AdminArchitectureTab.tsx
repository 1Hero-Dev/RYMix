/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Admin Architecture & System Boundaries Tab
 * Implements Recommendation #20 (9-Layer Logical Boundaries), #11/#15 (Outbox Events Inspector),
 * #4 (Fulfillment Models), and #5 (Authoritative Pricing Engine)
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
} from 'lucide-react';
import { outboxEventBus } from '../../events/outboxEventBus';
import { OutboxEventRecord } from '../../types';
import { calculateAuthoritativePrice } from '../../domain/pricingEngine';
import { AHMED_RACHEDI_SERVICE_ZONES } from '../../domain/geoZones';
import { SEED_MERCHANT_BRANCHES } from '../../domain/merchantBranch';

export const AdminArchitectureTab: React.FC = () => {
  const [outboxStats, setOutboxStats] = useState(() => outboxEventBus.getOutboxStats());
  const [isFlushing, setIsFlushing] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<number>(3); // Default to Application / Domain

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
      name: 'CLIENTS',
      role: 'Interfaces Utilisateurs Dédiées',
      tech: 'React 18, Tailwind CSS, Lucide Icons, Framer Motion',
      description: 'Applications découplées par personas : Client Express, Commerçant Tablette, Livreur Mobile & Console Administration.',
      status: 'ACTIF',
      color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
    },
    {
      num: '02',
      name: 'API / TRANSPORT',
      role: 'Passerelle & Flux Temps Réel',
      tech: 'REST Endpoints, WebSocket Streams, SSE Event Source',
      description: 'Acheminement sécurisé des requêtes HTTPS et flux bidirectionnels légers pour la télémétrie GPS et changements d\'états.',
      status: 'ACTIF',
      color: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
    },
    {
      num: '03',
      name: 'APPLICATION SERVICES',
      role: 'Cœur Métier & Orchestration',
      tech: 'OrderApplicationService, FulfillmentService, DeliveryService',
      description: 'Unique cerveau autoritaire coordonnant la création idempotente des commandes, l\'attribution livreur et la facturation.',
      status: 'ACTIF',
      color: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
    },
    {
      num: '04',
      name: 'DOMAIN',
      role: 'Règles Métier & Machines à États',
      tech: 'OrderLifecycle (11 États), PricingEngine, GeoZones, BranchRules',
      description: 'Machine à états stricte interdisant les sauts illégaux d\'états. Politiques d\'annulation formelles et tarification serveur.',
      status: 'ACTIF',
      color: 'border-purple-500/40 bg-purple-500/5 text-purple-400',
    },
    {
      num: '05',
      name: 'DATA & REPOSITORIES',
      role: 'Persistance & Idempotence',
      tech: 'Firestore Cloud, Idempotency Cache, Local Cache Démo',
      description: 'Transactions atomiques garantissant qu\'une commande ne soit jamais débitée ou dupliquée en cas de réseau instable.',
      status: 'ACTIF',
      color: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400',
    },
    {
      num: '06',
      name: 'REALTIME GATEWAY',
      role: 'Télémétrie & Événements Fins',
      tech: 'Lightweight Event Deltas, Courier GPS Stream',
      description: 'Transmission de deltas ciblés (ex: courier.location.updated) au lieu de retransmettre l\'intégralité des commandes.',
      status: 'ACTIF',
      color: 'border-rose-500/40 bg-rose-500/5 text-rose-400',
    },
    {
      num: '07',
      name: 'DISPATCH ENGINE',
      role: 'Algorithmes d\'Assignation & Tournées',
      tech: 'Éligibilité, Scoring Multi-critères, Groupage de Lots, Itinéraires',
      description: 'Moteur modulaire découplé en 5 fonctions indépendantes (Éligibilité, Scoring, Batch Optimizer, Planificateur, Réassignation).',
      status: 'ACTIF',
      color: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400',
    },
    {
      num: '08',
      name: 'EXTERNAL SERVICES',
      role: 'Connecteurs Tiers Spécialisés',
      tech: 'Firebase Auth, Google Maps Routing, Gateway SMS Telecom',
      description: 'Authentification centralisée, calcul matriciel d\'itinéraires routiers réels et notifications SMS/Push transactionnelles.',
      status: 'ACTIF',
      color: 'border-orange-500/40 bg-orange-500/5 text-orange-400',
    },
    {
      num: '09',
      name: 'OUTBOX & AUDIT BUS',
      role: 'Pattern Outbox & Fiabilité des Événements',
      tech: 'OutboxEventBus, File d\'attente transactionnelle, Journal d\'Audit',
      description: 'Chaque mise à jour enregistre un événement dans l\'Outbox avant dispatch asynchrone garanti vers les workers et dashboards.',
      status: 'ACTIF',
      color: 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300',
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
              Recommandations Appliquées avec Succès
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Architecture Système Découplée en 9 Couches
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl mt-1">
              Frontières logiques formalisées selon les standards de livraison express : séparation Food vs Courses,
              moteur de tarification serveur autoritaire, dispatch modulaire, pattern Outbox et idempotence réseau.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

      {/* Grid: 9 Logical Boundaries */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="text-emerald-400" size={20} />
            <h3 className="text-base font-bold text-white">
              Les 9 Frontières Logiques (Recommandation #20)
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Cliquez sur une couche pour explorer ses composants</span>
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

      {/* Two Column Section: Live Outbox Monitor & Authoritative Pricing Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outbox & Event Bus Monitor (Recommendations #11, #12, #15) */}
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
              Chaque mise à jour d'état s'enregistre d'abord dans la file Outbox pour garantir qu'aucun événement ne soit perdu lors des micro-coupures réseau à Ahmed Rachedi.
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

        {/* Authoritative Pricing Engine Playground (Recommendation #5) */}
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
              Calcul mathématique précis côté domaine évitant les incohérences client/serveur :
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

      {/* Fulfillment Models: Food vs Shopping (Recommendation #4) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Boxes className="text-purple-400" size={20} />
          <h3 className="text-base font-bold text-white">
            Différenciation des Modèles d'Exécution : Food vs Courses (Recommandation #4)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Food Preparation Card */}
          <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3 text-orange-400 font-bold text-sm">
              <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <Utensils size={16} />
              </div>
              <span>Modèle Restauration (FoodPreparation)</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Acceptation rapide par le restaurateur, cuisson à la commande, temps de préparation thermique, emballage chaud/froid hermétique puis remise directe au coursier.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
              <span>Acceptée</span>
              <ArrowRight size={12} className="text-zinc-500" />
              <span className="text-orange-400 font-bold">Cuisine / Cuisson</span>
              <ArrowRight size={12} className="text-zinc-500" />
              <span>Prête au comptoir</span>
              <ArrowRight size={12} className="text-zinc-500" />
              <span>Enlèvement</span>
            </div>
          </div>

          {/* Shopping Picking Card */}
          <div className="bg-zinc-950/60 border border-zinc-800/90 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3 text-emerald-400 font-bold text-sm">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <ShoppingBag size={16} />
              </div>
              <span>Modèle Superette & Courses (ShoppingPicking)</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
              Workflow avec picking article par article en rayon, gestion des ruptures de stock avec propositions de substitution, approbation client et emballage en sacs cabas.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
              <span>Acceptée</span>
              <ArrowRight size={12} className="text-zinc-500" />
              <span className="text-emerald-400 font-bold">Picking Rayon</span>
              <ArrowRight size={12} className="text-zinc-500" />
              <span>Substitution si rupture</span>
              <ArrowRight size={12} className="text-zinc-500" />
              <span>Sacs scellés</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
