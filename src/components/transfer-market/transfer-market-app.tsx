"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, Search, TimerReset, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import type { AuctionState, MutationAction, Player, Position, Team } from "@/lib/types";
import { cn, formatCr } from "@/lib/utils";

const positions: Position[] = ["GK", "DEF", "MID", "ATT"];
const tabs = ["Auction", "Teams", "Player Pool"];

// Hardcoded team colors (teams are fixed, no color column in DB)
const TEAM_COLORS: Record<string, string> = {
  "Varcelona": "#1E3A8A",
  "Hala Barca": "#DC2626",
  "Thenga FC": "#10B981",
  "Team Morph": "#8B5CF6",
  "Padayapas": "#F59E0B",
  "Madridistas": "#D1D5DB",
  "Real United FC": "#EF4444",
};

function teamColor(name: string): string {
  return TEAM_COLORS[name] || "#00FF88";
}

function playersForTeam(players: Player[], teamId: string): Player[] {
  return players.filter((p) => p.team_id === teamId && p.status === "SOLD");
}

function teamOVR(players: Player[], teamId: string): number {
  return playersForTeam(players, teamId).reduce((sum, p) => sum + p.ovr, 0);
}

type Mode = "public" | "admin";

export function TransferMarketApp({ mode }: { mode: Mode }) {
  const [state, setState] = useState<AuctionState | null>(null);
  const [activeTab, setActiveTab] = useState("Auction");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [contrast, setContrast] = useState(false);
  const soldKeyRef = useRef("");
  const [soldPopup, setSoldPopup] = useState<{ playerName: string; teamName: string; price: number } | null>(null);

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

  useEffect(() => {
    if (!state?.lastSold) return;
    const key = `${state.lastSold.playerName}|${state.lastSold.teamName}|${state.lastSold.price}|${state.lastSold.timestamp}`;
    if (key === soldKeyRef.current) return;
    soldKeyRef.current = key;

    // Prevent showing old sales when switching tabs or remounting
    if (Date.now() - state.lastSold.timestamp > 5000) return;

    setSoldPopup(state.lastSold);
    const timer = setTimeout(() => setSoldPopup(null), 4000);
    return () => clearTimeout(timer);
  }, [state?.lastSold?.playerName, state?.lastSold?.teamName, state?.lastSold?.price, state?.lastSold?.timestamp]);

  const mutate = async (action: MutationAction) => {
    setIsMutating(true);
    try {
      const response = await fetch("/api/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Action failed.");
      setState(payload);
      if ("BroadcastChannel" in window) new BroadcastChannel("transfer-market").postMessage("updated");
    } finally {
      setIsMutating(false);
    }
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
      {soldPopup && <SoldOverlay sold={soldPopup} />}
      {mode === "public" ? (
        <PublicLeaderboard state={state} />
      ) : (
        <AdminShell activeTab={activeTab} setActiveTab={setActiveTab} state={state} mutate={mutate} showToast={showToast} isMutating={isMutating} />
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
        <p className="mt-2 text-sm text-white/55">Football Franchise Auction System • 7 teams • 7-player squads • OVR decides the champion</p>
      </div>
      <div className="no-print flex flex-wrap gap-2">
        <a href="/" className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">Squads</a>
        <a href="/admin" className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">Admin</a>
        <Button variant="secondary" onClick={() => setContrast(!contrast)}>{contrast ? "Stadium Mode" : "Projector Contrast"}</Button>
        <Button variant="secondary" onClick={() => document.documentElement.requestFullscreen?.()}><Expand className="h-4 w-4" /> Fullscreen</Button>
      </div>
    </header>
  );
}

function PublicLeaderboard({ state }: { state: AuctionState }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
      <div className="grid gap-4 lg:grid-cols-2">
        {state.teams.map((team) => (
          <TeamCard key={team.id} team={team} players={playersForTeam(state.players, team.id)} totalOVR={teamOVR(state.players, team.id)} />
        ))}
      </div>
      <aside className="space-y-4">
        <LiveFeed state={state} />
        <AuctionTicker state={state} />
      </aside>
    </section>
  );
}

function TeamCard({ team, players, totalOVR }: { team: Team; players: Player[]; totalOVR: number }) {
  const color = teamColor(team.name);
  return (
    <Card className="overflow-hidden transition hover:-translate-y-0.5" style={{ borderColor: color }}>
      <div className="h-1.5" style={{ background: color }} />
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="mt-2 text-2xl">{team.name}</CardTitle>
          <p className="text-xs text-white/45">Squad {players.length}/7</p>
        </div>
        <div className="h-14 w-14 rounded-md border border-border" style={{ background: color }} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Budget" value={formatCr(team.remaining_budget)} />
          <Metric label="Total OVR" value={totalOVR.toString()} />
          <Metric label="Players" value={players.length.toString()} />
        </div>
        <div className="mt-4 grid gap-2">
          {players.length === 0 ? <p className="rounded-md border border-dashed border-border p-3 text-sm text-white/45">No players purchased yet.</p> : null}
          {players.map((player) => (
            <div key={player.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-white/[0.04] px-3 py-2">
              <Badge>{player.position}</Badge>
              <span className="truncate text-sm font-semibold">{player.display_name}</span>
              <span className="font-mono text-xs text-white/55">{player.ovr} OVR • {formatCr(player.sold_price ?? 0)}</span>
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

function PasswordModal({ isOpen, onClose, onConfirm, isMutating, requireConfirmation }: { isOpen: boolean; onClose: () => void; onConfirm: (pwd: string) => Promise<void>; isMutating: boolean; requireConfirmation?: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setConfirmation("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireConfirmation && confirmation !== requireConfirmation) {
      alert(`Please type ${requireConfirmation} to confirm.`);
      return;
    }
    await onConfirm(password);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-sm border-primary/40 bg-black shadow-glow">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-red-500">Protected Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requireConfirmation && (
              <label className="block space-y-2">
                <span className="text-xs uppercase text-white/45 text-red-400">Type {requireConfirmation} to confirm</span>
                <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} disabled={isMutating} />
              </label>
            )}
            <label className="block space-y-2">
              <span className="text-xs uppercase text-white/45">Admin Password</span>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus disabled={isMutating} />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isMutating}>Cancel</Button>
              <Button type="submit" disabled={isMutating}>{isMutating ? "Processing..." : "Confirm"}</Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

function AdminShell({
  activeTab,
  setActiveTab,
  state,
  mutate,
  showToast,
  isMutating
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  state: AuctionState;
  mutate: (action: MutationAction) => Promise<void>;
  showToast: (message: string) => void;
  isMutating: boolean;
}) {
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; action: MutationAction | null; requireConfirmation?: string; successMsg?: string }>({ isOpen: false, action: null });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("[data-search]")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleProtectedAction = (action: MutationAction, successMsg: string, requireConfirmation?: string) => {
    setPasswordModal({ isOpen: true, action, requireConfirmation, successMsg });
  };

  const executeProtectedAction = async (password: string) => {
    if (!passwordModal.action) return;
    try {
      await mutate({ ...passwordModal.action, password } as MutationAction);
      showToast(passwordModal.successMsg || "Action completed.");
      setPasswordModal({ isOpen: false, action: null });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed.");
      // Auto-clear logic inside the modal takes over; leave modal open on failure.
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <PasswordModal 
        isOpen={passwordModal.isOpen} 
        onClose={() => setPasswordModal({ isOpen: false, action: null })} 
        onConfirm={executeProtectedAction} 
        isMutating={isMutating} 
        requireConfirmation={passwordModal.requireConfirmation} 
      />
      
      <div className="space-y-4 min-w-0">
        <div className="no-print flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        </div>
        {activeTab === "Auction" && <AuctionTab state={state} mutate={mutate} showToast={showToast} isMutating={isMutating} />}
        {activeTab === "Teams" && <TeamsTab state={state} onProtectedAction={handleProtectedAction} isMutating={isMutating} />}
        {activeTab === "Player Pool" && <PlayerPoolTab state={state} mutate={mutate} onProtectedAction={handleProtectedAction} showToast={showToast} isMutating={isMutating} />}
      </div>
      <aside className="space-y-4 min-w-0">
        <AuctionTimer />
        <LiveFeed state={state} />
      </aside>
    </section>
  );
}

function AuctionTab({ state, mutate, showToast, isMutating }: { state: AuctionState; mutate: (action: MutationAction) => Promise<void>; showToast: (message: string) => void; isMutating: boolean }) {
  const [teamId, setTeamId] = useState(state.teams[0]?.id ?? "");
  const [playerId, setPlayerId] = useState(state.players.find((p) => p.status === "AVAILABLE")?.id ?? "");
  const [bid, setBid] = useState<number | string>(0);
  const [playerSearch, setPlayerSearch] = useState("");

  const available = state.players.filter((item) => item.status === "AVAILABLE");
  const filteredAvailable = available.filter(p => p.display_name.toLowerCase().includes(playerSearch.toLowerCase()) || p.enum_name.toLowerCase().includes(playerSearch.toLowerCase()));

  useEffect(() => {
    if (filteredAvailable.length > 0 && !filteredAvailable.find(p => p.id === playerId)) {
      setPlayerId(filteredAvailable[0].id);
      setBid(filteredAvailable[0].base_price);
    }
  }, [playerSearch, filteredAvailable, playerId]);

  const player = state.players.find((item) => item.id === playerId);
  const team = state.teams.find((item) => item.id === teamId);
  const remaining = (team?.remaining_budget ?? 0) - Number(bid || 0);

  useEffect(() => {
    if (player && bid === 0) setBid(player.base_price);
  }, [player, bid]);

  const confirm = async () => {
    if (!teamId || !playerId || isMutating) return;
    const finalBid = Number(bid);
    if (isNaN(finalBid) || finalBid < (player?.base_price ?? 0)) {
      showToast("Invalid bid amount.");
      return;
    }
    if (!window.confirm(`Confirm sale: ${player?.display_name} to ${team?.name} for ${formatCr(finalBid)}?`)) return;
    try {
      await mutate({ type: "SELL_PLAYER", teamId, playerId, soldPrice: finalBid });
      showToast("Sale confirmed and leaderboard updated.");
      setPlayerSearch("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Sale failed.");
    }
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.target as HTMLElement).tagName !== "TEXTAREA" && (event.target as HTMLElement).tagName !== "INPUT") confirm();
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
          <Select value={teamId} onChange={(event) => setTeamId(event.target.value)} disabled={isMutating}>
            {state.teams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </label>
        <label className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase text-white/45">Player</span>
            <input 
              type="text" 
              className="w-24 bg-transparent text-xs outline-none border-b border-border text-white/60 placeholder:text-white/20" 
              placeholder="Filter..." 
              value={playerSearch} 
              onChange={e => setPlayerSearch(e.target.value)} 
              disabled={isMutating} 
            />
          </div>
          <Select value={playerId} onChange={(event) => { setPlayerId(event.target.value); setBid(state.players.find((p) => p.id === event.target.value)?.base_price ?? 0); }} disabled={isMutating}>
            {filteredAvailable.map((item) => <option key={item.id} value={item.id}>{item.display_name} • {item.position} • {item.ovr}</option>)}
            {filteredAvailable.length === 0 && <option value="" disabled>No players found</option>}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase text-white/45">Winning Bid</span>
          <Input type="number" value={bid} min={0} onChange={(event) => setBid(event.target.value)} disabled={isMutating} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Current" value={formatCr(team?.remaining_budget ?? 0)} />
          <Metric label="After" value={formatCr(remaining)} />
        </div>
        <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
          <Button onClick={confirm} disabled={isMutating}>{isMutating ? "Processing..." : "Confirm Sale"}</Button>
          <span className="text-sm text-white/50">Enter confirms sale • / focuses search</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamsTab({ state, onProtectedAction, isMutating }: { state: AuctionState; onProtectedAction: (a: MutationAction, m: string, req?: string) => void; isMutating: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {state.teams.map((team) => {
            const color = teamColor(team.name);
            const roster = playersForTeam(state.players, team.id);
            const ovr = teamOVR(state.players, team.id);
            return (
              <div key={team.id} className="flex flex-col gap-4 rounded-md border border-border bg-black/25 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{team.name}</p>
                    <p className="text-xs text-white/45">Squad {roster.length}/7</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Metric label="Budget" value={formatCr(team.remaining_budget)} />
                  <Metric label="Initial" value={formatCr(team.initial_budget)} />
                  <Metric label="OVR" value={ovr.toString()} />
                  <div className="flex flex-col justify-center gap-1.5">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        const newStr = window.prompt(`Edit remaining budget for ${team.name} (Current: ${formatCr(team.remaining_budget)})\n\nYou can type a direct number (e.g. 150) or add/subtract (e.g. +10 or -15):`, team.remaining_budget.toString());
                        if (newStr !== null && newStr.trim() !== "") {
                          let newBudget = team.remaining_budget;
                          const val = newStr.trim();
                          if (val.startsWith("+")) {
                            newBudget += parseFloat(val.substring(1));
                          } else if (val.startsWith("-")) {
                            newBudget -= parseFloat(val.substring(1));
                          } else {
                            newBudget = parseFloat(val);
                          }
                          if (!isNaN(newBudget)) {
                            onProtectedAction({ type: "UPDATE_BUDGET", teamId: team.id, newBudget }, `Budget updated for ${team.name}`);
                          } else {
                            alert("Invalid number format.");
                          }
                        }
                      }}
                      disabled={isMutating}
                      className="h-full w-full text-[10px] leading-none"
                    >
                      Edit Remaining
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => {
                        const newStr = window.prompt(`Edit initial budget for ${team.name} (Current: ${formatCr(team.initial_budget)})\n\nNOTE: Modifying this will automatically adjust the remaining budget by the exact difference to keep maths consistent.`, team.initial_budget.toString());
                        if (newStr !== null && newStr.trim() !== "") {
                          const newInitial = parseFloat(newStr.trim());
                          if (!isNaN(newInitial)) {
                            onProtectedAction({ type: "UPDATE_INITIAL_BUDGET", teamId: team.id, newInitialBudget: newInitial }, `Initial budget updated for ${team.name}`);
                          } else {
                            alert("Invalid number format.");
                          }
                        }
                      }}
                      disabled={isMutating}
                      className="h-full w-full text-[10px] leading-none"
                    >
                      Edit Initial
                    </Button>
                  </div>
                </div>

                {roster.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-border/50 pt-3">
                    {roster.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-sm">
                        <span className="text-white/80 truncate pr-2 flex items-center gap-2">
                          <span className="text-white/40 text-[10px] uppercase font-bold">{p.position}</span>
                          {p.display_name}
                        </span>
                        <span className="font-mono text-white/60 text-xs shrink-0">{formatCr(p.sold_price ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 border-t border-border pt-4">
          <Button variant="secondary" onClick={() => onProtectedAction({ type: "RESET_AUCTION" }, "Auction reset complete.")} disabled={isMutating}>Reset Auction</Button>
          <Button variant="secondary" onClick={() => onProtectedAction({ type: "FACTORY_RESET" }, "Factory reset complete. Canonical dataset restored.", "RESET")} disabled={isMutating}>Factory Reset</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddPlayerForm({ onProtectedAction, isMutating }: { onProtectedAction: (a: MutationAction, m: string) => void; isMutating: boolean }) {
  const [display, setDisplay] = useState("");
  const [pos, setPos] = useState<Position>("ATT");
  const [ovr, setOvr] = useState(80);
  const [price, setPrice] = useState(10);

  // Auto-generate ENUM_NAME based on display name
  const autoEnum = display.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!display || !autoEnum || isMutating) return;
    onProtectedAction(
      { type: "ADD_PLAYER", display_name: display, enum_name: autoEnum, position: pos, ovr, base_price: price },
      `${display} added to the pool.`
    );
    setDisplay("");
    setOvr(80);
    setPrice(10);
  };

  return (
    <form onSubmit={submit} className="no-print grid gap-3 lg:grid-cols-[1fr_auto_100px_100px_auto] items-end rounded-md border border-border bg-black/25 p-3 mb-4">
      <label className="space-y-1">
        <span className="text-xs uppercase text-white/45">Add New Player</span>
        <Input placeholder="e.g. Kylian Mbappe" value={display} onChange={e => setDisplay(e.target.value)} disabled={isMutating} />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase text-white/45">Position</span>
        <Select value={pos} onChange={e => setPos(e.target.value as Position)} disabled={isMutating}>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase text-white/45">OVR</span>
        <Input type="number" value={ovr} onChange={e => setOvr(Number(e.target.value))} disabled={isMutating} />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase text-white/45">Base Price</span>
        <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} disabled={isMutating} />
      </label>
      <Button type="submit" disabled={isMutating || !display}>Add Player</Button>
    </form>
  )
}

function PlayerPoolTab({ state, mutate, onProtectedAction, showToast, isMutating }: { state: AuctionState; mutate: (action: MutationAction) => Promise<void>; onProtectedAction: (a: MutationAction, m: string) => void; showToast: (message: string) => void; isMutating: boolean }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "SOLD" | "UNAVAILABLE">("ALL");
  
  const filtered = state.players.filter((player) =>
    (position === "ALL" || player.position === position) &&
    (statusFilter === "ALL" || player.status === statusFilter) &&
    player.display_name.toLowerCase().includes(query.toLowerCase())
  );

  const handleAction = async (action: MutationAction, successMsg: string) => {
    try {
      await mutate(action);
      showToast(successMsg);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const handleDelete = (player: Player) => {
    if (window.confirm(`Are you sure you want to permanently delete ${player.display_name}?`)) {
      onProtectedAction({ type: "DELETE_PLAYER", playerId: player.id }, `${player.display_name} deleted.`);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Player Pool</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        
        <AddPlayerForm onProtectedAction={onProtectedAction} isMutating={isMutating} />

        <div className="no-print grid gap-3 lg:grid-cols-[1fr_120px_140px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/35" />
            <Input data-search className="pl-9" placeholder="Search player..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={position} onChange={(event) => setPosition(event.target.value as Position | "ALL")}>
            <option value="ALL">All Pos</option>
            {positions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="SOLD">Sold</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </Select>
        </div>
        <div className="overflow-auto rounded-md border border-border">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="bg-white/10 text-xs uppercase tracking-wider text-white/55">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Pos</th>
                <th className="px-3 py-3">OVR</th>
                <th className="px-3 py-3">Base</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Team</th>
                <th className="px-3 py-3 no-print">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => {
                const team = player.team_id ? state.teams.find((t) => t.id === player.team_id) : null;
                return (
                  <tr key={player.id} className="border-t border-border odd:bg-white/[0.025]">
                    <td className="px-3 py-3 font-semibold">{player.display_name}</td>
                    <td className="px-3 py-3"><Badge>{player.position}</Badge></td>
                    <td className="px-3 py-3">{player.ovr}</td>
                    <td className="px-3 py-3">{formatCr(player.base_price)}</td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold",
                        player.status === "AVAILABLE" && "bg-green-500/20 text-green-300",
                        player.status === "SOLD" && "bg-blue-500/20 text-blue-300",
                        player.status === "UNAVAILABLE" && "bg-red-500/20 text-red-300"
                      )}>{player.status}</span>
                    </td>
                    <td className="px-3 py-3 text-white/55">{team ? `${team.name} (${formatCr(player.sold_price ?? 0)})` : "—"}</td>
                    <td className="px-3 py-3 no-print flex gap-2 flex-wrap">
                      {player.status === "AVAILABLE" && (
                        <Button size="sm" variant="secondary" onClick={() => onProtectedAction({ type: "MARK_UNAVAILABLE", playerId: player.id }, `${player.display_name} marked unavailable.`)} disabled={isMutating}>Unavailable</Button>
                      )}
                      {player.status === "UNAVAILABLE" && (
                        <Button size="sm" variant="secondary" onClick={() => onProtectedAction({ type: "MARK_AVAILABLE", playerId: player.id }, `${player.display_name} recovered to available pool.`)} disabled={isMutating}>Recover</Button>
                      )}
                      {player.status === "SOLD" && (
                        <Button size="sm" variant="secondary" onClick={() => handleAction({ type: "REMOVE_PLAYER", playerId: player.id }, `${player.display_name} removed from team.`)} disabled={isMutating}>Remove</Button>
                      )}
                      {player.status !== "SOLD" && (
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(player)} disabled={isMutating}>Delete</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  const items = state.players.filter((p) => p.status === "SOLD").map((p) => `${p.display_name} sold for ${formatCr(p.sold_price ?? 0)}`);
  return <div className="overflow-hidden rounded-lg border border-border bg-black/60 p-3 text-sm text-primary"><div className="animate-ticker whitespace-nowrap">{items.concat(items).join(" • ") || "Auction ticker waiting for first sale..."}</div></div>;
}
