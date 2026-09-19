import {
  BatchDeliveryGroup,
  BatchDeliveryOrderCandidate,
  BatchEngineConfig,
  BatchRouteStop,
  BatchStopStatus,
  TrafficConditionLevel,
  TrafficOffsetConfig,
  StopCumulativeETA,
  BatchCumulativeETAResult,
} from '../types';

/**
 * Great-circle distance between two GPS coordinates in meters (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Realistic Pool of Live Orders in Ahmed Rachedi waiting for dispatch or courier acceptance
 */
export const MILA_CANDIDATE_ORDERS_POOL: BatchDeliveryOrderCandidate[] = [
  {
    orderId: 'order-ar-42',
    orderNumber: '#AR-42',
    storeId: 'store-beniharoun',
    storeName: 'Grillades & Resto Ahmed Rachedi',
    storeAddress: 'Rue Principale (CW 152), Centre-ville Ahmed Rachedi',
    pickupLat: 36.39485,
    pickupLng: 6.13162,
    customerName: 'Amine Benyahia',
    customerPhone: '+213 550 12 34 56',
    customerDestination: 'Cité El Bassatine, Bâtiment C4 (2ème étage)',
    customerLandmark: 'Face à la mosquée El Bassatine, Ahmed Rachedi',
    dropoffLat: 36.39124,
    dropoffLng: 6.12848,
    readyStatus: 'READY',
    readyTimestamp: '12:40',
    readyMinutesFromNow: 0,
    totalAmountDZD: 810,
    payoutFeeDZD: 350,
    itemsSummary: '1× Chawarma Maxi Poulet + Frites + Selecto 33cl',
    itemCount: 2,
    specialInstructions: 'Sonner au 2ème étage à droite, interphone fonctionnel',
  },
  {
    orderId: 'order-ar-89',
    orderNumber: '#AR-89',
    storeId: 'store-supermarket',
    storeName: 'Marché Ahmed Rachedi - Terroir & Supérette',
    storeAddress: 'Rue Principale, Ahmed Rachedi',
    pickupLat: 36.39410,
    pickupLng: 6.13090,
    customerName: 'Nadia Khelifi',
    customerPhone: '+213 661 78 90 12',
    customerDestination: 'Cité El Bassatine, Bâtiment B2 (3ème étage)',
    customerLandmark: 'Face à la supérette Al-Baraka, Ahmed Rachedi',
    dropoffLat: 36.39180,
    dropoffLng: 6.12890,
    readyStatus: 'READY',
    readyTimestamp: '12:43',
    readyMinutesFromNow: 3,
    totalAmountDZD: 1450,
    payoutFeeDZD: 380,
    itemsSummary: 'Panier fruits locaux + Eau minérale 6×1.5L',
    itemCount: 4,
    specialInstructions: 'Monter les packs au 3ème étage, ascenseur en panne',
  },
  {
    orderId: 'order-ar-94',
    orderNumber: '#AR-94',
    storeId: 'store-beniharoun',
    storeName: 'Grillades & Resto Ahmed Rachedi',
    storeAddress: 'Rue Principale (CW 152), Centre-ville Ahmed Rachedi',
    pickupLat: 36.39485,
    pickupLng: 6.13162,
    customerName: 'Karim Touati',
    customerPhone: '+213 770 45 67 89',
    customerDestination: 'Cité El Bassatine, Bâtiment D1 (RDC)',
    customerLandmark: 'Entrée parking sud, Cité El Bassatine',
    dropoffLat: 36.39230,
    dropoffLng: 6.12930,
    readyStatus: 'READY',
    readyTimestamp: '12:44',
    readyMinutesFromNow: 4,
    totalAmountDZD: 1200,
    payoutFeeDZD: 350,
    itemsSummary: 'Poisson grillé + Frites maison + Citronnade',
    itemCount: 3,
    specialInstructions: 'Appeler 2 min avant, j\'attends au hall d\'entrée',
  },
  {
    orderId: 'order-ar-102',
    orderNumber: '#AR-102',
    storeId: 'store-citadelle',
    storeName: 'Pâtisserie Ahmed Rachedi',
    storeAddress: 'Rue Principale, Ahmed Rachedi Centre',
    pickupLat: 36.39350,
    pickupLng: 6.13020,
    customerName: 'Yacine Mansour',
    customerPhone: '+213 555 33 22 11',
    customerDestination: 'Cité 1er Novembre, Bâtiment 4, Ahmed Rachedi',
    customerLandmark: 'À côté de l\'école primaire, Ahmed Rachedi',
    dropoffLat: 36.39280,
    dropoffLng: 6.12970,
    readyStatus: 'READY',
    readyTimestamp: '12:42',
    readyMinutesFromNow: 2,
    totalAmountDZD: 1850,
    payoutFeeDZD: 420,
    itemsSummary: 'Boîte Makroudh aux dattes + 4× Tartes aux fraises',
    itemCount: 5,
    specialInstructions: 'Colis pâtisserie fragile, maintenir à plat dans le top case',
  },
  {
    orderId: 'order-ar-110',
    orderNumber: '#AR-110',
    storeId: 'store-pizzeria-milano',
    storeName: 'Pizzeria Ahmed Rachedi',
    storeAddress: 'Rue Principale, Ahmed Rachedi Centre',
    pickupLat: 36.39380,
    pickupLng: 6.13050,
    customerName: 'Sami Rahmani',
    customerPhone: '+213 662 99 88 77',
    customerDestination: 'Cité El Bassatine, Bâtiment 6 (1er étage)',
    customerLandmark: 'Devant la pharmacie Cité El Bassatine',
    dropoffLat: 36.39150,
    dropoffLng: 6.12870,
    readyStatus: 'READY',
    readyTimestamp: '12:46',
    readyMinutesFromNow: 6,
    totalAmountDZD: 950,
    payoutFeeDZD: 380,
    itemsSummary: '1× Pizza Calzone Viande Hachée + Boisson Hamoud 33cl',
    itemCount: 2,
    specialInstructions: 'Conserver la pizza bien chaude dans le sac isotherme',
  },
  {
    orderId: 'order-ar-125',
    orderNumber: '#AR-125',
    storeId: 'store-fastfood-djenna',
    storeName: 'Fast-Food Ahmed Rachedi',
    storeAddress: 'Rue Principale, Ahmed Rachedi',
    pickupLat: 36.39440,
    pickupLng: 6.13110,
    customerName: 'Bilal Senoussi',
    customerPhone: '+213 771 22 33 44',
    customerDestination: 'Cité El Bassatine, Bloc 12',
    customerLandmark: 'À proximité du dispensaire Ahmed Rachedi',
    dropoffLat: 36.39080,
    dropoffLng: 6.12810,
    readyStatus: 'PREPARING',
    readyTimestamp: '12:55',
    readyMinutesFromNow: 15, // outside standard 10m window for batch 1
    totalAmountDZD: 700,
    payoutFeeDZD: 360,
    itemsSummary: 'Tacos Double Fromage + Frites + Canette Miranda',
    itemCount: 3,
    specialInstructions: 'Sauce algérienne supplémentaire demandée',
  },
];

