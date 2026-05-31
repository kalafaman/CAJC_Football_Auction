"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Download, Expand, RotateCcw, Search, TimerReset, Upload, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { createId, getAnalytics, getRankedTeams, playersForTeam, squadCounts } from "@/lib/auction-engine";
import type { AuctionState, EventCard, EventCardType, MutationAction, Player, Position, Team } from "@/lib/types";
import { cn, downloadText, formatCr } from "@/lib/utils";

const positions: Position[] = ["GK", "DEF", "MID", "ATT"];
const tabs = ["Auction", "Event Cards", "Team Setup", "Player Pool", "Results"];

type Mode = "public" | "admin" | "results";

export function TransferMarketApp({ mode }: { mode: Mode }) {
  const [state, setState] = useState<AuctionState | null>(null);
  const [activeTab, setActiveTab] = useState(mode === "results" ? "Results" : "Auction");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [contrast, setContrast] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const refresh = async () => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      const payload = await response.json();
      setState(payload);
      localStorage.setItem("transfer-market-offline-state", JSON.stringify(payload));
    } catch {
      const cached = localStorage.getItem("transfer-market-offline-state");
      if (cached) setState(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
    const interval = window.setInterval(refresh, 3000);
    const channel = "BroadcastChannel" in window ? new BroadcastChannel("transfer-market") : null;
    channel?.addEventListener("message", refresh);
    return () => {
      window.clearInterval(interval);
      channel?.close();
    };
  }, []);

  const mutate = async (action: MutationAction) => {
    const response = await fetch("/api/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Action failed.");
    setState(payload);
    if ("BroadcastChannel" in window) new BroadcastChannel("transfer-market").postMessage("updated");
  };

  if (loading || !state) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md animate-pulseGlow">
          <CardHeader>
            <CardTitle>TRANSFER MARKET</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/60">Loading auction control room...</CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className={cn("min-h-screen p-4 text-white sm:p-6", contrast && "bg-black")}>
      <Header mode={mode} contrast={contrast} setContrast={setContrast} />
      {toast ? <div className="fixed right-4 top-4 z-50 rounded-md border border-primary/30 bg-black px-4 py-3 text-sm font-semibold text-primary shadow-glow">{toast}</div> : null}
      {state.lastSold && <SoldOverlay sold={state.lastSold} />}
      {mode === "public" ? (
        <PublicLeaderboard state={state} />
      ) : (
        <AdminShell activeTab={activeTab} setActiveTab={setActiveTab} state={state} mutate={mutate} showToast={showToast} mode={mode} />
      )}
    </main>
  );
}

function Header({ mode, contrast, setContrast }: { mode: Mode; contrast: boolean; setContrast: (value: boolean) => void }) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-[0.14em] sm:text-5xl">TRANSFER MARKET</h1>
          <Badge className="animate-pulseGlow border-red-500/40 bg-red-500/15 text-red-300">LIVE</Badge>
        </div>
        <p className="mt-2 text-sm text-white/55">Football Franchise Auction System • 7 teams • 9-player squads • OVR decides the champion</p>
      </div>
      <div className="no-print flex flex-wrap gap-2">
        <a href="/" className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">Leaderboard</a>
        <a href="/admin" className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">Admin</a>
        <a href="/results" className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">Results</a>
        <Button variant="secondary" onClick={() => setContrast(!contrast)}>{contrast ? "Stadium Mode" : "Projector Contrast"}</Button>
        <Button variant="secondary" onClick={() => document.documentElement.requestFullscreen?.()}><Expand className="h-4 w-4" /> Fullscreen</Button>
      </div>
      {mode === "admin" ? <AdminLogin /> : null}
    </header>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("admin@transfermarket.local");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Production admin actions require NextAuth credentials.");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await signIn("credentials", { email, password, redirect: false });
    setMessage(result?.error ? "Login failed. Check ADMIN_EMAIL and ADMIN_PASSWORD." : "Admin session active.");
  };

  return (
    <form onSubmit={submit} className="no-print grid gap-2 rounded-lg border border-border bg-black/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
      <Input value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Admin email" />
      <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" type="password" aria-label="Admin password" />
      <Button type="submit">Sign in</Button>
      <p className="text-xs text-white/45 sm:col-span-3">{message}</p>
    </form>
  );
}

