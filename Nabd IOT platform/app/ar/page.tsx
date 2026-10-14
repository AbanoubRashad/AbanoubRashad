import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = { title: "نبض · الأسطول" };

const SITES = [
  { name: "فيلا وادي النطرون", note: "طاقة شمسية وبطارية", value: "3.42 kW", extra: "البطارية", extraValue: "87 %", tone: "ok" },
  { name: "صوبة الطماطم بالفيوم", note: "مناخ وري · المضخة تعمل", value: "29.4 °C · 71 %", tone: "ok" },
  { name: "ثلاجة أدوية العيادة", note: "مصر الجديدة · المطلوب من 2 إلى 8 درجات", value: "7.9 °C", tone: "warn" },
  { name: "غرفة التبريد", note: "العاشر من رمضان · حساس الباب لا يرسل منذ 14 دقيقة", value: "−18.2 °C", tone: "down" },
] as const;

const TONE = {
  ok: { label: "● طبيعي", color: "var(--green)", border: "var(--line)" },
  warn: { label: "▲ تحذير", color: "var(--amber)", border: "var(--amber-line)" },
  down: { label: "■ حساس منقطع", color: "var(--red)", border: "rgba(255,116,104,.45)" },
};

const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

const NAV = [
  { href: "/ar", label: "الرئيسية", current: true, svg: <svg {...icon}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg> },
  { href: "/fleet#sites", label: "المواقع", svg: <svg {...icon}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> },
  { href: "/alerts", label: "التنبيهات", svg: <svg {...icon}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21h4" /></svg> },
  { href: "/devices/nabd-01", label: "الأجهزة", svg: <svg {...icon}><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg> },
];

export default function ArabicMobilePage() {
  return (
    <div lang="ar" dir="rtl" style={{ fontFamily: "var(--font-ar)", minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", borderInline: "1px solid var(--line-soft)" }}>
      <div className="stack" style={{ flex: "1 1 auto", padding: "40px 20px 24px", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="stack" style={{ gap: 2 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>الأسطول</h1>
            <span className="muted" style={{ fontSize: 14 }}>11 من 12 جهازًا متصل الآن</span>
          </div>
          <Link href="/" aria-label="نبض · الصفحة الرئيسية"><LogoMark size={40} /></Link>
        </div>

        <Link href="/alerts" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, background: "rgba(245,177,61,.1)", border: "1px solid rgba(245,177,61,.4)", color: "var(--text)", textDecoration: "none", minHeight: 44 }}>
          <span aria-hidden="true" style={{ fontSize: 20, color: "var(--amber)" }}>▲</span>
          <span className="stack" style={{ gap: 2, fontSize: 14, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>ثلاجة الأدوية دافئة</span>
            <span style={{ color: "var(--text-3)" }}>مصر الجديدة · <span dir="ltr" className="mono">7.9 °C</span> وترتفع</span>
          </span>
          <span style={{ marginInlineStart: "auto", fontSize: 14, color: "var(--amber)" }}>عرض</span>
        </Link>

        <div className="stack" style={{ gap: 12 }}>
          {SITES.map((s) => {
            const tone = TONE[s.tone];
            return (
              <div key={s.name} className="card stack" style={{ padding: 16, gap: 8, borderColor: tone.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{s.name}</span>
                  <span style={{ fontSize: 13, color: tone.color }}>{tone.label}</span>
                </div>
                <span className="muted" style={{ fontSize: 13 }}>{s.note}</span>
                {"extra" in s ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span dir="ltr" className="mono" style={{ fontSize: 24 }}>{s.value}</span>
                    <span className="muted" style={{ fontSize: 13 }}>{s.extra} <span dir="ltr">{s.extraValue}</span></span>
                  </div>
                ) : (
                  <span dir="ltr" className="mono" style={{ alignSelf: "flex-end", fontSize: 24, color: s.tone === "warn" ? "var(--amber)" : undefined }}>{s.value}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <nav aria-label="التنقل" style={{ position: "sticky", bottom: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", borderTop: "1px solid var(--line-soft)", background: "var(--bg-2)", padding: "8px 8px 20px" }}>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={n.current ? "page" : undefined}
            style={{ minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, textDecoration: "none", fontSize: 12, color: n.current ? "var(--green)" : "var(--muted)", fontWeight: n.current ? 600 : 400 }}
          >
            {n.svg}
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
