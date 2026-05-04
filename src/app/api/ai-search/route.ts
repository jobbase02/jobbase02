import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase";

// Simple in-memory rate limiter to prevent API abuse (exhaustion of OpenAI/Grok tokens)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitData = rateLimitMap.get(ip);
  if (!limitData || limitData.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60_000 }); // 1 minute window
    return false;
  }
  if (limitData.count >= 10) { // Max 10 requests per minute per IP
    return true;
  }
  limitData.count++;
  return false;
}

// POST /api/ai-search   body: { query: string }
export async function POST(req: NextRequest) {
  // Extract client IP (Vercel standard header)
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  let body: { query?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Step 1: Try vector search (works once scraper stores embeddings) ──────
  // Falls back to keyword search if no embeddings exist yet.
  let matchedJobs: JobRow[] = [];
  let usedVectorSearch = false;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query.slice(0, 8191),
    });
    const queryEmbedding = embRes.data[0].embedding;

    const { data, error } = await supabase.rpc("search_jobs_by_embedding", {
      query_embedding:   queryEmbedding,
      match_count:       5,
      similarity_cutoff: 0.30,
    });

    if (!error && data && data.length > 0) {
      matchedJobs = data;
      usedVectorSearch = true;
    }
  } catch (err) {
    console.warn("[ai-search] Vector search skipped:", (err as Error).message);
  }

  // ── Step 2: Keyword fallback — extract key terms from query ───────────────
  if (matchedJobs.length === 0) {
    const keywords = extractKeywords(query);
    const { data } = await supabase
      .from("jobs")
      .select("id, title, company, location, role_category, batch_eligible, experience_required, apply_link, description_text, created_at")
      .eq("is_active", true)
      .or(keywords.map(k => `title.ilike.%${k}%,description_text.ilike.%${k}%`).join(","))
      .order("created_at", { ascending: false })
      .limit(5);

    matchedJobs = data ?? [];
  }

  // ── Step 3: If still empty, just return recent jobs ───────────────────────
  if (matchedJobs.length === 0) {
    const { data } = await supabase
      .from("jobs")
      .select("id, title, company, location, role_category, batch_eligible, experience_required, apply_link, description_text, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5);

    matchedJobs = data ?? [];
  }

  // ── Step 4: Ask Grok to synthesise a response ─────────────────────────────
  const grok = new OpenAI({
    apiKey:  process.env.GROK_API_KEY,
    baseURL: "https://api.x.ai/v1",
  });

  const jobSummary =
    matchedJobs.length > 0
      ? matchedJobs
          .map((j, i) =>
            `${i + 1}. **${j.title}** at ${j.company} | 📍 ${j.location ?? "India"} | 💼 ${j.experience_required ?? "Fresher"} | 🎓 ${(j.batch_eligible ?? []).join(", ") || "—"}\n   Apply: ${j.apply_link}`
          )
          .join("\n\n")
      : "No jobs found in the database right now.";

  const systemPrompt = `You are JobBase AI — a friendly, concise career assistant for Indian fresh graduates.
Help users understand which jobs match their profile. Be warm, specific, and actionable. Keep responses under 180 words.
Always mention the exact apply links for the top 2–3 roles you recommend.`;

  const userPrompt = `My profile / what I'm looking for:
"${query}"

${usedVectorSearch ? "Top semantically matched" : "Top recent"} jobs from the database:
${jobSummary}

Based on my profile, which should I prioritise and why? Mention the apply links.`;

  let aiMessage = `Here are ${matchedJobs.length} job(s) that match your search. Tap **Apply Now** to apply directly!`;

  try {
    const chat = await grok.chat.completions.create({
      model:      "grok-3-mini",
      max_tokens: 350,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt   },
      ],
    });
    aiMessage = chat.choices[0]?.message?.content?.trim() ?? aiMessage;
  } catch (err) {
    console.error("[ai-search] Grok call failed:", err);
    aiMessage =
      matchedJobs.length > 0
        ? `Found ${matchedJobs.length} job(s) for your profile. Tap Apply Now on any card below!`
        : "No close matches right now. Check back after the next scraper run.";
  }

  return NextResponse.json({ message: aiMessage, jobs: matchedJobs });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractKeywords(query: string): string[] {
  const stopwords = new Set([
    "i", "am", "a", "an", "the", "and", "or", "for", "in", "with",
    "looking", "want", "need", "have", "my", "me", "to", "at", "of",
    "is", "are", "be", "do", "get", "can", "will", "job", "jobs",
    "role", "roles", "work", "position", "fresher", "graduate",
  ]);
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s+]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))
    .slice(0, 5);
}

interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  role_category: string | null;
  batch_eligible: string[] | null;
  experience_required: string | null;
  apply_link: string;
  description_text: string | null;
  created_at: string;
  similarity?: number;
}
