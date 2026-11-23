import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

/** لو الموقع مش متاح نبدأ من الشيخ زايد، في نص المحطات اللي عندنا */
export const FALLBACK = { lat: 30.0444, lng: 30.9900 };

export function useMyLocation() {
  const [pos, setPos] = useState<{ lat: number; lng: number }>(FALLBACK);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        setGranted(status === 'granted');
        if (status !== 'granted') return;
        const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) setPos({ lat: first.coords.latitude, lng: first.coords.longitude });
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 50 }, (l) =>
          setPos({ lat: l.coords.latitude, lng: l.coords.longitude }),
        );
      } catch {
        setGranted(false);
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { pos, granted };
}
