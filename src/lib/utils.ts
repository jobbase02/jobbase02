import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openLink(url: string) {
  if (typeof window === "undefined") return;
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openLink(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function haptic(type: "light" | "medium" | "success" | "error" = "light") {
  if (typeof window === "undefined") return;
  const hf = window.Telegram?.WebApp?.HapticFeedback;
  if (!hf) return;
  if (type === "success" || type === "error") {
    hf.notificationOccurred(type);
  } else {
    hf.impactOccurred(type);
  }
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function companyInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// Deterministic pastel color for a company name
const COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500",  "bg-cyan-500",   "bg-amber-500",  "bg-rose-500",
];
export function companyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function activeFilterCount(f: Record<string, string>): number {
  return Object.values(f).filter(Boolean).length;
}

export function getCompanyLogoUrl(name: string): string | null {
  if (!name) return null;
  const normalized = name.toLowerCase();

  // Strict list of popular companies ONLY
  if (normalized.includes("deloitte")) return "https://www.google.com/s2/favicons?domain=deloitte.com&sz=128";
  if (normalized.includes("ey ") || normalized === "ey" || normalized.includes("ernst & young")) return "https://www.google.com/s2/favicons?domain=ey.com&sz=128";
  if (normalized.includes("adobe")) return "https://www.google.com/s2/favicons?domain=adobe.com&sz=128";
  if (normalized.includes("mastercard")) return "https://www.google.com/s2/favicons?domain=mastercard.com&sz=128";
  if (normalized.includes("cisco")) return "https://www.google.com/s2/favicons?domain=cisco.com&sz=128";
  if (normalized.includes("pwc")) return "https://www.google.com/s2/favicons?domain=pwc.com&sz=128";
  if (normalized.includes("amazon")) return "https://www.google.com/s2/favicons?domain=amazon.com&sz=128";
  if (normalized.includes("microsoft")) return "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128";
  if (normalized.includes("infosys")) return "https://www.google.com/s2/favicons?domain=infosys.com&sz=128";
  if (normalized.includes("tcs") || normalized.includes("tata consultancy")) return "https://www.google.com/s2/favicons?domain=tcs.com&sz=128";
  if (normalized.includes("wipro")) return "https://www.google.com/s2/favicons?domain=wipro.com&sz=128";
  if (normalized.includes("accenture")) return "https://www.google.com/s2/favicons?domain=accenture.com&sz=128";
  if (normalized.includes("cognizant")) return "https://www.google.com/s2/favicons?domain=cognizant.com&sz=128";
  if (normalized.includes("capgemini")) return "https://www.google.com/s2/favicons?domain=capgemini.com&sz=128";
  if (normalized.includes("google")) return "https://www.google.com/s2/favicons?domain=google.com&sz=128";
  if (normalized.includes("ibm")) return "https://www.google.com/s2/favicons?domain=ibm.com&sz=128";
  if (normalized.includes("oracle")) return "https://www.google.com/s2/favicons?domain=oracle.com&sz=128";
  if (normalized.includes("jpmorgan") || normalized.includes("jp morgan")) return "https://www.google.com/s2/favicons?domain=jpmorganchase.com&sz=128";
  if (normalized.includes("goldman sachs")) return "https://www.google.com/s2/favicons?domain=goldmansachs.com&sz=128";
  if (normalized.includes("american express") || normalized.includes("amex")) return "https://www.google.com/s2/favicons?domain=americanexpress.com&sz=128";
  if (normalized.includes("netflix")) return "https://www.google.com/s2/favicons?domain=netflix.com&sz=128";
  if (normalized.includes("meta") || normalized.includes("facebook")) return "https://www.google.com/s2/favicons?domain=meta.com&sz=128";
  if (normalized.includes("apple")) return "https://www.google.com/s2/favicons?domain=apple.com&sz=128";
  
  return null;
}

export function getPlatformBadgeDetails(url: string): { name: string, logo: string } | null {
  if (!url) return null;
  const normalized = url.toLowerCase();

  if (normalized.includes("naukri.com")) return { name: "Naukri", logo: "https://www.google.com/s2/favicons?domain=naukri.com&sz=128" };
  if (normalized.includes("internshala.com")) return { name: "Internshala", logo: "https://www.google.com/s2/favicons?domain=internshala.com&sz=128" };
  if (normalized.includes("unstop.com")) return { name: "Unstop", logo: "https://www.google.com/s2/favicons?domain=unstop.com&sz=128" };
  if (normalized.includes("indeed.com")) return { name: "Indeed", logo: "https://www.google.com/s2/favicons?domain=indeed.com&sz=128" };
  if (normalized.includes("linkedin.com")) return { name: "LinkedIn", logo: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128" };
  if (normalized.includes("hirist.tech") || normalized.includes("hirist.com")) return { name: "Hirist", logo: "https://www.google.com/s2/favicons?domain=hirist.tech&sz=128" };
  if (normalized.includes("wellfound.com")) return { name: "Wellfound", logo: "https://www.google.com/s2/favicons?domain=wellfound.com&sz=128" };
  if (normalized.includes("instahyre.com")) return { name: "Instahyre", logo: "https://www.google.com/s2/favicons?domain=instahyre.com&sz=128" };

  return null;
}
