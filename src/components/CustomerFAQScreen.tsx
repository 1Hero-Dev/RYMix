import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  MapPin,
  Banknote,
  Bike,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronDown,
  MessageSquare,
  HelpCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onOpenChat?: () => void;
}

interface FAQItem {
  id: string;
  category: 'delivery' | 'pricing' | 'cod';
  categoryLabel: string;
  question: string;
  answer: string;
  keyPoints?: string[];
}

const FAQ_ITEMS: FAQItem[] = [
  // 1. Livraison locale à Ahmed Rachedi
  {
    id: 'faq-delivery-zones',
    category: 'delivery',
    categoryLabel: 'Livraison à Ahmed Rachedi',
    question: 'Quels quartiers sont desservis à Ahmed Rachedi ?',
    answer:
      'Notre réseau de coursiers dessert un périmètre de 2,0 km à Ahmed Rachedi : Centre-ville, Cité El Bassatine, Cité En-Nasr, Route Principale et zones de proximité.',
    keyPoints: [
      'Périmètre de lancement de 2,0 km autour du centre d\'Ahmed Rachedi',
      'Dessert le Centre-ville, El Bassatine, En-Nasr et les abords immédiats',
      'Suivi GPS en temps réel sur la carte avec estimation d’arrivée',
    ],
  },
  {
    id: 'faq-delivery-time',
    category: 'delivery',
    categoryLabel: 'Livraison à Ahmed Rachedi',
    question: 'Quels sont les délais moyens de livraison ?',
    answer:
      'La livraison s’effectue en moyenne en 25 à 40 minutes selon le temps de préparation des commerçants et la circulation. Dès que le restaurant valide votre commande, vous suivez chaque étape en direct : confirmation, préparation, prise en charge par le coursier et arrivée à votre porte.',
    keyPoints: [
      '25 à 40 minutes en moyenne',
      'Notification à chaque changement de statut',
      'Contact direct par appel ou chat avec le livreur',
    ],
  },
  {
    id: 'faq-delivery-thermal',
    category: 'delivery',
    categoryLabel: 'Livraison à Ahmed Rachedi',
    question: 'Comment les repas restent-ils chauds et protégés ?',
    answer:
      'Tous les livreurs d\'Ahmed Rachedi utilisent des sacs isothermes certifiés et des scellés adhésifs protecteurs. Les plats chauds (chawarma, tajines, pizzas) et les boissons fraîches sont séparés pour préserver le goût et l’hygiène.',
    keyPoints: [
      'Sacs isothermes renforcés',
      'Scellés de sécurité apposés par le restaurant',
      'Option couverts écologiques disponibles au choix',
    ],
  },

  // 2. Frais et Tarifs de livraison
  {
    id: 'faq-pricing-rates',
    category: 'pricing',
    categoryLabel: 'Tarifs & Frais',
    question: 'Combien coûte la livraison d’une commande à Ahmed Rachedi ?',
    answer:
      'Nos frais de livraison sont fixes et calculés selon la zone sans aucune majoration cachée :',
    keyPoints: [
      '100 DZD pour Ahmed Rachedi Centre-Ville',
      '150 DZD pour les cités résidentielles (El Bassatine, En-Nasr)',
      '200 DZD pour les zones périphériques d\'Ahmed Rachedi',
      '50 DZD de frais d’emballage isotherme de qualité alimentaire',
    ],
  },
  {
    id: 'faq-pricing-free-delivery',
    category: 'pricing',
    categoryLabel: 'Tarifs & Frais',
    question: 'Comment obtenir la livraison 100% gratuite ?',
    answer:
      'La livraison est automatiquement offerte (0 DZD) pour toute commande dont le panier atteint ou dépasse 1 200 DZD. Aucune manipulation n’est requise, la réduction s’applique instantanément lors du récapitulatif du panier.',
    keyPoints: [
      'Livraison offerte dès 1 200 DZD d’achats',
      'Cumulable avec les bons d’achat de fidélité',
      'Économisez 100 à 200 DZD sur chaque repas de groupe',
    ],
  },
  {
    id: 'faq-pricing-transparency',
    category: 'pricing',
    categoryLabel: 'Tarifs & Frais',
    question: 'Y a-t-il des frais cachés ou des majorations météo / pluie ?',
    answer:
      'Non. Nous appliquons une transparence totale des prix. Le montant affiché au moment de valider la commande est le montant exact en Dinars Algériens (DZD) à régler en espèces. Il n’y a aucune tarification dynamique imprévue.',
    keyPoints: [
      'Zéro frais cachés',
      'Pas de surge pricing météo ou de nuit',
      'Ticket numérique détaillé conforme au montant perçu',
    ],
  },

  // 3. Paiement à la livraison (Cash on Delivery - COD)
  {
    id: 'faq-cod-how-it-works',
    category: 'cod',
    categoryLabel: 'Paiement Espèces (COD)',
    question: 'Comment fonctionne le paiement à la livraison (Cash on Delivery) ?',
    answer:
      'Vous n’avez besoin d’aucune carte bancaire ni de compte en ligne. Vous passez votre commande librement, et vous payez en espèces (Dinar Algérien DZD) directement au coursier lorsqu’il vous remet le sac à votre domicile ou bureau.',
    keyPoints: [
      '100% en espèces à la porte, sans carte bancaire',
      'Réglez uniquement quand vous avez votre commande entre les mains',
      'Reçu numérique instantané généré sur l’application',
    ],
  },
  {
    id: 'faq-cod-change',
    category: 'cod',
    categoryLabel: 'Paiement Espèces (COD)',
    question: 'Le coursier peut-il rendre la monnaie sur 1 000 ou 2 000 DZD ?',
    answer:
      'Oui, les coursiers d\'Ahmed Rachedi sont dotés d’un fond de caisse pour rendre la monnaie sur les billets courants (1 000 DZD et 2 000 DZD). Vous pouvez également indiquer une note lors de la commande (ex: « Prévoir monnaie sur 2000 DZD ») pour préparer l’appoint rapidement.',
    keyPoints: [
      'Monnaie rendue sur billets de 1 000 DZD et 2 000 DZD',
      'Champ « Instructions pour le livreur » pour préciser l’appoint',
      'Encaissement rapide et courtois',
    ],
  },
  {
    id: 'faq-cod-verification',
    category: 'cod',
    categoryLabel: 'Paiement Espèces (COD)',
    question: 'Puis-je vérifier ma commande avant de donner l’argent ?',
    answer:
      'Absolument. Vous avez le droit d’inspecter les scellés du sac et de vérifier avec le coursier le numéro de commande et les articles mentionnés sur votre ticket numérique avant de procéder au paiement.',
    keyPoints: [
      'Vérification du sac scellé à la remise',
      'Contrôle du ticket numérique correspondant',
      'En cas d’anomalie, support joignable en 1 clic',
    ],
  },
  {
    id: 'faq-cod-loyalty',
    category: 'cod',
    categoryLabel: 'Paiement Espèces (COD)',
    question: 'Gagne-t-on des points de fidélité en payant en espèces ?',
    answer:
      'Oui ! Le paiement en espèces vous donne droit aux mêmes avantages fidélité : vous cumulez des points à chaque commande, et vous gagnez +50 points supplémentaires à chaque fois que vous notez votre repas et votre coursier.',
    keyPoints: [
      'Points cumulés automatiquement à la livraison',
      '+50 points bonus pour chaque avis vérifié',
      'Bons d’achat débloquables (100 DZD, 200 DZD, 300 DZD)',
    ],
  },
];

