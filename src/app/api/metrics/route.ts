import { NextResponse } from "next/server";
import { Registry, collectDefaultMetrics } from "@prometheus-io/client";

export const dynamic = "force-dynamic";

const registry = new Registry();

collectDefaultMetrics({
  register: registry,
});

export async function GET() {
  const metrics = await registry.metrics();

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      "Content-Type": registry.contentType,
    },
  });
}
