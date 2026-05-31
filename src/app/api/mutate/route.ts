import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reduceAuctionState } from "@/lib/auction-engine";
import { readState, writeState } from "@/lib/repository";
import type { MutationAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN" && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  try {
    const action = (await request.json()) as MutationAction;
    const state = await readState();
    const nextState = reduceAuctionState(state, action);
    const saved = await writeState(nextState);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mutation failed." }, { status: 400 });
  }
}
