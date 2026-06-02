export type Position = "GK" | "DEF" | "MID" | "ATT";
export type PlayerStatus = "AVAILABLE" | "SOLD" | "UNAVAILABLE";

export interface Team {
  id: string;
  name: string;
  initial_budget: number;
  remaining_budget: number;
}

export interface Player {
  id: string;
  enum_name: string;
  display_name: string;
  position: Position;
  ovr: number;
  base_price: number;
  status: PlayerStatus;
  sold_price: number | null;
  team_id: string | null;
}

export interface HistoryEntry {
  id: string;
  actionType: string;
  timestamp: string | Date;
  payload: any;
}

export interface AuctionState {
  teams: Team[];
  players: Player[];
  history: HistoryEntry[];
  lastSold: { playerName: string; teamName: string; price: number; timestamp: number } | null;
}

export type BaseMutation = { password?: string };

export type MutationAction = BaseMutation & (
  | { type: "SELL_PLAYER"; teamId: string; playerId: string; soldPrice: number }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "MARK_UNAVAILABLE"; playerId: string }
  | { type: "MARK_AVAILABLE"; playerId: string }
  | { type: "RESET_AUCTION" }
  | { type: "FACTORY_RESET" }
  | { type: "ADD_PLAYER"; display_name: string; enum_name: string; position: Position; ovr: number; base_price: number }
  | { type: "DELETE_PLAYER"; playerId: string }
  | { type: "UPDATE_BUDGET"; teamId: string; newBudget: number }
  | { type: "UPDATE_INITIAL_BUDGET"; teamId: string; newInitialBudget: number }
);
