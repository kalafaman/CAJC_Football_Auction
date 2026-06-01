export type Position = "GK" | "DEF" | "MID" | "ATT";

export type EventCardType =
  | "ADD_CAPITAL"
  | "DEDUCT_CAPITAL"
  | "REMOVE_PLAYER"
  | "SELL_PLAYER_FOR_AMOUNT"
  | "FREE_PLAYER"
  | "CUSTOM";

export interface Team {
  id: string;
  name: string;
  color: string;
  capital: number;
  baseCapital: number;
  quizCapital: number;
  totalOVR: number;
  logoUrl: string | null;
  transferBan: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  ovr: number;
  basePrice: number;
  soldPrice: number | null;
  sold: boolean;
  teamId: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface EventCard {
  id: string;
  name: string;
  type: EventCardType;
  amount: number | null;
  description: string;
  enabled: boolean;
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
  eventCards: EventCard[];
  history: HistoryEntry[];
  lastSold: { playerName: string; teamName: string; price: number } | null;
}

export type MutationAction =
  | { type: "UNDO" }
  | { type: "SELL_PLAYER"; teamId: string; playerId: string; soldPrice: number }
  | { type: "BULK_IMPORT_TEAMS"; teams: Omit<Team, "id" | "capital" | "totalOVR" | "logoUrl" | "transferBan">[] }
  | { type: "UPDATE_TEAM"; teamId: string; patch: Partial<Team> }
  | { type: "IMPORT_PLAYERS"; players: Omit<Player, "soldPrice" | "sold" | "teamId">[] }
  | { type: "APPLY_CARD"; teamId: string; cardId: string; playerId?: string }
  | { type: "DELETE_CARD"; cardId: string }
  | { type: "UPSERT_CARD"; card: EventCard }
  | { type: "RESTORE"; state: AuctionState };
