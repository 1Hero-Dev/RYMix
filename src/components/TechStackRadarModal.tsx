import React, { useState, useEffect } from 'react';
import {
  Server,
  Radio,
  MapPin,
  Banknote,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Activity,
  X,
  Link,
  RefreshCw,
  Zap,
  Smartphone,
  Layers,
} from 'lucide-react';
import { LAUNCH_MAX_RADIUS_METERS } from '../utils/orderStateMachine';
import {
  localRealtimeDispatchService,
  LocalCourierTelemetryPing,
  DEFAULT_DEV_DATABASE_URL,
  DEFAULT_DEV_REALTIME_HTTP_URL,
  DEFAULT_DEV_REALTIME_WS_URL,
} from '../utils/localRealtimeSimulator';
import { mobileBffClient } from '../services/mobileBffClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TechStackRadarModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'radar' | 'prisma' | 'urls' | 'cod' | 'bff'>('urls');
  const [testDistance, setTestDistance] = useState<number>(1450);
  const [couriers, setCouriers] = useState<LocalCourierTelemetryPing[]>([]);
  const [dbUrl, setDbUrl] = useState(localRealtimeDispatchService.getDatabaseUrl());
  const [realtimeUrl, setRealtimeUrl] = useState(localRealtimeDispatchService.getRealtimeDispatchUrl());
  const [urlSavedNotification, setUrlSavedNotification] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribeCouriers = localRealtimeDispatchService.subscribe((updated) => {
      setCouriers([...updated]);
    });
    const unsubscribeConfig = localRealtimeDispatchService.subscribeConfig((cfg) => {
      setDbUrl(cfg.databaseUrl);
      setRealtimeUrl(cfg.realtimeDispatchUrl);
    });
    return () => {
      unsubscribeCouriers();
      unsubscribeConfig();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isTestDistanceWithin = testDistance <= LAUNCH_MAX_RADIUS_METERS;

  const handleSaveUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    await localRealtimeDispatchService.saveRemoteConfig(dbUrl, realtimeUrl);
    setUrlSavedNotification(true);
    setTimeout(() => setUrlSavedNotification(false), 3000);
  };

  const handleResetDefaultUrls = async () => {
    setDbUrl(DEFAULT_DEV_DATABASE_URL);
    setRealtimeUrl(DEFAULT_DEV_REALTIME_HTTP_URL);
    await localRealtimeDispatchService.saveRemoteConfig(DEFAULT_DEV_DATABASE_URL, DEFAULT_DEV_REALTIME_HTTP_URL);
    setUrlSavedNotification(true);
    setTimeout(() => setUrlSavedNotification(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[440px] max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-black/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#071E26] text-white p-4 shrink-0 flex items-center justify-between border-b border-[#EADBCE]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D9943B] text-[#071E26] flex items-center justify-center font-black text-sm">
              ⚡
            </div>
            <div>
              <h2 className="font-bold text-[14px] text-white flex items-center gap-1.5">
                Architecture & Dispatch 2.0 km
                <span className="text-[10px] bg-[#D9943B]/20 text-[#E5A34C] border border-[#D9943B]/30 px-1.5 py-0.2 rounded-full font-mono">
                  Ahmed Rachedi
                </span>
              </h2>
              <p className="text-[10px] text-[#648692]">Prisma (PostgreSQL) + Go Telemetry In-Memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#648692] hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Sub-nav Tabs */}
        <div className="bg-[#F8F4EC] p-1.5 flex gap-1 border-b border-[#EADBCE] text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('urls')}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'urls' ? 'bg-[#0A2B35] text-[#D9943B] shadow-xs' : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Link size={13} />
            <span>Config URLs</span>
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'radar' ? 'bg-[#0A2B35] text-[#D9943B] shadow-xs' : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Radio size={13} />
            <span>Radar Go (2km)</span>
          </button>
          <button
            onClick={() => setActiveTab('prisma')}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'prisma' ? 'bg-[#0A2B35] text-[#D9943B] shadow-xs' : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Database size={13} />
            <span>Prisma / DB</span>
          </button>
          <button
            onClick={() => setActiveTab('stack')}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'stack' ? 'bg-[#0A2B35] text-[#D9943B] shadow-xs' : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Server size={13} />
            <span>Stack Tech</span>
          </button>
          <button
            onClick={() => setActiveTab('cod')}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'cod' ? 'bg-[#0A2B35] text-[#D9943B] shadow-xs' : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Banknote size={13} />
            <span>COD Launch</span>
          </button>
          <button
            onClick={() => setActiveTab('bff')}
            className={`py-1.5 px-2 rounded-xl font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'bff' ? 'bg-[#0A2B35] text-[#00B578] shadow-xs' : 'text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Smartphone size={13} />
            <span>BFF Mobile</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-zinc-800">
          
          {/* TAB: CONFIG URLS (Local real-time dispatch & Database connection strings) */}
          {activeTab === 'urls' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5">
                <Zap size={18} className="text-[#B02F00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">Configuration Locale & URL Placeholders</h4>
                  <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                    L'application tourne avec le simulateur local de télémétrie Go et le mock relationnel Prisma. Les vraies URLs de production seront injectées via variables d'environnement.
                  </p>
                </div>
              </div>

              {urlSavedNotification && (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] flex items-center gap-1.5 font-medium animate-in fade-in">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Paramètres et URLs locales mis à jour avec succès !</span>
                </div>
              )}

              <form onSubmit={handleSaveUrls} className="space-y-3">
                {/* Database URL Field */}
                <div className="p-3 bg-white border border-neutral-200 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                      <Database size={13} className="text-blue-600" />
                      DATABASE_URL (PostgreSQL / Prisma)
                    </label>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      PostgreSQL
                    </span>
                  </div>
                  <input
                    type="text"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    placeholder="postgresql://user:pass@host:5432/db"
                    className="w-full font-mono text-[10px] p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                    <span>Dev local : localhost:5432</span>
                    <span className="text-emerald-700 font-semibold">Schéma: mila_delivery_db</span>
                  </div>
                </div>

                {/* Real-time Dispatch URL Field */}
                <div className="p-3 bg-white border border-neutral-200 rounded-2xl space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                      <Radio size={13} className="text-cyan-600" />
                      REALTIME_DISPATCH_URL (Go Service)
                    </label>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
                      Go RAM Hub
                    </span>
                  </div>
                  <input
                    type="text"
                    value={realtimeUrl}
                    onChange={(e) => setRealtimeUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="w-full font-mono text-[10px] p-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-500 pt-0.5">
                    <div className="bg-neutral-50 p-1.5 rounded">
                      <span className="text-[9px] block text-zinc-400 font-bold">WebSocket URL</span>
                      <span className="font-mono text-zinc-700">{realtimeUrl.replace('http://', 'ws://')}/ws</span>
                    </div>
                    <div className="bg-neutral-50 p-1.5 rounded">
                      <span className="text-[9px] block text-zinc-400 font-bold">SSE Stream</span>
                      <span className="font-mono text-zinc-700">/api/v1/telemetry/stream</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#0A2B35] hover:bg-[#114250] text-[#D9943B] font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={13} />
                    <span>Sauvegarder URLs</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaultUrls}
                    className="px-3 py-2 rounded-xl bg-[#F8F4EC] hover:bg-[#EADBCE] text-[#0A2B35] font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Réinitialiser URLs par défaut"
                  >
                    <RefreshCw size={12} />
                    <span>Reset</span>
                  </button>
                </div>
              </form>

              {/* Status checklist */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-1.5 text-[11px]">
                <span className="font-bold text-zinc-900 block text-xs">Statut des Composants Découplés :</span>
                <div className="flex items-center justify-between text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Simulateur Dispatch In-Memory Go (Ahmed Rachedi)
                  </span>
                  <span className="font-bold text-emerald-700 text-[10px]">ACTIF (2.5s)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Calculateur Géofence Strict 2.0 km
                  </span>
                  <span className="font-bold text-emerald-700 text-[10px]">EN VIGUEUR</span>
                </div>
                <div className="flex items-center justify-between text-zinc-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    PostgreSQL Réseau Distant
                  </span>
                  <span className="font-bold text-amber-800 text-[10px]">LOCAL DEV (READY)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GO REAL-TIME RADAR & 2KM GEOFENCE */}
          {activeTab === 'radar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">Radar Coursiers en Mémoire (RAM)</h4>
                  <p className="text-[10px] text-zinc-500">Ahmed Rachedi (Ref: 36.4503, 6.2649)</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Hub Actif (2.5s tick)
                </span>
              </div>

              {/* Dynamic Live Courier Table */}
              <div className="space-y-1.5">
                {(couriers.length > 0 ? couriers : [
                  {
                    courierId: 'courier-walid',
                    name: 'Walid M.',
                    vehicle: 'Scooter SYM Jet 14',
                    distMeters: 480,
                    speedKmh: 24,
                    freshness: 'LIVE',
                    eligible2KmRadius: true,
                    activeOrders: 0,
                  },
                ]).map((c: any) => {
                  const dist = c.distanceToMilaCenterMeters ?? c.distMeters ?? 500;
                  const isEligible = dist <= LAUNCH_MAX_RADIUS_METERS;
                  return (
                    <div
                      key={c.courierId || c.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isEligible
                          ? 'bg-white border-neutral-200 shadow-xs'
                          : 'bg-neutral-50/80 border-dashed border-red-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${c.freshness === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <div>
                          <div className="font-bold text-xs text-zinc-900 flex items-center gap-1">
                            {c.name}
                            <span className="text-[9px] text-zinc-400 font-normal">({c.vehicle})</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                            <span>{dist} m du centre</span>
                            <span>•</span>
                            <span>{c.speedKmh} km/h</span>
                            <span>•</span>
                            <span className="text-zinc-400 font-mono">
                              {c.activeOrders === 0 ? 'Disponible' : `${c.activeOrders} course`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isEligible ? (
                          <div>
                            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                              ≤ 2.0 km
                            </span>
                            <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">Éligible Rachedi</div>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[9px] font-mono bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-200">
                              {(dist / 1000).toFixed(1)} km
                            </span>
                            <div className="text-[9px] text-red-600 font-medium mt-0.5">&gt; 2,0 km exclu</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Distance Geofence Simulator */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-900 text-xs">Simulateur Géofence ~2.0 km</span>
                  <span className={`font-mono text-xs font-extrabold ${isTestDistanceWithin ? 'text-emerald-700' : 'text-red-600'}`}>
                    {(testDistance / 1000).toFixed(2)} km
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="3500"
                  step="50"
                  value={testDistance}
                  onChange={(e) => setTestDistance(Number(e.target.value))}
                  className="w-full accent-[#D9943B]"
                />
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Centre (0.3 km)</span>
                  <span className="font-bold text-amber-700">Seuil Lancement (2.0 km)</span>
                  <span>Périphérie (3.5 km)</span>
                </div>

                <div className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                  isTestDistanceWithin
                    ? 'bg-emerald-100/70 text-emerald-950 border border-emerald-200'
                    : 'bg-red-100/70 text-red-950 border border-red-200'
                }`}>
                  {isTestDistanceWithin ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Adresse éligible à la livraison rapide (≤ 2000 m). Dispatch Go autorisé.</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-red-600 shrink-0" />
                      <span>Hors périmètre : Rejet Fastify avec code OPERATIONAL_RADIUS_EXCEEDED.</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRISMA / POSTGRESQL SCHEMA */}
          {activeTab === 'prisma' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                <span className="font-bold text-zinc-900 text-xs">prisma/schema.prisma</span>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                  PostgreSQL 16
                </span>
              </div>

              <div className="p-3 bg-neutral-900 text-zinc-200 rounded-2xl font-mono text-[10px] leading-relaxed overflow-x-auto space-y-2">
                <div className="text-zinc-500">// Snapshot d'achat immuable pour audit financier</div>
                <div>
                  <span className="text-purple-400">model</span> <span className="text-amber-300">OrderItem</span> {'{'}
                  <div className="pl-3 text-zinc-300">
                    id <span className="text-cyan-400">String</span> @id @default(uuid())<br />
                    orderId <span className="text-cyan-400">String</span><br />
                    productNameSnapshot <span className="text-cyan-400">String</span><br />
                    unitPriceSnapshot <span className="text-cyan-400">Int</span> <span className="text-zinc-500">// DZD</span><br />
                    optionsSnapshotJson <span className="text-cyan-400">Json?</span><br />
                    subtotalSnapshot <span className="text-cyan-400">Int</span>
                  </div>
                  {'}'}
                </div>

                <div className="pt-1 text-zinc-500">// Entité Delivery découplée & Périmètre 2km</div>
                <div>
                  <span className="text-purple-400">model</span> <span className="text-amber-300">Delivery</span> {'{'}
                  <div className="pl-3 text-zinc-300">
                    id <span className="text-cyan-400">String</span> @id<br />
                    status <span className="text-cyan-400">DeliveryStatus</span><br />
                    distanceMeters <span className="text-cyan-400">Int</span> <span className="text-zinc-500">// &lt;= 2000m</span><br />
                    feeSnapshot <span className="text-cyan-400">Int</span><br />
                    dispatchedAt <span className="text-cyan-400">DateTime?</span>
                  </div>
                  {'}'}
                </div>

                <div className="pt-1 text-zinc-500">// Clé d'idempotence & Traçabilité statuts</div>
                <div>
                  <span className="text-purple-400">model</span> <span className="text-amber-300">Order</span> {'{'}
                  <div className="pl-3 text-zinc-300">
                    idempotencyKey <span className="text-cyan-400">String</span> @unique<br />
                    paymentMethod <span className="text-cyan-400">PaymentMethod</span> @default(COD)<br />
                    paymentStatus <span className="text-cyan-400">PaymentStatus</span> @default(UNPAID)
                  </div>
                  {'}'}
                </div>
              </div>

              <p className="text-[10px] text-zinc-500">
                Fichier source complet disponible sous <code className="font-mono text-zinc-700 bg-neutral-100 px-1 rounded">/prisma/schema.prisma</code>.
              </p>
            </div>
          )}

          {/* TAB 4: STACK TECH */}
          {activeTab === 'stack' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#B02F00] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-zinc-900 text-xs">Direction Technique Validée</h4>
                  <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                    Architecture hybride découplée pour garantir des performances optimales à Ahmed Rachedi :
                  </p>
                </div>
              </div>

              {/* Point 1: Backend */}
              <div className="p-3 bg-white border border-neutral-200 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    1. Backend API & Persistance
                  </span>
                  <span className="text-[10px] font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-zinc-600">
                    TypeScript
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                  <div className="bg-neutral-50 p-2 rounded-lg">
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold">Framework</span>
                    <span className="font-bold text-zinc-800">Fastify</span> (High-throughput)
                  </div>
                  <div className="bg-neutral-50 p-2 rounded-lg">
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold">ORM & DB</span>
                    <span className="font-bold text-zinc-800">Prisma + PostgreSQL</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 pt-1">
                  • Schémas relationnels avec snapshots de prix d'achat et clés d'idempotence.
                </p>
              </div>

              {/* Point 2: Go Real-Time Service */}
              <div className="p-3 bg-white border border-neutral-200 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    2. Service Temps-Réel (Go)
                  </span>
                  <span className="text-[10px] font-mono bg-cyan-50 text-cyan-800 px-1.5 py-0.5 rounded">
                    Go 1.23+
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Service dédié léger stockant les coordonnées GPS des livreurs <strong>en mémoire RAM</strong> (<code className="font-mono text-zinc-700 bg-neutral-100 px-1 rounded">sync.RWMutex</code>), évitant d'engorger PostgreSQL lors des pings toutes les 2–3s.
                </p>
                <div className="bg-cyan-50/60 p-2 rounded-xl text-[10px] text-cyan-900 font-medium">
                  • Formule Haversine sub-milliseconde & diffusion SSE / WebSocket.
                </div>
              </div>

              {/* Point 3: Operational Radius & COD */}
              <div className="p-3 bg-white border border-neutral-200 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    3. Périmètre & Paiement Lancement
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                    Périmètre ~2,0 km
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  • <strong>Rayon d'action :</strong> 2 000 mètres stricts autour du centre d'Ahmed Rachedi pour garantir une livraison chaude en moins de 20 minutes.
                  <br />
                  • <strong>Paiement au lancement :</strong> 100% Cash on Delivery (Espèces DZD à la remise), réconcilié instantanément avec le livreur.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: COD AT LAUNCH */}
          {activeTab === 'cod' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
                <Banknote size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">Paiement Espèces (COD) au Lancement</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Priorité absolue donnée à la simplicité et à la confiance locale à Ahmed Rachedi. Zéro friction de carte bancaire au lancement.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-zinc-700 text-xs">Devise exclusive</span>
                  <span className="font-bold text-zinc-900 bg-neutral-100 px-2 py-0.5 rounded">Dinar Algérien (DZD)</span>
                </div>
                <div className="p-2.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-zinc-700 text-xs">Encaissement livreur</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    Validation à la remise
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-zinc-700 text-xs">Passerelles électroniques</span>
                  <span className="text-[10px] font-semibold text-zinc-500 bg-amber-50 text-amber-900 border border-amber-200/50 px-2 py-0.5 rounded">
                    Phase 2 (CIB / EDAHABIA)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-zinc-600 space-y-1">
                <span className="font-bold text-zinc-900 block">Workflow d'encaissement COD :</span>
                <div>1. Client prépare la monnaie exacte indiquée sur l'écran.</div>
                <div>2. Le livreur valide la remise du sac scellé et la collecte des espèces.</div>
                <div>3. La transition d'état passe immédiatement à <code className="font-mono bg-white px-1 border rounded">COLLECTED</code> avec audit log.</div>
              </div>
            </div>
          )}

          {/* TAB 6: BACKEND-FOR-FRONTEND (BFF) MOBILE */}
          {activeTab === 'bff' && (
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
                <Smartphone size={20} className="text-[#00B578] shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-emerald-950 text-xs">
                      Passerelle BFF Mobile (Backend-for-Frontend)
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                      Port 3000 /api/bff/mobile
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Couche intermédiaire consolidée : 1 seule requête d'accueil au lieu de 4, économie de 68% de bande passante cellulaire et revalidation HTTP ETag (304).
                  </p>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white border border-neutral-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Consolidation</span>
                  <div className="text-sm font-extrabold text-zinc-900">1 aller-retour</div>
                  <p className="text-[10px] text-zinc-500">Home + Promos + Commerces + Fidélité</p>
                </div>
                <div className="p-2.5 bg-white border border-neutral-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Optimisation Données</span>
                  <div className="text-sm font-extrabold text-emerald-600">~68% d'économie</div>
                  <p className="text-[10px] text-zinc-500">Payload allégé pour terminaux 3G/4G</p>
                </div>
              </div>

              {/* Endpoints List */}
              <div className="p-3 bg-white border border-neutral-200 rounded-2xl space-y-2">
                <span className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                  <Layers size={13} className="text-[#00B578]" />
                  Endpoints Actifs Montés sur le Serveur :
                </span>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="p-1.5 bg-neutral-50 rounded border border-neutral-100 flex items-center justify-between">
                    <span className="text-blue-700 font-bold">GET /api/bff/mobile/home</span>
                    <span className="text-zinc-500 font-sans text-[10px]">Flux d'accueil consolidé + ETag</span>
                  </div>
                  <div className="p-1.5 bg-neutral-50 rounded border border-neutral-100 flex items-center justify-between">
                    <span className="text-blue-700 font-bold">GET /api/bff/mobile/config</span>
                    <span className="text-zinc-500 font-sans text-[10px]">Handshake version & Wilaya 43</span>
                  </div>
                  <div className="p-1.5 bg-neutral-50 rounded border border-neutral-100 flex items-center justify-between">
                    <span className="text-emerald-700 font-bold">POST /api/bff/mobile/quote</span>
                    <span className="text-zinc-500 font-sans text-[10px]">Devis panier certifié DZD</span>
                  </div>
                  <div className="p-1.5 bg-neutral-50 rounded border border-neutral-100 flex items-center justify-between">
                    <span className="text-emerald-700 font-bold">POST /api/bff/mobile/checkout</span>
                    <span className="text-zinc-500 font-sans text-[10px]">Commande unique idempotente</span>
                  </div>
                  <div className="p-1.5 bg-neutral-50 rounded border border-neutral-100 flex items-center justify-between">
                    <span className="text-blue-700 font-bold">GET /api/bff/mobile/orders/:id/live-status</span>
                    <span className="text-zinc-500 font-sans text-[10px]">Suivi temps-réel coursier</span>
                  </div>
                </div>
              </div>

              {/* Interactive test trigger */}
              <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                <span className="text-[11px] text-zinc-600">
                  Tester la réponse en direct :
                </span>
                <button
                  onClick={async () => {
                    try {
                      const res = await mobileBffClient.getMobileHome('all');
                      alert(`[BFF Mobile Test Réussi !]\nLatence: ${res.latencyMs}ms\nCommerces: ${res.data.stores.length}\nÉconomie estimée: ${res.data.meta.networkDataSavings}\nCache ETag: ${res.fromCache ? 'OUI (304)' : 'NON (200)'}`);
                    } catch (e: any) {
                      alert('Erreur BFF: ' + e.message);
                    }
                  }}
                  className="px-2.5 py-1 bg-[#00B578] hover:bg-[#009663] text-[#071E26] font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  Tester GET /home
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#F8F4EC] border-t border-[#EADBCE] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#0A2B35] hover:bg-[#114250] text-[#D9943B] font-bold text-xs active:scale-[0.99] transition-all cursor-pointer"
          >
            Fermer le moniteur
          </button>
        </div>

      </div>
    </div>
  );
};
