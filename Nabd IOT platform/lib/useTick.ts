"use client";

import { useEffect, useState } from "react";

/** Increments once per `ms` — drives the simulated live stream. */
export function useTick(ms: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}
