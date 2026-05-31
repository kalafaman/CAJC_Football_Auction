import { PrismaClient } from "@prisma/client";
import { defaultCards, defaultPlayers, defaultTeams } from "../src/lib/seed-data";
import { recomputeTeams } from "../src/lib/auction-engine";

const prisma = new PrismaClient();

async function main() {
  const teams = recomputeTeams(defaultTeams, defaultPlayers);

  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      create: {
        id: team.id,
        name: team.name,
        color: team.color,
        capital: team.capital,
        baseCapital: team.baseCapital,
        quizCapital: team.quizCapital,
        totalOVR: team.totalOVR,
        logoUrl: team.logoUrl,
        transferBan: team.transferBan,
      },
      update: {
        name: team.name,
        color: team.color,
        capital: team.capital,
        baseCapital: team.baseCapital,
        quizCapital: team.quizCapital,
        totalOVR: team.totalOVR,
      },
    });
  }

  for (const player of defaultPlayers) {
    await prisma.player.upsert({
      where: { name_position: { name: player.name, position: player.position } },
      create: player,
      update: {
        ovr: player.ovr,
        basePrice: player.basePrice,
        sold: player.sold,
        soldPrice: player.soldPrice,
        teamId: player.teamId,
      },
    });
  }

  for (const card of defaultCards) {
    await prisma.eventCard.upsert({
      where: { name: card.name },
      create: card,
      update: card,
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
