import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const BOT_TOKEN           = process.env.BOT_TOKEN!;
const CHANNEL_ID          = process.env.TELEGRAM_CHANNEL_ID ?? "";
const CHANNEL_POST_SECRET = process.env.CHANNEL_POST_SECRET ?? "";
const BOT_USERNAME        = process.env.BOT_USERNAME ?? "jobbase02_bot";

// Platform job board domains — jobs from these are excluded from channel posts
const PLATFORM_DOMAINS = [
  "naukri.com", "internshala.com", "unstop.com", "indeed.com",
  "linkedin.com", "hirist.tech", "wellfound.com", "instahyre.com",
];

async function tg(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`[channel-post] ${method} failed:`, await res.text());
    return null;
  }
  return res.json();
}

// POST /api/channel-post
// Sends 4 shuffled company-sourced jobs (one per company) to the channel.
// Auth: x-api-key header must match CHANNEL_POST_SECRET
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!CHANNEL_POST_SECRET || apiKey !== CHANNEL_POST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!CHANNEL_ID) {
    return NextResponse.json({ error: "TELEGRAM_CHANNEL_ID not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();

  // Fetch recent jobs — pull enough to have variety after filtering
  const { data: raw, error } = await supabase
    .from("jobs")
    .select("title, company, location, role_category, batch_eligible, experience_required, apply_link, source_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep only company-sourced jobs (exclude platform job boards)
  const companyJobs = (raw ?? []).filter(job => {
    const src = (job.source_url ?? job.apply_link ?? "").toLowerCase();
    return !PLATFORM_DOMAINS.some(d => src.includes(d));
  });

  // Shuffle
  for (let i = companyJobs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [companyJobs[i], companyJobs[j]] = [companyJobs[j], companyJobs[i]];
  }

  // Pick at most 1 job per company, take first 4
  const seenCompanies = new Set<string>();
  const selected = companyJobs.filter(job => {
    const key = job.company.toLowerCase().trim();
    if (seenCompanies.has(key)) return false;
    seenCompanies.add(key);
    return true;
  }).slice(0, 4);

  let sent = 0;
  for (const job of selected) {
    const batches = (job.batch_eligible ?? []).filter(Boolean).join(", ");

    const text =
      `💼 <b>${job.title}</b>\n` +
      `🏢 ${job.company}  |  📍 ${job.location ?? "India"}\n` +
      (batches ? `🎓 Batch: ${batches}\n` : "") +
      (job.experience_required ? `💼 ${job.experience_required}\n` : "") +
      `\n🔗 <a href="${job.apply_link}">Apply Now →</a>\n` +
      `\n━━━━━━━━━━━━━━━━\n` +
      `🤖 Find 100+ more jobs with AI-powered search`;

    const result = await tg("sendMessage", {
      chat_id:                  CHANNEL_ID,
      text,
      parse_mode:               "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[
          { text: "🤖 AI Job Search", url: `https://t.me/${BOT_USERNAME}` },
          { text: "🔍 Browse All",    url: `https://t.me/${BOT_USERNAME}` },
        ]],
      },
    });

    if (result) sent++;
    await new Promise(r => setTimeout(r, 1000));
  }

  return NextResponse.json({ ok: true, sent });
}
