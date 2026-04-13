import { NextResponse } from "next/server";
import { metrics } from "@/data/metrics";

export async function GET() {
  return NextResponse.json({
    metrics,
    version: "0.2.0",
  });
}
