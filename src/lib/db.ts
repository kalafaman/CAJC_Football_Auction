import { supabase } from "./supabase";
import type { AuctionState, HistoryEntry, Player, Team } from "./types";
import { seedPlayers } from "./seed-data";

// ---------------------------------------------------------------------------
// Ephemeral session state (not in DB — lives only for current server process)
// History and lastSold are live-event feed data, not persistent records.
// ---------------------------------------------------------------------------
let history: HistoryEntry[] = [];
let lastSold: AuctionState["lastSold"] = null;

function histId(): string {
  return `hist_${Math.random().toString(36).substr(2, 9)}`;
}

function pushHistory(actionType: string, label: string) {
  history = [
    { id: histId(), actionType, timestamp: new Date().toISOString(), payload: { label } },
    ...history,
  ].slice(0, 50);
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export async function fetchState(): Promise<AuctionState> {
  const [{ data: teams, error: tErr }, { data: players, error: pErr }] = await Promise.all([
    supabase().from("teams").select("*").order("name"),
    supabase().from("players").select("*").order("display_name"),
  ]);

  if (tErr) throw new Error(`Failed to fetch teams: ${tErr.message}`);
  if (pErr) throw new Error(`Failed to fetch players: ${pErr.message}`);

  return {
    teams: (teams ?? []) as Team[],
    players: (players ?? []) as Player[],
    history,
    lastSold,
  };
}

// ---------------------------------------------------------------------------
// Sell player
// ---------------------------------------------------------------------------
export async function sellPlayer(teamId: string, playerId: string, soldPrice: number) {
  const { data: player } = await supabase().from("players").select("*").eq("id", playerId).single();
  const { data: team } = await supabase().from("teams").select("*").eq("id", teamId).single();

  if (!player || !team) throw new Error("Player or team not found.");
  if (player.status !== "AVAILABLE") throw new Error("Player is not available for purchase.");

  const { count } = await supabase()
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "SOLD");
  if ((count ?? 0) >= 7) throw new Error("Squad limit of 7 players reached for this team.");

  if (team.remaining_budget < soldPrice) throw new Error("Insufficient team budget.");

  const { error: pUpErr } = await supabase()
    .from("players")
    .update({ status: "SOLD", sold_price: soldPrice, team_id: teamId })
    .eq("id", playerId);
  if (pUpErr) throw new Error(pUpErr.message);

  const { error: tUpErr } = await supabase()
    .from("teams")
    .update({ remaining_budget: team.remaining_budget - soldPrice })
    .eq("id", teamId);
  if (tUpErr) throw new Error(tUpErr.message);

  lastSold = { playerName: player.display_name, teamName: team.name, price: soldPrice, timestamp: Date.now() };
  pushHistory("SELL_PLAYER", `${player.display_name} sold to ${team.name} for ₹${soldPrice} Cr`);
}

// ---------------------------------------------------------------------------
// Remove player from team (refund budget)
// ---------------------------------------------------------------------------
export async function removePlayer(playerId: string) {
  const { data: player } = await supabase().from("players").select("*").eq("id", playerId).single();
  if (!player || player.status !== "SOLD") throw new Error("Player is not currently sold to a team.");

  const refund = player.sold_price ?? 0;
  const teamId = player.team_id;

  await supabase()
    .from("players")
    .update({ status: "AVAILABLE", sold_price: null, team_id: null })
    .eq("id", playerId);

  if (teamId) {
    const { data: team } = await supabase().from("teams").select("remaining_budget").eq("id", teamId).single();
    if (team) {
      await supabase()
        .from("teams")
        .update({ remaining_budget: team.remaining_budget + refund })
        .eq("id", teamId);
    }
  }

  pushHistory("REMOVE_PLAYER", `${player.display_name} removed from team, ₹${refund} Cr refunded`);
}

// ---------------------------------------------------------------------------
// Mark player unavailable (refund if sold)
// ---------------------------------------------------------------------------
export async function markUnavailable(playerId: string) {
  const { data: player } = await supabase().from("players").select("*").eq("id", playerId).single();
  if (!player) throw new Error("Player not found.");

  if (player.status === "SOLD" && player.team_id) {
    const refund = player.sold_price ?? 0;
    const { data: team } = await supabase().from("teams").select("remaining_budget").eq("id", player.team_id).single();
    if (team) {
      await supabase()
        .from("teams")
        .update({ remaining_budget: team.remaining_budget + refund })
        .eq("id", player.team_id);
    }
  }

  await supabase()
    .from("players")
    .update({ status: "UNAVAILABLE", sold_price: null, team_id: null })
    .eq("id", playerId);

  pushHistory("MARK_UNAVAILABLE", `${player.display_name} marked as unavailable`);
}

