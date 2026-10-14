import type { Metadata } from "next";
import { AlertRules } from "./AlertRules";

export const metadata: Metadata = { title: "Alert rules" };

export default function AlertsPage() {
  return <AlertRules />;
}
