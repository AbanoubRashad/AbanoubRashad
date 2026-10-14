import type { Metadata } from "next";
import { FleetDashboard } from "./FleetDashboard";

export const metadata: Metadata = { title: "Fleet overview" };

export default function FleetPage() {
  return <FleetDashboard />;
}
