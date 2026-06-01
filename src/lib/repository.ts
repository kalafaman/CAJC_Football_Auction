import fs from "fs";
import path from "path";
import type { AuctionState } from "./types";
import { defaultCards, defaultPlayers, defaultTeams } from "./seed-data";
import { recomputeTeams } from "./auction-engine";

const MOCK_FILE_PATH = path.join("/tmp", "transfer-market-state.json");

// In-memory cache for fast read/write, and fallback when container filesystem resets.
let serverInMemoryState: AuctionState | null = null;

function getInitialState(): AuctionState {
  // Convert Omit<Team, "capital" | "totalOVR">[] and Omit<Player, "soldPrice" | "sold" | "teamId">[] to full formats
  const teams = defaultTeams.map((t) => ({
    ...t,
    capital: t.baseCapital + t.quizCapital,
    totalOVR: 0,
  }));

  const players = defaultPlayers.map((p) => ({
    ...p,
    sold: false,
    soldPrice: null,
    teamId: null,
  }));

  const eventCards = [...defaultCards];

  return {
    teams: recomputeTeams(teams, players),
    players,
    eventCards,
    history: [],
    lastSold: null,
  };
}

export async function readState(): Promise<AuctionState> {
  if (serverInMemoryState) {
    return serverInMemoryState;
  }

  try {
    if (fs.existsSync(MOCK_FILE_PATH)) {
      const content = fs.readFileSync(MOCK_FILE_PATH, "utf-8");
      serverInMemoryState = JSON.parse(content) as AuctionState;
      return serverInMemoryState;
    }
  } catch (err) {
    console.error("Error reading state from /tmp/state.json, falling back to initial", err);
  }

  // Seed initial state
  serverInMemoryState = getInitialState();
  return serverInMemoryState;
}

export async function writeState(state: AuctionState): Promise<AuctionState> {
  serverInMemoryState = state;

  try {
    // Ensure dir exists (though /tmp always exists, safe practice)
    const dir = path.dirname(MOCK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing state to /tmp/state.json", err);
  }

  return serverInMemoryState;
}
