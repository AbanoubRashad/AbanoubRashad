import { NextResponse } from "next/server";
import { fleetDevices } from "@/lib/sim";

export const dynamic = "force-dynamic";

/** Snapshot of the demo fleet. In production this reads the latest rows from TimescaleDB. */
export function GET() {
  const t = Math.floor(Date.now() / 1000);
  return NextResponse.json({ updatedAt: new Date().toISOString(), devices: fleetDevices(t) });
}