/**
 * Default Batch Optimization Configuration
 */
export const DEFAULT_BATCH_CONFIG: BatchEngineConfig = {
  maxDestinationRadiusMeters: 600, // Destinations within 600m grouped together
  maxReadyTimeDiffMinutes: 10, // Kitchen ready time within 10 minutes
  maxOrdersPerBatch: 3, // Up to 3 orders per consolidated multi-stop run
};

/**
 * Constructs an optimal sequential multi-stop route for a grouped batch of orders.
 *
 * Sequence strategy:
 * 1. Pickups are sequenced first. If multiple orders share the same store, they are consolidated into one stop!
 * 2. Drop-offs are sequenced immediately following pickups in optimal proximity order.
 */
export function buildMultiStopRoute(
  orders: BatchDeliveryOrderCandidate[],
  courierOrigin: [number, number] = [36.4528, 6.2675]
): {
  stops: BatchRouteStop[];
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  distanceSavedMeters: number;
  timeSavedMinutes: number;
} {
  const stops: BatchRouteStop[] = [];
  let stopCounter = 1;
  let cumulativeMin = 3; // courier reaching first stop in ~3 mins

  // --- STEP 1: PICKUPS CONSOLIDATION ---
  // Group orders by store to prevent duplicate store stops if ordering from the same restaurant!
  const storeMap = new Map<string, BatchDeliveryOrderCandidate[]>();
  orders.forEach((o) => {
    const list = storeMap.get(o.storeId) || [];
    list.push(o);
    storeMap.set(o.storeId, list);
  });

  storeMap.forEach((ordersAtStore, storeId) => {
    const first = ordersAtStore[0];
    const orderNumbers = ordersAtStore.map((o) => o.orderNumber).join(' & ');
    const totalItems = ordersAtStore.reduce((sum, o) => sum + o.itemCount, 0);
    const combinedSummary = ordersAtStore.map((o) => `${o.orderNumber}: ${o.itemsSummary}`).join(' | ');

    stops.push({
      id: `stop-pickup-${storeId}-${stopCounter}`,
      stopNumber: stopCounter++,
      type: 'PICKUP',
      orderId: first.orderId,
      orderNumber: orderNumbers,
      targetName: first.storeName,
      roleLabel: ordersAtStore.length > 1 ? `Enlèvement Groupé (${ordersAtStore.length} colis)` : 'Enlèvement Boutique',
      address: first.storeAddress,
      landmark: 'Comptoir Retrait Coursiers',
      lat: first.pickupLat,
      lng: first.pickupLng,
      estimatedArrivalMin: cumulativeMin,
      status: stopCounter === 2 ? 'CURRENT' : 'PENDING',
      itemsSummary: combinedSummary,
      itemCount: totalItems,
      phone: '+213 31 47 12 34',
      cashToCollectDZD: 0,
      specialInstructions: 'Vérifier la fermeture hermétique des emballages isothermes',
    });

    cumulativeMin += 3; // +3 min for pickup & bag loading
  });

  // --- STEP 2: DROPOFFS (Optimized Nearest Neighbor Order) ---
  const remainingDropoffs = [...orders];
  let currentLat = stops[stops.length - 1]?.lat || courierOrigin[0];
  let currentLng = stops[stops.length - 1]?.lng || courierOrigin[1];

  while (remainingDropoffs.length > 0) {
    // Find closest dropoff to current position
    let bestIdx = 0;
    let minDistance = Infinity;

    remainingDropoffs.forEach((drop, idx) => {
      const dist = calculateDistanceMeters(currentLat, currentLng, drop.dropoffLat, drop.dropoffLng);
      if (dist < minDistance) {
        minDistance = dist;
        bestIdx = idx;
      }
    });

    const nextDrop = remainingDropoffs.splice(bestIdx, 1)[0];
    const transitMin = Math.max(2, Math.round(minDistance / 350)); // ~21 km/h in urban Mila
    cumulativeMin += transitMin;

    stops.push({
      id: `stop-dropoff-${nextDrop.orderId}-${stopCounter}`,
      stopNumber: stopCounter++,
      type: 'DROPOFF',
      orderId: nextDrop.orderId,
      orderNumber: nextDrop.orderNumber,
      targetName: nextDrop.customerName,
      roleLabel: 'Livraison Client (COD)',
      address: nextDrop.customerDestination,
      landmark: nextDrop.customerLandmark,
      lat: nextDrop.dropoffLat,
      lng: nextDrop.dropoffLng,
      estimatedArrivalMin: cumulativeMin,
      status: 'PENDING',
      itemsSummary: nextDrop.itemsSummary,
      itemCount: nextDrop.itemCount,
      phone: nextDrop.customerPhone,
      cashToCollectDZD: nextDrop.totalAmountDZD,
      specialInstructions: nextDrop.specialInstructions,
    });

    currentLat = nextDrop.dropoffLat;
    currentLng = nextDrop.dropoffLng;
    cumulativeMin += 2; // handoff & cash exchange duration
  }

  // Calculate total route distance
  let totalDistanceMeters = 0;
  let lastPt = courierOrigin;
  stops.forEach((st) => {
    totalDistanceMeters += calculateDistanceMeters(lastPt[0], lastPt[1], st.lat, st.lng);
    lastPt = [st.lat, st.lng];
  });

  // Calculate individual separate trips distance for savings calculation
  let separateTripsDistanceMeters = 0;
  orders.forEach((o) => {
    // Trip to store + Trip to customer + Return
    const toStore = calculateDistanceMeters(courierOrigin[0], courierOrigin[1], o.pickupLat, o.pickupLng);
    const toCust = calculateDistanceMeters(o.pickupLat, o.pickupLng, o.dropoffLat, o.dropoffLng);
    separateTripsDistanceMeters += toStore + toCust + 900; // estimated repositioning
  });

  const distanceSavedMeters = Math.max(800, separateTripsDistanceMeters - totalDistanceMeters);
  const timeSavedMinutes = Math.max(8, Math.round(distanceSavedMeters / 250));

  return {
    stops,
    totalDistanceMeters,
    totalDurationMinutes: cumulativeMin,
    distanceSavedMeters,
    timeSavedMinutes,
  };
}

