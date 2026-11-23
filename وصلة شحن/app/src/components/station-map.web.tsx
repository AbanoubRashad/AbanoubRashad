import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { colors, statusColors } from '../theme';
import type { MapPin, StationMapProps } from './station-map.types';

// نسخة الويب: Leaflet بخريطة CARTO الداكنة (مجانية مع ذكر المصدر)
const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; OpenStreetMap &copy; CARTO';

const glyph: Record<MapPin['status'], string> = {
  working: '<path d="M5 12l5 5L20 7"/>',
  broken: '<path d="M6 6l12 12M18 6L6 18"/>',
  queue: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  conflict: '<path d="M12 6v8M12 18.5v.5"/>',
  unknown: '',
};

function pinHtml(p: MapPin, selected: boolean) {
  const size = selected ? 52 : 38;
  const c = statusColors[p.status];
  const inner =
    p.status === 'working' && p.free !== null
      ? `<span style="font:700 ${selected ? 18 : 15}px 'Space Grotesk',sans-serif;color:${c.ink}">${p.free}</span>`
      : p.status === 'unknown'
        ? `<span style="font:700 15px 'IBM Plex Sans Arabic',sans-serif;color:${c.ink}">؟</span>`
        : `<svg width="${selected ? 18 : 14}" height="${selected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="${c.ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${glyph[p.status]}</svg>`;
  return `<div role="button" aria-label="محطة" style="width:${size}px;height:${size}px;border-radius:${size / 2}px ${size / 2}px ${size / 2}px 4px;transform:rotate(-45deg);background:${c.fill};box-shadow:0 0 0 ${selected ? 4 : 3}px ${colors.bg}${selected ? `,0 0 0 6px ${colors.brand}` : ''},0 10px 24px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="transform:rotate(45deg);display:flex">${inner}</div></div>`;
}

const meIcon = L.divIcon({
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `<div style="width:24px;height:24px;border-radius:12px;background:${colors.brand}33;display:flex;align-items:center;justify-content:center"><div style="width:12px;height:12px;border-radius:6px;background:${colors.brand};border:2px solid ${colors.text}"></div></div>`,
});

export function StationMap({ pins, me, selectedId, onSelect, recenterKey, style, bottomInset = 0 }: StationMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const host = useRef<any>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const meMarker = useRef<L.Marker | null>(null);

  useEffect(() => {
    const el = host.current as unknown as HTMLElement | null;
    if (!el || map.current) return;
    const m = L.map(el, { zoomControl: false, attributionControl: true }).setView([me.lat, me.lng], 12);
    L.tileLayer(TILES, { attribution: ATTRIBUTION, subdomains: 'abcd', maxZoom: 19 }).addTo(m);
    m.attributionControl.setPrefix(false);
    layer.current = L.layerGroup().addTo(m);
    meMarker.current = L.marker([me.lat, me.lng], { icon: meIcon, interactive: false, keyboard: false }).addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    meMarker.current?.setLatLng([me.lat, me.lng]);
  }, [me.lat, me.lng]);

  useEffect(() => {
    map.current?.setView([me.lat, me.lng], 12, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const p of pins) {
      const selected = p.id === selectedId;
      const size = selected ? 52 : 38;
      const icon = L.divIcon({ className: '', html: pinHtml(p, selected), iconSize: [size, size], iconAnchor: [size / 2, size * 1.2] });
      L.marker([p.lat, p.lng], { icon, zIndexOffset: selected ? 1000 : 0, title: p.id })
        .on('click', () => onSelect(p.id))
        .addTo(g);
    }
  }, [pins, selectedId, onSelect]);

  useEffect(() => {
    // الشيت تحت بيغطي جزء من الخريطة
    const el = map.current?.getContainer();
    if (el) el.style.setProperty('--sheet-inset', `${bottomInset}px`);
  }, [bottomInset]);

  return <View ref={host} style={[{ backgroundColor: colors.map.ground }, style]} />;
}
