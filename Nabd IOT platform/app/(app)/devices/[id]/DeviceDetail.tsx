"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STATUS_COLOR, fleetDevices } from "@/lib/sim";
import { useTick } from "@/lib/useTick";

type Phase = "idle" | "sent" | "delivered" | "done";
type Ota = "ready" | "installing" | "verifying" | "done";

const STEP_LABELS = ["Sent to broker", "Delivered to device", "Device confirmed"];
const STEP_MS = ["12 ms", "380 ms", "900 ms"];
const ORDER: Phase[] = ["sent", "delivered", "done"];

export function DeviceDetail({ id }: { id: string }) {
  const t = useTick(2000);
  const device = fleetDevices(t).find((d) => d.id === id)!;

  const [on, setOn] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cmd, setCmd] = useState(0);
  const [ota, setOta] = useState<Ota>("ready");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const busy = phase === "sent" || phase === "delivered";

  function toggle() {
    if (busy) return;
    const target = !on;
    setPhase("sent");
    setCmd((c) => c + 1);
    timers.current.push(
      setTimeout(() => setPhase("delivered"), 380),
      setTimeout(() => {
        setPhase("done");
        setOn(target);
      }, 900),
    );
  }

  function updateFirmware() {
    setOta("installing");
    timers.current.push(
      setTimeout(() => setOta("verifying"), 2200),
      setTimeout(() => setOta("done"), 4200),
    );
  }

  const reached = ORDER.indexOf(phase as Phase);
  const pv = (3.3 + 0.35 * Math.sin((60 + t) / 9)).toFixed(2);
  const load = (1.2 + 0.25 * Math.sin((60 + t) / 5 + 1) + (on ? 1.5 : 0)).toFixed(2);
  const volts = (51.5 + 0.2 * Math.sin(t / 4)).toFixed(1);
  const seq = 48210 + t;
  const cmdId = `c-${2040 + cmd}`;

  const pad = (n: number) => String(n).padStart(2, "0");
  const time = (k: number) => `14:32:${pad((10 + 2 * k) % 60)}`;
  const log: { time: string; topic: string; color: string; body: string }[] = [];
  for (let k = 4; k >= 0; k--) {
    log.push({
      time: time(t + k),
      topic: "telemetry",
      color: "var(--green)",
      body: `{"seq":${seq - (4 - k)},"pv_w":${Math.round(3300 + 300 * Math.sin((56 + t + k) / 9))},"bus_v":51.6,"soc":87}`,
    });
  }
  if (phase !== "idle") {
    log.unshift({
      time: time(t + 5),
      topic: "cmd/ack",
      color: "var(--blue)",
      body: `{"id":"${cmdId}","relay":1,"state":"${phase === "done" ? (on ? "on" : "off") : "pending"}"}`,
    });
  }

  const fw = ota === "done" ? "1.5.0" : device.fw;
  const online = device.status !== "Offline";

  return (
    <div className="container-wide">
      <nav aria-label="Breadcrumb" className="row muted" style={{ gap: 8, fontSize: 14 }}>
        <Link href="/fleet" style={{ color: "var(--muted)" }}>Fleet</Link>
        <span aria-hidden="true">/</span>
        <span>{device.site}</span>
        <span aria-hidden="true">/</span>
        <span style={{ color: "var(--text)" }}>{device.id}</span>
      </nav>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
        <div className="stack" style={{ gap: 8 }}>
          <h1 className="display" style={{ margin: 0, fontSize: 36, fontStretch: "110%" }}>{device.name}</h1>
          <div className="row" style={{ gap: 8 }}>
            {online ? (
              <span className="pill pill-live" style={{ color: STATUS_COLOR[device.status] }}><span className="live-dot" />{device.status}</span>
            ) : (
              <span className="pill" style={{ color: "var(--red)", borderColor: "rgba(255,116,104,.45)" }}>Offline · {device.seen}</span>
            )}
            <span className="pill">Firmware {fw}</span>
            <span className="pill">Wi-Fi {device.rssi}</span>
            <span className="pill">Up 18 d 4 h</span>
            {device.id === "nabd-01" ? <span className="pill">Real hardware</span> : <span className="pill">Simulated</span>}
          </div>
        </div>
        <span className="mono muted" style={{ fontSize: 13 }}>seq #{seq} · received 0.4 s ago</span>
      </div>

      <div className="grid-auto">
        <div className="card stat"><span className="stat-label">Solar input</span><span className="stat-value">{pv} kW</span></div>
        <div className="card stat" style={{ gap: 10 }}>
          <span className="stat-label">Battery state of charge</span>
          <span className="stat-value">87 %</span>
          <div style={{ height: 8, background: "var(--line-grid)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: "87%", height: 8, background: "var(--green)" }} />
          </div>
        </div>
        <div className="card stat"><span className="stat-label">Battery bus voltage</span><span className="stat-value">{volts} V</span></div>
        <div className="card stat"><span className="stat-label">House load</span><span className="stat-value">{load} kW</span></div>
      </div>

      <div className="row" style={{ gap: 16 }}>
        <section aria-labelledby="ch-h" className="card pad stack" style={{ flex: "999 1 560px", minWidth: 0, gap: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h2 id="ch-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Battery voltage · last 24 hours</h2>
            <span className="muted" style={{ fontSize: 13 }}>hourly roll-up · min / avg / max</span>
          </div>
          <svg viewBox="0 0 800 220" preserveAspectRatio="none" width="100%" height="220" role="img" aria-label="Battery voltage over 24 hours: it rises through the day while charging and falls slowly overnight">
            {[55, 110, 165].map((y) => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#1E2733" />)}
            <polygon points="0,150 66,160 133,166 200,160 266,120 333,70 400,46 466,40 533,52 600,86 666,112 733,128 800,136 800,156 733,148 666,134 600,110 533,76 466,64 400,70 333,96 266,142 200,178 133,184 66,180 0,170" fill="rgba(245,177,61,0.14)" />
            <polyline points="0,160 66,170 133,175 200,169 266,131 333,83 400,58 466,52 533,64 600,98 666,123 733,138 800,146" fill="none" stroke="#F5B13D" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mono muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span>
          </div>
        </section>

        <section aria-labelledby="ct-h" className="card pad stack" style={{ flex: "1 1 340px", minWidth: 0, gap: 18 }}>
          <h2 id="ct-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Remote control</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ fontWeight: 600 }}>Water heater</span>
              <span className="muted" style={{ fontSize: 13 }}>Relay 1 · GPIO 26</span>
            </div>
            <button
              type="button"
              className="relay-btn"
              onClick={toggle}
              aria-pressed={on}
              aria-label="Water heater relay"
              aria-busy={busy}
              disabled={busy || !online}
            >
              {busy ? "…" : on ? "ON" : "OFF"}
            </button>
          </div>
          <ol aria-label="Command progress" aria-live="polite" className="stack" style={{ listStyle: "none", margin: 0, padding: 0, gap: 10 }}>
            {STEP_LABELS.map((label, i) => {
              const ok = reached >= i;
              return (
                <li key={label} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                  <span className="mono" style={{ width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: ok ? "var(--green)" : "var(--line-grid)", color: ok ? "var(--green-ink)" : "var(--muted)" }}>
                    {ok ? "✓" : i + 1}
                  </span>
                  <span style={{ color: ok ? "var(--text)" : "var(--muted)" }}>{label}</span>
                  <span className="mono muted" style={{ marginInlineStart: "auto", fontSize: 12 }}>{ok ? STEP_MS[i] : ""}</span>
                </li>
              );
            })}
          </ol>
          <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
            Command <span className="mono dim">{cmdId}</span> times out after 10 s with no reply, and the switch returns to its real state.
          </p>
          <div id="firmware" className="stack" style={{ borderTop: "1px solid var(--line-grid)", paddingTop: 16, gap: 10 }}>
            <span style={{ fontWeight: 600 }}>Firmware update</span>
            {ota === "done" ? (
              <span style={{ fontSize: 14, color: "var(--green)", lineHeight: 1.5 }}>Updated to 1.5.0 · health check passed. 1.4.2 kept as fallback.</span>
            ) : (
              <span className="dim" style={{ fontSize: 14, lineHeight: 1.5 }}>
                Version 1.5.0 is signed and ready. The node keeps {device.fw} as a fallback and rolls back if it doesn&apos;t check in within 2 minutes.
              </span>
            )}
            <button type="button" className="btn" style={{ alignSelf: "flex-start" }} onClick={updateFirmware} disabled={ota !== "ready" || !online}>
              {ota === "ready" ? "Update to 1.5.0" : ota === "installing" ? "Installing to spare partition…" : ota === "verifying" ? "Waiting for check-in…" : "Up to date"}
            </button>
          </div>
        </section>
      </div>

      <section aria-labelledby="mq-h" className="stack" style={{ background: "var(--bg-deep)", border: "1px solid var(--line-soft)", borderRadius: 16, padding: "20px 22px", gap: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h2 id="mq-h" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Raw MQTT messages</h2>
          <span className="mono muted" style={{ fontSize: 12 }}>nabd/v1/{device.site.toLowerCase().replace(/\s+/g, "-")}/{device.id}/#</span>
        </div>
        <div className="table-wrap">
          <div className="mono stack" style={{ fontSize: 13, lineHeight: 1.8, minWidth: 760 }}>
            {log.slice(0, 6).map((m, i) => (
              <div key={`${m.time}-${i}`} style={{ display: "flex", gap: 16, whiteSpace: "nowrap" }}>
                <span className="muted">{m.time}</span>
                <span style={{ color: m.color }}>{m.topic}</span>
                <span style={{ color: "var(--text-3)" }}>{m.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
