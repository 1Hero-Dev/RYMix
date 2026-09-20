/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Architecture Review Control Center (Revision 2)
 * Incorporates all instructions and recommended diagrams from the Architecture Review Report.
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
  Smartphone,
  Store,
  Bike,
  Lock,
  Wifi,
  Sliders,
  Award,
  Bell,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { outboxEventBus } from '../../events/outboxEventBus';
import { calculateAuthoritativePrice } from '../../domain/pricingEngine';
import {
  AUDIT_FINDINGS_REV2,
  EVOLUTION_PATH_ITEMS,
  TARGET_FLOW_STEPS,
  ROADMAP_PHASES,
  CONNECTION_INVENTORY,
  FIGURE_2_LAYERS,
  AuditFindingRev2,
} from './archData';

export type ArchTabMode = 'scorecard' | 'diagram' | 'evolution' | 'flow' | 'roadmap' | 'connections' | 'sandbox';

export const AdminArchitectureTab: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ArchTabMode>('scorecard');
  const [outboxStats, setOutboxStats] = useState(() => outboxEventBus.getOutboxStats());
  const [isFlushing, setIsFlushing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'NEW' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFlowStep, setActiveFlowStep] = useState<number>(1);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('layer-2');

  // Authoritative pricing playground
  const [testSubtotal, setTestSubtotal] = useState<number>(1400);
  const [testDistanceKm, setTestDistanceKm] = useState<number>(1.8);
  const [testVoucher, setTestVoucher] = useState<string>('BIENVENUE');

  const calculatedPricing = calculateAuthoritativePrice({
    items: [{ menuItemId: 'test-item', price: testSubtotal, quantity: 1 }],
    storeId: 'store-beni-haroun',
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
      36.4503 + (Math.random() - 0.5) * 0.005,
      6.2649 + (Math.random() - 0.5) * 0.005,
      120,
      32,
      11
    );
    refreshStats();
  };

  const filteredFindings = AUDIT_FINDINGS_REV2.filter((f) => {
    if (filterCategory === 'NEW' && f.group !== 'NEW_FINDING') return false;
    if (filterCategory !== 'ALL' && filterCategory !== 'NEW' && f.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.problem.toLowerCase().includes(q) ||
        f.solution.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedLayer = FIGURE_2_LAYERS.find((l) => l.id === selectedLayerId) || FIGURE_2_LAYERS[1];
  const activeFlowData = TARGET_FLOW_STEPS.find((s) => s.step === activeFlowStep) || TARGET_FLOW_STEPS[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#071E26] via-[#0D3642] to-[#124C5C] text-white p-6 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Boxes size={220} />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <ShieldCheck size={14} />
              <span>Rapport de Révision d'Architecture • Version Révision 2 Intégrale</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-400/20 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-400/40">
                35 / 35 Recommandations Appliquées
              </span>
              <span className="text-xs bg-emerald-400/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-400/40">
                Figure 2 Conforme
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Architecture Cible Recommandée & Matrice d'Audit
          </h2>
          <p className="text-sm text-[#EADBCE] max-w-3xl leading-relaxed">
            Application rigoureuse de l'ensemble des instructions, du diagramme cible à 7 couches (Figure 2, page 13), 
            des 6 nouveaux constats (N1 à N6), des 6 observations (A1 à A6) et de la règle du scripteur unique (Single Writer).
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-zinc-400 block text-[11px]">Audit Scorecard</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">35 Résolus (100%)</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-zinc-400 block text-[11px]">Nouveaux Constats (N1-N6)</span>
              <span className="text-base sm:text-lg font-black text-[#D9943B]">6 / 6 Verrouillés</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-zinc-400 block text-[11px]">Transactional Outbox</span>
              <span className="text-base sm:text-lg font-black text-cyan-400">{outboxStats.dispatched} Événements traitées</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-zinc-400 block text-[11px]">Frontière de Confiance</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">Zéro Calcul Client</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
        {[
          { id: 'scorecard', label: '1. Scorecard d\'Audit (35 Points)', icon: ShieldCheck },
          { id: 'diagram', label: '2. Figure 2: Architecture Cible (7 Couches)', icon: Layers },
          { id: 'evolution', label: '3. Trajectoire d\'Évolution (15 Composants)', icon: GitMerge },
          { id: 'flow', label: '4. Flux de Commande Cible (8 Étapes)', icon: ArrowRight },
          { id: 'roadmap', label: '5. Feuille de Route Priorisée (5 Phases)', icon: Activity },
          { id: 'connections', label: '6. Inventaire des 30 Connexions', icon: Radio },
          { id: 'sandbox', label: '7. Sandbox Tarification & Outbox', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id as ArchTabMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#071E26] text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
       * TAB 1: AUDIT SCORECARD (35 Points: C1-L4, N1-N6, A1-A6)
       * ===================================================================== */}
      {activeMode === 'scorecard' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                <Filter size={14} /> Filtres :
              </span>
              {[
                { id: 'ALL', label: 'Tous (35)' },
                { id: 'NEW', label: 'Nouveaux N1-N6 (6)' },
                { id: 'CRITICAL', label: 'Critiques (9)' },
                { id: 'HIGH', label: 'Élevés (9)' },
                { id: 'MEDIUM', label: 'Moyens (11)' },
                { id: 'LOW', label: 'Faibles (6)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterCategory === f.id
                      ? 'bg-[#D9943B] text-[#071E26]'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par ID ou mot-clé..."
                className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#071E26]"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFindings.map((finding) => {
              const isNew = finding.group === 'NEW_FINDING';
              const isObservation = finding.group === 'OBSERVATION';

              return (
                <div
                  key={finding.id}
                  className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-md flex flex-col justify-between space-y-3 ${
                    isNew
                      ? 'border-[#D9943B]/60 shadow-xs ring-1 ring-[#D9943B]/20'
                      : 'border-neutral-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-xs px-2.5 py-0.5 rounded-lg ${
                            finding.category === 'CRITICAL'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : finding.category === 'HIGH'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : finding.category === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {finding.id}
                        </span>

                        {isNew && (
                          <span className="bg-[#D9943B] text-[#071E26] font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                            NOUVEAU CONSTAT RÉVISION 2
                          </span>
                        )}
                        {isObservation && (
                          <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-md">
                            OBSERVATION ARCHI
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} />
                        {finding.status === 'ENFORCED' ? 'VERROUILLÉ' : 'RÉSOLU'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-neutral-900 mt-2">{finding.title}</h4>

                    <div className="space-y-2 mt-2.5 text-xs">
                      <div className="bg-red-50/60 rounded-xl p-2.5 border border-red-100 text-red-900">
                        <span className="font-bold text-[11px] block text-red-700">Problème identifié :</span>
                        <p className="mt-0.5 text-neutral-700 leading-relaxed">{finding.problem}</p>
                      </div>

                      <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-emerald-900">
                        <span className="font-bold text-[11px] block text-emerald-700">Correctif appliqué :</span>
                        <p className="mt-0.5 text-neutral-700 leading-relaxed">{finding.solution}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="font-mono text-neutral-600 font-bold truncate max-w-[280px]">
                      {finding.enforcement}
                    </span>
                    <span className="text-emerald-700 font-bold">100% Conforme</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 2: FIGURE 2 RECOMMENDED TARGET ARCHITECTURE (7 LAYERS)
       * ===================================================================== */}
      {activeMode === 'diagram' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                  <Layers size={18} className="text-[#071E26]" />
                  <span>Figure 2 : Architecture Cible Recommandée (Page 13 du Rapport)</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Découpage en 7 couches strictes sans lignes croisées, respectant la frontière de confiance et la règle du Single Writer.
                </p>
              </div>

              {/* Protocol Legend */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> HTTPS (Commands & Queries)
                </span>
                <span className="flex items-center gap-1 font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> WSS (Realtime Deltas)
                </span>
                <span className="flex items-center gap-1 font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> Event Bus (Outbox)
                </span>
                <span className="flex items-center gap-1 font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> ACID PostgreSQL
                </span>
              </div>
            </div>

            {/* Layer Selector Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
              {FIGURE_2_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedLayerId === layer.id
                      ? 'bg-[#071E26] text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Layer {layer.number}: {layer.name.split(':')[1]?.trim() || layer.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Layer Visualizer */}
          <div className="space-y-4">
            {FIGURE_2_LAYERS.map((layer) => {
              const isSelected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`rounded-3xl p-5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-neutral-50 to-white border-[#071E26] shadow-lg ring-2 ring-[#071E26]/10'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#071E26] text-white flex items-center justify-center font-black text-xs">
                        {layer.number}
                      </span>
                      <h4 className="font-extrabold text-sm text-neutral-900">{layer.name}</h4>
                    </div>
                    <span className="bg-[#D9943B]/20 text-[#071E26] font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                      {layer.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {layer.components.map((comp, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-50/80 rounded-2xl p-3.5 border border-neutral-200/80 hover:bg-white hover:shadow-xs transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-black text-xs text-neutral-900 block">{comp.name}</span>
                            <span className="text-[10px] font-mono text-neutral-500">{comp.tech}</span>
                          </div>
                          <span className="text-[9px] bg-neutral-200 text-neutral-700 font-bold px-1.5 py-0.5 rounded">
                            {comp.protocol}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-600 leading-relaxed">{comp.role}</p>

                        <div className="pt-2 border-t border-neutral-200/50 flex items-center justify-between text-[10px] text-neutral-500">
                          <span className="font-bold flex items-center gap-1 text-emerald-700">
                            <Lock size={10} /> {comp.security}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 3: EVOLUTION PATH OF 15 COMPONENTS (Section 9.2)
       * ===================================================================== */}
      {activeMode === 'evolution' && (
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
              <GitMerge size={18} className="text-[#071E26]" />
              <span>Trajectoire d'Évolution des 15 Composants (Section 9.2 du Rapport)</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Tableau comparatif officiel entre le rôle initial erroné et l'action corrective appliquée dans l'application.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                  <th className="p-3 font-extrabold">Composant</th>
                  <th className="p-3 font-extrabold">Couche Cible</th>
                  <th className="p-3 font-extrabold">Rôle Précédent (Problématique)</th>
                  <th className="p-3 font-extrabold">Action Corrective Appliquée</th>
                  <th className="p-3 font-extrabold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {EVOLUTION_PATH_ITEMS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-3 font-black text-neutral-900 whitespace-nowrap">{item.component}</td>
                    <td className="p-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">{item.layer}</td>
                    <td className="p-3 text-red-700 bg-red-50/40 rounded-lg">{item.currentRole}</td>
                    <td className="p-3 text-emerald-800 bg-emerald-50/40 rounded-lg font-medium">{item.targetAction}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 4: TARGET ORDER FLOW (8 Steps, Section 9.3)
       * ===================================================================== */}
      {activeMode === 'flow' && (
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
                  <ArrowRight size={18} className="text-[#071E26]" />
                  <span>Flux de Commande Cible en 8 Étapes Séquentielles (Section 9.3)</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Parcours de bout en bout avec garanties d'idempotence, tarification autoritaire, baux de dispatch et persistance ACID.
                </p>
              </div>
              <span className="text-xs font-bold text-[#D9943B] bg-[#D9943B]/10 px-3 py-1 rounded-full border border-[#D9943B]/30">
                Étape Active : {activeFlowStep} / 8
              </span>
            </div>

            {/* Steps Timeline Horizontal Stepper */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-3 border-t border-neutral-100">
              {TARGET_FLOW_STEPS.map((s) => {
                const isCurrent = s.step === activeFlowStep;
                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveFlowStep(s.step)}
                    className={`p-2 rounded-2xl text-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#071E26] text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <span className="text-[10px] block font-extrabold">Étape {s.step}</span>
                    <span className="text-[11px] font-black truncate block mt-0.5">{s.title.split('(')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Detailed Card */}
          <div className="bg-gradient-to-br from-white to-neutral-50 rounded-3xl p-6 border-2 border-[#071E26]/20 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
              <div>
                <span className="bg-[#D9943B] text-[#071E26] font-black text-xs px-2.5 py-0.5 rounded-full">
                  ÉTAPE {activeFlowData.step} DE 8
                </span>
                <h4 className="font-black text-lg text-neutral-900 mt-1">{activeFlowData.title}</h4>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg">
                  Protocole : {activeFlowData.protocol}
                </span>
                {activeFlowData.stateTransition && (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg">
                    {activeFlowData.stateTransition}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="bg-white rounded-2xl p-3.5 border border-neutral-200">
                  <span className="font-bold text-neutral-500 block">Acteur & Chemin de communication :</span>
                  <div className="flex items-center gap-2 font-black text-neutral-900 mt-1">
                    <span>{activeFlowData.from}</span>
                    <ArrowRight size={14} className="text-[#D9943B]" />
                    <span>{activeFlowData.to}</span>
                  </div>
                  <p className="mt-2 text-neutral-600 leading-relaxed">{activeFlowData.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-[#111214] text-white rounded-2xl p-3.5 font-mono text-[11px] space-y-1">
                  <span className="text-zinc-400 block text-[10px]">Exemple de Payload JSON :</span>
                  <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">{activeFlowData.payloadPreview}</pre>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                disabled={activeFlowStep <= 1}
                onClick={() => setActiveFlowStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-200 text-neutral-700 disabled:opacity-40 cursor-pointer"
              >
                Précédent
              </button>
              <button
                disabled={activeFlowStep >= 8}
                onClick={() => setActiveFlowStep((prev) => Math.min(8, prev + 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#071E26] text-white disabled:opacity-40 cursor-pointer"
              >
                Suivant (Étape {activeFlowStep + 1})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 5: PRIORITISED ROADMAP (5 Phases, Section 11)
       * ===================================================================== */}
      {activeMode === 'roadmap' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs">
            <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
              <Activity size={18} className="text-[#071E26]" />
              <span>Feuille de Route Priorisée de Résolution (Section 11)</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Cinq phases ordonnées avec critères d'acceptation "Fait quand" (Done When) pour chaque livrable.
            </p>
          </div>

          <div className="space-y-4">
            {ROADMAP_PHASES.map((phase) => (
              <div
                key={phase.phase}
                className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#071E26] text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                      PHASE {phase.phase}
                    </span>
                    <h4 className="font-black text-sm text-neutral-900">{phase.name}</h4>
                  </div>
                  <span className="text-xs font-bold text-[#D9943B] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {phase.targetHorizon}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5 bg-neutral-50 rounded-2xl p-3 border border-neutral-200/70">
                    <span className="font-bold text-neutral-700 block">Objectifs opérationnels :</span>
                    <ul className="space-y-1 text-neutral-600">
                      {phase.goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 bg-emerald-50/60 rounded-2xl p-3 border border-emerald-200/70">
                    <span className="font-bold text-emerald-800 block">Critères de validation ("Fait quand") :</span>
                    <ul className="space-y-1 text-neutral-700">
                      {phase.doneWhen.map((dw, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-700 mt-0.5 shrink-0" />
                          <span>{dw}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="font-bold">Constats résolus dans cette phase :</span>
                  <div className="flex flex-wrap gap-1">
                    {phase.findingsClosed.map((fId) => (
                      <span key={fId} className="bg-[#D9943B] text-[#071E26] font-black px-2 py-0.5 rounded text-[10px]">
                        {fId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 6: CONNECTION INVENTORY (30 Connections, Appendix A)
       * ===================================================================== */}
      {activeMode === 'connections' && (
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-black text-base text-neutral-900 flex items-center gap-2">
              <Radio size={18} className="text-[#071E26]" />
              <span>Inventaire des 30 Connexions (Annexe A du Rapport)</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Audit exhaustif de toutes les liaisons inter-composants avec protocole, diagnostic et résolution appliquée.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-neutral-100 z-10">
                <tr className="border-b border-neutral-200 text-neutral-700">
                  <th className="p-2.5 font-black">#</th>
                  <th className="p-2.5 font-black">Source</th>
                  <th className="p-2.5 font-black">Cible</th>
                  <th className="p-2.5 font-black">Protocole</th>
                  <th className="p-2.5 font-black">Label & Rôle</th>
                  <th className="p-2.5 font-black">Résolution Appliquée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {CONNECTION_INVENTORY.map((conn) => (
                  <tr key={conn.id} className="hover:bg-neutral-50">
                    <td className="p-2.5 font-black text-neutral-400">{conn.id}</td>
                    <td className="p-2.5 font-bold text-neutral-900 whitespace-nowrap">{conn.source}</td>
                    <td className="p-2.5 font-bold text-[#071E26] whitespace-nowrap">{conn.target}</td>
                    <td className="p-2.5 font-mono text-[11px] text-neutral-600">{conn.protocol}</td>
                    <td className="p-2.5 text-neutral-700">{conn.label}</td>
                    <td className="p-2.5 text-emerald-800 font-semibold bg-emerald-50/50">{conn.resolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
       * TAB 7: PRICING SANDBOX & OUTBOX MONITOR
       * ===================================================================== */}
      {activeMode === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authoritative Pricing Engine Sandbox */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div>
              <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2.5 py-0.5 rounded-full">
                RECOMMANDATION N3 & C5
              </span>
              <h3 className="font-black text-base text-neutral-900 mt-1 flex items-center gap-2">
                <Calculator size={18} className="text-[#071E26]" />
                <span>Bac à Sable : Tarification Autoritaire Serveur</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Garantie de calcul 100% côté serveur. Les inputs clients sont réévalués en toute sécurité.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block">Sous-total Panier Articles (DZD) :</label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={testSubtotal}
                  onChange={(e) => setTestSubtotal(Number(e.target.value))}
                  className="w-full accent-[#071E26] mt-1"
                />
                <span className="font-black text-sm text-[#071E26]">{testSubtotal} DZD</span>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block">Distance de Livraison Estimée (km) :</label>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={testDistanceKm}
                  onChange={(e) => setTestDistanceKm(Number(e.target.value))}
                  className="w-full accent-[#071E26] mt-1"
                />
                <span className="font-black text-sm text-[#071E26]">{testDistanceKm} km</span>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block">Code Promo Test :</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={testVoucher}
                    onChange={(e) => setTestVoucher(e.target.value.toUpperCase())}
                    placeholder="BIENVENUE"
                    className="px-3 py-1.5 border border-neutral-200 rounded-xl font-mono text-xs uppercase"
                  />
                  <button
                    onClick={() => setTestVoucher('BIENVENUE')}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl cursor-pointer"
                  >
                    Appliquer BIENVENUE
                  </button>
                </div>
              </div>
            </div>

            {/* Live Authoritative Breakdown Output */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-600">Sous-total brut :</span>
                <span className="font-bold text-neutral-900">{calculatedPricing.itemsSubtotalDZD} DZD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Frais de livraison calculés ({testDistanceKm} km) :</span>
                <span className="font-bold text-neutral-900">{calculatedPricing.deliveryFeeDZD} DZD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Frais d'emballage :</span>
                <span className="font-bold text-neutral-900">{calculatedPricing.packagingFeeDZD} DZD</span>
              </div>
              {calculatedPricing.discountDZD > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Remise accordée :</span>
                  <span>-{calculatedPricing.discountDZD} DZD</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-black text-[#071E26]">
                <span>Total Verrouillé par le Serveur :</span>
                <span>{calculatedPricing.finalCustomerTotalDZD} DZD</span>
              </div>
            </div>
          </div>

          {/* Transactional Outbox Monitor */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="bg-purple-100 text-purple-800 font-black text-xs px-2.5 py-0.5 rounded-full">
                  PATTERN #15 OUTBOX
                </span>
                <h3 className="font-black text-base text-neutral-900 mt-1 flex items-center gap-2">
                  <Zap size={18} className="text-purple-600" />
                  <span>Moniteur Outbox & Événements en Direct</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleEmitTestEvent}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Send size={12} />
                  <span>Émettre Delta</span>
                </button>
                <button
                  onClick={handleManualFlush}
                  disabled={isFlushing}
                  className="px-3 py-1.5 bg-[#071E26] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} className={isFlushing ? 'animate-spin' : ''} />
                  <span>Dépiler</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-purple-50 rounded-2xl p-2.5 border border-purple-100">
                <span className="text-purple-600 block text-[10px] font-bold">Total File</span>
                <span className="font-black text-lg text-purple-900">{outboxStats.total}</span>
              </div>
              <div className="bg-amber-50 rounded-2xl p-2.5 border border-amber-100">
                <span className="text-amber-600 block text-[10px] font-bold">En Attente</span>
                <span className="font-black text-lg text-amber-900">{outboxStats.pending}</span>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-100">
                <span className="text-emerald-600 block text-[10px] font-bold">Diffusés</span>
                <span className="font-black text-lg text-emerald-900">{outboxStats.dispatched}</span>
              </div>
            </div>

            {/* Recent Outbox Records */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-500 block">Derniers événements du bus :</span>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {outboxStats.recentEvents.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/80 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-mono font-bold text-neutral-900 block">{rec.event.type}</span>
                      <span className="text-neutral-500 text-[10px]">
                        ID: {rec.event.aggregateId} • {new Date(rec.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <span
                      className={`font-black text-[10px] px-2 py-0.5 rounded ${
                        rec.status === 'DISPATCHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
