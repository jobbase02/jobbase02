"use client";

import { useState } from "react";
import { MapPin, Briefcase, GraduationCap, ExternalLink, ChevronRight } from "lucide-react";
import { Job } from "@/lib/types";
import { cn, openLink, haptic, timeAgo, companyColor, getCompanyLogoUrl, getPlatformBadgeDetails } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  showSimilarity?: boolean;
  className?: string;
}

export default function JobCard({ job, showSimilarity, className }: JobCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleApply = () => {
    haptic("medium");
    openLink(job.apply_link);
  };

  const batches = job.batch_eligible?.filter(Boolean) ?? [];
  const logoUrl = getCompanyLogoUrl(job.company);
  const platformSource = getPlatformBadgeDetails(job.apply_link);

  return (
    <article
      onClick={handleApply}
      className={cn(
        "group relative rounded-2xl p-5 mb-4 border transition-all duration-300 ease-in-out cursor-pointer",
        "bg-[var(--tg-secondary-bg)]/80 backdrop-blur-md border-[var(--border)]",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.98]",
        className
      )}
    >
      {/* Decorative gradient blob on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl bg-gradient-to-br from-[var(--tg-button)] to-transparent pointer-events-none" />

      {/* Header row: company avatar + name + date */}
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
            "text-white text-sm font-bold shadow-sm",
            (!logoUrl || imgError) && companyColor(job.company),
            (logoUrl && !imgError) && "bg-white"
          )}
        >
          {logoUrl && !imgError ? (
            <img 
              src={logoUrl} 
              alt={job.company} 
              className="w-full h-full object-contain p-1.5"
              onError={() => setImgError(true)}
            />
          ) : (
             <Briefcase size={20} className="opacity-90" />
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-[var(--tg-text)] text-[16px] leading-tight line-clamp-2">
              {job.title}
            </h3>
            <span className="text-[11px] font-medium text-[var(--tg-hint)] shrink-0 whitespace-nowrap bg-[var(--tg-bg)] px-2 py-0.5 rounded-full border border-[var(--border)]">
              {timeAgo(job.created_at)}
            </span>
          </div>
          <p className="text-[13px] text-[var(--tg-hint)] mt-1 font-medium truncate flex items-center gap-1.5">
            {job.company}
          </p>
          {showSimilarity && job.similarity !== undefined && (
            <div className="mt-1.5 inline-flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-md border border-green-500/20">
              <span className="text-[11px] font-bold">
                {Math.round(job.similarity * 100)}% Match
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-2 mb-4 relative z-10">
        {job.location && (
          <Chip icon={<MapPin size={12} />} label={job.location} />
        )}
        {job.experience_required && (
          <Chip icon={<Briefcase size={12} />} label={job.experience_required} />
        )}
        {batches.length > 0 && (
          <Chip icon={<GraduationCap size={12} />} label={`Batch ${batches.join(", ")}`} />
        )}
      </div>

      {/* Footer: role category badge + apply action */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)] relative z-10">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {job.role_category && (
            <span className="text-[12px] font-semibold px-3 py-1 rounded-lg bg-[var(--tg-button)]/10 text-[var(--tg-button)] shrink-0">
              {job.role_category}
            </span>
          )}
          {platformSource && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg bg-[var(--tg-bg)] border border-[var(--border)] text-[var(--tg-hint)] shadow-sm shrink-0">
              <img src={platformSource.logo} alt={platformSource.name} className="w-3.5 h-3.5 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <span>{platformSource.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-[var(--tg-button)] font-semibold text-[13px] group-hover:translate-x-1 transition-transform shrink-0 pl-2">
          View Details
          <ChevronRight size={16} />
        </div>
      </div>
    </article>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--tg-hint)] bg-[var(--tg-bg)] px-2.5 py-1 rounded-lg border border-[var(--border)] shadow-sm">
      <span className="opacity-70">{icon}</span>
      {label}
    </span>
  );
}
