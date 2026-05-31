"use client";

import { cn } from "@/lib/utils";

export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-black/40 p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-semibold text-white/60 transition",
            value === tab ? "bg-primary text-black" : "hover:bg-white/10 hover:text-white",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
