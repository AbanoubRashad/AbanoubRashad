import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { SITES } from "@/lib/sim";

const REPO = "https://github.com/AbanoubRashad/nabd";

const STEPS = [
  { n: "01 · SENSE", color: "var(--green)", title: "Read the real world", body: "ESP32-S3 firmware samples voltage, current, temperature and humidity every 2 seconds and filters the noise on the chip." },
  { n: "02 · SEND", color: "var(--blue)", title: "Publish over MQTT", body: "TLS on every connection, a unique key per device, and a flash buffer that keeps readings safe when the Wi-Fi drops." },
  { n: "03 · STORE", color: "var(--amber)", title: "Keep every reading", body: "An ingest worker validates each message and writes it to TimescaleDB, with hourly and daily roll-ups for fast charts." },
  { n: "04 · ACT", color: "var(--red)", title: "See it, act on it", body: "WebSockets push readings to the dashboard, a rules engine sends WhatsApp alerts, and you can switch relays from anywhere." },
];

const BOM = [
  ["ESP32-S3 DevKitC-1", "Brain, Wi-Fi, TLS", "—"],
  ["INA219", "Voltage and current", "I²C"],
  ["SHT31", "Air temperature and humidity", "I²C"],
  ["DS18B20 probe", "Fridge or water temperature", "1-Wire"],
  ["Relay module", "Switch a pump or heater", "GPIO"],
  ["SSD1306 OLED", "Readings on the box itself", "I²C"],
];

const DECISIONS = [
  { title: "No reading is ever lost", body: "When the network drops, the node stores readings in flash and replays them with their original timestamps. Ingest is idempotent on device and sequence number, so a replay never creates duplicates." },
  { title: "Commands you can trust", body: "Every relay command carries an ID. The device confirms it, and the screen shows sent, delivered and done, or a clear timeout. A button never pretends something happened." },
  { title: "Alerts without spam", body: "A rule fires only after a reading stays out of range for a set time, clears with a margin so it can't flap, and waits a cool-down before it messages anyone again." },
  { title: "Updates that can't brick a box", body: "Firmware is signed, installed to the spare partition and kept only if the node checks in afterwards. Otherwise it rolls back by itself." },
];

const STACK = [
  "C++ · ESP-IDF / Arduino",
  "MQTT · EMQX",
  "Node.js · TypeScript",
  "PostgreSQL · TimescaleDB",
  "WebSockets",
  "Next.js",
  "WhatsApp Cloud API",
  "Docker · GitHub Actions",
  "Sentry",
];

