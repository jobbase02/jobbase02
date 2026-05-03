"use client";

import { LayoutGrid, Sparkles } from "lucide-react";
import { cn, haptic } from "@/lib/utils";

export type Tab = "browse" | "ai";

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; Icon: typeof LayoutGrid }[] = [
  { id: "browse", label: "Browse",    Icon: LayoutGrid },
  { id: "ai",     label: "AI Search", Icon: Sparkles   },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="flex border-t border-[var(--border)] bg-[var(--tg-bg)] pb-safe shrink-0">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => { haptic("light"); onChange(id); }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all",
              isActive ? "text-[var(--tg-button)]" : "text-[var(--tg-hint)]"
            )}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
              className="transition-all"
            />
            <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
              {label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-[var(--tg-button)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