export const CustomerFAQScreen: React.FC<Props> = ({ onBack, onOpenChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'delivery' | 'pricing' | 'cod'>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-delivery-zones': true,
    'faq-pricing-rates': true,
    'faq-cod-how-it-works': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.keyPoints && item.keyPoints.some((kp) => kp.toLowerCase().includes(q)))
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div id="customer-faq-screen" className="flex-1 flex flex-col bg-neutral-50 min-h-screen">
      {/* Minimal Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/[0.05] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="faq-btn-back"
              onClick={onBack}
              aria-label="Retour"
              className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 flex items-center justify-center text-zinc-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-extrabold text-[16px] text-zinc-900 leading-tight">
                <span className="sm:hidden">FAQ</span>
                <span className="hidden sm:inline">Foire Aux Questions</span>
              </h1>
              <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                <MapPin size={11} className="text-[#B02F00]" />
                <span className="sm:hidden">Ahmed Rachedi</span>
                <span className="hidden sm:inline">Livraison, Tarifs & Paiement à Ahmed Rachedi</span>
              </p>
            </div>
          </div>

          {onOpenChat && (
            <button
              id="faq-btn-open-chat"
              onClick={onOpenChat}
              className="text-xs font-bold text-zinc-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <MessageSquare size={13} className="text-amber-700" />
              <span className="sm:hidden">Aide</span>
              <span className="hidden sm:inline">Assistance</span>
            </button>
          )}
        </div>

        {/* Minimal Search Field */}
        <div className="mt-3 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="faq-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question, quartier ou tarif..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white rounded-xl border border-transparent focus:border-amber-400 focus:outline-none transition-colors text-zinc-900 placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hover:text-zinc-600 bg-zinc-200 rounded-full px-1.5 py-0.5"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Category Selector Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            id="faq-pill-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0A2B35] text-white'
                : 'bg-[#F8F4EC] text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            Tous les thèmes ({FAQ_ITEMS.length})
          </button>
          <button
            id="faq-pill-delivery"
            onClick={() => setSelectedCategory('delivery')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'delivery'
                ? 'bg-[#D9943B] text-[#071E26] font-bold'
                : 'bg-[#F8F4EC] text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Bike size={12} />
            <span className="sm:hidden">Livraison</span>
            <span className="hidden sm:inline">Livraison Ahmed Rachedi</span>
          </button>
          <button
            id="faq-pill-pricing"
            onClick={() => setSelectedCategory('pricing')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'pricing'
                ? 'bg-[#D9943B] text-[#071E26] font-bold'
                : 'bg-[#F8F4EC] text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Tag size={12} />
            <span>Tarifs & Frais</span>
          </button>
          <button
            id="faq-pill-cod"
            onClick={() => setSelectedCategory('cod')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              selectedCategory === 'cod'
                ? 'bg-[#D9943B] text-[#071E26] font-bold'
                : 'bg-[#F8F4EC] text-[#648692] hover:text-[#0A2B35]'
            }`}
          >
            <Banknote size={12} />
            <span>Paiement Espèces (COD)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-3 pb-20">
        {/* Quick Summary Pill / Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-[#EADBCE] shadow-xs">
            <span className="text-[10px] text-[#648692] block font-medium">Rayon Livraison</span>
            <span className="text-xs font-extrabold text-[#0A2B35] block mt-0.5">2,0 km Rachedi</span>
            <span className="text-[9px] text-[#648692]">Centre & Cités</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#EADBCE] shadow-xs">
            <span className="text-[10px] text-[#648692] block font-medium">Tarif Moyen</span>
            <span className="text-xs font-extrabold text-[#D9943B] block mt-0.5">100 - 150 DZD</span>
            <span className="text-[9px] text-[#0A2B35] font-semibold">Offert dès 1200 DZD</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#EADBCE] shadow-xs">
            <span className="text-[10px] text-[#648692] block font-medium">Mode Paiement</span>
            <span className="text-xs font-extrabold text-[#D91A67] block mt-0.5">100% Espèces</span>
            <span className="text-[9px] text-[#648692]">À la porte (COD)</span>
          </div>
        </div>

        {/* Question Cards List */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#EADBCE] space-y-2">
            <HelpCircle size={28} className="mx-auto text-[#648692]" />
            <p className="text-sm font-bold text-[#0A2B35]">Aucun résultat trouvé</p>
            <p className="text-xs text-[#648692] max-w-xs mx-auto">
              Aucune question ne correspond à « {searchQuery} ». Essayez d’autres mots-clés ou consultez tous les thèmes.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 text-xs font-bold text-[#071E26] bg-[#D9943B] hover:bg-[#E5A34C] px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const isOpen = Boolean(openItems[item.id]);
              return (
                <div
                  key={item.id}
                  id={item.id}
                  className="bg-white rounded-xl border border-[#EADBCE] shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={isOpen}
                    className="w-full px-4 py-3 text-left flex items-start justify-between gap-3 hover:bg-[#F8F4EC]/60 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                            item.category === 'delivery'
                              ? 'bg-[#F7EBD9] text-[#0A2B35]'
                              : item.category === 'pricing'
                              ? 'bg-[#EADBCE]/60 text-[#071E26]'
                              : 'bg-[#F8F4EC] text-[#D91A67]'
                          }`}
                        >
                          {item.categoryLabel}
                        </span>
                      </div>
                      <h2 className="font-bold text-xs sm:text-sm text-[#0A2B35] leading-snug">
                        {item.question}
                      </h2>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#0A2B35] shrink-0 mt-0.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-[#D9943B] text-[#071E26]' : ''
                      }`}
                    >
                      <ChevronDown size={14} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3.5 pt-1 text-xs text-[#648692] border-t border-[#EADBCE]/50 space-y-2 animate-in fade-in duration-150">
                      <p className="leading-relaxed text-[#0A2B35]">{item.answer}</p>
                      {item.keyPoints && item.keyPoints.length > 0 && (
                        <div className="bg-[#F8F4EC]/80 rounded-lg p-2.5 space-y-1.5 border border-[#EADBCE]">
                          {item.keyPoints.map((kp, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#0A2B35]">
                              <CheckCircle2 size={13} className="text-[#D9943B] shrink-0 mt-0.5" />
                              <span>{kp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Direct Contact & Support Card */}
        <div className="bg-gradient-to-r from-[#071E26] to-[#0A2B35] text-white rounded-2xl p-4 shadow-sm border border-[#EADBCE]/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[#D9943B] text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={11} />
              <span>Assistance Ahmed Rachedi</span>
            </div>
            <h3 className="text-xs font-bold text-white">Une question spécifique sur votre livraison ?</h3>
            <p className="text-[11px] text-[#648692]">
              Notre équipe locale d'Ahmed Rachedi vous répond 7j/7 en direct.
            </p>
          </div>
          {onOpenChat ? (
            <button
              id="faq-btn-contact-support"
              onClick={onOpenChat}
              className="px-3.5 py-2 rounded-xl bg-[#D9943B] hover:bg-[#E5A34C] active:scale-95 text-[#071E26] font-bold text-xs whitespace-nowrap shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>Discuter</span>
            </button>
          ) : (
            <a
              href="tel:+213551234567"
              className="px-3.5 py-2 rounded-xl bg-[#D9943B] hover:bg-[#E5A34C] active:scale-95 text-[#071E26] font-bold text-xs whitespace-nowrap shadow-xs transition-all"
            >
              0551 23 45 67
            </a>
          )}
        </div>
      </main>
    </div>
  );
};
