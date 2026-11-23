import type { StyleProp, ViewStyle } from 'react-native';

import type { StationStatus } from '../theme';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  status: StationStatus;
  /** رقم الشواحن الفاضية لو معروف */
  free: number | null;
}

export interface StationMapProps {
  pins: MapPin[];
  me: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** غيّرها علشان الخريطة ترجع لمكانك */
  recenterKey: number;
  style?: StyleProp<ViewStyle>;
  /** مسافة من تحت علشان الشيت ما يغطيش الدبابيس */
  bottomInset?: number;
}

/** ستايل خريطة جوجل الداكن — «ليل الطريق» */
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0A111F' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4A5A80' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A111F' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#0E1729' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#0D2224' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#152036' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1B2742' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2C3D62' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#50608A' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#08182A' }] },
];
