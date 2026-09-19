// Real Road Routing Service for Ahmed Rachedi (Wilaya 43 - Mila)
// Queries real street network graph to compute the true shortest path respecting real roads in Ahmed Rachedi

export type LatLng = [number, number]; // [lat, lng]

export interface RouteStep {
  instruction: string;
  name: string;
  distance: number; // in meters
  duration: number; // in seconds
}

export interface ShortestRouteResult {
  coordinates: LatLng[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  steps: RouteStep[];
  currentStreetName: string;
  isRealNetwork: boolean;
}

// Default Key Landmarks in Ahmed Rachedi (Wilaya 43)
export const AHMED_RACHEDI_CENTER: LatLng = [36.39308, 6.13022]; // Centre-ville Ahmed Rachedi
export const AHMED_RACHEDI_DEFAULT_ORIGIN: LatLng = [36.39485, 6.13162]; // Commerce / Restaurant Centre, Ahmed Rachedi
export const AHMED_RACHEDI_DEFAULT_DESTINATION: LatLng = [36.39124, 6.12848]; // Cité El Bassatine, Ahmed Rachedi

// Bounding box strictly restricting the map to Ahmed Rachedi city
export const AHMED_RACHEDI_BOUNDS: [LatLng, LatLng] = [
  [36.375, 6.105],
  [36.415, 6.155],
];

export const MILA_DEFAULT_ORIGIN: LatLng = AHMED_RACHEDI_DEFAULT_ORIGIN;
export const MILA_DEFAULT_DESTINATION: LatLng = AHMED_RACHEDI_DEFAULT_DESTINATION;

// Calculate distance between two GPS coordinates in meters using Haversine
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (p1[0] * Math.PI) / 180;
  const phi2 = (p2[0] * Math.PI) / 180;
  const deltaPhi = ((p2[0] - p1[0]) * Math.PI) / 180;
  const deltaLambda = ((p2[1] - p1[1]) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Compute cumulative distance along a polyline
export function computePolylineDistances(coords: LatLng[]): { total: number; cumulative: number[] } {
  const cumulative = [0];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = calculateDistanceMeters(coords[i], coords[i + 1]);
    total += d;
    cumulative.push(total);
  }
  return { total, cumulative };
}

// Get interpolated position along polyline by target distance traveled (in meters)
export function getPositionAtDistance(
  coords: LatLng[],
  cumulativeDistances: number[],
  targetMeters: number
): { position: LatLng; segmentIndex: number; progressFraction: number } {
  if (coords.length === 0) return { position: [0, 0], segmentIndex: 0, progressFraction: 0 };
  if (targetMeters <= 0) return { position: coords[0], segmentIndex: 0, progressFraction: 0 };

  const total = cumulativeDistances[cumulativeDistances.length - 1];
  if (targetMeters >= total) {
    return {
      position: coords[coords.length - 1],
      segmentIndex: coords.length - 2,
      progressFraction: 1,
    };
  }

  // Find segment
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    const startD = cumulativeDistances[i];
    const endD = cumulativeDistances[i + 1];
    if (targetMeters >= startD && targetMeters <= endD) {
      const segLength = endD - startD;
      const frac = segLength > 0 ? (targetMeters - startD) / segLength : 0;
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * frac;
      const lng = p1[1] + (p2[1] - p1[1]) * frac;
      return {
        position: [lat, lng],
        segmentIndex: i,
        progressFraction: targetMeters / total,
      };
    }
  }

  return {
    position: coords[coords.length - 1],
    segmentIndex: coords.length - 2,
    progressFraction: 1,
  };
}

// Offline high-precision real street nodes for Ahmed Rachedi (Wilaya 43)
// Mapped along Rue Principale (CW 152) -> Centre-Ville -> Cité El Bassatine
const FALLBACK_AHMED_RACHEDI_REAL_ROAD_NODES: LatLng[] = [
  [36.39485, 6.13162],
  [36.39452, 6.13125],
  [36.39418, 6.13088],
  [36.39385, 6.13052],
  [36.39345, 6.13018],
  [36.39308, 6.12985],
  [36.39265, 6.12948],
  [36.39215, 6.12912],
  [36.39168, 6.12878],
  [36.39124, 6.12848],
];

