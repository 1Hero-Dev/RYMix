import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Store, CartItem, Order, MenuItem } from '../types';
import { LazyImage } from './common/LazyImage';
import { HorizontalScrollContainer } from './common/HorizontalScrollContainer';
import {
  Search,
  Mic,
  Utensils,
  HandPlatter,
  Store as StoreIcon,
  ShoppingBag,
  ShoppingBasket,
  Ticket,
  Film,
  Apple,
  Cross,
  Coffee,
  Bike,
  Sparkles,
  Zap,
  Star,
  Clock,
  Timer,
  ChevronRight,
  Plus,
  Navigation,
  Loader2,
  X,
  Pizza,
  Flame,
  Tag,
  SlidersHorizontal,
  ArrowUpDown,
  MapPin,
  Croissant,
  Shirt,
} from 'lucide-react';

interface Props {
  stores: Store[];
  onSelectStore: (store: Store) => void;
  onOpenGrocery: () => void;
  cartItems: CartItem[];
  onOpenCheckout: () => void;
  onOpenAllPromotions?: () => void;
  onSelectDishToCustomize: (store: Store, dishId: string) => void;
  activeOrder?: Order | null;
  onViewOrderTracking?: () => void;
}

function getStoreMaxDiscountPercent(store: Store): number | null {
  if (!store.items) return null;
  let max = 0;
  for (let i = 0; i < store.items.length; i++) {
    const item = store.items[i];
    if (item.originalPrice && item.originalPrice > item.price) {
      const pct = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
      if (pct > max) max = pct;
    }
  }
  return max > 0 ? max : null;
}

function getStorePromoBadge(store: Store): string | null {
  if (store.promotion) {
    if (store.promotion.type === 'free_delivery') {
      return store.promotion.badgeLabel;
    }
    if (store.promotion.percentage) {
      return `-${store.promotion.percentage}% dès ${store.promotion.minSubtotalDZD.toLocaleString('fr-DZ')} DZD`;
    }
    if (store.promotion.discountDZD && store.promotion.minSubtotalDZD) {
      const pct = Math.round((store.promotion.discountDZD / store.promotion.minSubtotalDZD) * 100);
      return `-${pct}% dès ${store.promotion.minSubtotalDZD.toLocaleString('fr-DZ')} DZD`;
    }
    return store.promotion.badgeLabel;
  }
  const maxDiscount = getStoreMaxDiscountPercent(store);
  if (maxDiscount) {
    return `Jusqu'à -${maxDiscount}%`;
  }
  return null;
}

/**
 * Isolated flash sale countdown timer.
 * Wrapping in React.memo prevents the 1000ms tick from causing the parent
 * HomeDiscoveryScreen and its entire store feed from re-rendering.
 */
const FlashSaleCountdown = React.memo(function FlashSaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, mins: 42, secs: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        return { hours: 1, mins: 30, secs: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-0.5 font-mono text-[11px] sm:text-xs font-black text-[#E5A34C] tracking-wide select-none">
      <span>{String(timeLeft.hours).padStart(2, '0')}</span>
      <span className="opacity-60 text-[10px]">:</span>
      <span>{String(timeLeft.mins).padStart(2, '0')}</span>
      <span className="opacity-60 text-[10px]">:</span>
      <span>{String(timeLeft.secs).padStart(2, '0')}</span>
    </div>
  );
});

