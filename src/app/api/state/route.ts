import { NextResponse } from "next/server";
import { fetchState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await fetchState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch state." },
      { status: 500 }
    );
  }
}