/**
 * BATCH DELIVERY ENGINE
 * Groups available orders based on:
 * 1. Close Destination Radius (<= config.maxDestinationRadiusMeters)
 * 2. Similar Ready Times (<= config.maxReadyTimeDiffMinutes)
 * 3. Pickup proximity
 */
export function groupOrdersIntoBatches(
  candidates: BatchDeliveryOrderCandidate[] = MILA_CANDIDATE_ORDERS_POOL,
  config: BatchEngineConfig = DEFAULT_BATCH_CONFIG,
  courierOrigin: [number, number] = [36.4528, 6.2675]
): BatchDeliveryGroup[] {
  const batches: BatchDeliveryGroup[] = [];
  const assignedOrderIds = new Set<string>();

  // Sort orders by ready time (earliest ready first)
  const sortedOrders = [...candidates].sort((a, b) => a.readyMinutesFromNow - b.readyMinutesFromNow);

  sortedOrders.forEach((seedOrder) => {
    if (assignedOrderIds.has(seedOrder.orderId)) return;

    // Find compatible partner orders
    const partnerOrders: BatchDeliveryOrderCandidate[] = [seedOrder];

    for (const otherOrder of sortedOrders) {
      if (otherOrder.orderId === seedOrder.orderId || assignedOrderIds.has(otherOrder.orderId)) {
        continue;
      }

      // Check Criteria 1: Destination Radius
      const destDistance = calculateDistanceMeters(
        seedOrder.dropoffLat,
        seedOrder.dropoffLng,
        otherOrder.dropoffLat,
        otherOrder.dropoffLng
      );
      if (destDistance > config.maxDestinationRadiusMeters) {
        continue;
      }

      // Check Criteria 2: Similar Ready Times (minutes delta)
      const readyDiff = Math.abs(seedOrder.readyMinutesFromNow - otherOrder.readyMinutesFromNow);
      if (readyDiff > config.maxReadyTimeDiffMinutes) {
        continue;
      }

      // Check Criteria 3: Pickup corridor compatibility (pickups within 800m)
      const pickupDistance = calculateDistanceMeters(
        seedOrder.pickupLat,
        seedOrder.pickupLng,
        otherOrder.pickupLat,
        otherOrder.pickupLng
      );
      if (pickupDistance > 850) {
        continue;
      }

      partnerOrders.push(otherOrder);
      if (partnerOrders.length >= config.maxOrdersPerBatch) {
        break;
      }
    }

    // Only create a batch if at least 2 orders are bundled together
    if (partnerOrders.length >= 2) {
      partnerOrders.forEach((o) => assignedOrderIds.add(o.orderId));

      // Calculate max radius between dropoffs in this batch
      let maxRadius = 0;
      for (let i = 0; i < partnerOrders.length; i++) {
        for (let j = i + 1; j < partnerOrders.length; j++) {
          const d = calculateDistanceMeters(
            partnerOrders[i].dropoffLat,
            partnerOrders[i].dropoffLng,
            partnerOrders[j].dropoffLat,
            partnerOrders[j].dropoffLng
          );
          if (d > maxRadius) maxRadius = d;
        }
      }

      // Calculate ready times spread
      const readyMins = partnerOrders.map((o) => o.readyMinutesFromNow);
      const readySpread = Math.max(...readyMins) - Math.min(...readyMins);

      // Build sequential multi-stop route
      const routeInfo = buildMultiStopRoute(partnerOrders, courierOrigin);

      // Financials
      const baseEarnings = partnerOrders.reduce((sum, o) => sum + o.payoutFeeDZD, 0);
      const batchBonus = partnerOrders.length * 150; // +150 DZD bonus per order in batch
      const totalCashToCollect = partnerOrders.reduce((sum, o) => sum + o.totalAmountDZD, 0);

      // Synergy score (closer radius + closer ready times = higher score up to 99%)
      const radiusScore = Math.max(0, 1 - maxRadius / config.maxDestinationRadiusMeters) * 50;
      const timeScore = Math.max(0, 1 - readySpread / config.maxReadyTimeDiffMinutes) * 50;
      const synergyScore = Math.round(Math.min(99, Math.max(80, radiusScore + timeScore)));

      // Estimate CO2 saved (75g/km on 125cc scooter)
      const co2Grams = Math.round((routeInfo.distanceSavedMeters / 1000) * 75);

      // Detect common neighborhood name
      const neighborhoodName = partnerOrders[0].customerDestination.split(',')[0].trim();

      batches.push({
        id: `batch-${partnerOrders.map((o) => o.orderNumber.replace('#', '')).join('-')}`,
        batchCode: `BATCH-RACHEDI-${batches.length + 1}`,
        neighborhood: `${neighborhoodName} (${maxRadius}m d'écart)`,
        status: 'AVAILABLE',
        orders: partnerOrders,
        stops: routeInfo.stops,
        currentStopIndex: 0,
        totalDistanceMeters: routeInfo.totalDistanceMeters,
        totalDurationMinutes: routeInfo.totalDurationMinutes,
        distanceSavedMeters: routeInfo.distanceSavedMeters,
        timeSavedMinutes: routeInfo.timeSavedMinutes,
        maxRadiusBetweenDropoffsMeters: maxRadius,
        readyTimeSpreadMinutes: readySpread,
        synergyScorePercent: synergyScore,
        baseEarningsDZD: baseEarnings,
        batchBonusDZD: batchBonus,
        totalCourierPayoutDZD: baseEarnings + batchBonus,
        totalCashToCollectDZD: totalCashToCollect,
        totalCashCollectedDZD: 0,
        co2SavedGrams: co2Grams,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return batches;
}

/**
 * Advances the active batch to the next stop, marking current as COMPLETED
 */
export function advanceBatchRouteStop(
  batch: BatchDeliveryGroup,
  proofPhotoUrl?: string
): BatchDeliveryGroup {
  const stops = [...batch.stops];
  const currentIndex = batch.currentStopIndex;

  if (currentIndex >= stops.length) {
    return { ...batch, status: 'COMPLETED' };
  }

  // Mark current stop completed
  const completedStop = {
    ...stops[currentIndex],
    status: 'COMPLETED' as BatchStopStatus,
    completedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    proofPhotoUrl: proofPhotoUrl || stops[currentIndex].proofPhotoUrl,
  };
  stops[currentIndex] = completedStop;

  // Add cash collected if it was a dropoff
  const cashAdded = completedStop.cashToCollectDZD;
  const newCashCollected = batch.totalCashCollectedDZD + cashAdded;

  const nextIndex = currentIndex + 1;
  const isFinished = nextIndex >= stops.length;

  if (!isFinished) {
    // Mark next stop as CURRENT
    stops[nextIndex] = {
      ...stops[nextIndex],
      status: 'CURRENT' as BatchStopStatus,
    };
  }

  return {
    ...batch,
    stops,
    currentStopIndex: nextIndex,
    totalCashCollectedDZD: newCashCollected,
    status: isFinished ? 'COMPLETED' : 'ACTIVE',
  };
}

/**
 * Generates geographic polyline waypoints for the multi-stop route to render on map
 */
export function getBatchRouteCoordinates(
  batch: BatchDeliveryGroup,
  courierOrigin: [number, number] = [36.4528, 6.2675]
): [number, number][] {
  const coords: [number, number][] = [courierOrigin];
  batch.stops.forEach((s) => {
    coords.push([s.lat, s.lng]);
  });
  return coords;
}

/**
 * Real-time Traffic Offset presets calibrated for urban conditions in Ahmed Rachedi
 */
export const MILA_TRAFFIC_CONDITIONS: Record<TrafficConditionLevel, TrafficOffsetConfig> = {
  FLUID: {
    level: 'FLUID',
    label: 'Fluide',
    multiplier: 1.0,
    fixedDelaySecondsPerKm: 0,
    description: 'Circulation normale et fluide sur CW 152 & Centre Ahmed Rachedi',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    reportedCorridor: 'CW 152 & Centre-ville dégagés',
  },
  MODERATE: {
    level: 'MODERATE',
    label: 'Modéré (+3-5 min)',
    multiplier: 1.25,
    fixedDelaySecondsPerKm: 45,
    description: 'Ralentissement au Centre-ville et abords du Marché',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    reportedCorridor: 'Carrefour Centre Ahmed Rachedi',
  },
  HEAVY: {
    level: 'HEAVY',
    label: 'Dense (+6-10 min)',
    multiplier: 1.55,
    fixedDelaySecondsPerKm: 95,
    description: 'Forte affluence au Marché d\'Ahmed Rachedi et sorties d\'écoles',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    reportedCorridor: 'Abords Marché Ahmed Rachedi',
  },
  CONGESTED: {
    level: 'CONGESTED',
    label: 'Saturé (+10-15 min)',
    multiplier: 1.85,
    fixedDelaySecondsPerKm: 160,
    description: 'Ralentissements sur l\'axe vers Cité El Bassatine',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    reportedCorridor: 'Intersection Cité El Bassatine & Axe Principal',
  },
};

/**
 * Calculates dynamic cumulative travel time and distance across all stops in a batch,
 * adjusting for real-time traffic offsets and per-stop service buffers.
 */
export function calculateCumulativeBatchETA(
  batch: BatchDeliveryGroup,
  courierOrigin: [number, number] = [36.4528, 6.2675],
  trafficLevel: TrafficConditionLevel = 'MODERATE',
  baseTime: Date = new Date()
): BatchCumulativeETAResult {
  const trafficConfig = MILA_TRAFFIC_CONDITIONS[trafficLevel] || MILA_TRAFFIC_CONDITIONS.MODERATE;
  const stopsETA: StopCumulativeETA[] = [];

  let runningCumulativeDistanceMeters = 0;
  let runningCumulativeSeconds = 0;
  let totalBaseTransitSeconds = 0;
  let totalTrafficOffsetSeconds = 0;
  let totalServiceBufferSeconds = 0;

  // Track position from which the courier continues
  let lastLat = courierOrigin[0];
  let lastLng = courierOrigin[1];

  let remainingCount = 0;

  batch.stops.forEach((stop, index) => {
    const isCompleted = stop.status === 'COMPLETED';

    if (isCompleted) {
      stopsETA.push({
        stopId: stop.id,
        stopNumber: stop.stopNumber,
        type: stop.type,
        targetName: stop.targetName,
        address: stop.address,
        segmentDistanceMeters: 0,
        cumulativeDistanceMeters: 0,
        baseTransitSeconds: 0,
        trafficOffsetSeconds: 0,
        serviceBufferSeconds: 0,
        totalSegmentSeconds: 0,
        cumulativeDurationSeconds: 0,
        cumulativeDurationMinutes: 0,
        estimatedArrivalClock: stop.completedAt || 'Fait',
        relativeMinutesFromNow: 0,
        status: 'COMPLETED',
      });
      return;
    }

    remainingCount++;

    // Calculate segment distance from last position to this stop
    const segmentDistance = calculateDistanceMeters(lastLat, lastLng, stop.lat, stop.lng);
    runningCumulativeDistanceMeters += segmentDistance;

    // Baseline scooter transit speed in Mila ~27 km/h (7.5 meters per second)
    const baseTransitSec = Math.max(30, Math.round(segmentDistance / 7.5));
    totalBaseTransitSeconds += baseTransitSec;

    // Traffic offset calculation: multiplier difference + fixed corridor delay
    const multiplierDelaySec = Math.round(baseTransitSec * (trafficConfig.multiplier - 1.0));
    const corridorDelaySec = Math.round((segmentDistance / 1000) * trafficConfig.fixedDelaySecondsPerKm);
    const trafficOffsetSec = multiplierDelaySec + corridorDelaySec;
    totalTrafficOffsetSeconds += trafficOffsetSec;

    // Stop service buffer:
    // PICKUP: 120s (2 min) for kitchen check & insulation pack
    // DROPOFF: 150s (2.5 min) for customer greeting, building climb & COD cash count
    const serviceBufferSec = stop.type === 'PICKUP' ? 120 : 150;
    totalServiceBufferSeconds += serviceBufferSec;

    // Total time for this individual leg
    const segmentTotalSec = baseTransitSec + trafficOffsetSec + serviceBufferSec;
    runningCumulativeSeconds += segmentTotalSec;

    // Estimated arrival clock time
    const arrivalDate = new Date(baseTime.getTime() + runningCumulativeSeconds * 1000);
    const arrivalClock = arrivalDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const relativeMins = Math.max(1, Math.round(runningCumulativeSeconds / 60));

    stopsETA.push({
      stopId: stop.id,
      stopNumber: stop.stopNumber,
      type: stop.type,
      targetName: stop.targetName,
      address: stop.address,
      segmentDistanceMeters: segmentDistance,
      cumulativeDistanceMeters: runningCumulativeDistanceMeters,
      baseTransitSeconds: baseTransitSec,
      trafficOffsetSeconds: trafficOffsetSec,
      serviceBufferSeconds: serviceBufferSec,
      totalSegmentSeconds: segmentTotalSec,
      cumulativeDurationSeconds: runningCumulativeSeconds,
      cumulativeDurationMinutes: relativeMins,
      estimatedArrivalClock: arrivalClock,
      relativeMinutesFromNow: relativeMins,
      status: index === batch.currentStopIndex ? 'CURRENT' : 'PENDING',
    });

    // Update last position for next segment
    lastLat = stop.lat;
    lastLng = stop.lng;
  });

  const totalMinutes = Math.max(1, Math.round(runningCumulativeSeconds / 60));
  const finalArrivalDate = new Date(baseTime.getTime() + runningCumulativeSeconds * 1000);
  const finalDeliveryClock = finalArrivalDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Effective real-time speed in km/h factoring traffic
  const hours = runningCumulativeSeconds / 3600;
  const avgSpeed = hours > 0 ? Math.round(((runningCumulativeDistanceMeters / 1000) / hours) * 10) / 10 : 25;

  return {
    stopsETA,
    totalCumulativeDistanceMeters: runningCumulativeDistanceMeters,
    totalCumulativeDurationMinutes: totalMinutes,
    baseTransitMinutes: Math.round(totalBaseTransitSeconds / 60),
    trafficOffsetMinutes: Math.round(totalTrafficOffsetSeconds / 60),
    serviceBufferMinutes: Math.round(totalServiceBufferSeconds / 60),
    remainingStopsCount: remainingCount,
    finalDeliveryClock,
    averageSpeedKmH: avgSpeed,
    traffic: trafficConfig,
    calculatedAt: baseTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