// ---------------------------------------------------------------------------
// Reset auction (all players available, budgets restored)
// ---------------------------------------------------------------------------
export async function resetAuction() {
  await supabase()
    .from("players")
    .update({ status: "AVAILABLE", sold_price: null, team_id: null })
    .not("id", "is", null);

  const { data: teams } = await supabase().from("teams").select("id, initial_budget");
  if (teams) {
    for (const t of teams) {
      await supabase().from("teams").update({ remaining_budget: t.initial_budget }).eq("id", t.id);
    }
  }

  history = [];
  lastSold = null;
  pushHistory("RESET_AUCTION", "Auction reset: all players available, budgets restored");
}

// ---------------------------------------------------------------------------
// Factory reset (wipe players, reseed canonical dataset, reset teams)
// ---------------------------------------------------------------------------
export async function factoryReset() {
  // Wipe all player rows
  await supabase().from("players").delete().not("id", "is", null);

  // Reset team budgets
  const { data: teams } = await supabase().from("teams").select("id, initial_budget");
  if (teams) {
    for (const t of teams) {
      await supabase().from("teams").update({ remaining_budget: t.initial_budget }).eq("id", t.id);
    }
  }

  // Re-seed canonical players
  const { error } = await supabase().from("players").insert(
    seedPlayers.map((p) => ({
      enum_name: p.enum_name,
      display_name: p.display_name,
      position: p.position,
      ovr: p.ovr,
      base_price: p.base_price,
      status: "AVAILABLE" as const,
    }))
  );
  if (error) throw new Error(`Failed to reseed players: ${error.message}`);

  history = [];
  lastSold = null;
  pushHistory("FACTORY_RESET", "Factory reset: canonical player dataset restored");
}

// ---------------------------------------------------------------------------
// Add player dynamically
// ---------------------------------------------------------------------------
export async function addPlayer(enum_name: string, display_name: string, position: string, ovr: number, base_price: number) {
  const { data: existing } = await supabase().from("players").select("id").eq("enum_name", enum_name).maybeSingle();
  if (existing) throw new Error("A player with this enum_name already exists.");

  const { error } = await supabase().from("players").insert({
    enum_name,
    display_name,
    position,
    ovr,
    base_price,
    status: "AVAILABLE",
  });
  if (error) throw new Error(error.message);

  pushHistory("ADD_PLAYER", `${display_name} added to the auction pool`);
}

// ---------------------------------------------------------------------------
// Delete player permanently
// ---------------------------------------------------------------------------
export async function deletePlayer(playerId: string) {
  const { data: player } = await supabase().from("players").select("*").eq("id", playerId).single();
  if (!player) throw new Error("Player not found.");
  if (player.status === "SOLD") throw new Error("Cannot delete a player that is currently SOLD. Remove them from the team first.");

  const { error } = await supabase().from("players").delete().eq("id", playerId);
  if (error) throw new Error(error.message);

  pushHistory("DELETE_PLAYER", `${player.display_name} deleted from the auction pool`);
}

// ---------------------------------------------------------------------------
// Update team budget manually
// ---------------------------------------------------------------------------
export async function updateBudget(teamId: string, newBudget: number) {
  const { data: team } = await supabase().from("teams").select("*").eq("id", teamId).single();
  if (!team) throw new Error("Team not found.");

  const { error } = await supabase().from("teams").update({ remaining_budget: newBudget }).eq("id", teamId);
  if (error) throw new Error(error.message);

  pushHistory("UPDATE_BUDGET", `${team.name} remaining budget adjusted to ₹${newBudget} Cr`);
}

// ---------------------------------------------------------------------------
// Update team initial budget manually
// ---------------------------------------------------------------------------
export async function updateInitialBudget(teamId: string, newInitialBudget: number) {
  const { data: team } = await supabase().from("teams").select("*").eq("id", teamId).single();
  if (!team) throw new Error("Team not found.");

  const delta = newInitialBudget - team.initial_budget;
  const newRemaining = team.remaining_budget + delta;

  const { error } = await supabase().from("teams").update({ 
    initial_budget: newInitialBudget, 
    remaining_budget: newRemaining 
  }).eq("id", teamId);
  if (error) throw new Error(error.message);

  pushHistory("UPDATE_INITIAL_BUDGET", `${team.name} initial budget set to ₹${newInitialBudget} Cr`);
}

// ---------------------------------------------------------------------------
// Mark player available
// ---------------------------------------------------------------------------
export async function markAvailable(playerId: string) {
  const { data: player } = await supabase().from("players").select("*").eq("id", playerId).single();
  if (!player) throw new Error("Player not found.");
  if (player.status !== "UNAVAILABLE") throw new Error("Only UNAVAILABLE players can be marked AVAILABLE.");

  await supabase()
    .from("players")
    .update({ status: "AVAILABLE", sold_price: null, team_id: null })
    .eq("id", playerId);

  pushHistory("MARK_AVAILABLE", `${player.display_name} recovered to available pool`);
}
