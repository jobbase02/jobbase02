import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60_000 });
    return false;
  }
  if (entry.count >= 30) return true;
  entry.count++;
  return false;
}

// GET /api/search?q=react&role=SDE&location=Bangalore&batch=2025&experience=Fresher&page=1
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const p = req.nextUrl.searchParams;
  const q          = (p.get("q") || "").trim().slice(0, 150);
  const role       = p.get("role")       || null;
  const location   = p.get("location")   || null;
  const batch      = p.get("batch")      || null;
  const experience = p.get("experience") || null;
  const page       = Math.max(1, parseInt(p.get("page") || "1"));
  const limit      = 20;
  const offset     = (page - 1) * limit;

  if (!q && !role && !location && !batch && !experience) {
    return NextResponse.json({ jobs: [], total: 0, hasMore: false, page: 1 });
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("jobs")
    .select(
      "id, title, company, location, role_category, batch_eligible, experience_required, apply_link, created_at",
      { count: "exact" }
    )
    .eq("is_active", true);

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,company.ilike.%${q}%,role_category.ilike.%${q}%,description_text.ilike.%${q}%`
    );
  }
  if (role)       query = query.ilike("role_category", `%${role}%`);
  if (location)   query = query.ilike("location", `%${location}%`);
  if (experience) query = query.ilike("experience_required", `%${experience}%`);
  if (batch)      query = query.contains("batch_eligible", [batch]);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[/api/search]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs:    data ?? [],
    total:   count ?? 0,
    hasMore: (count ?? 0) > offset + limit,
    page,
  });
}
