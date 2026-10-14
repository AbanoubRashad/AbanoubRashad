import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fleetDevices } from "@/lib/sim";
import { DeviceDetail } from "./DeviceDetail";

export function generateStaticParams() {
  return fleetDevices(0).map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: id };
}

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!fleetDevices(0).some((d) => d.id === id)) notFound();
  return <DeviceDetail id={id} />;
}
