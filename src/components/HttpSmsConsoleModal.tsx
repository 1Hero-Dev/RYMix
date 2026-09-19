import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Settings,
  RefreshCw,
  Clock,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  httpSmsService,
  HttpSmsConfig,
  SmsLogEntry,
} from '../services/httpSmsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HttpSmsConsoleModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<HttpSmsConfig>(httpSmsService.getConfig());
  const [logs, setLogs] = useState<SmsLogEntry[]>(httpSmsService.getLogs());
  const [activeTab, setActiveTab] = useState<'console' | 'config' | 'logs'>('console');

  // Test send form
  const [testRecipient, setTestRecipient] = useState('+213 550 12 34 56');
  const [testMessage, setTestMessage] = useState(
    'RYM SuperApp Ahmed Rachedi : Test de la passerelle open-source HTTP-SMS réussi sur le réseau 43 !'
  );
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-subscribe to new SMS logs
  useEffect(() => {
    const unsubscribe = httpSmsService.onNewLog((newLog) => {
      setLogs(httpSmsService.getLogs());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    httpSmsService.saveConfig(config);
    setSendResult({ success: true, message: 'Paramètres HTTP-SMS enregistrés avec succès !' });
    setTimeout(() => setSendResult(null), 3000);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient.trim() || !testMessage.trim()) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await httpSmsService.sendSms(testRecipient, testMessage, 'TEST');
      setSendResult({
        success: res.success,
        message:
          res.status === 'SENT'
            ? '✓ SMS transmis à la carte SIM Android avec succès !'
            : '✓ SMS simulé avec succès (journalisé dans la console)',
      });
      setLogs(httpSmsService.getLogs());
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err?.message || "Échec d'envoi via la passerelle HTTP-SMS",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-[#18191B] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-[#00B578] flex items-center justify-center border border-emerald-500/30 shadow-xs">
              <Smartphone size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Passerelle Open-Source HTTP-SMS</h2>
                <span className="text-[10px] bg-emerald-500/20 text-[#00B578] px-1.5 py-0.5 rounded font-mono font-bold">
                  SIM Algérie (0 DZD)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Envoi de SMS direct via smartphone Android (Mobilis / Djezzy / Ooredoo)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('console')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'console'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Send size={13} />
            <span>Test & Envoi Direct</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Clock size={13} />
            <span>Journal ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#D9943B] text-[#D9943B]'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Settings size={13} />
            <span>Configuration Passerelle</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Notification banner */}
          {sendResult && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                sendResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {sendResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{sendResult.message}</span>
            </div>
          )}

          {/* TAB 1: Console / Test Direct */}
          {activeTab === 'console' && (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <Radio size={14} className="text-emerald-400 animate-pulse" />
                    <span>Statut Passerelle Android</span>
                  </span>
                  <span className="bg-emerald-500/20 text-[#00B578] font-bold px-2 py-0.5 rounded text-[10px]">
                    Actif • {config.gatewayType === 'android_local_apk' ? 'APK Local' : 'Relais Ouvert'}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  L'application utilise le projet open-source <strong>http-sms</strong> installé sur un
                  téléphone Android dédié avec carte SIM locale à Ahmed Rachedi. Zéro frais par SMS envoyé aux
                  clients et livreurs.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-zinc-400 font-mono bg-black/40 px-2 py-1 rounded">
                    URL: {config.gatewayUrl}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono bg-black/40 px-2 py-1 rounded">
                    SIM: {config.senderPhone}
                  </span>
                </div>
              </div>

              {/* Formulaire de Test */}
              <form onSubmit={handleSendTest} className="space-y-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Numéro de Téléphone Destinataire (Algérie)
                  </label>
                  <input
                    type="text"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="+213 550 12 34 56 ou 0550123456"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono placeholder:text-zinc-500 focus:outline-none focus:border-[#D9943B]"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Supporte Mobilis (06), Djezzy (07), Ooredoo (05)
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Message SMS</label>
                  <textarea
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D9943B] resize-none"
                  />
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-0.5">
                    <span>Format: GSM-7 standard (160 caractères)</span>
                    <span>{testMessage.length} caractères</span>
                  </div>
                </div>

                {/* Templates rapides */}
                <div>
                  <span className="text-zinc-400 font-bold text-[11px] block mb-1.5">
                    Modèles Prêts pour Wilaya 43 :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setTestMessage(
                          'RYM SuperApp Ahmed Rachedi : Votre code OTP est 839201. Valable 5 min.'
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] border border-white/10"
                    >
                      🔑 Code OTP
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTestMessage(
                          'RYM SuperApp : Commande #RYM-42 validée chez Boulangerie El Manar ! En préparation.'
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] border border-white/10"
                    >
                      🥐 Commande Validée
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTestMessage(
                          'RYM SuperApp : Le coursier Walid M. est en route vers Centre-Ville Ahmed Rachedi ! ETA: 8 min.'
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px] border border-white/10"
                    >
                      🛵 Livreur en Route
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 rounded-xl bg-[#D9943B] hover:bg-[#E5A34C] text-[#071E26] font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Transmission vers SIM Android...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Envoyer le SMS via la Passerelle HTTP</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Logs d'envois */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Derniers SMS Traités</span>
                <button
                  onClick={() => {
                    httpSmsService.clearLogs();
                    setLogs([]);
                  }}
                  className="text-zinc-500 hover:text-rose-400 text-[10px]"
                >
                  Effacer l'historique
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">Aucun SMS envoyé pour le moment.</div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-white font-bold text-xs">{log.recipient}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              log.status === 'SENT'
                                ? 'bg-emerald-500/20 text-[#00B578]'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-zinc-500 text-[10px]">{log.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-snug">{log.message}</p>
                      {log.details && (
                        <span className="text-[9px] text-zinc-500 block font-mono">
                          {log.details}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Configuration de la Passerelle */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Type de Passerelle</label>
                  <select
                    value={config.gatewayType}
                    onChange={(e) =>
                      setConfig({ ...config, gatewayType: e.target.value as any })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D9943B]"
                  >
                    <option value="android_local_apk">
                      Smartphone Android Local (Application HTTP-SMS APK sur WiFi)
                    </option>
                    <option value="httpsms_gateway">
                      Serveur Relais Open-Source HTTP-SMS (Cloud / VPS)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Adresse IP / URL de la Passerelle
                  </label>
                  <input
                    type="text"
                    value={config.gatewayUrl}
                    onChange={(e) => setConfig({ ...config, gatewayUrl: e.target.value })}
                    placeholder="http://192.168.1.100:8080/send"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D9943B]"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Adresse IP du téléphone Android sur le réseau local du bureau/restaurant à Ahmed Rachedi
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Numéro de Téléphone de la Carte SIM Expéditrice
                  </label>
                  <input
                    type="text"
                    value={config.senderPhone}
                    onChange={(e) => setConfig({ ...config, senderPhone: e.target.value })}
                    placeholder="+213 550 12 34 56"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D9943B]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Clé API (Optionnelle)</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="rym_secret_key"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D9943B]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <span className="font-bold text-white block">Mode Repli Simulation</span>
                    <span className="text-[10px] text-zinc-400">
                      En cas de coupure WiFi sur le téléphone, journaliser localement sans planter
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.fallbackToSimulation}
                    onChange={(e) =>
                      setConfig({ ...config, fallbackToSimulation: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full py-2.5 rounded-xl bg-[#00B578] hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Enregistrer la Configuration</span>
                </button>
              </div>

              {/* Guide open-source */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldCheck size={14} />
                  <span>Comment déployer l'APK HTTP-SMS en Algérie :</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>Prendre un smartphone Android dédié avec une puce Mobilis/Djezzy illimitée.</li>
                  <li>Installer l'application open-source HTTP-SMS (ou thedevs-network/http-sms APK).</li>
                  <li>Activer le service HTTP dans l'application Android et noter l'adresse IP locale.</li>
                  <li>Renseigner l'adresse IP ci-dessus pour router tous les SMS via la puce sans frais tiers.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-zinc-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-[#D9943B]" />
            <span>Open Source • Zero Coût par SMS</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