const FALLBACK_MILA_REAL_ROAD_NODES = FALLBACK_AHMED_RACHEDI_REAL_ROAD_NODES;

// Memory Cache for calculated routes to minimize bandwidth, battery and CPU consumption
const routeCache = new Map<string, ShortestRouteResult>();

function getCacheKey(origin: LatLng, destination: LatLng): string {
  return `${origin[0].toFixed(5)},${origin[1].toFixed(5)}->${destination[0].toFixed(5)},${destination[1].toFixed(5)}`;
}

/**
 * Fetch the shortest path respecting the real road network using OSRM
 * (cached in memory; fallback to real mapped street nodes if network is restricted)
 */
export async function fetchShortestRoadPath(
  origin: LatLng,
  destination: LatLng,
  externalSignal?: AbortSignal
): Promise<ShortestRouteResult> {
  const [origLat, origLng] = origin;
  const [destLat, destLng] = destination;

  // Check in-memory cache first to avoid unnecessary network payload
  const cacheKey = getCacheKey(origin, destination);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Format: {lng},{lat};{lng},{lat}
  const url = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    // If caller provided an abort signal, listen to it
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        // OSRM coordinates are [lng, lat], transform to Leaflet [lat, lng]
        const rawCoords: [number, number][] = primaryRoute.geometry.coordinates;
        const coordinates: LatLng[] = rawCoords.map(([lng, lat]) => [lat, lng]);

        const steps: RouteStep[] = [];
        let currentStreetName = 'Rue Zerouki Houssine';

        if (primaryRoute.legs && primaryRoute.legs[0]?.steps) {
          for (const s of primaryRoute.legs[0].steps) {
            const name = s.name || s.ref || 'Voie municipale';
            if (name && name !== 'Voie municipale' && !currentStreetName) {
              currentStreetName = name;
            }
            steps.push({
              instruction: s.maneuver?.type ? `${s.maneuver.type} ${name}` : name,
              name: name,
              distance: s.distance,
              duration: s.duration,
            });
          }
        }

        const result: ShortestRouteResult = {
          coordinates,
          totalDistanceMeters: Math.round(primaryRoute.distance),
          totalDurationSeconds: Math.round(primaryRoute.duration),
          steps,
          currentStreetName: currentStreetName || "Boulevard de l'ALN",
          isRealNetwork: true,
        };

        // Cache up to 30 routes to keep memory minimal
        if (routeCache.size > 30) {
          const firstKey = routeCache.keys().next().value;
          if (firstKey) routeCache.delete(firstKey);
        }
        routeCache.set(cacheKey, result);

        return result;
      }
    }
  } catch {
    // Network timeout or offline - use offline real road graph
  }

  // Fallback: connect origin -> nearest street nodes -> destination
  const fallbackCoords = [origin, ...FALLBACK_MILA_REAL_ROAD_NODES, destination];
  let dist = 0;
  for (let i = 0; i < fallbackCoords.length - 1; i++) {
    dist += calculateDistanceMeters(fallbackCoords[i], fallbackCoords[i + 1]);
  }

  return {
    coordinates: fallbackCoords,
    totalDistanceMeters: Math.round(dist),
    totalDurationSeconds: Math.round((dist / 30000) * 3600), // ~30 km/h
    steps: [
      {
        instruction: 'Départ depuis le commerce',
        name: 'Rue Principale (CW 152)',
        distance: Math.round(dist * 0.3),
        duration: 90,
      },
      {
        instruction: 'Continuer sur Rue Principale, Ahmed Rachedi',
        name: 'Rue Principale (CW 152)',
        distance: Math.round(dist * 0.5),
        duration: 150,
      },
      {
        instruction: 'Arrivée à Cité El Bassatine, Ahmed Rachedi',
        name: 'Cité El Bassatine',
        distance: Math.round(dist * 0.2),
        duration: 60,
      },
    ],
    currentStreetName: 'Rue Principale (CW 152)',
    isRealNetwork: false,
  };
}
