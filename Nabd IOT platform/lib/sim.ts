/**
 * Demo-mode data source. The live demo runs a simulated fleet beside one real
 * board; in production these values arrive over a WebSocket fed by the
 * MQTT -> ingest -> TimescaleDB pipeline (see /architecture).
 */

export type Status = "Online" | "Warning" | "Offline";

export interface Device {
  id: string;
  name: string;
  site: string;
  reading: string;
  rssi: string;
  fw: string;
  seen: string;
  status: Status;
}

export interface Site {
  name: string;
  place: string;
  kind: string;
  value: string;
  status: "Normal" | "Warning";
}

export const STATUS_COLOR: Record<Status, string> = {
  Online: "var(--green)",
  Warning: "var(--amber)",
  Offline: "var(--red)",
};

/** Solar input of nabd-01 in kW at sample k (2 s samples). */
export const pvAt = (k: number) => 3.3 + 0.35 * Math.sin(k / 9) + 0.08 * Math.sin(k * 1.7);
/** Household load of nabd-01 in kW at sample k. */
export const loadAt = (k: number) => 1.2 + 0.25 * Math.sin(k / 5 + 1) + 0.06 * Math.sin(k * 2.3);

export const SITES: Site[] = [
  { name: "Off-grid villa", place: "Wadi El Natrun", kind: "solar + battery", value: "3.42 kW", status: "Normal" },
  { name: "Tomato greenhouse", place: "Fayoum", kind: "climate + irrigation", value: "29.4 °C · 71 %", status: "Normal" },
  { name: "Clinic medicine fridge", place: "Heliopolis", kind: "must stay 2–8 °C", value: "7.9 °C", status: "Warning" },
  { name: "Frozen-goods cold room", place: "10th of Ramadan City", kind: "freezer", value: "−18.2 °C", status: "Normal" },
];

export function fleetDevices(t: number): Device[] {
  const fridge = (7.8 + 0.1 * ((t % 4) / 3)).toFixed(1);
  return [
    { id: "nabd-01", name: "Rooftop power node", site: "Wadi El Natrun", reading: `${pvAt(60 + t).toFixed(2)} kW · 51.6 V`, rssi: "−61 dBm", fw: "1.4.2", seen: "just now", status: "Online" },
    { id: "nabd-04", name: "Greenhouse climate", site: "Fayoum", reading: "29.4 °C · 71 % RH", rssi: "−68 dBm", fw: "1.4.2", seen: "just now", status: "Online" },
    { id: "nabd-05", name: "Irrigation pump", site: "Fayoum", reading: "Relay ON · soil 38 %", rssi: "−70 dBm", fw: "1.4.1", seen: "2 s ago", status: "Online" },
    { id: "nabd-07", name: "Medicine fridge", site: "Heliopolis", reading: `${fridge} °C · door closed`, rssi: "−57 dBm", fw: "1.4.2", seen: "just now", status: "Warning" },
    { id: "nabd-09", name: "Cold room", site: "10th of Ramadan", reading: "−18.2 °C · duty 64 %", rssi: "−73 dBm", fw: "1.4.0", seen: "1 s ago", status: "Online" },
    { id: "nabd-11", name: "Cold room door", site: "10th of Ramadan", reading: "no data", rssi: "—", fw: "1.4.0", seen: "14 min ago", status: "Offline" },
  ];
}

/** Builds SVG polyline points for a series over an 800 x 240 viewBox. */
export function seriesPoints(fn: (k: number) => number, t: number, toY: (v: number) => number, samples = 60, width = 800) {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    pts.push(`${((i * width) / samples).toFixed(1)},${toY(fn(i + t)).toFixed(1)}`);
  }
  return pts.join(" ");
}
