"use client";

import { useState } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import JobCard from "./JobCard";
import { Job, FILTER_OPTIONS, FilterState, EMPTY_FILTERS } from "@/lib/types";
import { cn, haptic, activeFilterCount } from "@/lib/utils";

type FilterKey = keyof FilterState;

const LABELS: Record<FilterKey, string> = {
  role_category:       "Role",
  location:            "Location",
  experience_required: "Experience",
  batch_year:          "Batch Year",
};

export default function SearchTab() {
  const [query, setQuery]       = useState("");
  const [filters, setFilters]   = useState<FilterState>(EMPTY_FILTERS);
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const doSearch = async (p = 1) => {
    if (!query.trim() && !activeFilterCount(filters as unknown as Record<string, string>)) return;
    haptic("light");
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams({ page: String(p) });
    if (query.trim())              params.set("q",          query.trim());
    if (filters.role_category)     params.set("role",       filters.role_category);
    if (filters.location)          params.set("location",   filters.location);
    if (filters.experience_required) params.set("experience", filters.experience_required);
    if (filters.batch_year)        params.set("batch",      filters.batch_year);

    try {
      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
      setHasMore(data.hasMore ?? false);
      setPage(p);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (key: FilterKey, val: string) => {
    haptic("light");
    setFilters(prev => ({ ...prev, [key]: prev[key] === val ? "" : val }));
  };

  const clearAll = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setJobs([]);
    setTotal(0);
    setSearched(false);
    setOpenFilter(null);
  };

  const filterCount = activeFilterCount(filters as unknown as Record<string, string>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--tg-bg)] sticky top-0 z-10">
        <h1 className="font-extrabold text-xl text-[var(--tg-text)] tracking-tight mb-3">
          Search Jobs
        </h1>

        {/* Search input */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[var(--tg-secondary-bg)] border border-[var(--border)] rounded-xl px-3 py-2.5">
            <Search size={16} className="text-[var(--tg-hint)] shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch(1)}
              placeholder="e.g. SDE, React, Data Analyst…"
              className="flex-1 bg-transparent text-sm text-[var(--tg-text)] placeholder:text-[var(--tg-hint)] outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={14} className="text-[var(--tg-hint)]" />
              </button>
            )}
          </div>
          <button
            onClick={() => doSearch(1)}
            disabled={loading}
            className="px-4 rounded-xl bg-[var(--tg-button)] text-[var(--tg-button-text)] text-sm font-semibold shrink-0 active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>

        {/* Filter pills row */}
        <div className="flex gap-2 mt-2.5 overflow-x-auto pb-0.5">
          {(Object.keys(FILTER_OPTIONS) as FilterKey[]).map(key => (
            <button
              key={key}
              onClick={() => setOpenFilter(openFilter === key ? null : key)}
              className={cn(
                "shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all",
                filters[key]
                  ? "bg-[var(--tg-button)] text-[var(--tg-button-text)] border-transparent"
                  : "bg-[var(--tg-secondary-bg)] text-[var(--tg-text)] border-[var(--border)]"
              )}
            >
              {filters[key] || LABELS[key]}
              {filters[key] && (
                <span
                  className="ml-1.5 opacity-70"
                  onClick={e => { e.stopPropagation(); toggleFilter(key, filters[key]); }}
                >✕</span>
              )}
            </button>
          ))}
          {filterCount > 0 && (
            <button
              onClick={clearAll}
              className="shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--tg-hint)] bg-[var(--tg-secondary-bg)]"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Expanded filter options */}
        {openFilter && (
          <div className="mt-2 flex flex-wrap gap-1.5 animate-fade-in">
            {FILTER_OPTIONS[openFilter].map(opt => (
              <button
                key={opt}
                onClick={() => { toggleFilter(openFilter, opt); setOpenFilter(null); }}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-all",
                  filters[openFilter] === opt
                    ? "bg-[var(--tg-button)] text-[var(--tg-button-text)] border-transparent"
                    : "bg-[var(--tg-secondary-bg)] text-[var(--tg-text)] border-[var(--border)]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        {/* Stats bar */}
        {searched && !loading && (
          <p className="text-[12px] text-[var(--tg-hint)] font-medium mb-3">
            {total === 0 ? "No results found" : `${total} result${total !== 1 ? "s" : ""} · Page ${page} of ${totalPages}`}
          </p>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-32 rounded-2xl bg-[var(--tg-secondary-bg)] animate-pulse" />
            ))}
          </div>
        )}

        {/* Job cards */}
        {!loading && jobs.map((job, i) => (
          <JobCard key={`${job.id}-${i}`} job={job} className="animate-fade-in" />
        ))}

        {/* Empty state */}
        {!loading && searched && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={36} className="text-[var(--tg-hint)] mb-3" />
            <p className="font-semibold text-[var(--tg-text)]">No jobs found</p>
            <p className="text-sm text-[var(--tg-hint)] mt-1">Try different keywords or remove some filters</p>
          </div>
        )}

        {/* Initial state */}
        {!searched && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={40} className="text-[var(--tg-hint)] mb-3 opacity-40" />
            <p className="font-semibold text-[var(--tg-text)]">Search by keyword</p>
            <p className="text-sm text-[var(--tg-hint)] mt-1 max-w-xs">
              Type a job title, skill, or company name and tap Search
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && searched && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-6">
            <button
              onClick={() => doSearch(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--tg-secondary-bg)] text-sm font-medium text-[var(--tg-text)] border border-[var(--border)] disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-[var(--tg-hint)] font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => doSearch(page + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--tg-secondary-bg)] text-sm font-medium text-[var(--tg-text)] border border-[var(--border)] disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
