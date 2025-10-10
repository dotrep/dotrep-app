import type { HelloResponse } from "./types";

/** Uses relative /api path so Vite proxy handles dev; set VITE_API_URL only if needed. */
const base = import.meta?.env?.VITE_API_URL || "";

export async function apiHello(): Promise<HelloResponse> {
  const res = await fetch(`${base}/api/hello`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
