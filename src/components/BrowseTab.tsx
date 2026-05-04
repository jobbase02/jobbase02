"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import JobCard from "./JobCard";
import FilterDrawer from "./FilterDrawer";
import { Job, FilterState, EMPTY_FILTERS } from "@/lib/types";
import { cn, activeFilterCount, haptic } from "@/lib/utils";

type Mode = "browse" | "search";

export default function BrowseTab() {
  const [mode, setMode]           = useState<Mode>("browse");
  const [query, setQuery]         = useState("");
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [page, setPage]           = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore]     = useState(true);
  const [loading, setLoading]     = useState(false);
  const [filters, setFilters]     = useState<FilterState>(EMPTY_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalPages = totalCount ? Math.ceil(totalCount / 20) : null;

  // ── Browse (filter-based) ─────────────────────────────────────────────────
  const fetchBrowse = useCallback(async (p: number, f: FilterState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (f.role_category)       params.set("role",       f.role_category);
      if (f.location)            params.set("location",   f.location);
      if (f.experience_required) params.set("experience", f.experience_required);
      if (f.batch_year)          params.set("batch",      f.batch_year);

      const res  = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setHasMore(data.hasMore ?? false);
      if (data.totalCount !== undefined) setTotalCount(data.totalCount);
    } catch (err) {
      console.error("[BrowseTab]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Keyword search ────────────────────────────────────────────────────────
  const fetchSearch = async (p: number) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), page: String(p) });
      if (filters.role_category)       params.set("role",       filters.role_category);
      if (filters.location)            params.set("location",   filters.location);
      if (filters.experience_required) params.set("experience", filters.experience_required);
      if (filters.batch_year)          params.set("batch",      filters.batch_year);

      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotalCount(data.total ?? 0);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error("[BrowseTab search]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrowse(1, EMPTY_FILTERS); }, [fetchBrowse]);

  const handleSearch = () => {
    if (!query.trim()) return;
    haptic("light");
    setMode("search");
    setPage(1);
    setTotalCount(null);
    fetchSearch(1);
  };

  const clearSearch = () => {
    setQuery("");
    setMode("browse");
    setPage(1);
    setTotalCount(null);
    fetchBrowse(1, filters);
  };

  const goToPage = (p: number) => {
    haptic("light");
    setPage(p);
    if (mode === "search") fetchSearch(p);
    else fetchBrowse(p, filters);
  };

  const applyFilters = (f: FilterState) => {
    setFilters(f);
    setPage(1);
    setTotalCount(null);
    if (mode === "search") fetchSearch(1);
    else fetchBrowse(1, f);
  };

  const filterCount = activeFilterCount(filters as unknown as Record<string, string>);
  const activePills = Object.entries(filters).filter(([, v]) => v);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="px-4 pt-4 pb-3 sticky top-0 z-10 bg-[var(--tg-bg)]/90 backdrop-blur-xl border-b border-[var(--border)]">

        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-extrabold text-xl text-[var(--tg-text)] tracking-tight">
              {mode === "search" ? `Results for "${query}"` : "Browse Jobs"}
            </h1>
            {totalCount !== null && (
              <p className="text-[12px] text-[var(--tg-hint)] font-medium mt-0.5">
                {totalCount.toLocaleString()} {mode === "search" ? "results" : "listings"}
                {totalPages && ` · Page ${page} of ${totalPages}`}
              </p>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
              filterCount > 0
                ? "bg-[var(--tg-button)] text-[var(--tg-button-text)]"
                : "bg-[var(--tg-secondary-bg)] text-[var(--tg-text)] border border-[var(--border)]"
            )}
          >
            <SlidersHorizontal size={15} />
            Filter
            {filterCount > 0 && (
              <span className="bg-white/25 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[var(--tg-secondary-bg)] border border-[var(--border)] rounded-xl px-3 py-2.5">
            <Search size={15} className="text-[var(--tg-hint)] shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search by title, skill, company…"
              className="flex-1 bg-transparent text-sm text-[var(--tg-text)] placeholder:text-[var(--tg-hint)] outline-none"
            />
            {query && (
              <button onClick={clearSearch}>
                <X size={14} className="text-[var(--tg-hint)]" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="px-4 rounded-xl bg-[var(--tg-button)] text-[var(--tg-button-text)] text-sm font-semibold shrink-0 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading && mode === "search" ? "…" : "Search"}
          </button>
        </div>

        {/* Active filter pills */}
        {activePills.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mt-2.5">
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
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        {loading && (
          <div className="space-y-3 mb-3">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-36 rounded-2xl bg-[var(--tg-secondary-bg)] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && jobs.map((job, i) => (
          <JobCard key={`${job.id}-${i}`} job={job} className="animate-fade-in" />
        ))}

        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={36} className="text-[var(--tg-hint)] mb-3 opacity-50" />
            <p className="font-semibold text-[var(--tg-text)]">
              {mode === "search" ? "No results found" : "No jobs found"}
            </p>
            <p className="text-sm text-[var(--tg-hint)] mt-1">
              {mode === "search" ? "Try different keywords" : "Try clearing your filters"}
            </p>
            {mode === "search" && (
              <button onClick={clearSearch} className="mt-4 px-5 py-2.5 rounded-xl bg-[var(--tg-button)] text-[var(--tg-button-text)] text-sm font-semibold">
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <div className="flex items-center justify-center gap-3 py-6">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[var(--tg-secondary-bg)] border border-[var(--border)] text-sm font-medium text-[var(--tg-text)] disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-[var(--tg-hint)] font-medium min-w-[60px] text-center">
              {totalPages ? `${page} / ${totalPages}` : `Page ${page}`}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[var(--tg-secondary-bg)] border border-[var(--border)] text-sm font-medium text-[var(--tg-text)] disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="h-4" />
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