function PublicLeaderboard({ state }: { state: AuctionState }) {
  const ranked = getRankedTeams(state);
  return (
    <section className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
      <div className="grid gap-4 lg:grid-cols-2">
        {ranked.map((team, index) => (
          <TeamCard key={team.id} team={team} players={playersForTeam(state.players, team.id)} rank={index + 1} />
        ))}
      </div>
      <aside className="space-y-4">
        <LiveFeed state={state} />
        <AuctionTicker state={state} />
      </aside>
    </section>
  );
}

function TeamCard({ team, players, rank }: { team: Team; players: Player[]; rank: number }) {
  const counts = squadCounts(players);
  return (
    <Card className="overflow-hidden transition hover:-translate-y-0.5" style={{ borderColor: team.color }}>
      <div className="h-1.5" style={{ background: team.color }} />
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <Badge style={{ borderColor: team.color, color: team.color }}>#{rank}</Badge>
          <CardTitle className="mt-2 text-2xl">{team.name}</CardTitle>
          <p className="text-xs text-white/45">Squad {players.length}/9 • GK {counts.GK}/1 • DEF {counts.DEF}/2 • MID {counts.MID}/1 • ATT {counts.ATT}/1</p>
        </div>
        {team.logoUrl ? <img src={team.logoUrl} alt={`${team.name} logo`} className="h-14 w-14 rounded-md object-cover" /> : <div className="h-14 w-14 rounded-md border border-border" style={{ background: team.color }} />}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Capital" value={formatCr(team.capital)} />
          <Metric label="Total OVR" value={team.totalOVR.toString()} />
          <Metric label="Players" value={players.length.toString()} />
        </div>
        <div className="mt-4 grid gap-2">
          {players.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-sm text-white/45">No players purchased yet.</p> : null}
          {players.map((player) => (
            <div key={player.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md bg-white/[0.04] px-3 py-2">
              <Badge>{player.position}</Badge>
              <span className="truncate text-sm font-semibold">{player.name}</span>
              <span className="font-mono text-xs text-white/55">{player.ovr} OVR • {formatCr(player.soldPrice)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-black/35 p-3">
      <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 font-mono text-xl font-black text-primary">{value}</p>
    </div>
  );
}

function SoldOverlay({ sold }: { sold: { playerName: string; teamName: string; price: number } }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 top-24 z-40 mx-auto max-w-xl animate-sold rounded-lg border border-primary/60 bg-black/90 p-6 text-center shadow-glow">
      <p className="text-5xl font-black text-primary">SOLD</p>
      <p className="mt-2 text-lg font-semibold">{sold.playerName} → {sold.teamName}</p>
      <p className="font-mono text-white/60">{formatCr(sold.price)}</p>
    </div>
  );
}

function AdminShell({
  activeTab,
  setActiveTab,
  state,
  mutate,
  showToast,
  mode,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  state: AuctionState;
  mutate: (action: MutationAction) => Promise<void>;
  showToast: (message: string) => void;
  mode: Mode;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        mutate({ type: "UNDO" }).then(() => showToast("Last action rolled back."));
      }
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("[data-search]")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mutate, showToast]);

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="no-print flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
          <Button variant="secondary" onClick={() => mutate({ type: "UNDO" }).then(() => showToast("Last action rolled back."))}>
            <RotateCcw className="h-4 w-4" /> Global Undo
          </Button>
        </div>
        {activeTab === "Auction" && <AuctionTab state={state} mutate={mutate} showToast={showToast} />}
        {activeTab === "Event Cards" && <EventCardsTab state={state} mutate={mutate} showToast={showToast} />}
        {activeTab === "Team Setup" && <TeamSetupTab state={state} mutate={mutate} showToast={showToast} />}
        {activeTab === "Player Pool" && <PlayerPoolTab state={state} mutate={mutate} showToast={showToast} />}
        {activeTab === "Results" && <ResultsTab state={state} mutate={mutate} showToast={showToast} />}
      </div>
      <aside className="space-y-4">
        <AuctionTimer />
        <LiveFeed state={state} />
        <AnalyticsPanel state={state} />
      </aside>
    </section>
  );
}

function AuctionTab({ state, mutate, showToast }: { state: AuctionState; mutate: (action: MutationAction) => Promise<void>; showToast: (message: string) => void }) {
  const [teamId, setTeamId] = useState(state.teams[0]?.id ?? "");
  const [playerId, setPlayerId] = useState(state.players.find((player) => !player.sold)?.id ?? "");
  const [bid, setBid] = useState(0);
  const player = state.players.find((item) => item.id === playerId);
  const team = state.teams.find((item) => item.id === teamId);
  const available = state.players.filter((item) => !item.sold);
  const remaining = (team?.capital ?? 0) - bid;

  useEffect(() => {
    if (player && bid === 0) setBid(player.basePrice);
  }, [player, bid]);

  const confirm = async () => {
    if (!teamId || !playerId) return;
    if (!window.confirm(`Confirm sale: ${player?.name} to ${team?.name} for ${formatCr(bid)}?`)) return;
    await mutate({ type: "SELL_PLAYER", teamId, playerId, soldPrice: Number(bid) });
    showToast("Sale confirmed and leaderboard updated.");
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.target as HTMLElement).tagName !== "TEXTAREA") confirm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auction Desk</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs uppercase text-white/45">Team</span>
          <Select value={teamId} onChange={(event) => setTeamId(event.target.value)}>
            {state.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase text-white/45">Player</span>
          <Select value={playerId} onChange={(event) => { setPlayerId(event.target.value); setBid(state.players.find((p) => p.id === event.target.value)?.basePrice ?? 0); }}>
            {available.map((item) => <option key={item.id} value={item.id}>{item.name} • {item.position} • {item.ovr}</option>)}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase text-white/45">Winning Bid</span>
          <Input type="number" value={bid} min={0} onChange={(event) => setBid(Number(event.target.value))} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Current" value={formatCr(team?.capital)} />
          <Metric label="After" value={formatCr(remaining)} />
        </div>
        <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
          <Button onClick={confirm}>Confirm Sale</Button>
          <span className="text-sm text-white/50">Enter confirms sale • Ctrl+Z rolls back • / focuses search</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSetupTab({ state, mutate, showToast }: { state: AuctionState; mutate: (action: MutationAction) => Promise<void>; showToast: (message: string) => void }) {
  const [bulk, setBulk] = useState("Team Name,Color,Base Capital,Quiz Capital\n");

  const bulkImport = async () => {
    const rows = parseDelimited(bulk);
    const teams = rows.map((row) => ({
      name: pick(row, ["team name", "name", "team"]) || "Unnamed Team",
      color: pick(row, ["color", "colour"]) || "#00FF88",
      baseCapital: Number(pick(row, ["base capital", "capital"]) || 100),
      quizCapital: Number(pick(row, ["quiz capital", "quizcapital", "quiz"]) || 0),
    }));
    await mutate({ type: "BULK_IMPORT_TEAMS", teams });
    showToast(`Imported ${teams.length} teams from spreadsheet format.`);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle>Team Setup</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {state.teams.map((team) => (
            <div key={team.id} className="grid gap-3 rounded-md border border-border bg-black/25 p-3 lg:grid-cols-[1.1fr_.7fr_.6fr_.6fr_1fr_auto]">
              <Input value={team.name} onChange={(event) => mutate({ type: "UPDATE_TEAM", teamId: team.id, patch: { name: event.target.value } })} />
              <Input value={team.color} type="color" onChange={(event) => mutate({ type: "UPDATE_TEAM", teamId: team.id, patch: { color: event.target.value } })} />
              <Input value={team.baseCapital} type="number" onChange={(event) => mutate({ type: "UPDATE_TEAM", teamId: team.id, patch: { baseCapital: Number(event.target.value) } })} />
              <Input value={team.quizCapital} type="number" onChange={(event) => mutate({ type: "UPDATE_TEAM", teamId: team.id, patch: { quizCapital: Number(event.target.value) } })} />
              <Input value={team.logoUrl ?? ""} placeholder="Logo URL" onChange={(event) => mutate({ type: "UPDATE_TEAM", teamId: team.id, patch: { logoUrl: event.target.value } })} />
              <div className="flex gap-1">
                {[10, 25, 50].map((value) => (
                  <Button key={value} size="sm" variant="secondary" onClick={() => mutate({ type: "UPDATE_TEAM", teamId: team.id, patch: { quizCapital: team.quizCapital + value } })}>+{value}</Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Bulk Team Import</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-white/50">Paste CSV from the event spreadsheet. Accepted columns: Team Name, Color, Base Capital, Quiz Capital.</p>
          <Textarea value={bulk} onChange={(event) => setBulk(event.target.value)} />
          <Button onClick={bulkImport}><Upload className="h-4 w-4" /> Import Teams</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerPoolTab({ state, mutate, showToast }: { state: AuctionState; mutate: (action: MutationAction) => Promise<void>; showToast: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const filtered = state.players.filter((player) => (position === "ALL" || player.position === position) && player.name.toLowerCase().includes(query.toLowerCase()));

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const players = await parsePlayerFile(file);
    await mutate({ type: "IMPORT_PLAYERS", players });
    showToast(`Imported ${players.length} valid players.`);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Player Pool</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="no-print grid gap-3 lg:grid-cols-[1fr_160px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/35" />
            <Input data-search className="pl-9" placeholder="Search player..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={position} onChange={(event) => setPosition(event.target.value as Position | "ALL")}>
            <option value="ALL">All</option>
            {positions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white/5 px-3 text-sm font-semibold hover:bg-white/10">
            <Upload className="h-4 w-4" /> CSV/XLSX Upload
            <input type="file" accept=".csv,.xlsx,.xls" onChange={upload} className="hidden" />
          </label>
        </div>
        <DataTable rows={filtered.map((player) => [player.name, player.position, `${player.ovr}`, formatCr(player.basePrice), player.sold ? "Sold" : "Available"])} headers={["Name", "Position", "OVR", "Base Price", "Status"]} />
      </CardContent>
    </Card>
  );
}

function EventCardsTab({ state, mutate, showToast }: { state: AuctionState; mutate: (action: MutationAction) => Promise<void>; showToast: (message: string) => void }) {
  const [teamId, setTeamId] = useState(state.teams[0]?.id ?? "");
  const [playerId, setPlayerId] = useState("");
  const [draft, setDraft] = useState<EventCard>({ id: createId("card"), name: "", type: "ADD_CAPITAL", amount: 10, description: "", enabled: true });
  const teamPlayers = playersForTeam(state.players, teamId);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader><CardTitle>Event Card Engine</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <Select value={teamId} onChange={(event) => setTeamId(event.target.value)}>
            {state.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </Select>
          <Select value={playerId} onChange={(event) => setPlayerId(event.target.value)}>
            <option value="">Optional player target</option>
            {teamPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
          </Select>
          <div className="grid gap-3 md:grid-cols-2">
            {state.eventCards.map((card) => (
              <div key={card.id} className="rounded-md border border-border bg-black/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{card.name}</p>
                    <p className="text-sm text-white/50">{card.description}</p>
                  </div>
                  <Badge>{card.type}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => mutate({ type: "APPLY_CARD", teamId, cardId: card.id, playerId: playerId || undefined }).then(() => showToast("Event card applied."))}>Apply</Button>
                  <Button size="sm" variant="secondary" onClick={() => setDraft(card)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => mutate({ type: "DELETE_CARD", cardId: card.id })}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Card Library</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <Input placeholder="Card name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <Select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as EventCardType })}>
            {["ADD_CAPITAL", "DEDUCT_CAPITAL", "REMOVE_PLAYER", "SELL_PLAYER_FOR_AMOUNT", "FREE_PLAYER", "CUSTOM"].map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Input type="number" value={draft.amount ?? 0} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} />
          <Textarea placeholder="Effect description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <Button onClick={() => mutate({ type: "UPSERT_CARD", card: draft }).then(() => { showToast("Card saved."); setDraft({ id: createId("card"), name: "", type: "ADD_CAPITAL", amount: 10, description: "", enabled: true }); })}>Save Card</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsTab({ state, mutate, showToast }: { state: AuctionState; mutate: (action: MutationAction) => Promise<void>; showToast: (message: string) => void }) {
  const restoreRef = useRef<HTMLInputElement>(null);
  const ranked = getRankedTeams(state);
  const exportCsv = () => {
    const lines = ["Rank,Team,Total OVR,Capital Left,Squad"];
    ranked.forEach((team, index) => lines.push(`${index + 1},"${team.name}",${team.totalOVR},${team.capital},"${playersForTeam(state.players, team.id).map((p) => `${p.name} (${p.position}/${p.ovr})`).join("; ")}"`));
    downloadText("transfer-market-results.csv", lines.join("\n"), "text/csv");
  };
  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = ranked.map((team, index) => ({ Rank: index + 1, Team: team.name, "Total OVR": team.totalOVR, "Capital Left": team.capital, Squad: playersForTeam(state.players, team.id).map((p) => p.name).join(", ") }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Results");
    XLSX.writeFile(book, "transfer-market-results.xlsx");
  };
  const restore = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const restored = JSON.parse(await file.text()) as AuctionState;
    await mutate({ type: "RESTORE", state: restored });
    showToast("Database restored from backup.");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Final Rankings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="no-print flex flex-wrap gap-2">
          <Button onClick={() => window.print()}><Download className="h-4 w-4" /> PDF</Button>
          <Button variant="secondary" onClick={exportExcel}>Excel</Button>
          <Button variant="secondary" onClick={exportCsv}>CSV</Button>
          <Button variant="secondary" onClick={() => downloadText("transfer-market-backup.json", JSON.stringify(state, null, 2), "application/json")}>Backup JSON</Button>
          <Button variant="secondary" onClick={() => restoreRef.current?.click()}>Restore JSON</Button>
          <input ref={restoreRef} type="file" accept=".json" className="hidden" onChange={restore} />
        </div>
        <DataTable
          headers={["Rank", "Team", "Total OVR", "Capital Left", "Squad"]}
          rows={ranked.map((team, index) => [`#${index + 1}`, team.name, String(team.totalOVR), formatCr(team.capital), playersForTeam(state.players, team.id).map((p) => `${p.name} (${p.position})`).join(", ") || "Incomplete"])}
        />
      </CardContent>
    </Card>
  );
}

function AuctionTimer() {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [running]);
  return (
    <Card className="no-print">
      <CardHeader><CardTitle>Auction Timer</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="font-mono text-5xl font-black text-primary">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</Button>
          <Button size="sm" variant="secondary" onClick={() => { setSeconds(60); setRunning(false); }}><TimerReset className="h-4 w-4" /> Reset</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveFeed({ state }: { state: AuctionState }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> Bidding History Feed</CardTitle></CardHeader>
      <CardContent className="max-h-[360px] space-y-2 overflow-auto">
        {[...state.history].slice(0, 12).map((entry) => (
          <div key={entry.id} className="rounded-md border border-border bg-white/[0.035] p-3">
            <p className="text-sm font-semibold">{entry.payload.label}</p>
            <p className="font-mono text-xs text-white/40">{new Date(entry.timestamp).toLocaleTimeString()}</p>
          </div>
        ))}
        {state.history.length === 0 ? <p className="text-sm text-white/45">No actions yet. The feed will auto-save every auction event.</p> : null}
      </CardContent>
    </Card>
  );
}

function AuctionTicker({ state }: { state: AuctionState }) {
  const items = state.players.filter((player) => player.sold).map((player) => `${player.name} sold for ${formatCr(player.soldPrice)}`);
  return <div className="overflow-hidden rounded-lg border border-border bg-black/60 p-3 text-sm text-primary"><div className="animate-ticker whitespace-nowrap">{items.concat(items).join(" • ") || "Auction ticker waiting for first sale..."}</div></div>;
}

function AnalyticsPanel({ state }: { state: AuctionState }) {
  const analytics = useMemo(() => getAnalytics(state), [state]);
  return (
    <Card>
      <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Most expensive: <b>{analytics.mostExpensivePlayer?.name ?? "N/A"}</b></p>
        <p>Highest spending: <b>{analytics.highestSpendingTeam?.name ?? "N/A"}</b></p>
        <p>Best value: <b>{analytics.bestValuePurchase?.name ?? "N/A"}</b></p>
        <p>Most active: <b>{analytics.mostActiveTeam?.name ?? "N/A"}</b></p>
      </CardContent>
    </Card>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-auto rounded-md border border-border">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-white/10 text-xs uppercase tracking-wider text-white/55">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border odd:bg-white/[0.025]">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseDelimited(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(/,|\t/).map((header) => header.trim().toLowerCase());
  return lines.filter(Boolean).map((line) => {
    const values = line.split(/,|\t/).map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function pick(row: Record<string, string>, names: string[]) {
  return names.map((name) => row[name]).find(Boolean);
}

async function parsePlayerFile(file: File) {
  const rows = file.name.endsWith(".csv")
    ? parseDelimited(await file.text())
    : await parseXlsx(file);
  return rows.map((row, index) => {
    const name = pick(row, ["player name", "name", "player"]) || `Player ${index + 1}`;
    const rawPosition = (pick(row, ["position", "pos"]) || "MID").toUpperCase();
    const position = positions.includes(rawPosition as Position) ? (rawPosition as Position) : "MID";
    return {
      id: createId("player"),
      name,
      position,
      ovr: Number(pick(row, ["ovr", "overall", "rating"]) || 70),
      basePrice: Number(pick(row, ["base price", "price", "base"]) || 1),
    };
  });
}

async function parseXlsx(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const book = XLSX.read(buffer);
  const sheet = book.Sheets[book.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return json.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? "").trim()])),
  );
}
