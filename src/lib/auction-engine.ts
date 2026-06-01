import type { AuctionState, MutationAction, Player, Team, Position, EventCard } from "./types";
import { formatCr } from "./utils";

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

export function playersForTeam(players: Player[], teamId: string): Player[] {
  return players.filter((p) => p.teamId === teamId);
}

export function squadCounts(players: Player[]): { GK: number; DEF: number; MID: number; ATT: number } {
  return players.reduce(
    (acc, p) => {
      if (p.position in acc) {
        acc[p.position]++;
      }
      return acc;
    },
    { GK: 0, DEF: 0, MID: 0, ATT: 0 }
  );
}

export function getRankedTeams(state: AuctionState): Team[] {
  return [...state.teams].sort((a, b) => {
    if (b.totalOVR !== a.totalOVR) {
      return b.totalOVR - a.totalOVR;
    }
    return b.capital - a.capital;
  });
}

export function getAnalytics(state: AuctionState): {
  mostExpensivePlayer: Player | null;
  highestSpendingTeam: Team | null;
  bestValuePurchase: Player | null;
  mostActiveTeam: Team | null;
} {
  const soldPlayers = state.players.filter((p) => p.sold && p.soldPrice !== null);

  let mostExpensivePlayer: Player | null = null;
  if (soldPlayers.length > 0) {
    mostExpensivePlayer = [...soldPlayers].sort((a, b) => b.soldPrice! - a.soldPrice!)[0];
  }

  let highestSpendingTeam: Team | null = null;
  let maxSpend = -1;
  state.teams.forEach((team) => {
    const teamPlayers = soldPlayers.filter((p) => p.teamId === team.id);
    const spend = teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    if (spend > maxSpend) {
      maxSpend = spend;
      highestSpendingTeam = team;
    }
  });

  let bestValuePurchase: Player | null = null;
  if (soldPlayers.length > 0) {
    bestValuePurchase = [...soldPlayers].sort((a, b) => {
      const valA = a.ovr / (a.soldPrice || 1);
      const valB = b.ovr / (b.soldPrice || 1);
      return valB - valA;
    })[0];
  }

  let mostActiveTeam: Team | null = null;
  let maxActiveCount = -1;
  state.teams.forEach((team) => {
    const count = soldPlayers.filter((p) => p.teamId === team.id).length;
    if (count > maxActiveCount) {
      maxActiveCount = count;
      mostActiveTeam = team;
    }
  });

  return {
    mostExpensivePlayer,
    highestSpendingTeam,
    bestValuePurchase,
    mostActiveTeam,
  };
}

export function recomputeTeams(teams: Team[], players: Player[]): Team[] {
  return teams.map((team) => {
    const teamPlayers = players.filter((p) => p.teamId === team.id && p.sold);
    const spent = teamPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const totalOVR = teamPlayers.reduce((sum, p) => sum + p.ovr, 0);
    return {
      ...team,
      capital: team.baseCapital + team.quizCapital - spent,
      totalOVR,
    };
  });
}

