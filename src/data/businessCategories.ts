import { BusinessCategory, BusinessCategoryConfig } from '../types';

export interface CategoryDetail extends BusinessCategoryConfig {
  icon: string; // Lucide icon name identifier
  color: string;
  bgLight: string;
  borderColor: string;
  recommendedPrepTime: number;
  catalogTabLabel: string;
  unitOptions: string[];
  aisleOptions?: string[];
  sampleProducts: {
    name: string;
    category: string;
    price: number;
    description: string;
    imageUrl: string;
    badge?: string;
    // Tailored defaults
    unit?: string;
    stockQuantity?: number;
    stockThreshold?: number;
    aisle?: string;
    prepTimeMinutes?: number;
    spiciness?: 'none' | 'mild' | 'spicy' | 'extra_spicy';
    dishCourse?: 'entree' | 'plat' | 'dessert' | 'boisson' | 'formule';
    bakingBatchTime?: string;
    requiresPrescription?: boolean;
    dosageFormat?: string;
  }[];
}

export const BUSINESS_CATEGORIES: Record<BusinessCategory, CategoryDetail> = {
  restaurant: {
    id: 'restaurant',
    nameFr: 'Restaurant & Restauration Rapide',
    nameAr: 'مطعم ومأكولات سريعة',
    description: 'Pizzeria, fast-food, grillades, poissons de Beni Haroun, traiteur & plats traditionnels.',
    badgeLabel: 'Cuisine & Restauration',
    icon: 'UtensilsCrossed',
    color: '#D97706',
    bgLight: '#FEF3C7',
    borderColor: '#F59E0B',
    recommendedPrepTime: 20,
    catalogTabLabel: 'Menu & Carte',
    primaryCatalogName: 'Carte des Plats & Menus',
    secondaryTools: [
      'Tickets de Cuisine KDS (Imprimante Thermique)',
      'Gestion des Cuissons & Temps de Préparation',
      'Formules Repas & Options Garnitures',
      'Activation / Rupture de Plat en 1 clic',
      'Remarques Personnalisées du Chef',
    ],
    defaultCategories: [
      '🔥 Les Populaires & Grillades',
      '🐟 Spécialités Beni Haroun',
      '🌯 Sandwichs & Chawarma',
      '🍕 Pizzas & Tartes',
      '🥤 Boissons Fraîches & Jus',
      '🍨 Desserts & Douceurs',
    ],
    defaultPrepOrDeliveryMinutes: 20,
    unitOptions: ['portion', 'plat', 'sandwich', 'menu complet', 'bouteille'],
    sampleProducts: [
      {
        name: 'Maxi Chawarma Poulet Braisé & Frites',
        category: '🌯 Sandwichs & Chawarma',
        price: 750,
        description: 'Pain maison cuit au four, émincé de poulet mariné aux épices de Mila, frites fraîches et sauce à l\'ail.',
        imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop&q=80',
        badge: 'Populaire',
        prepTimeMinutes: 15,
        dishCourse: 'plat',
        spiciness: 'mild',
      },
      {
        name: 'Poisson Frais Beni Haroun Grillé',
        category: '🐟 Spécialités Beni Haroun',
        price: 950,
        description: 'Sandre ou carpe pêchée le matin même au barrage de Beni Haroun, grillade au feu de bois avec charmoula et citron.',
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
        badge: 'Spécialité Locale',
        prepTimeMinutes: 25,
        dishCourse: 'plat',
        spiciness: 'none',
      },
    ],
  },
  grocery: {
    id: 'grocery',
    nameFr: 'Épicerie, Supérette & Supermarché',
    nameAr: 'بقالة ومواد غذائية وسوبرماركت',
    description: 'Alimentation générale, produits frais, produits laitiers, boissons, droguerie & produits du quotidien.',
    badgeLabel: 'Commerce & Supérette',
    icon: 'ShoppingBasket',
    color: '#059669',
    bgLight: '#D1FAE5',
    borderColor: '#10B981',
    recommendedPrepTime: 10,
    catalogTabLabel: 'Inventaire & Rayons',
    primaryCatalogName: 'Gestion de l\'Inventaire & Rayons',
    secondaryTools: [
      'Suivi Précis des Stocks (Quantité & Unités)',
      'Alertes Automatiques de Rupture (< seuil critique)',
      'Suivi DLC & Dates de Péremption',
      'Réassort Express (+10, +50 unités en 1 clic)',
      'Unités au Poids (kg, litre, pièce, pack)',
      'Organisation par Rayons en Magasin',
    ],
    defaultCategories: [
      '🥛 Produits Frais & Laiterie',
      '🌾 Épicerie Salée & Huiles',
      '🍯 Épicerie Sucrée & Biscuits',
      '🧃 Boissons, Jus & Eaux',
      '🧼 Hygiène, Beauté & Entretien',
      '🍎 Fruits & Légumes du Terroir',
    ],
    defaultPrepOrDeliveryMinutes: 10,
    unitOptions: ['pièce', 'kg', 'g', 'litre', 'bouteille', 'paquet', 'boîte', 'pack de 6', 'palette'],
    aisleOptions: [
      'Rayon Frais & Crémerie',
      'Rayon Boissons',
      'Rayon Petit-Déjeuner',
      'Rayon Conserves & Condiments',
      'Rayon Hygiène & Ménage',
      'Rayon Fruits & Légumes',
    ],
    sampleProducts: [
      {
        name: 'Lait Pasteurisé Candia Silia 1L',
        category: '🥛 Produits Frais & Laiterie',
        price: 135,
        description: 'Brique de lait entier pasteurisé 1L, origine Algérie.',
        imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
        unit: 'litre',
        stockQuantity: 48,
        stockThreshold: 10,
        aisle: 'Rayon Frais & Crémerie',
      },
      {
        name: 'Semoule Extra Fine Sim 1kg',
        category: '🌾 Épicerie Salée & Huiles',
        price: 120,
        description: 'Semoule de blé dur de qualité supérieure pour kesra et pâtes traditionnelles.',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
        badge: 'Essentiel',
        unit: 'kg',
        stockQuantity: 65,
        stockThreshold: 15,
        aisle: 'Rayon Conserves & Condiments',
      },
      {
        name: 'Huile de Table Elio 5L',
        category: '🌾 Épicerie Salée & Huiles',
        price: 650,
        description: 'Bidon d\'huile végétale raffinée sans cholestérol 5 Litres.',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
        unit: 'bouteille',
        stockQuantity: 18,
        stockThreshold: 5,
        aisle: 'Rayon Conserves & Condiments',
      },
    ],
  },
  bakery: {
    id: 'bakery',
    nameFr: 'Boulangerie & Pâtisserie Artisanale',
    nameAr: 'مخبزة وحلويات تقليدية وعصرية',
    description: 'Pains traditionnels, baguettes, viennoiseries chaudes, gâteaux orientaux et pâtisseries fines.',
    badgeLabel: 'Boulangerie & Pâtisserie',
    icon: 'Croissant',
    color: '#EA580C',
    bgLight: '#FFEDD5',
    borderColor: '#FB923C',
    recommendedPrepTime: 10,
    catalogTabLabel: 'Fournées & Pâtisserie',
    primaryCatalogName: 'Fournées & Carte Pâtisseries',
    secondaryTools: [
      'Gestion des Horaires de Fournées (Matin / Après-midi)',
      'Suivi de la Fraîcheur du Jour (Pains du matin)',
      'Commandes Spéciales & Gâteaux Événements',
      'Alerte Rupture Immédiate sur Pains Chauds',
    ],
    defaultCategories: [
      '🥖 Pains & Baguettes Chaudes',
      '🥐 Viennoiseries du Matin',
      '🍯 Gâteaux Traditionnels (Baklawa, Makroud)',
      '🍰 Pâtisseries Fines & Tartes',
      '☕ Boissons & Jus de Fruits',
    ],
    defaultPrepOrDeliveryMinutes: 10,
    unitOptions: ['pièce', 'baguette', 'douzaine', 'boîte', 'plateau', 'kg'],
    sampleProducts: [
      {
        name: 'Matlouh Traditionnel de Mila à la Semoule',
        category: '🥖 Pains & Baguettes Chaudes',
        price: 40,
        description: 'Pain traditionnel algérien cuit sur tajine en terre cuite, mie alvéolée et moelleuse.',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        badge: 'Fait Maison',
        unit: 'pièce',
        stockQuantity: 30,
        stockThreshold: 6,
        bakingBatchTime: 'Fournée de 07h00',
      },
      {
        name: 'Plateau Assortiment Makroud aux Dattes de Biskra',
        category: '🍯 Gâteaux Traditionnels (Baklawa, Makroud)',
        price: 900,
        description: '12 pièces de makroud au miel de fleurs d\'oranger et pâte de dattes Deglet Nour de première qualité.',
        imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
        badge: 'Terroir',
        unit: 'plateau',
        stockQuantity: 12,
        stockThreshold: 3,
      },
    ],
  },
  pharmacy: {
    id: 'pharmacy',
    nameFr: 'Pharmacie & Parapharmacie',
    nameAr: 'صيدلية وشبه صيدلية',
    description: 'Médicaments courants, premiers soins, hygiène pour bébé, vitamines et produits parapharmaceutiques.',
    badgeLabel: 'Santé & Bien-être',
    icon: 'Pill',
    color: '#0284C7',
    bgLight: '#E0F2FE',
    borderColor: '#38BDF8',
    recommendedPrepTime: 10,
    catalogTabLabel: 'Officine & Soins',
    primaryCatalogName: 'Catalogue Officine & Soins',
    secondaryTools: [
      'Indicateur Ordonnance Médicale Obligatoire',
      'Gestion des Formats & Posologies Claires',
      'Suivi des Lots & Dates de Péremption',
      'Mode Urgence & Pharmacie de Garde',
    ],
    defaultCategories: [
      '🩹 Premiers Secours & Pansements',
      '👶 Soins Bébé & Maternité',
      '🧴 Dermocosmétique & Peau',
      '🦷 Hygiène Dentaire & Corps',
      '⚡ Vitamines & Compléments',
    ],
    defaultPrepOrDeliveryMinutes: 10,
    unitOptions: ['boîte', 'flacon', 'tube', 'lot', 'sachet'],
    sampleProducts: [
      {
        name: 'Boîte Premiers Secours & Antiseptique',
        category: '🩹 Premiers Secours & Pansements',
        price: 850,
        description: 'Kit de compresses stériles, désinfectant local, sparadrap et ciseaux.',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
        unit: 'boîte',
        stockQuantity: 15,
        stockThreshold: 3,
        requiresPrescription: false,
        dosageFormat: 'Trousse 10 éléments',
      },
      {
        name: 'Lait Nourrisson 1er Âge Bio 800g',
        category: '👶 Soins Bébé & Maternité',
        price: 1450,
        description: 'Lait infantile de suite enrichi en fer et DHA, 0 à 6 mois.',
        imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
        unit: 'boîte',
        stockQuantity: 20,
        stockThreshold: 4,
        requiresPrescription: false,
        dosageFormat: 'Boîte 800g avec mesurette',
      },
    ],
  },
  butcher: {
    id: 'butcher',
    nameFr: 'Boucherie & Volailles du Terroir',
    nameAr: 'جزارة ودواجن طازجة',
    description: 'Viande bovine et ovine locale, volailles fermières, saucisses merguez artisanales découpées à la demande.',
    badgeLabel: 'Boucherie Halal',
    icon: 'Beef',
    color: '#DC2626',
    bgLight: '#FEE2E2',
    borderColor: '#F87171',
    recommendedPrepTime: 15,
    catalogTabLabel: 'Découpe & Viandes',
    primaryCatalogName: 'Catalogue Découpe & Viandes Fraîches',
    secondaryTools: [
      'Vente au Poids Net (kg / 500g)',
      'Indicateur Découpe Personnalisée (haché, steak, rôti)',
      'Traçabilité 100% Viande Locale Wilaya de Mila',
      'Merguez Artisanales Épicées Maison',
    ],
    defaultCategories: [
      '🥩 Viande Bovine Locale',
      '🐑 Viande Ovine (Agneau du Terroir)',
      '🍗 Volailles Fermières Fraîches',
      '🌭 Merguez & Préparations Maison',
    ],
    defaultPrepOrDeliveryMinutes: 15,
    unitOptions: ['kg', '500g', 'pièce', 'barquette'],
    sampleProducts: [
      {
        name: 'Merguez Artisanales Pur Bœuf de Mila (1 kg)',
        category: '🌭 Merguez & Préparations Maison',
        price: 1600,
        description: 'Recette artisanale aux épices de Mila, sans colorant artificiel, boyau naturel d\'agneau.',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        badge: 'Maison',
        unit: 'kg',
        stockQuantity: 25,
        stockThreshold: 5,
      },
    ],
  },
  artisan: {
    id: 'artisan',
    nameFr: 'Fleuriste, Cadeaux & Artisanat',
    nameAr: 'زهور وهدايا وصناعات تقليدية',
    description: 'Bouquets de fleurs fraîches, céramique, broderie, cadeaux personnalisés et produits d\'artisanat.',
    badgeLabel: 'Artisanat & Fleurs',
    icon: 'Sparkles',
    color: '#7C3AED',
    bgLight: '#EDE9FE',
    borderColor: '#A78BFA',
    recommendedPrepTime: 20,
    catalogTabLabel: 'Créations & Cadeaux',
    primaryCatalogName: 'Créations & Produits Artisanaux',
    secondaryTools: [
      'Option Emballage Cadeau Offert',
      'Message Personnalisé pour le Destinataire',
      'Conseils de Conservation des Fleurs',
      'Pièces Uniques Faites Main',
    ],
    defaultCategories: [
      '💐 Bouquets de Fleurs & Roses',
      '🎁 Coffrets Cadeaux & Fêtes',
      '🏺 Poterie & Céramique de Mila',
      '🌿 Plantes d\'Intérieur',
    ],
    defaultPrepOrDeliveryMinutes: 20,
    unitOptions: ['bouquet', 'pièce', 'coffret', 'pot'],
    sampleProducts: [
      {
        name: 'Bouquet de Roses Rouges & Blanches Fraîches',
        category: '💐 Bouquets de Fleurs & Roses',
        price: 2200,
        description: 'Arrangement soigné de 15 roses avec feuillage décoratif et carte message personnalisée.',
        imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80',
        badge: 'Coup de Cœur',
        unit: 'bouquet',
        stockQuantity: 10,
        stockThreshold: 2,
      },
    ],
  },
};

