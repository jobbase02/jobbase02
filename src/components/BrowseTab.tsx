"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SlidersHorizontal, RefreshCw } from "lucide-react";
import JobCard from "./JobCard";
import FilterDrawer from "./FilterDrawer";
import { Job, FilterState, EMPTY_FILTERS } from "@/lib/types";
import { cn, activeFilterCount } from "@/lib/utils";

export default function BrowseTab() {
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [loading, setLoading]     = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [filters, setFilters]     = useState<FilterState>(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Fetch jobs ────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (currentPage: number, currentFilters: FilterState, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage) });
      if (currentFilters.role_category)       params.set("role",       currentFilters.role_category);
      if (currentFilters.location)            params.set("location",   currentFilters.location);
      if (currentFilters.experience_required) params.set("experience", currentFilters.experience_required);
      if (currentFilters.batch_year)          params.set("batch",      currentFilters.batch_year);

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();

      setJobs(prev => reset ? data.jobs : [...prev, ...data.jobs]);
      setHasMore(data.hasMore);
      if (data.totalCount !== undefined) {
        setTotalCount(data.totalCount);
      }
    } catch (err) {
      console.error("[BrowseTab] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    fetchJobs(1, EMPTY_FILTERS, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When page increments (infinite scroll), load next page
  useEffect(() => {
    if (page > 1) fetchJobs(page, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ── Infinite scroll sentinel ──────────────────────────────────────────────
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => p + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  // ── Apply filters ─────────────────────────────────────────────────────────
  const applyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    setJobs([]);
    fetchJobs(1, newFilters, true);
  };

  const filterCount = activeFilterCount(filters as unknown as Record<string, string>);

  // ── Active filter pills ───────────────────────────────────────────────────
  const activePills = Object.entries(filters).filter(([, v]) => v);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10 bg-[var(--tg-bg)]/80 backdrop-blur-xl border-b border-[var(--border)] shadow-sm">
        <div>
          <h1 className="font-extrabold text-[var(--tg-text)] text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--tg-text)] to-[var(--tg-hint)]">Browse Jobs</h1>
          {totalCount !== null ? (
            <p className="text-[13px] font-medium text-[var(--tg-hint)] mt-0.5">{totalCount.toLocaleString()} total listings</p>
          ) : jobs.length > 0 ? (
            <p className="text-[13px] font-medium text-[var(--tg-hint)] mt-0.5">{jobs.length}+ listings</p>
          ) : null}
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all",
            filterCount > 0
              ? "bg-[var(--tg-button)] text-[var(--tg-button-text)]"
              : "bg-[var(--tg-secondary-bg)] text-[var(--tg-text)]"
          )}
        >
          <SlidersHorizontal size={15} />
          Filter
          {filterCount > 0 && (
            <span className="bg-white/25 text-[var(--tg-button-text)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-[var(--tg-bg)]">
          {activePills.map(([key, value]) => (
            <button
              key={key}
              onClick={() => applyFilters({ ...filters, [key]: "" })}
              className="flex items-center gap-1 shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-[var(--tg-button)]/10 text-[var(--tg-button)] border border-[var(--tg-button)]/20"
            >
              {value} ✕
            </button>
          ))}
        </div>
      )}

      {/* Job list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        {jobs.map((job, i) => (
          <JobCard
            key={`${job.id}-${i}`}
            job={job}
            className="animate-fade-in"
          />
        ))}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 mb-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-32 rounded-2xl bg-[var(--tg-secondary-bg)] animate-pulse" />
            ))}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-4" />

        {/* End of results */}
        {!hasMore && jobs.length > 0 && (
          <p className="text-center text-sm text-[var(--tg-hint)] py-6">
            All caught up ✓
          </p>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw size={36} className="text-[var(--tg-hint)] mb-3" />
            <p className="font-medium text-[var(--tg-text)]">No jobs found</p>
            <p className="text-sm text-[var(--tg-hint)] mt-1">Try clearing your filters</p>
            <button
              onClick={() => applyFilters(EMPTY_FILTERS)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--tg-button)] text-[var(--tg-button-text)] text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Bottom padding so last card isn't behind the tab bar */}
        <div className="h-6" />
      </div>

      <FilterDrawer
        open={drawerOpen}
        initial={filters}
        onApply={applyFilters}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