function NodeIllustration() {
  return (
    <svg viewBox="0 0 520 300" width="100%" role="img" aria-label="Illustration of the Nabd sensor node: an ESP32 board with an OLED screen, a current sensor and a temperature probe">
      <rect x="20" y="30" width="480" height="240" rx="18" fill="#0D1218" stroke="#2A3646" />
      <rect x="60" y="70" width="210" height="120" rx="8" fill="#13324A" stroke="#1E4D6E" />
      <rect x="84" y="94" width="72" height="72" rx="4" fill="#1C232D" stroke="#3B4A5C" />
      <text x="120" y="135" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#93A3B5">ESP32-S3</text>
      <rect x="176" y="98" width="72" height="44" rx="3" fill="#05090D" stroke="#3B4A5C" />
      <polyline className="trace" points="182,130 192,124 200,127 208,112 216,118 224,108 232,114 242,104" fill="none" stroke="#3DDC97" strokeWidth="2" />
      <circle cx="250" cy="174" r="4" fill="#3DDC97" />
      <g fill="#C8A24A">
        {[66, 80, 94, 108, 122, 136, 150, 164].map((x) => (
          <rect key={x} x={x} y="196" width="6" height="10" />
        ))}
      </g>
      <rect x="318" y="76" width="140" height="58" rx="6" fill="#1D3B2E" stroke="#2C5A45" />
      <text x="388" y="110" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#B9F0D6">INA219</text>
      <rect x="318" y="152" width="140" height="58" rx="6" fill="#3A2A14" stroke="#5A4220" />
      <text x="388" y="186" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#F7D9A6">SHT31 · relay</text>
      <path d="M270 110 C 295 110, 295 105, 318 105" fill="none" stroke="#6CB4FF" strokeWidth="2" />
      <path d="M270 150 C 295 150, 295 181, 318 181" fill="none" stroke="#F5B13D" strokeWidth="2" />
      <path d="M120 270 C 120 290, 60 290, 40 296" fill="none" stroke="#93A3B5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="grid-bg" style={{ minHeight: "100vh" }}>
      <header className="container site-header">
        <a href="#top" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--text)" }}>
          <LogoMark />
          <span className="display" style={{ fontSize: 22, letterSpacing: "0.01em" }}>Nabd</span>
          <span lang="ar" className="muted" style={{ fontSize: 15 }}>نبض</span>
        </a>
        <nav aria-label="Main" className="site-nav">
          <a href="#how">How it works</a>
          <a href="#hardware">Hardware</a>
          <a href="#decisions">Engineering</a>
          <a href={REPO}>Source</a>
          <Link href="/fleet" className="btn btn-primary" style={{ padding: "0 20px" }}>Open live demo</Link>
        </nav>
      </header>

      <section id="top" className="container hero">
        <div className="stack" style={{ flex: "1 1 520px", minWidth: 0, gap: 28 }}>
          <div className="mono muted" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <span className="live-dot lg" />
            <span>ESP32 · MQTT · TimescaleDB · Next.js</span>
          </div>
          <h1>Every device has a pulse.</h1>
          <p className="lede">
            Nabd streams readings from ESP32 sensor nodes over MQTT, stores them as time-series data and pushes them to a live dashboard in under a second. When a reading drifts out of range, the right person gets a WhatsApp message.
          </p>
          <div className="row" style={{ gap: 12 }}>
            <Link href="/fleet" className="btn btn-primary btn-lg">Watch the live fleet</Link>
            <a href="#how" className="btn btn-lg">How it is built</a>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Live demo runs a simulated fleet of 12 nodes beside one real board.</p>
        </div>

        <div style={{ flex: "1 1 520px", minWidth: 0 }}>
          <div className="card stack" style={{ borderRadius: 20, padding: 24, gap: 20, boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div className="stack" style={{ gap: 2 }}>
                <span className="muted" style={{ fontSize: 13 }}>nabd-01 · Off-grid villa, Wadi El Natrun</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>Rooftop power node</span>
              </div>
              <span className="pill pill-live" style={{ fontSize: 12 }}><span className="live-dot" />LIVE</span>
            </div>
            <NodeIllustration />
            <div className="grid-auto" style={{ ["--min" as string]: "140px", gap: 12 }}>
              {[
                ["Solar input", "3.42 kW", undefined],
                ["Battery", "87 %", undefined],
                ["Device → screen", "412 ms", "var(--green)"],
              ].map(([label, value, color]) => (
                <div key={label} className="stack" style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, gap: 4 }}>
                  <span className="muted" style={{ fontSize: 12 }}>{label}</span>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 500, color }}>{value}</span>
                </div>
              ))}
            </div>
            <span className="muted" style={{ fontSize: 12 }}>Sample readings from the demo fleet</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="sites-h" className="container stack" style={{ paddingBottom: 104, gap: 24 }}>
        <h2 id="sites-h" className="kicker">Four sites in the demo fleet</h2>
        <div className="grid-auto" style={{ ["--min" as string]: "260px" }}>
          {SITES.map((s) => {
            const warn = s.status === "Warning";
            return (
              <div key={s.name} className={`card stack${warn ? " warn" : ""}`} style={{ padding: 20, gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: warn ? "var(--amber)" : "var(--green)" }}>{warn ? "▲ Warning" : "● Normal"}</span>
                </div>
                <span className="muted" style={{ fontSize: 14 }}>{s.place} · {s.kind}</span>
                <span className="mono" style={{ fontSize: 24, color: warn ? "var(--amber)" : undefined }}>{s.value}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how" aria-labelledby="how-h" className="section-band">
        <div className="container section stack" style={{ gap: 48 }}>
          <div className="stack" style={{ gap: 14, maxWidth: 720 }}>
            <h2 id="how-h" className="h2">From a sensor wire to your phone in four steps</h2>
            <p className="dim" style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>
              Each step is a separate service you can read in the repo, with its own tests. <Link href="/architecture">See the architecture →</Link>
            </p>
          </div>
          <ol className="grid-auto" style={{ ["--min" as string]: "250px", listStyle: "none", margin: 0, padding: 0 }}>
            {STEPS.map((s) => (
              <li key={s.n} className="card stack" style={{ padding: 24, gap: 12 }}>
                <span className="mono" style={{ fontSize: 13, color: s.color }}>{s.n}</span>
                <span className="step-title">{s.title}</span>
                <span className="dim" style={{ fontSize: 15, lineHeight: 1.6 }}>{s.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="hardware" aria-labelledby="hw-h" className="container section row" style={{ gap: 56, alignItems: "flex-start" }}>
        <div className="stack" style={{ flex: "1 1 380px", minWidth: 0, gap: 16 }}>
          <h2 id="hw-h" className="h2">Real hardware, not just a mock API</h2>
          <p className="dim" style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>
            One node costs less than a dinner out and takes an afternoon to wire. The wiring diagram, firmware and enclosure files are all in the repo.
          </p>
          <a href={REPO} style={{ fontWeight: 600, fontSize: 16 }}>Wiring diagram and firmware →</a>
        </div>
        <div className="card table-wrap" style={{ flex: "1 1 560px", minWidth: 0 }}>
          <table className="table" style={{ fontSize: 15, minWidth: 520 }}>
            <caption>Bill of materials, one node</caption>
            <thead>
              <tr><th style={{ padding: "12px 20px" }}>Part</th><th style={{ padding: "12px 20px" }}>Job</th><th style={{ padding: "12px 20px" }}>Bus</th></tr>
            </thead>
            <tbody>
              {BOM.map(([part, job, bus]) => (
                <tr key={part}>
                  <td className="mono" style={{ padding: "14px 20px" }}>{part}</td>
                  <td className="dim" style={{ padding: "14px 20px" }}>{job}</td>
                  <td className="muted" style={{ padding: "14px 20px" }}>{bus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="decisions" aria-labelledby="dec-h" className="section-band">
        <div className="container section stack" style={{ gap: 48 }}>
          <h2 id="dec-h" className="h2" style={{ maxWidth: 760 }}>The hard parts, solved on purpose</h2>
          <div className="grid-auto" style={{ ["--min" as string]: "480px" }}>
            {DECISIONS.map((d) => (
              <div key={d.title} className="card stack" style={{ padding: 28, gap: 10 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24 }}>{d.title}</span>
                <span className="dim" style={{ fontSize: 16, lineHeight: 1.6 }}>{d.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="stack-h" className="container stack" style={{ paddingTop: 104, paddingBottom: 56, gap: 20 }}>
        <h2 id="stack-h" className="kicker">Built with</h2>
        <div className="row mono" style={{ gap: 10, fontSize: 14 }}>
          {STACK.map((s) => (
            <span key={s} style={{ border: "1px solid var(--line-strong)", borderRadius: 999, padding: "8px 14px" }}>{s}</span>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingTop: 56, paddingBottom: 104 }}>
        <div className="card ok row" style={{ borderRadius: 24, padding: "56px 40px", gap: 28, alignItems: "center", justifyContent: "space-between" }}>
          <div className="stack" style={{ gap: 10, flex: "1 1 420px", minWidth: 0 }}>
            <span className="display" style={{ fontSize: 40, lineHeight: 1.1 }}>See the fleet breathe.</span>
            <span className="dim" style={{ fontSize: 17 }}>The demo is live. Flip a relay, watch the acknowledgement come back.</span>
          </div>
          <Link href="/fleet" className="btn btn-primary btn-lg" style={{ minHeight: 52, fontSize: 17 }}>Open live demo</Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line-soft)" }}>
        <div className="container row muted" style={{ paddingTop: 32, paddingBottom: 32, justifyContent: "space-between", gap: 16, fontSize: 14 }}>
          <span>Designed and built by Abanoub Rashad · Mechatronics engineer, software developer</span>
          <div className="row" style={{ gap: 20 }}>
            <a href="https://abanoub--rashad.web.app">Portfolio</a>
            <a href="https://github.com/AbanoubRashad">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