/**
 * Returns helper to safely determine business category from store category string
 */
export function detectBusinessCategory(storeCategoryOrName?: string): BusinessCategory {
  if (!storeCategoryOrName) return 'restaurant';
  const text = storeCategoryOrName.toLowerCase();
  if (text.includes('épicerie') || text.includes('epicerie') || text.includes('supérette') || text.includes('superette') || text.includes('supermarché') || text.includes('supermarket') || text.includes('alimentation')) {
    return 'grocery';
  }
  if (text.includes('boulangerie') || text.includes('pâtisserie') || text.includes('patisserie') || text.includes('viennoiserie') || text.includes('gâteaux')) {
    return 'bakery';
  }
  if (text.includes('pharmacie') || text.includes('santé') || text.includes('parapharmacie') || text.includes('médicament')) {
    return 'pharmacy';
  }
  if (text.includes('boucherie') || text.includes('viande') || text.includes('volaille')) {
    return 'butcher';
  }
  if (text.includes('fleur') || text.includes('artisan') || text.includes('cadeau') || text.includes('boutique')) {
    return 'artisan';
  }
  return 'restaurant';
}

/**
 * Returns tailored business category configuration and localized labels
 */
export function getBusinessCategoryConfig(category: BusinessCategory) {
  const detail = BUSINESS_CATEGORIES[category] || BUSINESS_CATEGORIES.restaurant;
  return {
    ...detail,
    name: detail.nameFr,
    badge: detail.badgeLabel,
    features: detail.secondaryTools,
    labels: {
      catalogTitle: detail.primaryCatalogName,
      addProduct:
        category === 'grocery'
          ? 'Ajouter un Produit en Rayon'
          : category === 'restaurant'
          ? 'Ajouter un Plat au Menu'
          : category === 'bakery'
          ? 'Ajouter une Fournée'
          : category === 'pharmacy'
          ? 'Ajouter un Produit de Santé'
          : category === 'butcher'
          ? 'Ajouter une Découpe de Viande'
          : 'Ajouter une Création Artisanale',
    },
  };
}
