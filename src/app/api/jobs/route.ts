import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// GET /api/jobs?role=SDE&location=Bangalore&experience=Fresher&batch=2025&page=1
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const role_category       = p.get("role")       || null;
  const location            = p.get("location")   || null;
  const experience_required = p.get("experience") || null;
  const batch_year          = p.get("batch")       || null;
  const page                = Math.max(1, parseInt(p.get("page") || "1"));
  const limit               = 20;
  const offset              = (page - 1) * limit;

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("browse_jobs", {
    p_role_category:       role_category,
    p_location:            location,
    p_experience_required: experience_required,
    p_batch_year:          batch_year,
    p_limit:               limit,
    p_offset:              offset,
  });

  if (error) {
    console.error("[/api/jobs]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let jobs = data ?? [];
  // Shuffle the jobs on the current page to meet "latest but shuffled" requirement
  for (let i = jobs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
  }

  // Get total count of jobs (only if no filters are applied, for performance)
  let totalCount = null;
  if (!role_category && !location && !experience_required && !batch_year) {
    const { count } = await supabase.from("jobs").select("id", { count: "exact", head: true });
    totalCount = count;
  }

  return NextResponse.json({
    jobs,
    page,
    hasMore: (data?.length ?? 0) === limit,
    totalCount,
  });
}