export function reduceAuctionState(state: AuctionState, action: MutationAction): AuctionState {
  if (action.type === "UNDO") {
    const lastHistory = state.history[0];
    if (!lastHistory || !lastHistory.payload?.prevState) {
      return state;
    }
    return {
      ...lastHistory.payload.prevState,
      history: state.history.slice(1),
    };
  }

  // Create state snapshot for history
  const prevStateSnapshot = {
    teams: JSON.parse(JSON.stringify(state.teams)),
    players: JSON.parse(JSON.stringify(state.players)),
    eventCards: JSON.parse(JSON.stringify(state.eventCards)),
    lastSold: state.lastSold ? { ...state.lastSold } : null,
  };

  const createHistoryEntry = (actionType: string, label: string, extraPayload: any = {}) => {
    return {
      id: createId("hist"),
      actionType,
      timestamp: new Date().toISOString(),
      payload: {
        label,
        prevState: prevStateSnapshot,
        ...extraPayload,
      },
    };
  };

  let nextState = { ...state };

  switch (action.type) {
    case "SELL_PLAYER": {
      const { teamId, playerId, soldPrice } = action;
      const team = state.teams.find((t) => t.id === teamId);
      const player = state.players.find((p) => p.id === playerId);

      if (!team || !player) return state;

      const teamPlayers = state.players.filter((p) => p.teamId === teamId && p.sold);
      if (teamPlayers.length >= 9) {
        throw new Error("Squad limit of 9 players reached for this team.");
      }

      const nextPlayers = state.players.map((p) =>
        p.id === playerId ? { ...p, sold: true, soldPrice, teamId } : p
      );
      const nextTeams = recomputeTeams(state.teams, nextPlayers);

      const updatedTeam = nextTeams.find((t) => t.id === teamId);
      if (updatedTeam && updatedTeam.capital < 0) {
        throw new Error("Insufficient capital to purchase player.");
      }

      const hist = createHistoryEntry(
        "SELL_PLAYER",
        `${player.name} sold to ${team.name} for ${formatCr(soldPrice)}`,
        { teamId, playerId, soldPrice }
      );

      nextState = {
        ...state,
        players: nextPlayers,
        teams: nextTeams,
        lastSold: { playerName: player.name, teamName: team.name, price: soldPrice },
        history: [hist, ...state.history],
      };
      break;
    }

    case "BULK_IMPORT_TEAMS": {
      const newTeams = action.teams.map((t) => ({
        id: createId("team"),
        name: t.name,
        color: t.color,
        baseCapital: t.baseCapital,
        quizCapital: t.quizCapital,
        capital: t.baseCapital + t.quizCapital,
        totalOVR: 0,
        logoUrl: null,
        transferBan: false,
      }));

      const hist = createHistoryEntry("BULK_IMPORT_TEAMS", `Bulk imported ${newTeams.length} teams.`);
      nextState = {
        ...state,
        teams: newTeams,
        players: state.players.map((p) => ({ ...p, sold: false, soldPrice: null, teamId: null })),
        lastSold: null,
        history: [hist, ...state.history],
      };
      break;
    }

    case "UPDATE_TEAM": {
      const { teamId, patch } = action;
      const nextTeams = state.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t));
      const nextTeamsRecomputed = recomputeTeams(nextTeams, state.players);

      const team = state.teams.find((t) => t.id === teamId);
      const hist = createHistoryEntry(
        "UPDATE_TEAM",
        `Updated settings for team: ${team?.name || "Unknown"}`,
        { teamId, patch }
      );

      nextState = {
        ...state,
        teams: nextTeamsRecomputed,
        history: [hist, ...state.history],
      };
      break;
    }

    case "IMPORT_PLAYERS": {
      const newPlayers = action.players.map((p) => ({
        id: createId("player"),
        name: p.name,
        position: p.position,
        ovr: p.ovr,
        basePrice: p.basePrice,
        sold: false,
        soldPrice: null,
        teamId: null,
      }));

      const hist = createHistoryEntry("IMPORT_PLAYERS", `Imported ${newPlayers.length} players to the pool.`);
      nextState = {
        ...state,
        players: newPlayers,
        teams: state.teams.map((t) => ({ ...t, capital: t.baseCapital + t.quizCapital, totalOVR: 0 })),
        lastSold: null,
        history: [hist, ...state.history],
      };
      break;
    }

    case "APPLY_CARD": {
      const { teamId, cardId, playerId } = action;
      const team = state.teams.find((t) => t.id === teamId);
      const card = state.eventCards.find((c) => c.id === cardId);

      if (!team || !card) return state;

      let nextPlayers = [...state.players];
      let nextTeams = [...state.teams];
      let logMsg = `Applied card "${card.name}" to team ${team.name}`;

      if (card.type === "ADD_CAPITAL") {
        nextTeams = state.teams.map((t) =>
          t.id === teamId ? { ...t, quizCapital: t.quizCapital + (card.amount || 0) } : t
        );
        logMsg = `Added ${formatCr(card.amount)} Cr to ${team.name} via ${card.name}`;
      } else if (card.type === "DEDUCT_CAPITAL") {
        nextTeams = state.teams.map((t) =>
          t.id === teamId ? { ...t, quizCapital: t.quizCapital - (card.amount || 0) } : t
        );
        logMsg = `Deducted ${formatCr(card.amount)} Cr from ${team.name} via ${card.name}`;
      } else if (card.type === "REMOVE_PLAYER" && playerId) {
        const player = state.players.find((p) => p.id === playerId);
        if (player) {
          nextPlayers = state.players.map((p) =>
            p.id === playerId ? { ...p, sold: false, soldPrice: null, teamId: null } : p
          );
          logMsg = `Removed player ${player.name} from ${team.name} squad`;
        }
      } else if (card.type === "SELL_PLAYER_FOR_AMOUNT" && playerId) {
        const player = state.players.find((p) => p.id === playerId);
        if (player) {
          nextPlayers = state.players.map((p) =>
            p.id === playerId ? { ...p, sold: true, soldPrice: card.amount, teamId } : p
          );
          logMsg = `Forced sale: ${player.name} to ${team.name} for ${formatCr(card.amount)}`;
        }
      } else if (card.type === "FREE_PLAYER" && playerId) {
        const player = state.players.find((p) => p.id === playerId);
        if (player) {
          nextPlayers = state.players.map((p) =>
            p.id === playerId ? { ...p, sold: true, soldPrice: 0, teamId } : p
          );
          logMsg = `Free signing: ${player.name} signed by ${team.name} for free`;
        }
      }

      const recomputedTeamsList = recomputeTeams(nextTeams, nextPlayers);
      const hist = createHistoryEntry("APPLY_CARD", logMsg, { teamId, cardId, playerId });

      nextState = {
        ...state,
        players: nextPlayers,
        teams: recomputedTeamsList,
        history: [hist, ...state.history],
      };
      break;
    }

    case "DELETE_CARD": {
      const { cardId } = action;
      const card = state.eventCards.find((c) => c.id === cardId);
      const nextCards = state.eventCards.filter((c) => c.id !== cardId);

      const hist = createHistoryEntry("DELETE_CARD", `Deleted event card: ${card?.name || "Unknown"}`);
      nextState = {
        ...state,
        eventCards: nextCards,
        history: [hist, ...state.history],
      };
      break;
    }

    case "UPSERT_CARD": {
      const { card } = action;
      const exists = state.eventCards.some((c) => c.id === card.id);
      const nextCards = exists
        ? state.eventCards.map((c) => (c.id === card.id ? card : c))
        : [...state.eventCards, card];

      const hist = createHistoryEntry("UPSERT_CARD", `Saved event card: ${card.name}`);
      nextState = {
        ...state,
        eventCards: nextCards,
        history: [hist, ...state.history],
      };
      break;
    }

    case "RESTORE": {
      const hist = createHistoryEntry("RESTORE", "Restored database state from backup.");
      nextState = {
        ...action.state,
        history: [hist, ...action.state.history],
      };
      break;
    }
  }

  return nextState;
}
