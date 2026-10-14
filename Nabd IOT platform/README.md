# Nabd · نبض — IoT Platform

> Every device has a pulse.

Nabd streams readings from ESP32 sensor nodes over MQTT, stores them as time-series data and pushes them to a live dashboard in under a second. When a reading drifts out of range, the right person gets a WhatsApp message.

This folder is the **web front end** (Next.js 15 · React 19 · TypeScript), built from the *Nabd IoT Platform* design canvas. It runs in **demo mode**: a simulated fleet (`lib/sim.ts`) stands in for the live WebSocket feed, so every screen works without hardware.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Landing page: hero, demo sites, how it works, bill of materials, engineering decisions |
| `/fleet` | Live fleet overview: KPIs, power chart with time range, events, sites, searchable device table |
| `/devices/[id]` | Device detail: live metrics, 24 h battery chart, remote relay control (sent → delivered → confirmed), signed OTA update, raw MQTT log |
| `/alerts` | Alert rule builder with duration, hysteresis and cool-down; live WhatsApp message preview; all rules |
| `/architecture` | System architecture diagram (ESP32 → MQTT → ingest → TimescaleDB → rules / API → WhatsApp / dashboard) |
| `/ar` | Mobile fleet view in Arabic (RTL) |
| `/api/fleet` | JSON snapshot of the demo fleet |

## Run it

Requires Node.js 18.18+ (20+ recommended).

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Type-check: `npm run lint`

## Project layout

```
app/
  page.tsx                 landing page
  (app)/layout.tsx         dashboard shell with sidebar
  (app)/fleet/             fleet overview (client, live)
  (app)/devices/[id]/      device detail + remote control
  (app)/alerts/            alert rules + WhatsApp preview
  (app)/architecture/      system diagram
  ar/                      Arabic RTL mobile view
  api/fleet/route.ts       demo fleet snapshot
  globals.css              design tokens and shared styles
components/                logo, app shell
lib/sim.ts                 simulated fleet data
lib/useTick.ts             timer hook that drives the live demo
```

## Design system

- **Type:** Archivo (display), IBM Plex Sans (body), IBM Plex Mono (numbers, code), IBM Plex Sans Arabic
- **Colors:** ground `#0A0E13`, cards `#10161E`, pulse green `#3DDC97`, command blue `#6CB4FF`, warning amber `#F5B13D`, critical red `#FF7468`

## Next steps toward the full platform

The design describes the complete system. To go from demo to real hardware:

1. **Firmware** — ESP32-S3 (INA219, SHT31, DS18B20, relay, SSD1306) publishing to `nabd/v1/<site>/<device>/telemetry` over TLS, with a flash replay buffer.
2. **Broker** — EMQX with per-device credentials and ACLs.
3. **Ingest worker** — validate, dedupe on `(device, seq)`, batch-write to TimescaleDB hypertables with hourly/daily roll-ups.
4. **API + WebSocket** — Fastify service; replace `useTick` / `lib/sim.ts` with a WebSocket subscription.
5. **Rules engine** — duration, hysteresis, cool-down; WhatsApp Cloud API templates and reply webhooks.

---

Designed and built by Abanoub Rashad · [Portfolio](https://abanoub--rashad.web.app) · [GitHub](https://github.com/AbanoubRashad)
