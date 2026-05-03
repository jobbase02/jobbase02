"use client";

import { X } from "lucide-react";
import { FilterState, FILTER_OPTIONS, EMPTY_FILTERS } from "@/lib/types";
import { cn, haptic } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FilterDrawerProps {
  open: boolean;
  initial: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}

const LABELS: Record<keyof FilterState, string> = {
  role_category:       "Role Category",
  location:            "Location",
  experience_required: "Experience",
  batch_year:          "Batch Year",
};

export default function FilterDrawer({ open, initial, onApply, onClose }: FilterDrawerProps) {
  const [local, setLocal] = useState<FilterState>(initial);

  // Sync when drawer opens
  useEffect(() => { if (open) setLocal(initial); }, [open, initial]);

  const toggle = (key: keyof FilterState, value: string) => {
    haptic("light");
    setLocal(prev => ({ ...prev, [key]: prev[key] === value ? "" : value }));
  };

  const handleApply = () => {
    haptic("success");
    onApply(local);
    onClose();
  };

  const handleClear = () => {
    haptic("light");
    setLocal(EMPTY_FILTERS);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl",
          "bg-[var(--tg-bg)] border-t border-[var(--border)]",
          "max-h-[80vh] flex flex-col animate-slide-up",
          "pb-safe"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--tg-hint)]/30" />
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="font-semibold text-[var(--tg-text)] text-base">Filters</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--tg-secondary-bg)] transition-colors">
            <X size={18} className="text-[var(--tg-hint)]" />
          </button>
        </div>

        {/* Filter sections */}
        <div className="overflow-y-auto flex-1 px-5 pb-2">
          {(Object.keys(FILTER_OPTIONS) as (keyof FilterState)[]).map(key => (
            <div key={key} className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-hint)] mb-2.5">
                {LABELS[key]}
              </p>
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS[key].map(option => {
                  const active = local[key] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => toggle(key, option)}
                      className={cn(
                        "text-sm px-3.5 py-1.5 rounded-full border transition-all",
                        active
                          ? "bg-[var(--tg-button)] text-[var(--tg-button-text)] border-transparent"
                          : "bg-[var(--tg-secondary-bg)] text-[var(--tg-text)] border-[var(--border)]"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-[var(--border)]">
          <button
            onClick={handleClear}
            className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--tg-text)] text-sm font-medium"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-xl bg-[var(--tg-button)] text-[var(--tg-button-text)] text-sm font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
