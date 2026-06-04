import { NextResponse } from "next/server";

/** Healthcheck simple para monitoreo/uptime. Ruta pública. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "pedigo",
    time: new Date().toISOString(),
  });
}
