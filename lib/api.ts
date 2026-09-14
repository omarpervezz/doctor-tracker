import { NextResponse } from "next/server";
export function apiOk<T>(data: T, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
export function apiError(error: string, status = 400, code?: string) { return NextResponse.json({ success: false, error, code }, { status }); }
export function parsePositiveInt(value: string | null, fallback: number, max = 100) {
  const n = Number(value); return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
}
