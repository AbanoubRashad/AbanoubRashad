import Link from "next/link";

export default function NotFound() {
  return (
    <div className="stack" style={{ minHeight: "100vh", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
      <span className="mono" style={{ color: "var(--red)" }}>404 · no pulse</span>
      <h1 className="display" style={{ margin: 0, fontSize: 36 }}>This device isn&apos;t in the fleet.</h1>
      <Link href="/fleet" className="btn btn-primary">Back to the fleet</Link>
    </div>
  );
}
