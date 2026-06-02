import { NextResponse } from "next/server";
import { fetchState, sellPlayer, removePlayer, markUnavailable, markAvailable, resetAuction, factoryReset, addPlayer, deletePlayer, updateBudget, updateInitialBudget } from "@/lib/db";
import type { MutationAction } from "@/lib/types";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_ACTION_PASSWORD || "admin123";
const PROTECTED_ACTIONS = ["RESET_AUCTION", "FACTORY_RESET", "MARK_UNAVAILABLE", "MARK_AVAILABLE", "ADD_PLAYER", "DELETE_PLAYER", "UPDATE_BUDGET", "UPDATE_INITIAL_BUDGET"];

export async function POST(request: Request) {
  try {
    const action = (await request.json()) as MutationAction;

    if (PROTECTED_ACTIONS.includes(action.type)) {
      if (action.password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Invalid admin password." }, { status: 403 });
      }
    }

    switch (action.type) {
      case "SELL_PLAYER":
        await sellPlayer(action.teamId, action.playerId, action.soldPrice);
        break;
      case "REMOVE_PLAYER":
        await removePlayer(action.playerId);
        break;
      case "MARK_UNAVAILABLE":
        await markUnavailable(action.playerId);
        break;
      case "MARK_AVAILABLE":
        await markAvailable(action.playerId);
        break;
      case "RESET_AUCTION":
        await resetAuction();
        break;
      case "FACTORY_RESET":
        await factoryReset();
        break;
      case "ADD_PLAYER":
        await addPlayer(action.enum_name, action.display_name, action.position, action.ovr, action.base_price);
        break;
      case "DELETE_PLAYER":
        await deletePlayer(action.playerId);
        break;
      case "UPDATE_BUDGET":
        await updateBudget(action.teamId, action.newBudget);
        break;
      case "UPDATE_INITIAL_BUDGET":
        await updateInitialBudget(action.teamId, action.newInitialBudget);
        break;
      default:
        return NextResponse.json({ error: "Unknown action type." }, { status: 400 });
    }

    const state = await fetchState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mutation failed." },
      { status: 400 }
    );
  }
}
