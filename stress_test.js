// Using native fetch

async function run() {
  console.log("Fetching state...");
  const stateRes = await fetch("http://localhost:3000/api/state");
  const state = await stateRes.json();
  
  const team = state.teams[0];
  const player = state.players.find(p => p.status === "AVAILABLE");
  
  if (!team || !player) {
    console.error("No team or available player found!");
    return;
  }
  
  console.log(`Initial budget: ${team.remaining_budget}, Player: ${player.display_name}`);
  
  console.log("\n[TEST] Firing 3 simultaneous SELL_PLAYER requests (Race Condition / Double Click Test)");
  
  const payload = {
    type: "SELL_PLAYER",
    teamId: team.id,
    playerId: player.id,
    soldPrice: player.base_price
  };

  const requests = [
    fetch("http://localhost:3000/api/mutate", { method: "POST", body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'} }),
    fetch("http://localhost:3000/api/mutate", { method: "POST", body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'} }),
    fetch("http://localhost:3000/api/mutate", { method: "POST", body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'} })
  ];

  const results = await Promise.all(requests);
  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    const data = await res.json();
    if (res.ok) {
      console.log(`Request ${i+1}: SUCCESS`);
    } else {
      console.log(`Request ${i+1}: FAILED -> ${data.error}`);
    }
  }

  const endStateRes = await fetch("http://localhost:3000/api/state");
  const endState = await endStateRes.json();
  const endTeam = endState.teams.find(t => t.id === team.id);
  const endPlayer = endState.players.find(p => p.id === player.id);
  
  console.log(`\n[RESULT] Final budget: ${endTeam.remaining_budget}`);
  console.log(`[RESULT] Budget delta: ${team.remaining_budget - endTeam.remaining_budget} (Expected: ${player.base_price})`);
  console.log(`[RESULT] Player status: ${endPlayer.status}`);
}

run().catch(console.error);
