import type { Metadata } from "next";

export const metadata: Metadata = { title: "System architecture" };

const W = 220;
const H = 88;
const COL = [24, 360, 696, 1032];
const ROW = [150, 430, 710];

const NODES = [
  { c: 0, r: 0, title: "ESP32-S3 node", sub: "INA219 · SHT31 · DS18B20", border: "#2C5A45" },
  { c: 1, r: 0, title: "MQTT broker", sub: "EMQX · TLS 8883 · ACLs" },
  { c: 2, r: 0, title: "Ingest worker", sub: "validate · dedupe · batch" },
  { c: 3, r: 0, title: "TimescaleDB", sub: "hypertables · roll-ups" },
  { c: 0, r: 1, title: "Firmware store", sub: "signed builds · rollback" },
  { c: 2, r: 1, title: "Rules engine", sub: "duration · hysteresis · cool-down", border: "#5A4220" },
  { c: 3, r: 1, title: "API + WebSocket", sub: "Fastify · auth · commands" },
  { c: 2, r: 2, title: "WhatsApp · email", sub: "Cloud API templates" },
  { c: 3, r: 2, title: "Next.js dashboard", sub: "English + Arabic RTL", border: "#2C5A45" },
];

const GREY = "#6B7B8D";
const BLUE = "#6CB4FF";
const AMBER = "#F5B13D";
const GREEN = "#3DDC97";
const MUTED = "#93A3B5";

const ARROWS: { d: string; color: string; dashed?: boolean }[] = [
  { d: "M244 179 H353", color: GREY },
  { d: "M360 209 H251", color: BLUE },
  { d: "M580 194 H689", color: GREY },
  { d: "M916 194 H1025", color: GREY },
  { d: "M806 238 V423", color: GREY },
  { d: "M1142 238 V423", color: GREY },
  { d: "M806 518 V703", color: AMBER },
  { d: "M1142 518 V703", color: GREEN },
  { d: "M134 430 V245", color: GREY, dashed: true },
];

const LABELS: { x: number; y: number; text: string; color: string; anchor?: "middle" }[] = [
  { x: 302, y: 168, text: "telemetry", color: MUTED, anchor: "middle" },
  { x: 302, y: 230, text: "commands", color: BLUE, anchor: "middle" },
  { x: 636, y: 183, text: "subscribe", color: MUTED, anchor: "middle" },
  { x: 972, y: 183, text: "batch write", color: MUTED, anchor: "middle" },
  { x: 818, y: 335, text: "each reading", color: MUTED },
  { x: 1154, y: 335, text: "queries", color: MUTED },
  { x: 818, y: 615, text: "alert", color: AMBER },
  { x: 1154, y: 615, text: "WebSocket push", color: GREEN },
  { x: 146, y: 340, text: "signed OTA", color: MUTED },
];

const COLORS = [GREY, BLUE, AMBER, GREEN];
const markerId = (c: string) => `head-${c.slice(1)}`;

export default function ArchitecturePage() {
  return (
    <div className="container-wide">
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="display" style={{ margin: 0, fontSize: 36, fontStretch: "110%" }}>How Nabd moves a reading</h1>
        <p className="muted" style={{ margin: 0, fontSize: 16 }}>
          <span>Grey: data path</span> · <span style={{ color: BLUE }}>blue: commands back to the device</span> ·{" "}
          <span style={{ color: AMBER }}>amber: alerts</span> · <span style={{ color: GREEN }}>green: live push</span> · dashed: firmware updates
        </p>
      </div>

      <div className="table-wrap">
        <svg
          viewBox="0 0 1276 830"
          width="100%"
          role="img"
          aria-label="Nabd architecture: ESP32 nodes publish telemetry to an MQTT broker; an ingest worker validates and batch-writes readings to TimescaleDB and feeds a rules engine that sends WhatsApp and email alerts; an API and WebSocket server queries TimescaleDB and pushes live data to the Next.js dashboard; commands flow back to the device through the broker, and signed firmware updates come from the firmware store."
          style={{ minWidth: 760, fontFamily: "var(--font-sans)" }}
        >
          <defs>
            {COLORS.map((c) => (
              <marker key={c} id={markerId(c)} orient="auto" markerWidth="10" markerHeight="10" refX="4" refY="4" viewBox="0 0 8 8">
                <path d="M0 0 L8 4 L0 8 Z" fill={c} />
              </marker>
            ))}
          </defs>

          {ARROWS.map((a) => (
            <path
              key={a.d}
              d={a.d}
              stroke={a.color}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={a.dashed ? "6 6" : undefined}
              markerEnd={`url(#${markerId(a.color)})`}
            />
          ))}

          {NODES.map((n) => {
            const x = COL[n.c];
            const y = ROW[n.r];
            return (
              <g key={n.title}>
                <rect x={x + 0.5} y={y + 0.5} width={W - 1} height={H - 1} rx="12" fill="#10161E" stroke={n.border ?? "#2E3B4B"} />
                <text x={x + W / 2} y={y + 38} textAnchor="middle" fontSize="15" fontWeight="600" fill="#E7EDF3">{n.title}</text>
                <text x={x + W / 2} y={y + 60} textAnchor="middle" fontSize="13" fill={MUTED}>{n.sub}</text>
              </g>
            );
          })}

          {LABELS.map((l) => (
            <text key={l.text} x={l.x} y={l.y} textAnchor={l.anchor ?? "start"} fontSize="13" fill={l.color}>{l.text}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}
