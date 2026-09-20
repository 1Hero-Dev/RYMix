import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  useMap,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MapControls,
  MapRoute,
  RouteProgress,
} from './ui/map';
import {
  Maximize2,
  Minimize2,
  Crosshair,
  Layers,
  Eye,
  EyeOff,
  Route as RouteIcon,
  Navigation,
  RotateCcw,
  Compass,
  Store,
  MapPin,
  Bike,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  fetchShortestRoadPath,
  computePolylineDistances,
  getPositionAtDistance,
  calculateDistanceMeters,
  AHMED_RACHEDI_CENTER,
  AHMED_RACHEDI_DEFAULT_ORIGIN,
  AHMED_RACHEDI_DEFAULT_DESTINATION,
  MILA_DEFAULT_ORIGIN,
  MILA_DEFAULT_DESTINATION,
  LatLng,
  ShortestRouteResult,
} from '../utils/roadRoutingService';
import {
  updateDriverLocation,
  subscribeToDriverLocation,
} from '../firebase/firebaseServices';
import { OrderStatus } from '../types';

export interface MapcnOrderTrackingMapProps {
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

// Mapcn basemap styles (Open Source, Carto GL styles)
const MAPCN_STYLES = {
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

/**
 * Inner controller inside <Map> that accesses the raw MapLibre instance via useMap()
 * Handles map click, camera fitting, and follow mode without blocking render.
 */
function MapcnCameraController({
  onMapClick,
  followCoords,
  isFollowing,
  routeBounds,
}: {
  onMapClick: (coords: [number, number]) => void;
  followCoords: [number, number] | null; // [lng, lat]
  isFollowing: boolean;
  routeBounds: [[number, number], [number, number]] | null; // [[minLng, minLat], [maxLng, maxLat]]
}) {
  const { map, isLoaded } = useMap();
  const hasFitInitialBoundsRef = useRef(false);

  // Click on the map to set a new waypoint and recalculate the shortest road path
  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleClick = (e: { lngLat: { lng: number; lat: number } }) => {
      onMapClick([e.lngLat.lng, e.lngLat.lat]);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, isLoaded, onMapClick]);

  // Fit bounds when route loads
  useEffect(() => {
    if (!map || !isLoaded || !routeBounds) return;
    if (!hasFitInitialBoundsRef.current) {
      hasFitInitialBoundsRef.current = true;
      try {
        map.fitBounds(routeBounds, {
          padding: { top: 60, bottom: 60, left: 40, right: 40 },
          maxZoom: 16.5,
          duration: 1200,
        });
      } catch {
        // ignore
      }
    }
  }, [map, isLoaded, routeBounds]);

  // Follow courier position
  useEffect(() => {
    if (!map || !isLoaded || !isFollowing || !followCoords) return;
    map.easeTo({
      center: followCoords,
      duration: 600,
      zoom: Math.max(map.getZoom(), 15.2),
    });
  }, [map, isLoaded, isFollowing, followCoords]);

  return null;
}

export const MapcnOrderTrackingMap: React.FC<MapcnOrderTrackingMapProps> = ({
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
  const cleanCourierName = courierName.replace(/\s*\([^)]*\)/g, '').trim() || 'Walid M.';

  // Map theme & visual state
  const [selectedTheme, setSelectedTheme] = useState<'voyager' | 'positron' | 'dark'>('voyager');
  const [hideOverlays, setHideOverlays] = useState<boolean>(false);
  const [showInfoBanner, setShowInfoBanner] = useState<boolean>(true);

  // Road Routing State
  const [routeResult, setRouteResult] = useState<ShortestRouteResult | null>(null);
  const [distanceTraveled, setDistanceTraveled] = useState<number>(0);
  const [currentStreet, setCurrentStreet] = useState<string>('Rue Principale (CW 152)');
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState<number>(1400);
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [routingNotification, setRoutingNotification] = useState<string | null>(null);

  // Live Telemetry & Follow Mode
  const [isFollowingCourier, setIsFollowingCourier] = useState<boolean>(true);
  const [courierSpeedKmh, setCourierSpeedKmh] = useState<number>(32);
  const [courierHeading, setCourierHeading] = useState<number>(135);

  // GPS coordinates in [lat, lng] format for routing algorithms
  const [courierLatLng, setCourierLatLng] = useState<LatLng>(MILA_DEFAULT_ORIGIN);
  const polylineDistancesRef = useRef<{ total: number; cumulative: number[] }>({
    total: 0,
    cumulative: [],
  });
  const routingAbortRef = useRef<AbortController | null>(null);
  const hasTriggeredArrivedRef = useRef(false);

  // Calculate shortest road path between origin and destination
  const calculateShortestPath = useCallback(
    async (originPos: LatLng, destPos: LatLng = MILA_DEFAULT_DESTINATION) => {
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

        let initialDist = 0;
        if (orderStatus === 'DELIVERED') {
          initialDist = distInfo.total;
        } else if (orderStatus === 'DELIVERING') {
          initialDist = 0;
        } else if (orderStatus === 'PICKED_UP') {
          initialDist = Math.min(25, distInfo.total);
        }

        setDistanceTraveled(initialDist);
        setRemainingDistanceMeters(Math.max(0, distInfo.total - initialDist));
        setCurrentStreet(result.currentStreetName || 'Rue Principale');

        const km = (result.totalDistanceMeters / 1000).toFixed(1);
        setRoutingNotification(
          result.isRealNetwork
            ? `Itinéraire calculé via mapcn (${km} km)`
            : `Réseau routier synchronisé (${km} km)`
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

  // Initial routing calculation
  useEffect(() => {
    calculateShortestPath(MILA_DEFAULT_ORIGIN, MILA_DEFAULT_DESTINATION);
    return () => {
      if (routingAbortRef.current) {
        routingAbortRef.current.abort();
      }
    };
  }, [calculateShortestPath]);

  // Subscribe to real-time driver telemetry (Firebase/Gateway)
  useEffect(() => {
    const unsub = subscribeToDriverLocation('courier-walid-43', (loc) => {
      if (!loc) return;
      if (typeof loc.speed === 'number' && loc.speed > 0) {
        setCourierSpeedKmh(loc.speed);
      }
      if (typeof loc.heading === 'number') {
        setCourierHeading(loc.heading);
      }
      if (loc.lat && loc.lng) {
        const newCoords: LatLng = [loc.lat, loc.lng];
        setCourierLatLng(newCoords);

        // Check 20-meter arrival radius
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
  }, [orderStatus, onStatusChange, onSimulateStatusAdvance]);

  // Periodic courier progress along the road network while DELIVERING
  useEffect(() => {
    if (orderStatus !== 'DELIVERING' || !routeResult || routeResult.coordinates.length === 0) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;

      setDistanceTraveled((prev) => {
        const total = polylineDistancesRef.current.total;
        if (total === 0) return prev;

        const stepMeters = 35;
        const next = prev + stepMeters;

        const coords = routeResult.coordinates;
        const cumulative = polylineDistancesRef.current.cumulative;
        const { position: nextPos } = getPositionAtDistance(coords, cumulative, next);
        const spatialDist = calculateDistanceMeters(nextPos, MILA_DEFAULT_DESTINATION);
        const remainingDist = Math.max(0, total - next);
        const ARRIVAL_RADIUS = 20;

        if (spatialDist <= ARRIVAL_RADIUS || remainingDist <= ARRIVAL_RADIUS || next >= total) {
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

  // Update courier position along coordinates as distanceTraveled progresses
  useEffect(() => {
    if (!routeResult || routeResult.coordinates.length === 0) return;

    const { total, cumulative } = polylineDistancesRef.current;
    if (total === 0 || cumulative.length === 0) return;

    const { position, segmentIndex } = getPositionAtDistance(
      routeResult.coordinates,
      cumulative,
      distanceTraveled
    );

    setCourierLatLng(position);

    // Compute heading direction between current and next coordinate
    if (segmentIndex < routeResult.coordinates.length - 1) {
      const p1 = routeResult.coordinates[segmentIndex];
      const p2 = routeResult.coordinates[segmentIndex + 1];
      const angle = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;
      setCourierHeading(Math.round((angle + 360) % 360));
    }

    // Publish to real-time driver telemetry
    updateDriverLocation('courier-walid-43', {
      lat: position[0],
      lng: position[1],
      heading: courierHeading,
      speed: courierSpeedKmh,
      activeOrderId: 'active-order',
      isOnline: true,
    });

    const remaining = Math.max(0, Math.round(total - distanceTraveled));
    setRemainingDistanceMeters(remaining);

    // Update active street name
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
  }, [distanceTraveled, routeResult, courierSpeedKmh, courierHeading]);

  // Reset trigger ref when status changes
  useEffect(() => {
    if (orderStatus !== 'DELIVERING') {
      hasTriggeredArrivedRef.current = false;
    }
  }, [orderStatus]);

  // Sync with order stage
  useEffect(() => {
    const total = polylineDistancesRef.current.total;
    if (total === 0) return;

    if (orderStatus === 'PENDING' || orderStatus === 'CONFIRMED' || orderStatus === 'PREPARING') {
      setDistanceTraveled(0);
      setRemainingDistanceMeters(total);
      setCourierLatLng(MILA_DEFAULT_ORIGIN);
    } else if (orderStatus === 'PICKED_UP') {
      const initial = Math.min(25, total);
      setDistanceTraveled(initial);
      setRemainingDistanceMeters(Math.max(0, total - initial));
    } else if (orderStatus === 'ARRIVED' || orderStatus === 'DELIVERED') {
      setDistanceTraveled(total);
      setRemainingDistanceMeters(0);
      setCourierLatLng(MILA_DEFAULT_DESTINATION);
    }
  }, [orderStatus]);

  // Map click handler (user can click road to reposition courier)
  const handleMapClick = useCallback(
    ([clickedLng, clickedLat]: [number, number]) => {
      const clickedPos: LatLng = [clickedLat, clickedLng];
      setCourierLatLng(clickedPos);
      setIsFollowingCourier(false);
      updateDriverLocation('courier-walid-43', {
        lat: clickedPos[0],
        lng: clickedPos[1],
        heading: courierHeading,
        speed: courierSpeedKmh,
        isOnline: true,
      });
      calculateShortestPath(clickedPos, MILA_DEFAULT_DESTINATION);
    },
    [calculateShortestPath, courierHeading, courierSpeedKmh]
  );

  // Reset to origin
  const handleResetToOrigin = () => {
    setCourierLatLng(MILA_DEFAULT_ORIGIN);
    setIsFollowingCourier(true);
    calculateShortestPath(MILA_DEFAULT_ORIGIN, MILA_DEFAULT_DESTINATION);
  };

  // Convert route coordinates to MapLibre GeoJSON format: [longitude, latitude][]
  const routeCoordinatesLngLat: [number, number][] = (routeResult?.coordinates || []).map(
    (c) => [c[1], c[0]]
  );

  // Calculate traveled ratio for RouteProgress
  const totalDist = polylineDistancesRef.current.total;
  const traveledRatio = totalDist > 0 ? Math.min(1, Math.max(0, distanceTraveled / totalDist)) : 0;

  // Bounding box for MapLibre fitBounds: [[minLng, minLat], [maxLng, maxLat]]
  const routeBounds: [[number, number], [number, number]] | null =
    routeCoordinatesLngLat.length > 1
      ? [
          [
            Math.min(...routeCoordinatesLngLat.map((c) => c[0])),
            Math.min(...routeCoordinatesLngLat.map((c) => c[1])),
          ],
          [
            Math.max(...routeCoordinatesLngLat.map((c) => c[0])),
            Math.max(...routeCoordinatesLngLat.map((c) => c[1])),
          ],
        ]
      : null;

  const formattedRemainingDistance =
    remainingDistanceMeters >= 1000
      ? `${(remainingDistanceMeters / 1000).toFixed(1)} km`
      : `${remainingDistanceMeters} m`;

  return (
    <div
      className={`relative w-full transition-all duration-300 overflow-hidden border-b border-[#EADBCE] bg-[#F8F4EC] ${
        isExpanded ? 'h-[480px]' : 'h-[320px]'
      }`}
    >
      {/* MAPCN MAP COMPONENT (MapLibre GL JS + shadcn/ui) */}
      <Map
        center={[AHMED_RACHEDI_CENTER[1], AHMED_RACHEDI_CENTER[0]]}
        zoom={15}
        styles={{
          light: MAPCN_STYLES[selectedTheme],
          dark: MAPCN_STYLES.dark,
        }}
        className="w-full h-full cursor-crosshair"
      >
        {/* Camera and click event bridge */}
        <MapcnCameraController
          onMapClick={handleMapClick}
          followCoords={isFollowingCourier ? [courierLatLng[1], courierLatLng[0]] : null}
          isFollowing={isFollowingCourier}
          routeBounds={routeBounds}
        />

        {/* 1. SHORT ROAD ROUTE VIA MAPCN */}
        {routeCoordinatesLngLat.length > 1 && (
          <MapRoute
            id="order-delivery-route"
            coordinates={routeCoordinatesLngLat}
            color="#0A2B35"
            width={5}
            opacity={0.85}
            progress={traveledRatio}
          >
            {/* Traveled portion shown in contrasting emerald/gold highlight */}
            <RouteProgress color="#D9943B" width={6} opacity={0.95} />
          </MapRoute>
        )}

        {/* 2. STORE ORIGIN MARKER */}
        <MapMarker
          longitude={MILA_DEFAULT_ORIGIN[1]}
          latitude={MILA_DEFAULT_ORIGIN[0]}
          anchor="center"
        >
          <MarkerContent>
            <div className="group relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
              <div className="w-7 h-7 rounded-full bg-[#071E26] border-2 border-white shadow-md flex items-center justify-center text-[#D9943B]">
                <Store size={14} className="stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#071E26]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Commerce
              </span>
            </div>
          </MarkerContent>
          <MarkerPopup offset={12} className="p-0">
            <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-2.5 min-w-[180px]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A2B35]">
                <Store size={13} className="text-[#D9943B]" />
                <span>{storeName}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Point de collecte marchand</p>
              <div className="mt-1.5 pt-1.5 border-t border-neutral-100 flex items-center justify-between text-[10px] text-emerald-600 font-semibold">
                <span>Commande emballée</span>
                <span>Prête</span>
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>

        {/* 3. CUSTOMER DESTINATION MARKER WITH 20M GEOFENCE RING */}
        <MapMarker
          longitude={MILA_DEFAULT_DESTINATION[1]}
          latitude={MILA_DEFAULT_DESTINATION[0]}
          anchor="center"
        >
          <MarkerContent>
            <div className="group relative flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110">
              {/* Pulsing arrival geofence halo */}
              <span className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none border border-emerald-500/40" />
              <div className="w-7 h-7 rounded-full bg-[#D91A67] border-2 border-white shadow-md flex items-center justify-center text-white z-10">
                <MapPin size={14} className="stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#D91A67]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                Client (20m)
              </span>
            </div>
          </MarkerContent>
          <MarkerPopup offset={14} className="p-0">
            <div className="bg-white rounded-xl shadow-xl border border-neutral-200 p-2.5 min-w-[190px]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D91A67]">
                <MapPin size={13} />
                <span>Adresse de Livraison</span>
              </div>
              <p className="text-[11px] text-zinc-700 font-medium mt-1">{destinationName}</p>
              <div className="mt-1.5 pt-1.5 border-t border-neutral-100 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Zone d'arrivée</span>
                <span className="font-bold text-emerald-600">Rayon 20m actif</span>
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>

        {/* 4. LIVE COURIER VEHICLE MARKER */}
        <MapMarker
          longitude={courierLatLng[1]}
          latitude={courierLatLng[0]}
          anchor="center"
        >
          <MarkerContent>
            <div className="relative flex items-center justify-center cursor-pointer group">
              {/* Radar pulse effect */}
              <span className="absolute -inset-2 rounded-full bg-[#D9943B]/40 animate-ping pointer-events-none" />
              <div className="w-8 h-8 rounded-full bg-[#D9943B] border-2 border-white shadow-lg flex items-center justify-center text-[#071E26] font-bold z-10 transition-transform duration-300">
                <Bike size={16} className="stroke-[2.4]" />
              </div>
              {/* Mini speed badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A2B35] text-white text-[9px] font-extrabold px-1 rounded shadow-sm border border-white/40 whitespace-nowrap z-20">
                {courierSpeedKmh} km/h
              </div>
            </div>
          </MarkerContent>
          <MarkerTooltip offset={10} className="px-2 py-1 text-[10px] font-bold bg-[#0A2B35] text-white rounded-md shadow">
            {cleanCourierName} • En route
          </MarkerTooltip>
        </MapMarker>

        {/* 5. BUILT-IN MAPCN CONTROLS */}
        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showFullscreen
          className="shadow-md"
        />
      </Map>

      {/* Dynamic Route Notification Toast */}
      {routingNotification && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-[#0A2B35]/95 backdrop-blur-md text-white text-[10px] font-medium px-3 py-1 rounded-full shadow-lg border border-white/15 flex items-center gap-1.5 whitespace-nowrap">
            <RouteIcon size={12} className="text-[#D9943B]" />
            <span>{routingNotification}</span>
          </div>
        </div>
      )}

      {/* Live Courier Telemetry Card in Top-Left */}
      {!hideOverlays && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-auto flex flex-col gap-1.5 max-w-[calc(100%-140px)]">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-[#EADBCE] flex items-center gap-2 text-[11px]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-[#0A2B35] truncate">{cleanCourierName}</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-700 font-semibold whitespace-nowrap">
              {orderStatus === 'DELIVERED'
                ? 'Livré'
                : orderStatus === 'ARRIVED'
                ? 'Arrivé sur place'
                : formattedRemainingDistance}
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500 font-medium whitespace-nowrap">
              {orderStatus === 'ARRIVED'
                ? 'À votre porte'
                : orderStatus === 'DELIVERED'
                ? 'Terminé'
                : `~${etaText}`}
            </span>
          </div>

          {/* Camera Follow Toggle & Mapcn badge */}
          <div className="flex items-center gap-1.5">
            {orderStatus === 'DELIVERING' && (
              <button
                onClick={() => setIsFollowingCourier(!isFollowingCourier)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isFollowingCourier
                    ? 'bg-[#0A2B35] text-white border-transparent'
                    : 'bg-white/95 backdrop-blur-md text-[#0A2B35] border-[#EADBCE] hover:bg-white'
                }`}
                title={isFollowingCourier ? 'Caméra verrouillée sur le coursier' : 'Cliquer pour suivre le coursier'}
              >
                <Compass
                  size={11}
                  className={isFollowingCourier ? 'animate-spin text-[#D9943B]' : 'text-[#0A2B35]'}
                  style={{ animationDuration: '4s' }}
                />
                <span>{isFollowingCourier ? 'Suivi caméra actif' : 'Recentrer livreur'}</span>
              </button>
            )}

            {/* Mapcn Open Source Pill */}
            <div className="bg-[#0A2B35]/90 backdrop-blur-xs text-white text-[9px] font-medium px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-xs">
              <Sparkles size={9} className="text-[#D9943B]" />
              <span className="font-semibold">mapcn.dev</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Dock in Top-Right */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 pointer-events-auto">
        {/* Recalculate Route */}
        <button
          onClick={() => calculateShortestPath(courierLatLng, MILA_DEFAULT_DESTINATION)}
          disabled={isRouting}
          aria-label="Plus court chemin"
          title="Recalculer le plus court chemin sur les routes réelles"
          className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md text-[#0A2B35] shadow-xs border border-[#EADBCE] flex items-center justify-center active:scale-95 hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          <RouteIcon size={13} className={isRouting ? 'animate-spin text-[#D9943B]' : ''} />
        </button>

        {/* Reset Courier Position to Restaurant */}
        <button
          onClick={handleResetToOrigin}
          aria-label="Réinitialiser départ"
          title="Replacer le coursier au restaurant"
          className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md text-[#0A2B35] shadow-xs border border-[#EADBCE] flex items-center justify-center active:scale-95 hover:bg-white cursor-pointer"
        >
          <RotateCcw size={12} />
        </button>

        {/* Switch Basemap Tile Layer */}
        <button
          onClick={() =>
            setSelectedTheme((prev) =>
              prev === 'voyager' ? 'positron' : prev === 'positron' ? 'dark' : 'voyager'
            )
          }
          aria-label="Style de carte"
          title={`Style: ${selectedTheme} (Cliquer pour changer)`}
          className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md text-[#0A2B35] shadow-xs border border-[#EADBCE] flex items-center justify-center active:scale-95 hover:bg-white cursor-pointer"
        >
          <Layers size={13} />
        </button>

        {/* Toggle Overlays */}
        <button
          onClick={() => setHideOverlays(!hideOverlays)}
          aria-label={hideOverlays ? 'Afficher les infos' : 'Vue pure'}
          title={hideOverlays ? 'Afficher les infos' : 'Vue pure (sans overlays)'}
          className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md text-[#0A2B35] shadow-xs border border-[#EADBCE] flex items-center justify-center active:scale-95 hover:bg-white cursor-pointer"
        >
          {hideOverlays ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>

        {/* Expand / Collapse Map size */}
        <button
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Réduire la carte' : 'Agrandir la carte'}
          title={isExpanded ? 'Réduire' : 'Agrandir la carte'}
          className="w-7 h-7 rounded-full bg-white/95 backdrop-blur-md text-[#0A2B35] shadow-xs border border-[#EADBCE] flex items-center justify-center active:scale-95 hover:bg-white cursor-pointer"
        >
          {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* Real Street Name Tag in Bottom-Left */}
      {!hideOverlays && (
        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none flex flex-col gap-1">
          <div className="bg-white/95 backdrop-blur-xs text-[#0A2B35] font-semibold text-[10px] px-2.5 py-1 rounded-lg shadow-xs border border-[#EADBCE] flex items-center gap-1.5">
            <Navigation size={11} className="text-[#00B578]" />
            <span className="font-bold">{currentStreet}</span>
            <span className="text-zinc-400 font-normal">➔ {destinationName}</span>
          </div>

          {showInfoBanner && (
            <div className="bg-[#0A2B35]/90 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded shadow-xs border border-white/10 flex items-center gap-1 pointer-events-auto">
              <Info size={9} className="text-[#D9943B] shrink-0" />
              <span>Astuce: Cliquez sur la carte pour repositionner le coursier</span>
              <button
                onClick={() => setShowInfoBanner(false)}
                className="ml-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
