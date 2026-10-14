"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STATUS_COLOR, SITES, fleetDevices, loadAt, pvAt, seriesPoints } from "@/lib/sim";
import { useTick } from "@/lib/useTick";

const RANGES = ["15m", "1h", "24h", "7d"] as const;
type Range = (typeof RANGES)[number];

const RANGE_AXIS: Record<Range, string[]> = {
  "15m": ["−15 min", "−10 min", "−5 min", "now"],
  "1h": ["−60 min", "−40 min", "−20 min", "now"],
  "24h": ["−24 h", "−16 h", "−8 h", "now"],
  "7d": ["−7 d", "−5 d", "−2 d", "now"],
};

const toY = (kw: number) => 230 - kw * 50;

export function FleetDashboard() {
  const t = useTick(1000);
  const [range, setRange] = useState<Range>("15m");
  const [query, setQuery] = useState("");

  const devices = fleetDevices(t);
  const q = query.trim().toLowerCase();
  const visible = q
    ? devices.filter((d) => [d.id, d.name, d.site, d.reading].some((v) => v.toLowerCase().includes(q)))
    : devices;

  const pvLine = useMemo(() => seriesPoints(pvAt, t, toY), [t]);
  const loadLine = useMemo(() => seriesPoints(loadAt, t, toY), [t]);

  return (
    <div className="stack" style={{ padding: "28px 32px 48px", gap: 24 }}>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div className="stack" style={{ gap: 4 }}>
          <h1 className="display" style={{ margin: 0, fontSize: 32, fontStretch: "110%" }}>Fleet overview</h1>
          <span className="muted" style={{ fontSize: 14 }}>4 sites · 12 devices · updated just now</span>
        </div>
        <div className="row" style={{ alignItems: "center", gap: 12 }}>
          <span className="pill pill-live" style={{ fontSize: 12, padding: "8px 12px" }}>
            <span className="live-dot" />LIVE · WebSocket
          </span>
          <div role="group" aria-label="Time range" className="segmented">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-auto">
        <div className="card stat">
          <span className="stat-label">Devices online</span>
          <span className="stat-value" style={{ fontSize: 32 }}>11<span className="muted" style={{ fontSize: 20 }}> / 12</span></span>
          <span className="stat-note" style={{ color: "var(--red)" }}>nabd-11 offline 14 min</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Messages per second</span>
          <span className="stat-value" style={{ fontSize: 32 }}>{36 + ((t * 7) % 5)}</span>
          <span className="stat-note">QoS 1 · 0 dropped today</span>
        </div>
        <div className="card warn stat">
          <span className="stat-label">Open alerts</span>
          <span className="stat-value" style={{ fontSize: 32, color: "var(--amber)" }}>2</span>
          <span className="stat-note">1 critical · 1 warning</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Device → screen, p95</span>
          <span className="stat-value" style={{ fontSize: 32, color: "var(--green)" }}>{380 + ((t * 37) % 60)} ms</span>
          <span className="stat-note">measured from device timestamp</span>
        </div>
      </div>

      <div className="row" style={{ gap: 16 }}>
        <section aria-labelledby="pw-h" className="card pad stack" style={{ flex: "999 1 560px", minWidth: 0, gap: 16 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div className="stack" style={{ gap: 2 }}>
              <h2 id="pw-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Power · Off-grid villa, Wadi El Natrun</h2>
              <span className="muted" style={{ fontSize: 13 }}>nabd-01 · last {range} · 2 s samples</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 14, height: 3, background: "var(--green)", display: "inline-block" }} />Solar {pvAt(60 + t).toFixed(2)} kW
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 14, height: 3, background: "var(--blue)", display: "inline-block" }} />Load {loadAt(60 + t).toFixed(2)} kW
              </span>
            </div>
          </div>
          <svg viewBox="0 0 800 240" preserveAspectRatio="none" width="100%" height="240" role="img" aria-label="Line chart of solar input and household load over the selected time range">
            {[60, 120, 180].map((y) => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#1E2733" />)}
            <polygon points={`0,240 ${pvLine} 800,240`} fill="rgba(61,220,151,0.12)" />
            <polyline points={pvLine} fill="none" stroke="#3DDC97" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            <polyline points={loadLine} fill="none" stroke="#6CB4FF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mono muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            {RANGE_AXIS[range].map((l) => <span key={l}>{l}</span>)}
          </div>
        </section>

        <section aria-labelledby="ev-h" className="card pad stack" style={{ flex: "1 1 320px", minWidth: 0, gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 id="ev-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Events</h2>
            <Link href="/alerts" style={{ fontSize: 14 }}>All alerts</Link>
          </div>
          <ul className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 10 }}>
            <li className="event" style={{ background: "rgba(255,116,104,.08)", border: "1px solid rgba(255,116,104,.3)" }}>
              <span className="tag" style={{ color: "var(--red)" }}>CRITICAL</span>
              <span>Door sensor nabd-11 stopped reporting · cold room, 10th of Ramadan<br /><span className="muted">14 min ago</span></span>
            </li>
            <li className="event" style={{ background: "rgba(245,177,61,.08)", border: "1px solid rgba(245,177,61,.3)" }}>
              <span className="tag" style={{ color: "var(--amber)" }}>WARN</span>
              <span>Clinic fridge at 7.9 °C and rising · Heliopolis<br /><span className="muted">3 min ago · WhatsApp sent</span></span>
            </li>
            <li className="event">
              <span className="tag" style={{ color: "var(--blue)" }}>CMD</span>
              <span>Irrigation pump ON · Fayoum greenhouse<br /><span className="muted">acknowledged in 640 ms</span></span>
            </li>
            <li className="event">
              <span className="tag" style={{ color: "var(--green)" }}>OTA</span>
              <span>nabd-04 updated to firmware 1.4.2<br /><span className="muted">2 h ago · health check passed</span></span>
            </li>
          </ul>
        </section>
      </div>

      <section id="sites" aria-labelledby="st-h" className="stack" style={{ gap: 12 }}>
        <h2 id="st-h" className="kicker">Sites</h2>
        <div className="grid-auto" style={{ ["--min" as string]: "240px" }}>
          {SITES.map((s) => {
            const warn = s.status === "Warning";
            return (
              <div key={s.name} className={`card stack${warn ? " warn" : ""}`} style={{ padding: 18, gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: warn ? "var(--amber)" : "var(--green)" }}>{warn ? "▲ Warning" : "● Normal"}</span>
                </div>
                <span className="muted" style={{ fontSize: 13 }}>{s.place}</span>
                <span className="mono" style={{ fontSize: 20, color: warn ? "var(--amber)" : undefined }}>{s.value}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="dv-h" className="card stack">
        <div className="row" style={{ padding: "20px 22px 8px", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 id="dv-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Devices</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--muted)" }}>
            Search
            <input
              type="search"
              className="input"
              placeholder="ID, site or sensor"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ minHeight: 40, width: 220, fontSize: 14 }}
            />
          </label>
        </div>
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 820 }}>
            <thead>
              <tr><th>Device</th><th>Site</th><th>Latest reading</th><th>Signal</th><th>Firmware</th><th>Last seen</th><th>Status</th></tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`/devices/${d.id}`} className="stack" style={{ color: "var(--text)", textDecoration: "none", gap: 2 }}>
                      <span className="mono">{d.id}</span>
                      <span className="muted" style={{ fontSize: 13 }}>{d.name}</span>
                    </Link>
                  </td>
                  <td className="dim">{d.site}</td>
                  <td className="mono">{d.reading}</td>
                  <td className="mono dim">{d.rssi}</td>
                  <td className="mono dim">{d.fw}</td>
                  <td className="dim">{d.seen}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: STATUS_COLOR[d.status] }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: STATUS_COLOR[d.status] }} />
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr><td colSpan={7} className="muted">No device matches “{query}”.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
