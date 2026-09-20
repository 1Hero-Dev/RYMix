import React from 'react';
import {
  MapcnOrderTrackingMap,
  MapcnOrderTrackingMapProps,
} from './MapcnOrderTrackingMap';

export type RealLeafletMapProps = MapcnOrderTrackingMapProps;

/**
 * Re-export powered by the open-source mapcn project (MapLibre GL JS + shadcn/ui)
 */
export const RealLeafletMap: React.FC<RealLeafletMapProps> = (props) => {
  return <MapcnOrderTrackingMap {...props} />;
};

export default RealLeafletMap;