export const HomeDiscoveryScreen: React.FC<Props> = React.memo(({
  stores,
  onSelectStore,
  onOpenGrocery,
  cartItems,
  onOpenCheckout,
  onOpenAllPromotions,
  onSelectDishToCustomize,
  activeOrder,
  onViewOrderTracking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  // Default selected category is null (all categories and stores shown)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeDynamicFilter, setActiveDynamicFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'fastest' | 'rating' | 'distance' | 'deliveryFee'>('default');

  // Reset dynamic filter whenever category changes for immediate contextual relevance
  useEffect(() => {
    setActiveDynamicFilter('all');
  }, [selectedCategory]);

  // Debouncing de 300ms pour optimiser la performance lors de la frappe en temps réel
  useEffect(() => {
    if (searchQuery.trim() === debouncedQuery.trim()) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsDebouncing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedQuery]);

  // Synchronisation immédiate si l'utilisateur appuie sur Entrée
  const handleImmediateSearch = useCallback(() => {
    setDebouncedQuery(searchQuery);
    setIsDebouncing(false);
  }, [searchQuery]);

  // Memoize total cart calculations
  const { totalCartDZD, totalCartCount } = useMemo(() => {
    let sumDZD = 0;
    let count = 0;
    for (let i = 0; i < cartItems.length; i++) {
      sumDZD += cartItems[i].basePrice * cartItems[i].quantity;
      count += cartItems[i].quantity;
    }
    return { totalCartDZD: sumDZD, totalCartCount: count };
  }, [cartItems]);

  // 10-Categories matrix with unified one-color iconography for Ahmed Rachedi.
  // Interleaved short and long label sequence to prevent adjacent long names in the 5-column grid:
  // Row 1: Repas (5) | Boulangeries (12) | Cafés (5) | Supérettes (10) | Pizzas (6)
  // Row 2: Boutique (8) | Fruits (6) | Pharmacie (9) | Marché (6) | Coursier (8)
  const categories = useMemo(
    () => [
      // Row 1
      {
        id: 'food',
        name: 'Repas',
        icon: Utensils,
        color: '#1C1B1B',
        hot: true,
      },
      {
        id: 'bakeries',
        name: 'Boulangeries',
        icon: Croissant,
        color: '#1C1B1B',
        hot: true,
      },
      {
        id: 'tea',
        name: 'Cafés',
        icon: Coffee,
        color: '#1C1B1B',
      },
      {
        id: 'superettes',
        name: 'Supérettes',
        icon: StoreIcon,
        color: '#1C1B1B',
        hot: true,
      },
      {
        id: 'pizza',
        name: 'Pizzas',
        icon: Pizza,
        color: '#1C1B1B',
      },
      // Row 2
      {
        id: 'boutique',
        name: 'Boutique',
        icon: ShoppingBag,
        color: '#1C1B1B',
        hot: true,
      },
      {
        id: 'fresh',
        name: 'Fruits',
        icon: Apple,
        color: '#1C1B1B',
        action: onOpenGrocery,
      },
      {
        id: 'pharmacy',
        name: 'Pharmacie',
        icon: Cross,
        color: '#1C1B1B',
      },
      {
        id: 'grocery',
        name: 'Marché',
        icon: ShoppingBasket,
        color: '#1C1B1B',
        action: onOpenGrocery,
      },
      {
        id: 'bikes',
        name: 'Coursier',
        icon: Bike,
        color: '#1C1B1B',
      },
    ],
    [onOpenGrocery]
  );

  // Dynamic filter options generated logically based on selectedCategory
  const filterOptions = useMemo(() => {
    if (!selectedCategory) {
      return [
        { id: 'all', label: 'Tous', shortLabel: 'Tous', icon: SlidersHorizontal },
        { id: 'under_20', label: 'Moins de 20 min', shortLabel: 'Rapide', icon: Clock },
        { id: 'popular', label: 'Populaire', shortLabel: 'Populaire', icon: Flame },
        { id: 'top_rated', label: 'Mieux notés (4.8+)', shortLabel: 'Étoilés', icon: Star },
        { id: 'promos', label: 'Promotions', shortLabel: 'Promos', icon: Tag },
        { id: 'cheap_delivery', label: 'Livraison ≤ 80 DA', shortLabel: 'Éco', icon: Bike },
        { id: 'ar_center', label: 'Ahmed Rachedi Centre', shortLabel: 'Centre', icon: MapPin },
      ];
    }

    switch (selectedCategory) {
      case 'superettes':
        return [
          { id: 'all', label: 'Toutes les supérettes', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_20', label: 'Moins de 20 min', shortLabel: 'Rapide', icon: Clock },
          { id: 'top_rated', label: 'Mieux notées (4.8+)', shortLabel: 'Étoilés', icon: Star },
          { id: 'promos', label: 'Promotions supérette', shortLabel: 'Promos', icon: Tag },
          { id: 'cheap_delivery', label: 'Livraison ≤ 80 DA', shortLabel: 'Éco', icon: Bike },
          { id: 'ar_center', label: 'Ahmed Rachedi Centre', shortLabel: 'Centre', icon: MapPin },
        ];
      case 'bakeries':
        return [
          { id: 'all', label: 'Toutes les boulangeries', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_15', label: 'Pains chauds (< 15 min)', shortLabel: 'Chaud', icon: Clock },
          { id: 'kesra_matlouh', label: 'Kesra & Matlouh', shortLabel: 'Tradition', icon: Flame },
          { id: 'viennoiserie', label: 'Croissants & Gâteaux', shortLabel: 'Gâteaux', icon: Star },
          { id: 'cheap_delivery', label: 'Livraison ≤ 70 DA', shortLabel: 'Éco', icon: Bike },
        ];
      case 'tea':
        return [
          { id: 'all', label: 'Tous les cafés', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_15', label: 'Moins de 15 min', shortLabel: 'Rapide', icon: Clock },
          { id: 'braises', label: 'Thé à la menthe & Braises', shortLabel: 'Thé', icon: Coffee },
          { id: 'popular', label: 'Cafés réputés', shortLabel: 'Populaire', icon: Star },
          { id: 'cheap_delivery', label: 'Livraison ≤ 70 DA', shortLabel: 'Éco', icon: Bike },
        ];
      case 'pizza':
        return [
          { id: 'all', label: 'Toutes les pizzerias', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'wood_fire', label: 'Feu de bois', shortLabel: 'Feu', icon: Flame },
          { id: 'under_25', label: 'Moins de 25 min', shortLabel: 'Rapide', icon: Clock },
          { id: 'tacos_burgers', label: 'Burgers & Tacos', shortLabel: 'Burgers', icon: Utensils },
          { id: 'top_rated', label: 'Mieux notées (4.8+)', shortLabel: 'Étoilés', icon: Star },
          { id: 'cheap_delivery', label: 'Livraison ≤ 80 DA', shortLabel: 'Éco', icon: Bike },
        ];
      case 'boutique':
        return [
          { id: 'all', label: 'Toutes les boutiques', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'fashion_clothes', label: 'Mode & Prêt-à-porter', shortLabel: 'Mode', icon: Shirt },
          { id: 'perfume_beauty', label: 'Parfums & Cosmétiques', shortLabel: 'Parfums', icon: Sparkles },
          { id: 'tech_accessories', label: 'Tech & Téléphonie', shortLabel: 'Tech', icon: Zap },
          { id: 'promos', label: 'Promotions boutique', shortLabel: 'Promos', icon: Tag },
          { id: 'cheap_delivery', label: 'Livraison ≤ 80 DA', shortLabel: 'Éco', icon: Bike },
        ];
      case 'dining':
        return [
          { id: 'all', label: 'Tous les restaurants', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_30', label: 'Moins de 30 min', shortLabel: 'Rapide', icon: Clock },
          { id: 'grillades', label: 'Rôtisserie & Braises', shortLabel: 'Rôtisserie', icon: Flame },
          { id: 'top_rated', label: 'Mieux notés (4.8+)', shortLabel: 'Étoilés', icon: Star },
          { id: 'promos', label: 'Offres spéciales', shortLabel: 'Promos', icon: Tag },
          { id: 'cheap_delivery', label: 'Livraison ≤ 90 DA', shortLabel: 'Éco', icon: Bike },
        ];
      case 'fresh':
      case 'grocery':
        return [
          { id: 'all', label: 'Tout le marché', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_20', label: 'Moins de 20 min', shortLabel: 'Rapide', icon: Clock },
          { id: 'local_produce', label: 'Vergers d\'Ahmed Rachedi', shortLabel: 'Terroir', icon: Apple },
          { id: 'promos', label: 'Promotions du jour', shortLabel: 'Promos', icon: Tag },
          { id: 'cheap_delivery', label: 'Livraison offerte / ≤ 80 DA', shortLabel: 'Éco', icon: Bike },
        ];
      case 'pharmacy':
        return [
          { id: 'all', label: 'Toutes les pharmacies', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_20', label: 'Urgence (< 20 min)', shortLabel: 'Urgence', icon: Clock },
          { id: 'ar_center', label: 'Centre-Ville', shortLabel: 'Centre', icon: MapPin },
          { id: 'top_rated', label: 'Mieux notées', shortLabel: 'Étoilés', icon: Star },
        ];
      case 'food':
        return [
          { id: 'all', label: 'Tous les repas', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_30', label: 'Moins de 30 min', shortLabel: 'Rapide', icon: Clock },
          { id: 'chawarma', label: 'Chawarmas & Sandwiches', shortLabel: 'Chawarma', icon: Utensils },
          { id: 'popular', label: 'Plats populaires', shortLabel: 'Populaire', icon: Flame },
          { id: 'promos', label: 'Avec remise', shortLabel: 'Promos', icon: Tag },
          { id: 'cheap_delivery', label: 'Livraison ≤ 90 DA', shortLabel: 'Éco', icon: Bike },
        ];
      case 'bikes':
        return [
          { id: 'all', label: 'Tous les coursiers', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_20', label: 'Express (< 20 min)', shortLabel: 'Express', icon: Clock },
          { id: 'cheap_delivery', label: 'Moins de 80 DA', shortLabel: 'Éco', icon: Bike },
          { id: 'ar_center', label: 'Ahmed Rachedi Centre', shortLabel: 'Centre', icon: MapPin },
        ];
      default:
        return [
          { id: 'all', label: 'Tous', shortLabel: 'Tous', icon: SlidersHorizontal },
          { id: 'under_30', label: 'Moins de 30 min', shortLabel: 'Rapide', icon: Clock },
          { id: 'popular', label: 'Populaire', shortLabel: 'Populaire', icon: Flame },
          { id: 'top_rated', label: 'Mieux notés', shortLabel: 'Étoilés', icon: Star },
        ];
    }
  }, [selectedCategory]);

  // Promotions catalog available in Ahmed Rachedi
  const allPromotions = useMemo(
    () => [
      {
        id: 'promo-chawarma',
        categoryIds: ['food', 'dining'],
        title: 'Chawarma Poulet Braisé',
        originalPriceDZD: 900,
        promoPriceDZD: 750,
        discountLabel: '-17%',
        badge: 'Top 1 Ahmed Rachedi',
        subtext: '100 portions max',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDXgK0NauGzq7NBUsA_EWhrT91S70btBrr7ikNQDeZ6kvC-lRiK_RzMH0eekPLr-QNWZaluA6-Iugvrm3EApfRLDSJoBPm0jyHcrIomUgWjxyIQav4GfnYFDhN54NSjQdHt67nuQvNohApFLZMAatYgm_8FKBJEfg-6IzKErJzlP-3ygErAzwXzQHmKMy-BwojlxvHW3AS9jhn7ceYAmJIEvZLY76ULfYayw7-DutccphSMAbhcpsks=rw',
        onClick: () => onSelectStore(stores[0]),
      },
      {
        id: 'promo-boutique',
        categoryIds: ['boutique'],
        title: 'Coffret Parfum & Soin Royal',
        originalPriceDZD: 2200,
        promoPriceDZD: 1750,
        discountLabel: '-20%',
        badge: 'Élégance Ahmed Rachedi',
        subtext: 'Boutique El Anaka',
        imageUrl:
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80',
        onClick: () => {
          const boutiqueStore =
            stores.find(
              (s) =>
                s.category.toLowerCase().includes('boutique') ||
                s.name.toLowerCase().includes('anaka')
            ) || stores[0];
          onSelectStore(boutiqueStore);
        },
      },
      {
        id: 'promo-fraises',
        categoryIds: ['fresh', 'grocery'],
        title: 'Fraises Terroir Rouached',
        originalPriceDZD: 550,
        promoPriceDZD: 420,
        discountLabel: '-24%',
        badge: 'Récolte du Jour',
        subtext: 'Livraison 18 min',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDTMMmy-w4l3HkEFtHyH5RtbqSHqKDF0Qio3NMqmwctRrBZiL2G5pbAC0jQ05cg2HQMn9Gfqn8DfYr5Ex-E6z3pmCp7NDXAnDoaIZaQt56dse-qVgMKPRmtRWYnCE9ha0cbvsUX7F2nJQhW55Mqmq_oluGysX7Gdiefscwn4-hI_xAEjYrP7xAJB9fnmkbbtKgKBH6UmZJbfJ4XDsWfcUAN6FVlVb5lil1i2bHkKDUQoa31myoG7_Aj=rw',
        onClick: onOpenGrocery,
      },
      {
        id: 'promo-pizza',
        categoryIds: ['pizza', 'food'],
        title: 'Duo Pizzas Géantes Feu de Bois',
        originalPriceDZD: 1500,
        promoPriceDZD: 1300,
        discountLabel: '-13%',
        badge: 'Soirée Pizzas',
        subtext: 'Livraison 20 min',
        imageUrl:
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
        onClick: () => {
          const pizzaStore = stores.find((s) => s.category.toLowerCase().includes('pizza')) || stores[0];
          onSelectStore(pizzaStore);
        },
      },
      {
        id: 'promo-cafe',
        categoryIds: ['tea'],
        title: 'Formule Café d’El Djezoua & Gaufre',
        originalPriceDZD: 450,
        promoPriceDZD: 360,
        discountLabel: '-20%',
        badge: 'Pause Gourmande',
        subtext: 'Livraison 15 min',
        imageUrl:
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
        onClick: () => {
          const cafeStore =
            stores.find((s) => s.category.toLowerCase().includes('café') || s.category.toLowerCase().includes('thé')) || stores[0];
          onSelectStore(cafeStore);
        },
      },
      {
        id: 'promo-boulangerie',
        categoryIds: ['bakeries'],
        title: 'Formule Kesra Mbarem & Baguettes Chaudes',
        originalPriceDZD: 350,
        promoPriceDZD: 290,
        discountLabel: '-17%',
        badge: 'Fournil d’Ahmed Rachedi',
        subtext: 'Livraison 12 min',
        imageUrl:
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
        onClick: () => {
          const bakeryStore =
            stores.find((s) => s.category.toLowerCase().includes('boulangerie')) || stores[0];
          onSelectStore(bakeryStore);
        },
      },
      {
        id: 'promo-superette',
        categoryIds: ['superettes'],
        title: 'Pack Eau Minérale & Produits Laitiers',
        originalPriceDZD: 1200,
        promoPriceDZD: 1050,
        discountLabel: '-13%',
        badge: 'Supérette El Baraka',
        subtext: 'Livraison 15 min',
        imageUrl:
          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80',
        onClick: () => {
          const superetteStore =
            stores.find((s) => s.category.toLowerCase().includes('supérette') || s.category.toLowerCase().includes('superette')) || stores[0];
          onSelectStore(superetteStore);
        },
      },
    ],
    [stores, onSelectStore, onOpenGrocery]
  );

  // Promotions filtered by category (Hides completely if no promotions exist in the category)
  const activePromotions = useMemo(() => {
    if (!selectedCategory) {
      return allPromotions;
    }
    return allPromotions.filter((p) => p.categoryIds.includes(selectedCategory));
  }, [allPromotions, selectedCategory]);

  // Normalisation sans accents pour une recherche tolérante et fluide
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Stores matching search, selected category, and active segment (candidates before quick dynamic filter)
  const candidateStores = useMemo(() => {
    const q = normalize(debouncedQuery);

    return stores.filter((s) => {
      // Category filter (from grid click)
      if (selectedCategory) {
        if (selectedCategory === 'food') {
          const isFood =
            s.category.toLowerCase().includes('restaurant') ||
            s.category.toLowerCase().includes('grillade') ||
            s.category.toLowerCase().includes('spécialité') ||
            s.category.toLowerCase().includes('pizza') ||
            s.category.toLowerCase().includes('fast food') ||
            s.category.toLowerCase().includes('burger') ||
            s.category.toLowerCase().includes('plat') ||
            (s.items && s.items.length > 0) ||
            (s.tags && s.tags.some((t) => /viande|plat|chawarma|burger|grillade|pizza|poulet|repas/i.test(t)));
          if (!isFood) return false;
        } else if (selectedCategory === 'superettes') {
          const isSuperette =
            s.category.toLowerCase().includes('supérette') ||
            s.category.toLowerCase().includes('superette') ||
            s.category.toLowerCase().includes('alimentation') ||
            s.category.toLowerCase().includes('épicerie') ||
            s.name.toLowerCase().includes('supérette') ||
            s.name.toLowerCase().includes('superette') ||
            s.name.toLowerCase().includes('baraka') ||
            (s.tags && s.tags.some((t) => t.toLowerCase().includes('supérette') || t.toLowerCase().includes('alimentation') || t.toLowerCase().includes('épicerie')));
          if (!isSuperette) return false;
        } else if (selectedCategory === 'bakeries') {
          const isBakery =
            s.category.toLowerCase().includes('boulangerie') ||
            s.category.toLowerCase().includes('pâtisserie') ||
            s.category.toLowerCase().includes('patisserie') ||
            s.category.toLowerCase().includes('fournil') ||
            s.name.toLowerCase().includes('boulangerie') ||
            s.name.toLowerCase().includes('fournil') ||
            s.name.toLowerCase().includes('el manar') ||
            (s.tags && s.tags.some((t) => t.toLowerCase().includes('pain') || t.toLowerCase().includes('boulangerie') || t.toLowerCase().includes('fournil') || t.toLowerCase().includes('kesra')));
          if (!isBakery) return false;
        } else if (selectedCategory === 'tea') {
          const isCafe =
            s.category.toLowerCase().includes('café') ||
            s.category.toLowerCase().includes('cafe') ||
            s.category.toLowerCase().includes('thé') ||
            s.category.toLowerCase().includes('crèmerie') ||
            s.name.toLowerCase().includes('coffee') ||
            s.name.toLowerCase().includes('café') ||
            s.name.toLowerCase().includes('lounge') ||
            s.name.toLowerCase().includes('waha') ||
            (s.tags && s.tags.some((t) => t.toLowerCase().includes('café') || t.toLowerCase().includes('coffee') || t.toLowerCase().includes('thé') || t.toLowerCase().includes('glace')));
          if (!isCafe) return false;
        } else if (selectedCategory === 'dining') {
          const isDining =
            s.category.toLowerCase().includes('restaurant') ||
            s.category.toLowerCase().includes('grillade') ||
            s.category.toLowerCase().includes('spécialité') ||
            s.category.toLowerCase().includes('pizza') ||
            s.category.toLowerCase().includes('burger') ||
            s.name.toLowerCase().includes('restaurant') ||
            s.name.toLowerCase().includes('pizzeria') ||
            s.name.toLowerCase().includes('amine') ||
            s.name.toLowerCase().includes('food');
          if (!isDining) return false;
        } else if (selectedCategory === 'pizza') {
          const isPizza =
            s.category.toLowerCase().includes('pizza') ||
            s.category.toLowerCase().includes('fast food') ||
            s.name.toLowerCase().includes('pizza') ||
            s.name.toLowerCase().includes('pizzeria') ||
            (s.tags && s.tags.some((t) => t.toLowerCase().includes('pizza') || t.toLowerCase().includes('tacos')));
          if (!isPizza) return false;
        } else if (selectedCategory === 'fresh') {
          const isFresh =
            s.category.toLowerCase().includes('fruits') ||
            s.category.toLowerCase().includes('primeur') ||
            s.category.toLowerCase().includes('marché') ||
            (s.tags && s.tags.some((t) => t.toLowerCase().includes('fruit') || t.toLowerCase().includes('terroir') || t.toLowerCase().includes('fraise')));
          if (!isFresh) return false;
        } else if (selectedCategory === 'pharmacy') {
          const isPharm =
            s.category.toLowerCase().includes('pharmacie') ||
            s.name.toLowerCase().includes('pharmacie') ||
            (s.tags && s.tags.some((t) => t.toLowerCase().includes('pharmacie') || t.toLowerCase().includes('santé')));
          if (!isPharm) return false;
        } else if (selectedCategory === 'boutique') {
          const isBoutique =
            s.category.toLowerCase().includes('boutique') ||
            s.category.toLowerCase().includes('mode') ||
            s.category.toLowerCase().includes('shopping') ||
            s.category.toLowerCase().includes('bazar') ||
            s.category.toLowerCase().includes('vêtement') ||
            s.name.toLowerCase().includes('boutique') ||
            s.name.toLowerCase().includes('anaka') ||
            s.name.toLowerCase().includes('bazar') ||
            (s.tags && s.tags.some((t) => /boutique|mode|parfum|cadeau|vêtement|accessoire|bazar/i.test(t))) ||
            (s.items && s.items.some((it) => /parfum|musc|soin|robe|écharpe|montre|écouteur|câble/i.test(it.name)));
          if (!isBoutique) return false;
        } else if (selectedCategory === 'food') {
          const isFood =
            s.category.toLowerCase().includes('grillade') ||
            s.category.toLowerCase().includes('spécialité') ||
            s.category.toLowerCase().includes('restaurant') ||
            s.category.toLowerCase().includes('fast food') ||
            s.name.toLowerCase().includes('amine') ||
            s.name.toLowerCase().includes('comida') ||
            s.name.toLowerCase().includes('tamtam') ||
            (s.tags && s.tags.some((t) => /poulet|chawarma|burger|repas|plat/i.test(t)));
          if (!isFood) return false;
        } else if (selectedCategory === 'bikes') {
          const isBikes =
            s.category.toLowerCase().includes('coursier') ||
            s.name.toLowerCase().includes('coursier') ||
            (s.tags && s.tags.some((t) => /coursier|express|livraison/i.test(t)));
          if (!isBikes) return false;
        }
      }

      // Query filter: filtrage par nom ou catégorie (et tags/menus associés)
      if (!q) return true;

      const matchName = normalize(s.name).includes(q);
      const matchCategory = normalize(s.category).includes(q);
      const matchTags = s.tags && s.tags.some((t) => normalize(t).includes(q));
      const matchItems =
        s.items &&
        s.items.some(
          (it) => normalize(it.name).includes(q) || normalize(it.category || '').includes(q)
        );

      return matchName || matchCategory || matchTags || matchItems;
    });
  }, [stores, debouncedQuery, selectedCategory]);

  // Contextual matching predicate for dynamic filters
  const matchesDynamicFilter = useCallback((s: Store, filterId: string) => {
    if (filterId === 'all') return true;
    if (filterId === 'under_30') return s.deliveryTimeMin <= 30;
    if (filterId === 'under_25') return s.deliveryTimeMin <= 25;
    if (filterId === 'under_20') return s.deliveryTimeMin <= 20;
    if (filterId === 'under_15') return s.deliveryTimeMin <= 15;
    if (filterId === 'under_2km') return s.distanceKm <= 2.0;
    if (filterId === 'popular') {
      return (
        s.rating >= 4.8 ||
        s.reviewCount.includes('1,') ||
        s.reviewCount.includes('2,') ||
        (s.tags && s.tags.some((t) => /top|best|populaire|n°1/i.test(t)))
      );
    }
    if (filterId === 'top_rated') return s.rating >= 4.8;
    if (filterId === 'promos') {
      return Boolean(s.promotion) || (s.items && s.items.some((it) => Boolean(it.originalPrice && it.originalPrice > it.price)));
    }
    if (filterId === 'cheap_delivery') return s.deliveryFee <= 100;
    if (filterId === 'ar_center' || filterId === 'mila_center') {
      return (
        s.commune.toLowerCase().includes('ahmed rachedi') ||
        s.commune.toLowerCase().includes('centre') ||
        s.address.toLowerCase().includes('centre') ||
        s.address.toLowerCase().includes('mairie') ||
        s.distanceKm <= 1.8
      );
    }
    if (filterId === 'kesra_matlouh') {
      return (
        (s.tags && s.tags.some((t) => /kesra|matlouh|pain|tradition/i.test(t))) ||
        (s.items && s.items.some((it) => /kesra|matlouh/i.test(it.name)))
      );
    }
    if (filterId === 'viennoiserie') {
      return (
        (s.tags && s.tags.some((t) => /viennoiserie|croissant|brioche|gâteau/i.test(t))) ||
        (s.items && s.items.some((it) => /croissant|mille-feuille|brioche/i.test(it.name)))
      );
    }
    if (filterId === 'lake_view') {
      return (
        s.name.toLowerCase().includes('haroun') ||
        s.address.toLowerCase().includes('haroun') ||
        s.commune.toLowerCase().includes('grarem') ||
        (s.tags && s.tags.some((t) => /lac|barrage|vue|haroun/i.test(t)))
      );
    }
    if (filterId === 'with_restaurant') {
      return (
        (s.tags && s.tags.some((t) => /resto|table|gastronomie|buffet|dîner|repas/i.test(t))) ||
        s.category.toLowerCase().includes('resto')
      );
    }
    if (filterId === 'braises') {
      return (
        s.notice.toLowerCase().includes('braise') ||
        (s.tags && s.tags.some((t) => /braise|djezoua|thé|charbon/i.test(t))) ||
        s.category.toLowerCase().includes('thé')
      );
    }
    if (filterId === 'brunch') {
      return (
        s.category.toLowerCase().includes('pâtisserie') ||
        s.category.toLowerCase().includes('crèmerie') ||
        (s.tags && s.tags.some((t) => /brunch|pâtisserie|gaufre|crêpe|petit-déjeuner/i.test(t)))
      );
    }
    if (filterId === 'wood_fire') {
      return (
        s.notice.toLowerCase().includes('bois') ||
        (s.tags && s.tags.some((t) => /feu de bois|traditionnel|artisanal/i.test(t)))
      );
    }
    if (filterId === 'tacos_burgers') {
      return (
        s.category.toLowerCase().includes('fast') ||
        (s.tags && s.tags.some((t) => /burger|tacos|sandwich/i.test(t)))
      );
    }
    if (filterId === 'grillades') {
      return (
        s.category.toLowerCase().includes('grillade') ||
        (s.tags && s.tags.some((t) => /grillade|viande|brochette/i.test(t)))
      );
    }
    if (filterId === 'fish_lake') {
      return (
        s.name.toLowerCase().includes('haroun') ||
        s.category.toLowerCase().includes('poisson') ||
        (s.tags && s.tags.some((t) => /poisson|pêche|haroun/i.test(t)))
      );
    }
    if (filterId === 'local_produce') {
      return (
        (s.tags && s.tags.some((t) => /terroir|verger|plaine|grarem|local/i.test(t))) ||
        s.category.toLowerCase().includes('terroir')
      );
    }
    if (filterId === 'chawarma') {
      return (
        (s.items && s.items.some((i) => i.name.toLowerCase().includes('chawarma'))) ||
        (s.tags && s.tags.some((t) => /chawarma|sandwich/i.test(t)))
      );
    }
    if (filterId === 'fashion_clothes') {
      return (
        (s.tags && s.tags.some((t) => /mode|vêtement|étole|foulard|prêt-à-porter/i.test(t))) ||
        (s.items && s.items.some((it) => /robe|écharpe|t-shirt|chemise|pantalon|foulard|mode|tissu/i.test(it.name)))
      );
    }
    if (filterId === 'perfume_beauty') {
      return (
        (s.tags && s.tags.some((t) => /parfum|beauté|soin|cosmétique|musc/i.test(t))) ||
        (s.items && s.items.some((it) => /parfum|musc|oud|soin|beauté|eau de parfum/i.test(it.name)))
      );
    }
    if (filterId === 'tech_accessories') {
      return (
        (s.tags && s.tags.some((t) => /tech|phone|téléphonie|accessoire/i.test(t))) ||
        (s.items && s.items.some((it) => /écouteur|câble|chargeur|coque|bluetooth/i.test(it.name)))
      );
    }
    return true;
  }, []);

  // Dynamic counts for each filter option based on current candidates
  const dynamicFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const opt of filterOptions) {
      counts[opt.id] = candidateStores.filter((s) => matchesDynamicFilter(s, opt.id)).length;
    }
    return counts;
  }, [filterOptions, candidateStores, matchesDynamicFilter]);

  // Distinctive featured products & services for the active category
  const categoryFeaturedItems = useMemo(() => {
    if (!selectedCategory) return [];
    const results: Array<{ item: MenuItem; store: Store }> = [];
    for (const store of candidateStores) {
      if (store.items) {
        for (const item of store.items) {
          results.push({ item, store });
        }
      }
    }
    return results.slice(0, 8);
  }, [selectedCategory, candidateStores]);

  // Final filtered & sorted stores list
  const filteredStores = useMemo(() => {
    let result = candidateStores.filter((s) => matchesDynamicFilter(s, activeDynamicFilter));

    if (sortBy === 'fastest') {
      result = [...result].sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      result = [...result].sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'deliveryFee') {
      result = [...result].sort((a, b) => a.deliveryFee - b.deliveryFee);
    }

    return result;
  }, [candidateStores, activeDynamicFilter, matchesDynamicFilter, sortBy]);

  // Handlers wrapped in useCallback
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsDebouncing(false);
  }, []);

  return (
    <div className="flex-1 flex flex-col pb-28">
      {/* Real-time Search Bar with 300ms Debouncing (No redundant search button) */}
      <div id="home-search-bar-container" className="px-3.5 pt-2 pb-2">
        <div className="bg-white rounded-full p-2 pl-3.5 pr-2.5 flex items-center shadow-xs border border-black/5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
          <div className="mr-2.5 shrink-0 flex items-center justify-center">
            {isDebouncing ? (
              <Loader2 size={16} className="text-[#1C1B1B] animate-spin" />
            ) : (
              <Search size={16} className="text-[#1C1B1B]" />
            )}
          </div>
          <input
            id="home-search-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleImmediateSearch();
              }
            }}
            placeholder="Rechercher supérette, boulangerie, repas (ex: El Baraka, El Manar)..."
            className="w-full bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none border-none p-0"
          />
          {searchQuery ? (
            <button
              id="home-search-clear-btn"
              onClick={handleClearSearch}
              className="p-1 text-[#1C1B1B] hover:text-black text-xs font-bold rounded-full hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
              aria-label="Effacer recherche"
              title="Effacer la recherche"
            >
              <X size={15} className="text-[#1C1B1B]" />
            </button>
          ) : (
            <button
              id="home-search-quick-btn"
              onClick={() => {
                setSearchQuery('Supérette El Baraka');
              }}
              className="p-1 text-[#1C1B1B] hover:text-black shrink-0 cursor-pointer"
              aria-label="Exemple de recherche"
              title="Remplir exemple"
            >
              <Mic size={16} className="text-[#1C1B1B]" />
            </button>
          )}
        </div>

        {/* Real-time Debounce Feedback & Results Status */}
        {debouncedQuery.trim() && (
          <div
            id="home-search-status-bar"
            className="mt-2 px-1 flex items-center justify-between text-[11px] text-zinc-600 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-zinc-900">
                {filteredStores.length} {filteredStores.length > 1 ? 'commerces trouvés' : 'commerce trouvé'}
              </span>
              <span className="text-zinc-400">pour</span>
              <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 truncate max-w-[130px]">
                « {debouncedQuery} »
              </span>
              {isDebouncing && (
                <span className="text-[10px] text-zinc-800 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin text-[#1C1B1B]" />
                  <span>300ms...</span>
                </span>
              )}
            </div>
            <button
              onClick={handleClearSearch}
              className="text-[11px] font-bold text-[#1C1B1B] hover:underline shrink-0 ml-2 cursor-pointer"
            >
              <span className="sm:hidden">Effacer</span>
              <span className="hidden sm:inline">Effacer le filtre</span>
            </button>
          </div>
        )}
      </div>

      {/* 10-Icon Super-App Grid (Yellow with 15% opacity applied strictly to category container backgrounds) */}
      <div className="px-3.5 py-1">
        <div className="bg-white p-3 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-xs font-bold text-zinc-900 tracking-tight">Catégories</span>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setActiveDynamicFilter('all');
                }}
                className="text-[11px] font-semibold text-[#1C1B1B] hover:underline transition-colors cursor-pointer"
              >
                <span className="sm:hidden">Toutes</span>
                <span className="hidden sm:inline">Toutes les catégories</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-y-2.5 gap-x-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.action) {
                      cat.action();
                    } else {
                      if (selectedCategory === cat.id) {
                        setSelectedCategory(null);
                      } else {
                        setSelectedCategory(cat.id);
                        setSearchQuery('');
                        setDebouncedQuery('');
                        setIsDebouncing(false);
                      }
                    }
                  }}
                  className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all outline-none focus:outline-none"
                  title={`Catégorie: ${cat.name}`}
                >
                  <div
                    className={`w-10 h-10 min-[370px]:w-11 min-[370px]:h-11 rounded-full flex items-center justify-center relative transition-all duration-200 border-0 outline-none ring-0 ${
                      isSelected
                        ? 'btn-gradient-tertiary text-white scale-105 shadow-md font-black'
                        : 'bg-gradient-to-br from-[#D9943B]/25 to-[#D9943B]/10 hover:from-[#D9943B]/35 hover:to-[#D9943B]/20 text-[#0A2B35] scale-95'
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 ${isSelected ? 'text-white' : 'text-[#0A2B35]'}`} />
                    {cat.hot && (
                      <span className="absolute -top-1 -right-1 badge-gradient-tertiary text-[8px] leading-tight px-1 rounded-full font-bold">
                        HOT
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[9.5px] min-[360px]:text-[10.5px] sm:text-[11px] mt-1 text-center line-clamp-1 transition-colors ${
                      isSelected ? 'text-[#D91A67] font-extrabold' : 'text-[#0A2B35] font-medium'
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Single Row Horizontally Scrollable Promotions Section */}
      {activePromotions.length > 0 && (
        <div className="px-3.5 py-2 animate-in fade-in duration-200">
          <div className="card-gradient-promo p-3.5 rounded-2xl border border-[#2B788C]/40 shadow-sm relative overflow-hidden">
            {/* Subtle blue-greenish ambient background glow */}
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-[#2B788C]/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-28 h-28 rounded-full bg-[#114250]/30 blur-xl pointer-events-none" />

            <div className="flex justify-between items-start mb-2.5 relative z-10 gap-2">
              <div
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
                onClick={onOpenAllPromotions}
                title="Voir toutes les offres d'Ahmed Rachedi"
              >
                <Flame size={17} strokeWidth={2.4} className="text-[#E5A34C] fill-[#E5A34C] shrink-0" />
                <div className="relative inline-flex items-center">
                  <span className="font-black text-[15px] sm:text-[16px] text-white tracking-tight leading-none">
                    Promotions
                  </span>
                  <span className="badge-gradient-tertiary text-white text-[7.5px] font-black px-1.5 py-0.2 rounded-full shadow-xs ml-1 -translate-y-1.5 leading-none whitespace-nowrap">
                    {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name || 'Ahmed Rachedi' : 'Ahmed Rachedi'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {/* Counter in the top corner without frames */}
                <div className="flex items-center gap-1">
                  <Timer size={11} className="text-[#E5A34C] shrink-0" />
                  <FlashSaleCountdown />
                </div>

                <button
                  id="promo-jump-all-btn"
                  onClick={onOpenAllPromotions}
                  className="text-[10.5px] font-bold text-white/90 hover:text-white flex items-center gap-0.5 bg-white/15 hover:bg-white/25 px-2.5 py-0.5 rounded-full border border-white/20 shadow-2xs transition-colors cursor-pointer backdrop-blur-xs active:scale-95"
                  title="Ouvrir toutes les promotions"
                >
                  <span>Voir tout</span>
                  <ChevronRight size={11} className="text-white" />
                </button>
              </div>
            </div>

            {/* Single Row Horizontally Scrollable Cards */}
            <HorizontalScrollContainer
              id="promotions-horizontal-list"
              step={260}
              ariaLabel="Promotions du moment"
              className="gap-2.5 pb-0.5 -mx-1 px-1 relative z-10"
            >
              {activePromotions.map((promo) => (
                <div
                  key={promo.id}
                  onClick={onOpenAllPromotions}
                  className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl flex items-center gap-2.5 border border-black/5 shadow-xs cursor-pointer hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shrink-0 w-[240px] sm:w-[260px] group"
                  title="Cliquer pour voir toutes les promotions"
                >
                  <div className="w-13 h-13 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-black/5">
                    <LazyImage
                      src={promo.imageUrl}
                      alt={promo.title}
                      placeholderType="food"
                      targetWidth={140}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-extrabold badge-gradient-tertiary px-1.5 py-0.2 rounded">
                        {promo.originalPriceDZD && promo.originalPriceDZD > promo.promoPriceDZD
                          ? `-${Math.round(((promo.originalPriceDZD - promo.promoPriceDZD) / promo.originalPriceDZD) * 100)}%`
                          : promo.discountLabel}
                      </span>
                      <span className="text-[9px] text-zinc-500 truncate">{promo.badge}</span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-900 truncate mt-0.5">
                      {promo.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono font-extrabold text-[#D91A67]">
                        {promo.promoPriceDZD} DZD
                      </span>
                      {promo.originalPriceDZD && (
                        <span className="text-[9px] text-zinc-400 line-through">
                          {promo.originalPriceDZD} DZD
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-emerald-700 font-semibold truncate">
                      {promo.subtext}
                    </span>
                  </div>
                </div>
              ))}
            </HorizontalScrollContainer>
          </div>
        </div>
      )}

      {/* Refined Quick Filters & Sorting Bar (Clean visual hierarchy, single vector icons, no emoji duplicates) */}
      <div id="dynamic-filters-bar" className="px-3.5 pt-2 pb-1 space-y-2 sticky top-[53px] bg-[#F8F4EC] z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-[#0A2B35] truncate">
              {selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name || 'Commerces'
                : 'Tous les commerces'}
            </span>
            <span className="text-[11px] text-[#648692] font-medium">
              ({filteredStores.length})
            </span>
            {activeDynamicFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveDynamicFilter('all')}
                className="text-[11px] text-[#D9943B] hover:text-[#B8731E] font-semibold underline cursor-pointer transition-colors ml-1"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-[#EADBCE] hover:border-[#D9943B]/60 rounded-full px-2.5 py-1 shadow-2xs transition-colors">
            <ArrowUpDown size={11} className="text-[#0A2B35] shrink-0" />
            <span className="text-[10px] text-[#648692] font-medium hidden sm:inline">Trier :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#0A2B35] font-semibold text-[11px] border-none outline-none cursor-pointer pr-0.5"
              aria-label="Trier les établissements"
            >
              <option value="default">Pertinence</option>
              <option value="fastest">Plus rapide</option>
              <option value="rating">Meilleure note</option>
              <option value="distance">Proximité</option>
              <option value="deliveryFee">Frais min</option>
            </select>
          </div>
        </div>

        {/* Scrollable Dynamic Filter Chips (Icon-only on narrow screens when unselected, one-word naming when selected) */}
        <HorizontalScrollContainer
          id="dynamic-filters-horizontal-list"
          step={180}
          ariaLabel="Filtres rapides"
          className="items-center gap-1.5 py-0.5 -mx-1 px-1"
        >
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            const isSelected = activeDynamicFilter === filter.id;
            const count = dynamicFilterCounts[filter.id] ?? 0;

            return (
              <button
                key={filter.id}
                onClick={() => {
                  if (isSelected && filter.id !== 'all') {
                    setActiveDynamicFilter('all');
                  } else {
                    setActiveDynamicFilter(filter.id);
                  }
                }}
                className={`flex items-center gap-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                  isSelected
                    ? 'h-9 px-3 bg-[#0A2B35] text-white ring-1 ring-[#071E26]'
                    : 'w-9 h-9 sm:w-auto sm:h-9 justify-center sm:justify-start px-0 sm:px-3 bg-white text-[#0A2B35] hover:bg-[#F5EDE0] border border-[#EADBCE]'
                } ${count === 0 && !isSelected ? 'opacity-40' : ''}`}
                title={`Filtrer: ${filter.label} (${count})`}
              >
                <Icon
                  size={14}
                  className={`shrink-0 ${isSelected ? 'text-[#E5A34C]' : 'text-[#0A2B35]'}`}
                />
                {/* One word only on narrow screens when selected */}
                {isSelected && (
                  <span className="sm:hidden font-bold text-white">
                    {filter.shortLabel}
                  </span>
                )}
                {/* Full label on desktop screens */}
                <span className={`hidden sm:inline font-semibold ${isSelected ? 'text-white' : 'text-[#0A2B35]'}`}>
                  {filter.label}
                </span>
                {/* Count badge: visible always on desktop, visible on narrow screens when selected */}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-tight transition-colors ${
                    isSelected
                      ? 'bg-[#071E26] text-[#E5A34C]'
                      : 'hidden sm:inline-block bg-[#F7EBD9] text-[#0A2B35]'
                  }`}
                >
                  {count}
                </span>
                {isSelected && filter.id !== 'all' && (
                  <X size={12} className="text-[#EADBCE] hover:text-white shrink-0 ml-0.5" />
                )}
              </button>
            );
          })}
        </HorizontalScrollContainer>
      </div>

      {/* Category-Specific Products & Services Spotlight */}
      {selectedCategory && categoryFeaturedItems.length > 0 && (
        <div id="category-featured-products-section" className="px-3.5 pt-2 pb-1 animate-in fade-in duration-200">
          <div className="card-gradient-warm rounded-2xl p-3 shadow-xs border border-[#EADBCE]">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles size={14} className="text-[#D9943B] shrink-0" />
                <h4 className="text-xs font-bold text-[#0A2B35] truncate">
                  Produits & Services : {categories.find((c) => c.id === selectedCategory)?.name}
                </h4>
              </div>
              <span className="text-[10px] text-[#648692] font-medium shrink-0 ml-2">
                {categoryFeaturedItems.length} articles
              </span>
            </div>

            <HorizontalScrollContainer
              id="category-spotlight-horizontal-list"
              step={220}
              ariaLabel="Produits et services de la catégorie"
              className="items-stretch gap-2.5 pb-1 -mx-1 px-1"
            >
              {categoryFeaturedItems.map(({ item, store }) => (
                <div
                  key={`${store.id}-${item.id}`}
                  onClick={() => onSelectDishToCustomize(store, item.id)}
                  className="w-36 shrink-0 bg-white rounded-xl p-2 border border-[#EADBCE] hover:border-[#D9943B] transition-all cursor-pointer flex flex-col justify-between group active:scale-95 shadow-2xs"
                  title={`${item.name} chez ${store.name}`}
                >
                  <div>
                    <div className="w-full h-20 rounded-lg overflow-hidden relative bg-neutral-200 mb-1.5">
                      <LazyImage
                        src={item.imageUrl}
                        alt={item.name}
                        placeholderType="dish"
                        targetWidth={160}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.badge && (
                        <span className="absolute top-1 left-1 bg-[#071E26]/85 text-white text-[8px] font-bold px-1 rounded truncate max-w-[90%]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#0A2B35] line-clamp-2 leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-[#648692] line-clamp-1 mt-0.5">
                      {store.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#EADBCE]/60">
                    <span className="text-[11px] font-mono font-extrabold text-[#D91A67]">
                      {item.price} DZD
                    </span>
                    <button
                      type="button"
                      className="btn-gradient-primary w-5 h-5 rounded-full flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform cursor-pointer"
                      aria-label={`Ajouter ${item.name}`}
                    >
                      <Plus size={12} className="text-[#071E26]" />
                    </button>
                  </div>
                </div>
              ))}
            </HorizontalScrollContainer>
          </div>
        </div>
      )}

      {/* Store & Restaurant Feed */}
      <div id="home-store-feed" className="px-3.5 space-y-3 mt-1">
        {filteredStores.length === 0 ? (
          <div
            id="home-search-empty-state"
            className="bg-white rounded-2xl p-6 text-center border border-black/[0.04] shadow-xs flex flex-col items-center justify-center my-3 animate-in fade-in duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Search size={26} strokeWidth={2} className="text-[#1C1B1B]" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 mb-1">
              Aucun commerce trouvé
            </h3>
            <p className="text-xs text-zinc-500 max-w-[280px] mb-4 leading-relaxed">
              {activeDynamicFilter !== 'all'
                ? `Aucun commerce ne correspond au filtre « ${filterOptions.find(f => f.id === activeDynamicFilter)?.label} ».`
                : debouncedQuery || searchQuery
                ? `Aucun commerce ne correspond à la recherche « ${debouncedQuery || searchQuery} ».`
                : 'Aucun établissement ne correspond aux critères sélectionnés.'}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-[340px] mb-4">
              {['Supérettes', 'Boulangeries', 'Kesra', 'Pizzas', 'Supérette El Baraka', 'Boulangerie El Manar', 'Poulet Rôti', 'Café El Waha'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSelectedCategory(null);
                    setActiveDynamicFilter('all');
                    setSearchQuery(suggestion);
                    setDebouncedQuery(suggestion);
                    setIsDebouncing(false);
                  }}
                  className="text-[11px] font-medium bg-neutral-100 hover:bg-amber-100 text-zinc-700 hover:text-amber-900 px-2.5 py-1 rounded-full border border-zinc-200/60 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                handleClearSearch();
                setSelectedCategory(null);
                setActiveDynamicFilter('all');
              }}
              className="px-4 py-2 bg-[#1C1B1B] text-white text-xs font-bold rounded-xl hover:bg-black active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Afficher tous les commerces d'Ahmed Rachedi
            </button>
          </div>
        ) : (
          filteredStores.map((store) => (
            <article
              key={store.id}
              onClick={() => onSelectStore(store)}
              className="card-gradient-primary-glow rounded-2xl p-3 shadow-xs border border-[#EADBCE]/70 flex flex-col gap-2.5 cursor-pointer hover:border-[#D9943B]/60 transition-all active:scale-[0.99]"
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 min-[370px]:w-24 min-[370px]:h-24 aspect-square rounded-xl overflow-hidden shrink-0 relative bg-neutral-100 border border-black/5">
                  <LazyImage
                    src={store.imageUrl}
                    alt={store.name}
                    placeholderType="store"
                    targetWidth={200}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] text-center font-bold py-0.5 z-10">
                    Top Marque
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-[14px] text-[#1C1B1B] line-clamp-1">{store.name}</h3>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center text-[#1C1B1B]">
                        <Star size={12} className="fill-[#1C1B1B] text-[#1C1B1B]" />
                        <span className="text-xs font-bold ml-0.5">{store.rating}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">({store.reviewCount})</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-[11px] text-zinc-500 font-medium">{store.deliveryTimeMin} mins</span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-[11px] text-zinc-500">{store.distanceKm} km</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                        Livraison {store.deliveryFee} DZD
                      </span>
                      <span className="badge-gradient-soft-primary text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Zap size={9} className="text-[#B8731E]" /> Express
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const promoBadge = getStorePromoBadge(store);
                      return promoBadge ? (
                        <span className="badge-gradient-soft-tertiary text-[10px] px-1.5 py-0.2 rounded font-bold">
                          {promoBadge}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-1.5 py-0.2 rounded font-medium">
                          Qualité certifiée Ahmed Rachedi
                        </span>
                      );
                    })()}
                    <span className="text-[10px] bg-neutral-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium">
                      <span className="sm:hidden">COD</span>
                      <span className="hidden sm:inline">Paiement à la livraison</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Featured items micro-preview in this store */}
              {store.items && store.items.length > 0 && (
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] bg-neutral-100 text-zinc-500 px-1 rounded font-bold shrink-0">
                      Spécialité
                    </span>
                    <p className="text-xs text-zinc-700 font-medium truncate">
                      {store.items[0].name} —{' '}
                      <span className="font-bold text-[#D91A67]">{store.items[0].price} DZD</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDishToCustomize(store, store.items[0].id);
                    }}
                    className="btn-gradient-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-xs active:scale-90 cursor-pointer"
                    aria-label="Ajouter au panier"
                  >
                    <Plus size={14} className="text-[#071E26]" />
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* Floating Sticky Cart Preview Bar */}
      {totalCartCount > 0 && (() => {
        const activeCartStore = stores.find((s) => s.id === cartItems[0]?.storeId);
        const deliveryFee = activeCartStore?.deliveryFee ?? 120;
        const isFreeDelivery = totalCartDZD >= 1200;
        const totalSavings =
          cartItems.reduce((acc, it) => {
            const store = stores.find((s) => s.id === it.storeId);
            const menuItem = store?.items?.find((mi) => mi.id === it.menuItemId);
            if (menuItem?.originalPrice && menuItem.originalPrice > menuItem.price) {
              return acc + (menuItem.originalPrice - menuItem.price) * it.quantity;
            }
            return acc;
          }, 0) + (isFreeDelivery ? deliveryFee : 0);

        return (
          <div className="fixed bottom-14 left-0 right-0 w-full max-w-[430px] mx-auto px-3.5 z-30 pointer-events-none">
            <div className="pointer-events-auto card-gradient-dark-fusion text-white rounded-full p-2 pl-3 flex items-center justify-between shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full btn-gradient-tertiary flex items-center justify-center font-bold shadow-md">
                    <ShoppingBag size={20} className="text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 badge-gradient-primary text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-[#071E26]">
                    {totalCartCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-base font-extrabold text-white">{totalCartDZD} DZD</span>
                    {isFreeDelivery ? (
                      <span className="text-[10px] text-[#E5A34C] font-semibold">
                        • <span className="sm:hidden">Offerte</span>
                        <span className="hidden sm:inline">Livraison offerte dès 1 200 DZD</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-300 font-medium">• Frais {deliveryFee} DZD</span>
                    )}
                    {totalSavings > 0 && (
                      <span className="badge-gradient-soft-tertiary text-[10px] px-1.5 py-0.2 rounded font-bold">
                        <span className="sm:hidden">-{Math.round((totalSavings / (totalCartDZD + totalSavings)) * 100)}%</span>
                        <span className="hidden sm:inline">Économie -{Math.round((totalSavings / (totalCartDZD + totalSavings)) * 100)}%</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    <span className="sm:hidden">COD</span>
                    <span className="hidden sm:inline">Paiement en espèces à la livraison</span>
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenCheckout}
                className="btn-gradient-primary text-xs font-extrabold px-4 py-2.5 rounded-full shadow-md flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Commander</span>
                <ChevronRight size={14} className="text-[#071E26]" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
});
