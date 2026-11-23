import { useEffect, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform } from 'react-native';

import { Pin } from './pin';
import { darkMapStyle, type StationMapProps } from './station-map.types';

export function StationMap({ pins, me, selectedId, onSelect, recenterKey, style, bottomInset = 0 }: StationMapProps) {
  const ref = useRef<MapView>(null);

  useEffect(() => {
    ref.current?.animateToRegion({ latitude: me.lat, longitude: me.lng, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 500);
    // نرجع لمكانك بس لما المستخدم يطلب (recenterKey)، مش مع كل تحديث للموقع
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);

  return (
    <MapView
      ref={ref}
      style={style}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={darkMapStyle}
      userInterfaceStyle="dark"
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      mapPadding={{ top: 120, right: 0, bottom: bottomInset, left: 0 }}
      initialRegion={{ latitude: me.lat, longitude: me.lng, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
    >
      {pins.map((p) => (
        <Marker
          key={p.id + (p.id === selectedId ? '-sel' : '') + p.status + p.free}
          coordinate={{ latitude: p.lat, longitude: p.lng }}
          onPress={() => onSelect(p.id)}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
          zIndex={p.id === selectedId ? 10 : 1}
        >
          <Pin pin={p} selected={p.id === selectedId} />
        </Marker>
      ))}
    </MapView>
  );
}
