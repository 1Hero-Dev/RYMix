import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Maximize2,
  Minimize2,
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Route,
  Navigation,
  RotateCcw,
  Compass,
  Radio,
} from 'lucide-react';
import {
  fetchShortestRoadPath,
  computePolylineDistances,
  getPositionAtDistance,
  calculateDistanceMeters,
  AHMED_RACHEDI_CENTER,
  AHMED_RACHEDI_DEFAULT_ORIGIN,
  AHMED_RACHEDI_DEFAULT_DESTINATION,
  AHMED_RACHEDI_BOUNDS,
  MILA_DEFAULT_ORIGIN,
  MILA_DEFAULT_DESTINATION,
  LatLng,
  ShortestRouteResult,
} from '../utils/roadRoutingService';
import {
  updateDriverLocation,
  subscribeToDriverLocation,
  DriverLocationData,
} from '../firebase/firebaseServices';
import { OrderStatus } from '../types';

interface RealLeafletMapProps {
  orderStatus: string;
  courierName?: string;
  storeName?: string;
  destinationName?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  etaText?: string;
  onSimulateStatusAdvance?: () => void;
  onStatusChange?: (status: OrderStatus) => void;
}

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
  orderStatus,
  courierName = 'Walid M.',
  storeName = 'Commerce & Resto Ahmed Rachedi',
  destinationName = 'Cité El Bassatine, Ahmed Rachedi',
  isExpanded,
  onToggleExpand,
  etaText = '6–9 min',
  onSimulateStatusAdvance,
  onStatusChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const routeHaloRef = useRef<L.Polyline | null>(null);
  const traveledLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routingAbortRef = useRef<AbortController | null>(null);
  const hasTriggeredArrivedRef = useRef(false);

  const cleanCourierName = courierName.replace(/\s*\([^)]*\)/g, '').trim() || 'Walid M.';

  // Road Routing State
  const [routeResult, setRouteResult] = useState<ShortestRouteResult | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0); // meters traveled along route
  const [currentStreet, setCurrentStreet] = useState<string>('Rue Principale (CW 152)');
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState<number>(1400);
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [routingNotification, setRoutingNotification] = useState<string | null>(null);

  // Live Telemetry & Follow Mode
  const [isFollowingCourier, setIsFollowingCourier] = useState<boolean>(true);
  const [courierSpeedKmh, setCourierSpeedKmh] = useState<number>(31);
  const [telemetrySignalFresh, setTelemetrySignalFresh] = useState<boolean>(true);

  // Map settings
  const [mapTheme, setMapTheme] = useState<'streets' | 'light' | 'topo'>('streets');
  const [hideOverlays, setHideOverlays] = useState<boolean>(false);

  // Store distances cache for fast interpolation
  const polylineDistancesRef = useRef<{ total: number; cumulative: number[] }>({
    total: 0,
    cumulative: [],
  });
  const currentCoordsRef = useRef<LatLng>(MILA_DEFAULT_ORIGIN);

  // Calculate shortest road path between courier location and destination
  const calculateShortestPath = useCallback(
    async (originPos: LatLng, destPos: LatLng = MILA_DEFAULT_DESTINATION) => {
      // Abort any prior in-flight route fetch to conserve network and prevent race conditions
      if (routingAbortRef.current) {
        routingAbortRef.current.abort();
      }
      const abortController = new AbortController();
      routingAbortRef.current = abortController;

      setIsRouting(true);
      try {
        const result = await fetchShortestRoadPath(originPos, destPos, abortController.signal);
        setRouteResult(result);

        const distInfo = computePolylineDistances(result.coordinates);
        polylineDistancesRef.current = distInfo;

        // Reset traveled polyline for clean re-route
        if (traveledLineRef.current) {
          traveledLineRef.current.remove();
          traveledLineRef.current = null;
        }

        // Determine starting distance based on delivery progress
        let initialDistance = 0;
        if (orderStatus === 'DELIVERED') {
          initialDistance = distInfo.total;
        } else if (orderStatus === 'DELIVERING') {
          initialDistance = 0;
        } else if (orderStatus === 'PICKED_UP') {
          initialDistance = Math.min(25, distInfo.total);
        } else {
          initialDistance = 0;
        }

        setDistanceTraveled(initialDistance);
        setRemainingDistanceMeters(Math.max(0, distInfo.total - initialDistance));
        setCurrentStreet(result.currentStreetName);

        // Update rendered route polyline on real roads
        if (mapInstanceRef.current) {
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(result.coordinates);
          }
          if (routeHaloRef.current) {
            routeHaloRef.current.setLatLngs(result.coordinates);
          }

          // Adjust map viewport smoothly to cover the entire real road path
          const bounds = L.latLngBounds(result.coordinates);
          mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
        }

        const km = (result.totalDistanceMeters / 1000).toFixed(1);
        setRoutingNotification(
          result.isRealNetwork
            ? `Plus court chemin calculé (${km} km)`
            : `Itinéraire chargé (${km} km)`
        );
        setTimeout(() => setRoutingNotification(null), 2500);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Failed to compute shortest road path:', err);
        }
      } finally {
        setIsRouting(false);
      }
    },
    [orderStatus]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: AHMED_RACHEDI_CENTER,
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      maxBounds: AHMED_RACHEDI_BOUNDS,
      maxBoundsViscosity: 1.0, // Strictly focus on the city of Ahmed Rachedi only
      zoomControl: false,
      attributionControl: false, // Suppress watermark attribution
    });

    // Clean, watermark-free OpenStreetMap street tiles
    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Outer halo to guarantee road visibility
    const routeHalo = L.polyline([], {
      color: '#FFFFFF',
      weight: 7,
      opacity: 0.7,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeHaloRef.current = routeHalo;

    // Full Shortest Route Polyline on real roads
    const routePolyline = L.polyline([], {
      color: '#00B578',
      weight: 4.5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeLineRef.current = routePolyline;

    // 1. Origin Store Marker (Lucide Store-style icon in branded dark pill)
    const storeIcon = L.divIcon({
      className: 'custom-minimal-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full bg-[#071E26] border-2 border-white shadow-md flex items-center justify-center text-[#D9943B]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
              <path d="M2 7h20"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(MILA_DEFAULT_ORIGIN, { icon: storeIcon, title: storeName })
      .bindTooltip(storeName, { direction: 'top', className: 'minimal-tooltip', offset: [0, -10] })
      .addTo(map);

    // 2. Destination Pin Marker (Lucide MapPin-style drop pin)
    const destIcon = L.divIcon({
      className: 'custom-minimal-marker',
      html: `
        <div class="relative flex flex-col items-center justify-center">
          <div class="w-6 h-6 rounded-full btn-gradient-tertiary border-2 border-white shadow-md flex items-center justify-center text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(MILA_DEFAULT_DESTINATION, { icon: destIcon, title: destinationName })
      .bindTooltip(destinationName, {
        direction: 'top',
        className: 'minimal-tooltip',
        offset: [0, -10],
      })
      .addTo(map);

    // 2b. Spatial Buffer / Arrival Radius Geofence Circle (20 meters)
    L.circle(MILA_DEFAULT_DESTINATION, {
      radius: 20,
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.16,
      weight: 2,
      dashArray: '4, 4',
    })
      .bindTooltip("Zone d'arrivée (Rayon 20m)", {
        direction: 'bottom',
        className: 'minimal-tooltip',
        offset: [0, 8],
      })
      .addTo(map);

    // 3. Courier Vehicle Marker (Lucide Bike-style marker with golden radar pulse)
    const courierIcon = L.divIcon({
      className: 'custom-minimal-marker',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer">
          <span class="absolute w-8 h-8 rounded-full bg-[#D9943B]/40 animate-ping pointer-events-none"></span>
          <div class="w-7 h-7 rounded-full bg-[#D9943B] border-2 border-white shadow-md flex items-center justify-center text-[#071E26] font-bold z-10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="15" cy="5" r="1"/>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const courierMarker = L.marker(MILA_DEFAULT_ORIGIN, {
      icon: courierIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    courierMarkerRef.current = courierMarker;

    // Interactive Map Click: Click anywhere on the map road network to reposition courier and recalculate the shortest road path!
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLatLng: LatLng = [e.latlng.lat, e.latlng.lng];
      currentCoordsRef.current = clickedLatLng;
      if (courierMarkerRef.current) {
        courierMarkerRef.current.setLatLng(clickedLatLng);
      }
      // Notify telemetry listeners
      updateDriverLocation('courier-walid-43', {
        lat: clickedLatLng[0],
        lng: clickedLatLng[1],
        heading: 0,
        speed: courierSpeedKmh,
        isOnline: true,
      });
      calculateShortestPath(clickedLatLng, MILA_DEFAULT_DESTINATION);
    });

    // When the user drags the map manually, temporarily release camera follow lock so they can explore freely
    map.on('dragstart', () => {
      setIsFollowingCourier(false);
    });

    mapInstanceRef.current = map;

    // Initial shortest road path calculation
    calculateShortestPath(MILA_DEFAULT_ORIGIN, MILA_DEFAULT_DESTINATION);

    return () => {
      if (routingAbortRef.current) {
        routingAbortRef.current.abort();
      }
      if (traveledLineRef.current) {
        traveledLineRef.current.remove();
        traveledLineRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Listen to external real-time driver telemetry updates (from Courier app or device GPS)
  useEffect(() => {
    const unsub = subscribeToDriverLocation('courier-walid-43', (loc) => {
      if (!loc) return;
      setTelemetrySignalFresh(true);
      if (typeof loc.speed === 'number' && loc.speed > 0) {
        setCourierSpeedKmh(loc.speed);
      }
      if (loc.lat && loc.lng && courierMarkerRef.current) {
        const newCoords: LatLng = [loc.lat, loc.lng];
        currentCoordsRef.current = newCoords;
        courierMarkerRef.current.setLatLng(newCoords);

        // Auto follow camera if active
        if (isFollowingCourier && mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newCoords, { animate: true, duration: 0.5 });
        }

        // Check 20-meter arrival geofence
        const distToDest = calculateDistanceMeters(newCoords, MILA_DEFAULT_DESTINATION);
        if (orderStatus === 'DELIVERING' && distToDest <= 20) {
          if (!hasTriggeredArrivedRef.current) {
            hasTriggeredArrivedRef.current = true;
            if (onStatusChange) {
              onStatusChange('ARRIVED');
            } else if (onSimulateStatusAdvance) {
              onSimulateStatusAdvance();
            }
          }
        }
      }
    });

    return () => unsub();
  }, [isFollowingCourier, orderStatus, onStatusChange, onSimulateStatusAdvance]);

  // Synchronize courier location and traveled path strictly with order status
  useEffect(() => {
    const total = polylineDistancesRef.current.total;
    if (total === 0) return;

    if (orderStatus === 'PENDING' || orderStatus === 'CONFIRMED' || orderStatus === 'PREPARING') {
      setDistanceTraveled(0);
      setRemainingDistanceMeters(total);
      if (courierMarkerRef.current) {
        courierMarkerRef.current.setLatLng(MILA_DEFAULT_ORIGIN);
      }
      if (traveledLineRef.current) {
        traveledLineRef.current.setLatLngs([]);
      }
    } else if (orderStatus === 'PICKED_UP') {
      const initial = Math.min(25, total);
      setDistanceTraveled(initial);
      setRemainingDistanceMeters(Math.max(0, total - initial));
    } else if (orderStatus === 'ARRIVED') {
      setDistanceTraveled(total);
      setRemainingDistanceMeters(0);
      if (courierMarkerRef.current) {
        courierMarkerRef.current.setLatLng(MILA_DEFAULT_DESTINATION);
      }
      if (routeResult && traveledLineRef.current) {
        traveledLineRef.current.setLatLngs(routeResult.coordinates);
      }
    } else if (orderStatus === 'DELIVERED') {
      setDistanceTraveled(total);
      setRemainingDistanceMeters(0);
      if (courierMarkerRef.current) {
        courierMarkerRef.current.setLatLng(MILA_DEFAULT_DESTINATION);
      }
      if (routeResult && traveledLineRef.current) {
        traveledLineRef.current.setLatLngs(routeResult.coordinates);
      }
    }
  }, [orderStatus, routeResult]);

  // Reset trigger ref when moving away from DELIVERING
  useEffect(() => {
    if (orderStatus !== 'DELIVERING') {
      hasTriggeredArrivedRef.current = false;
    }
  }, [orderStatus]);

  // Periodic smooth advancement of courier along the real street geometry ONLY while DELIVERING
  useEffect(() => {
    if (orderStatus !== 'DELIVERING' || !routeResult || routeResult.coordinates.length === 0) return;

    const interval = setInterval(() => {
      // Conserve CPU & battery when tab is in background
      if (typeof document !== 'undefined' && document.hidden) return;

      setDistanceTraveled((prev) => {
        const total = polylineDistancesRef.current.total;
        if (total === 0) return prev;

        // Smooth road progression (~30-35 km/h = ~9-10 m/s)
        const stepMeters = 35;
        const next = prev + stepMeters;

        // Spatial buffer check: test if upcoming position is within 20m radius of customer address
        const coords = routeResult.coordinates;
        const cumulative = polylineDistancesRef.current.cumulative;
        const { position: nextPos } = getPositionAtDistance(coords, cumulative, next);
        const spatialDist = calculateDistanceMeters(nextPos, MILA_DEFAULT_DESTINATION);
        const remainingDist = Math.max(0, total - next);
        const ARRIVAL_RADIUS_METERS = 20;

        if (spatialDist <= ARRIVAL_RADIUS_METERS || remainingDist <= ARRIVAL_RADIUS_METERS || next >= total) {
          // Immediately force state machine to trigger ARRIVED status to prevent coordinate loop!
          if (!hasTriggeredArrivedRef.current) {
            hasTriggeredArrivedRef.current = true;
            if (onStatusChange) {
              onStatusChange('ARRIVED');
            } else if (onSimulateStatusAdvance) {
              onSimulateStatusAdvance();
            }
          }
          return total;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderStatus, routeResult, onSimulateStatusAdvance, onStatusChange]);

  // Update courier marker, camera follow, and publish real-time telemetry as progress advances along real roads
  useEffect(() => {
    if (!routeResult || routeResult.coordinates.length === 0) return;
    if (!courierMarkerRef.current || !mapInstanceRef.current) return;

    const { total, cumulative } = polylineDistancesRef.current;
    if (total === 0 || cumulative.length === 0) return;

    const { position, segmentIndex } = getPositionAtDistance(
      routeResult.coordinates,
      cumulative,
      distanceTraveled
    );

    currentCoordsRef.current = position;
    courierMarkerRef.current.setLatLng(position);

    // Camera follow tracking: smoothly center on courier
    if (isFollowingCourier && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(position, { animate: true, duration: 0.8 });
    }

    // Publish to real-time driver telemetry bus
    updateDriverLocation('courier-walid-43', {
      lat: position[0],
      lng: position[1],
      heading: 145,
      speed: courierSpeedKmh,
      activeOrderId: 'active-order',
      isOnline: true,
    });

    // Update remaining distance
    const remaining = Math.max(0, Math.round(total - distanceTraveled));
    setRemainingDistanceMeters(remaining);

    // Spatial buffer check: when courier coordinates are within 20 meters of customer's address,
    // immediately trigger ARRIVED to prevent coordinate loop!
    const ARRIVAL_RADIUS_METERS = 20;
    const spatialDistance = calculateDistanceMeters(position, MILA_DEFAULT_DESTINATION);
    if (
      orderStatus === 'DELIVERING' &&
      (spatialDistance <= ARRIVAL_RADIUS_METERS || remaining <= ARRIVAL_RADIUS_METERS)
    ) {
      if (!hasTriggeredArrivedRef.current) {
        hasTriggeredArrivedRef.current = true;
        if (onStatusChange) {
          onStatusChange('ARRIVED');
        } else if (onSimulateStatusAdvance) {
          onSimulateStatusAdvance();
        }
      }
    }

    // Update active street name from step segments
    if (routeResult.steps && routeResult.steps.length > 0) {
      const stepIdx = Math.min(
        Math.floor((segmentIndex / routeResult.coordinates.length) * routeResult.steps.length),
        routeResult.steps.length - 1
      );
      const activeStep = routeResult.steps[stepIdx];
      if (activeStep && activeStep.name && activeStep.name !== 'Voie municipale') {
        setCurrentStreet(activeStep.name);
      }
    }

    // Update traveled road line
    const passedCoords = routeResult.coordinates.slice(0, segmentIndex + 1);
    passedCoords.push(position);

    if (traveledLineRef.current) {
      traveledLineRef.current.setLatLngs(passedCoords);
    } else {
      traveledLineRef.current = L.polyline(passedCoords, {
        color: '#10B981',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
      }).addTo(mapInstanceRef.current);
    }
  }, [distanceTraveled, routeResult, isFollowingCourier, courierSpeedKmh, orderStatus, onStatusChange, onSimulateStatusAdvance]);

  // Handle map resizing
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
      if (routeResult && routeResult.coordinates.length > 0) {
        const bounds = L.latLngBounds(routeResult.coordinates);
        mapInstanceRef.current?.fitBounds(bounds, { padding: [30, 30] });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isExpanded, routeResult]);

  // Switch clean tile themes (Zero watermarks)
  const handleChangeTheme = () => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const nextTheme = mapTheme === 'streets' ? 'light' : mapTheme === 'light' ? 'topo' : 'streets';
    setMapTheme(nextTheme);

    tileLayerRef.current.remove();

    let newUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    let sub: string | string[] = 'abc';

    if (nextTheme === 'light') {
      newUrl =
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      sub = '';
    } else if (nextTheme === 'topo') {
      newUrl = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
      sub = 'abc';
    }

    const newLayer = L.tileLayer(newUrl, { subdomains: sub, maxZoom: 19 }).addTo(
      mapInstanceRef.current
    );
    tileLayerRef.current = newLayer;
  };

  // Recenter on courier position
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !courierMarkerRef.current) return;
    mapInstanceRef.current.setView(courierMarkerRef.current.getLatLng(), 16, { animate: true });
  };

  // Trigger recalculation of shortest path from current courier location
  const handleRecalculateShortestRoute = () => {
    calculateShortestPath(currentCoordsRef.current, MILA_DEFAULT_DESTINATION);
  };

  // Reset courier back to restaurant origin
  const handleResetToOrigin = () => {
    currentCoordsRef.current = MILA_DEFAULT_ORIGIN;
    if (courierMarkerRef.current) {
      courierMarkerRef.current.setLatLng(MILA_DEFAULT_ORIGIN);
    }
    calculateShortestPath(MILA_DEFAULT_ORIGIN, MILA_DEFAULT_DESTINATION);
  };

  const formattedRemainingDistance =
    remainingDistanceMeters >= 1000
      ? `${(remainingDistanceMeters / 1000).toFixed(1)} km`
      : `${remainingDistanceMeters} m`;

  return (
    <div
      className={`relative w-full transition-all duration-300 overflow-hidden border-b border-neutral-200 bg-[#EBF0F5] ${
        isExpanded ? 'h-[460px]' : 'h-[300px]'
      }`}
    >
      {/* Real Interactive Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Dynamic Route Recalculation Toast (Minimal, disappears in 3s) */}
      {routingNotification && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all">
          <div className="bg-[#1C1B1B]/90 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg border border-white/10 flex items-center gap-1.5 whitespace-nowrap">
            <Route size={12} className="text-white" />
            <span>{routingNotification}</span>
          </div>
        </div>
      )}

      {/* Live Courier Telemetry Pill in Top-Left */}
      {!hideOverlays && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-auto flex flex-col gap-1.5">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-black/5 flex items-center gap-2 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-[#1C1B1B]">{cleanCourierName}</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-700 font-semibold">
              {orderStatus === 'DELIVERED'
                ? 'Livré'
                : orderStatus === 'ARRIVED'
                ? 'Arrivé sur place (Rayon 20m)'
                : formattedRemainingDistance}
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500 font-medium">
              {orderStatus === 'ARRIVED'
                ? 'À votre porte'
                : orderStatus === 'DELIVERED'
                ? 'Terminé'
                : `~${etaText}`}
            </span>

            {/* Live Speedometer & GPS badge during active delivery */}
            {orderStatus === 'DELIVERING' && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="bg-neutral-100 text-zinc-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                  {courierSpeedKmh} km/h
                </span>
              </>
            )}
          </div>

          {/* Camera Follow Mode Banner / Toggle */}
          {orderStatus === 'DELIVERING' && (
            <button
              onClick={() => {
                setIsFollowingCourier(!isFollowingCourier);
                if (!isFollowingCourier) {
                  handleRecenter();
                }
              }}
              className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border transition-all flex items-center gap-1.5 ${
                isFollowingCourier
                  ? 'bg-[#1C1B1B] text-white border-transparent'
                  : 'bg-white/95 backdrop-blur-md text-[#1C1B1B] border-black/10 hover:bg-white'
              }`}
              title={isFollowingCourier ? 'Caméra verrouillée sur le coursier' : 'Cliquer pour suivre le coursier'}
            >
              <Compass size={11} className={isFollowingCourier ? 'animate-spin text-white' : 'text-[#1C1B1B]'} style={{ animationDuration: '4s' }} />
              <span>{isFollowingCourier ? 'Suivi caméra actif' : 'Recentrer sur le livreur'}</span>
            </button>
          )}
        </div>
      )}

      {/* Minimal Map Tools Dock in Top-Right (Semi-transparent, compact) */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 pointer-events-auto">
        {/* Recalculate Shortest Path from courier position */}
        <button
          onClick={handleRecalculateShortestRoute}
          disabled={isRouting}
          aria-label="Plus court chemin"
          title="Recalculer le plus court chemin sur les routes réelles"
          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#1C1B1B] shadow-sm border border-black/5 flex items-center justify-center active:scale-95 text-xs hover:bg-white disabled:opacity-50"
        >
          <Route size={13} className={isRouting ? 'animate-spin' : ''} />
        </button>

        {/* Reset courier to restaurant origin */}
        <button
          onClick={handleResetToOrigin}
          aria-label="Réinitialiser départ"
          title="Replacer le coursier au restaurant"
          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#1C1B1B] shadow-sm border border-black/5 flex items-center justify-center active:scale-95 text-xs hover:bg-white"
        >
          <RotateCcw size={12} />
        </button>

        {/* Toggle Overlays button so user can see 100% clean map without any UI */}
        <button
          onClick={() => setHideOverlays(!hideOverlays)}
          aria-label={hideOverlays ? 'Afficher les infos' : 'Vue pure'}
          title={hideOverlays ? 'Afficher les infos' : 'Vue pure (carte sans éléments superposés)'}
          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#1C1B1B] shadow-sm border border-black/5 flex items-center justify-center active:scale-95 text-xs hover:bg-white"
        >
          {hideOverlays ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>

        {/* Expand / Collapse Map size */}
        <button
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Réduire la carte' : 'Agrandir la carte'}
          title={isExpanded ? 'Réduire' : 'Agrandir la carte'}
          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#1C1B1B] shadow-sm border border-black/5 flex items-center justify-center active:scale-95 text-xs hover:bg-white"
        >
          {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* Navigation & Zoom Controls in Bottom-Right */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex flex-col gap-1 pointer-events-auto">
        <button
          onClick={handleRecenter}
          aria-label="Recentrer"
          title="Recentrer sur le coursier"
          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#1C1B1B] shadow-sm border border-black/5 flex items-center justify-center active:scale-95 hover:bg-white"
        >
          <Crosshair size={13} />
        </button>

        <button
          onClick={handleChangeTheme}
          aria-label="Style de carte"
          title={`Style: ${mapTheme}`}
          className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-[#1C1B1B] shadow-sm border border-black/5 flex items-center justify-center active:scale-95 hover:bg-white"
        >
          <Layers size={13} />
        </button>

        <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-black/5 overflow-hidden">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            aria-label="Zoom +"
            title="Zoom avant"
            className="w-7 h-7 text-[#1C1B1B] flex items-center justify-center active:bg-neutral-100"
          >
            <ZoomIn size={13} />
          </button>
          <div className="h-px bg-neutral-200 w-full" />
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            aria-label="Zoom -"
            title="Zoom arrière"
            className="w-7 h-7 text-[#1C1B1B] flex items-center justify-center active:bg-neutral-100"
          >
            <ZoomOut size={13} />
          </button>
        </div>
      </div>

      {/* Real Street Name Tag in Bottom-Left (Unobtrusive) */}
      {!hideOverlays && (
        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xs text-zinc-800 font-semibold text-[9px] px-2 py-0.5 rounded shadow-xs border border-black/5 flex items-center gap-1">
            <Navigation size={10} className="text-[#00B578]" />
            <span>{currentStreet}</span>
            <span className="text-zinc-400 font-normal">➔ Cité 500 Logts</span>
          </div>
        </div>
      )}
    </div>
  );
};
