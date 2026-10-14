"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Op = "above" | "below" | "outside range";

interface Rule {
  name: string;
  condition: string;
  notify: string;
  state: "Firing" | "OK";
  critical?: boolean;
}

const INITIAL_RULES: Rule[] = [
  { name: "Medicine fridge too warm", condition: "temp > 8.0 °C for 5 min", notify: "WhatsApp, email", state: "Firing" },
  { name: "Device stopped reporting", condition: "no message for 5 min", notify: "WhatsApp", state: "Firing", critical: true },
  { name: "Battery running low", condition: "soc < 25 % for 10 min", notify: "WhatsApp", state: "OK" },
  { name: "Greenhouse overheating", condition: "air > 35 °C for 10 min", notify: "WhatsApp, quiet 23:00–06:00", state: "OK" },
];

const OP_SYMBOL: Record<Op, string> = { above: ">", below: "<", "outside range": "∉" };

export function AlertRules() {
  const [op, setOp] = useState<Op>("above");
  const [threshold, setThreshold] = useState("8.0");
  const [duration, setDuration] = useState("5");
  const [clears, setClears] = useState("7.5");
  const [cooldown, setCooldown] = useState("30");
  const [severity, setSeverity] = useState("Warning");
  const [whatsapp, setWhatsapp] = useState(true);
  const [email, setEmail] = useState(true);
  const [escalate, setEscalate] = useState(false);
  const [rules, setRules] = useState(INITIAL_RULES);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const th = Number(threshold) || 0;
  const current = 8.3;
  const wouldFire = op === "above" ? Math.max(0, Math.floor((9 - th) * 2.5)) : op === "below" ? 0 : 2;
  const channels = [whatsapp && "WhatsApp", email && "email"].filter(Boolean).join(", ") || "nobody";

  function save(e: FormEvent) {
    e.preventDefault();
    const condition = `temp ${OP_SYMBOL[op]} ${th.toFixed(1)} °C for ${duration} min`;
    setRules((rs) =>
      rs.map((r, i) =>
        i === 0 ? { ...r, condition, notify: channels + (escalate ? ", escalate 15 min" : ""), state: op === "above" && current > th ? "Firing" : "OK" } : r,
      ),
    );
    setToast("Rule saved. The rules engine picks it up on the next reading.");
  }

  return (
    <div className="container-wide">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div className="stack" style={{ gap: 6 }}>
          <Link href="/fleet" className="muted" style={{ fontSize: 14 }}>← Fleet</Link>
          <h1 className="display" style={{ margin: 0, fontSize: 36, fontStretch: "110%" }}>Alert rules</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setToast("Rule templates are coming soon. Edit the rule below for now.")}>New rule</button>
      </div>

      <div className="row" style={{ gap: 16, alignItems: "flex-start" }}>
        <form aria-labelledby="rb-h" onSubmit={save} className="card stack" style={{ flex: "999 1 600px", minWidth: 0, padding: 26, gap: 22 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h2 id="rb-h" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Medicine fridge too warm</h2>
            <span className="muted" style={{ fontSize: 14 }}>Vaccines must stay between 2 and 8 °C.</span>
          </div>

          <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, gap: 12 }}>
            <legend className="kicker" style={{ fontSize: 12, paddingBottom: 10 }}>When</legend>
            <div className="grid-auto" style={{ ["--min" as string]: "180px", gap: 12 }}>
              <label className="field">Device<select className="input"><option>nabd-07 · Medicine fridge</option></select></label>
              <label className="field">Reading<select className="input"><option>Probe temperature</option></select></label>
              <label className="field">Is
                <select className="input" value={op} onChange={(e) => setOp(e.target.value as Op)}>
                  <option value="above">above</option><option value="below">below</option><option value="outside range">outside range</option>
                </select>
              </label>
              <label className="field">Threshold (°C)<input className="input mono" type="number" step="0.1" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></label>
            </div>
          </fieldset>

          <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, gap: 12 }}>
            <legend className="kicker" style={{ fontSize: 12, paddingBottom: 10 }}>So it doesn&apos;t spam</legend>
            <div className="grid-auto" style={{ ["--min" as string]: "180px", gap: 12 }}>
              <label className="field">For at least (min)<input className="input mono" type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} /></label>
              <label className="field">Clears below (°C)<input className="input mono" type="number" step="0.1" value={clears} onChange={(e) => setClears(e.target.value)} /></label>
              <label className="field">Repeat at most every (min)<input className="input mono" type="number" min="0" value={cooldown} onChange={(e) => setCooldown(e.target.value)} /></label>
              <label className="field">Severity
                <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}><option>Warning</option><option>Critical</option></select>
              </label>
            </div>
          </fieldset>

          <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, gap: 12 }}>
            <legend className="kicker" style={{ fontSize: 12, paddingBottom: 10 }}>Then notify</legend>
            <div className="row" style={{ gap: 12 }}>
              <label className="check-chip"><input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />WhatsApp · clinic manager</label>
              <label className="check-chip"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />Email · on-call list</label>
              <label className="check-chip"><input type="checkbox" checked={escalate} onChange={(e) => setEscalate(e.target.checked)} />Escalate to owner after 15 min unacknowledged</label>
            </div>
          </fieldset>

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 12, borderTop: "1px solid var(--line-grid)", paddingTop: 18 }}>
            <span className="muted" style={{ fontSize: 14 }}>
              Tested against the last 7 days: would have fired <span className="mono" style={{ color: "var(--text)" }}>{wouldFire}</span> times.
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn" disabled={!whatsapp && !email} onClick={() => setToast(`Test message sent to ${channels}.`)}>Send test message</button>
              <button type="submit" className="btn btn-primary">Save rule</button>
            </div>
          </div>
        </form>

        <div className="stack" style={{ flex: "1 1 360px", minWidth: 0, gap: 16 }}>
          <section aria-labelledby="wa-h" className="card pad stack" style={{ gap: 14 }}>
            <h2 id="wa-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>What the manager receives</h2>
            <div className="stack" style={{ background: "#0B141A", borderRadius: 14, padding: 18, gap: 10 }}>
              <div className="stack" style={{ alignSelf: "flex-start", maxWidth: "92%", background: "#1F2C34", color: "#E9EDEF", borderRadius: "4px 12px 12px 12px", padding: "12px 14px", fontSize: 14, lineHeight: 1.55, gap: 6 }}>
                <span style={{ fontWeight: 600 }}>Nabd alert · {severity}</span>
                <span>
                  Medicine fridge, Heliopolis is at {current.toFixed(1)} °C. It has been {op === "outside range" ? "outside its range" : `${op} ${th.toFixed(1)} °C`} for {duration} minutes. Door: closed.
                </span>
                <span>Reply 1 to acknowledge, 2 to mute for 1 hour.</span>
                <span style={{ alignSelf: "flex-end", fontSize: 11, color: "#A9B5BC" }}>14:36</span>
              </div>
              <div style={{ alignSelf: "flex-end", background: "#005C4B", color: "#E9EDEF", borderRadius: "12px 4px 12px 12px", padding: "10px 14px", fontSize: 14 }}>1</div>
              <div style={{ alignSelf: "flex-start", maxWidth: "92%", background: "#1F2C34", color: "#E9EDEF", borderRadius: "4px 12px 12px 12px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>
                Acknowledged by you. Nabd will message again when it clears.
              </div>
            </div>
            <span className="muted" style={{ fontSize: 13 }}>Sent with an approved WhatsApp Cloud API template. Replies come back by webhook.</span>
          </section>

          <section aria-labelledby="tl-h" className="card pad stack" style={{ gap: 14 }}>
            <h2 id="tl-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>This alert so far</h2>
            <ol className="stack" style={{ listStyle: "none", margin: 0, padding: "0 0 0 18px", borderInlineStart: "2px solid var(--line)", gap: 14, fontSize: 14 }}>
              <li className="stack" style={{ gap: 2 }}><span className="mono muted" style={{ fontSize: 12 }}>14:31</span><span>Reading crossed {th.toFixed(1)} °C, timer started</span></li>
              <li className="stack" style={{ gap: 2 }}><span className="mono muted" style={{ fontSize: 12 }}>14:36</span><span style={{ color: "var(--amber)" }}>Alert opened · {channels} sent</span></li>
              <li className="stack" style={{ gap: 2 }}><span className="mono muted" style={{ fontSize: 12 }}>14:38</span><span>Acknowledged by clinic manager</span></li>
              <li className="stack" style={{ gap: 2 }}><span className="mono muted" style={{ fontSize: 12 }}>—</span><span className="muted">Clears when below {Number(clears).toFixed(1)} °C · repeats at most every {cooldown} min</span></li>
            </ol>
          </section>
        </div>
      </div>

      <section id="rules" aria-labelledby="rl-h" className="card table-wrap">
        <h2 id="rl-h" style={{ margin: 0, padding: "20px 22px 8px", fontSize: 17, fontWeight: 600 }}>All rules</h2>
        <table className="table" style={{ minWidth: 760 }}>
          <thead><tr><th>Rule</th><th>Condition</th><th>Notify</th><th>State</th></tr></thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="mono dim">{r.condition}</td>
                <td className="dim">{r.notify}</td>
                <td style={{ color: r.state === "OK" ? "var(--green)" : r.critical ? "var(--red)" : "var(--amber)" }}>{r.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {toast ? <div role="status" className="toast">{toast}</div> : null}
    </div>
  );
}
