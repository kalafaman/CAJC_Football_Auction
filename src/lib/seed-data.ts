import type { Team, Player, EventCard } from "./types";

export const defaultTeams: Omit<Team, "capital" | "totalOVR">[] = [
  { id: "team_1", name: "Red Devils", color: "#EF4444", baseCapital: 100, quizCapital: 0, logoUrl: null, transferBan: false },
  { id: "team_2", name: "Blue Lions", color: "#3B82F6", baseCapital: 100, quizCapital: 0, logoUrl: null, transferBan: false },
  { id: "team_3", name: "Merseyside Reds", color: "#DC2626", baseCapital: 100, quizCapital: 0, logoUrl: null, transferBan: false },
  { id: "team_4", name: "Galacticos", color: "#FBBF24", baseCapital: 100, quizCapital: 0, logoUrl: null, transferBan: false },
  { id: "team_5", name: "Bavarians", color: "#10B981", baseCapital: 100, quizCapital: 0, logoUrl: null, transferBan: false },
  { id: "team_6", name: "Parisian Stars", color: "#6366F1", baseCapital: 100, quizCapital: 0, logoUrl: null, transferBan: false },
  { id: "team_7", name: "Rossoneri", color: "#EC4899", baseCapital: 100, quizCapital: 0, logoUrl: null, transferBan: false },
];

export const defaultPlayers: Omit<Player, "soldPrice" | "sold" | "teamId">[] = [
  { id: "player_1", name: "Lionel Messi", position: "ATT", ovr: 93, basePrice: 15 },
  { id: "player_2", name: "Cristiano Ronaldo", position: "ATT", ovr: 90, basePrice: 12 },
  { id: "player_3", name: "Kylian Mbappé", position: "ATT", ovr: 92, basePrice: 18 },
  { id: "player_4", name: "Erling Haaland", position: "ATT", ovr: 91, basePrice: 17 },
  { id: "player_5", name: "Kevin De Bruyne", position: "MID", ovr: 91, basePrice: 14 },
  { id: "player_6", name: "Jude Bellingham", position: "MID", ovr: 89, basePrice: 13 },
  { id: "player_7", name: "Rodri", position: "MID", ovr: 90, basePrice: 12 },
  { id: "player_8", name: "Virgil van Dijk", position: "DEF", ovr: 89, basePrice: 10 },
  { id: "player_9", name: "Rúben Dias", position: "DEF", ovr: 89, basePrice: 10 },
  { id: "player_10", name: "Alphonso Davies", position: "DEF", ovr: 85, basePrice: 7 },
  { id: "player_11", name: "Manuel Neuer", position: "GK", ovr: 87, basePrice: 6 },
  { id: "player_12", name: "Alisson Becker", position: "GK", ovr: 89, basePrice: 8 },
  { id: "player_13", name: "Mohamed Salah", position: "ATT", ovr: 89, basePrice: 11 },
  { id: "player_14", name: "Bukayo Saka", position: "MID", ovr: 87, basePrice: 9 },
  { id: "player_15", name: "Martin Ødegaard", position: "MID", ovr: 88, basePrice: 10 },
  { id: "player_16", name: "Trent Alexander-Arnold", position: "DEF", ovr: 86, basePrice: 8 },
  { id: "player_17", name: "Achraf Hakimi", position: "DEF", ovr: 84, basePrice: 7 },
  { id: "player_18", name: "Thibaut Courtois", position: "GK", ovr: 90, basePrice: 9 },
];

export const defaultCards: EventCard[] = [
  { id: "card_1", name: "Sponsor Bonus", type: "ADD_CAPITAL", amount: 15, description: "Add ₹15 Cr capital to team", enabled: true },
  { id: "card_2", name: "Tax Fine", type: "DEDUCT_CAPITAL", amount: 10, description: "Deduct ₹10 Cr capital from team", enabled: true },
  { id: "card_3", name: "Contract Void", type: "REMOVE_PLAYER", amount: null, description: "Remove a player from team squad", enabled: true },
  { id: "card_4", name: "Sponsor Sellout", type: "SELL_PLAYER_FOR_AMOUNT", amount: 25, description: "Force sell player for ₹25 Cr", enabled: true },
  { id: "card_5", name: "Free Agent Signing", type: "FREE_PLAYER", amount: null, description: "Sign a player for free (₹0 Cr)", enabled: true },
];
