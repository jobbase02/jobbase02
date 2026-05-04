import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const BOT_TOKEN          = process.env.BOT_TOKEN!;
const CHANNEL_ID         = process.env.TELEGRAM_CHANNEL_ID ?? "";
const CHANNEL_POST_SECRET = process.env.CHANNEL_POST_SECRET ?? "";
const APP_URL            = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const BOT_USERNAME       = process.env.BOT_USERNAME ?? "jobbase02_bot";

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
// Called by the scraper after each run to push the latest jobs to the channel.
// Body: { count?: number }   (default 5, max 10)
// Auth: x-api-key header must match CHANNEL_POST_SECRET
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!CHANNEL_POST_SECRET || apiKey !== CHANNEL_POST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!CHANNEL_ID) {
    return NextResponse.json({ error: "TELEGRAM_CHANNEL_ID not configured" }, { status: 500 });
  }

  let count = 5;
  try {
    const body = await req.json();
    count = Math.min(10, Math.max(1, parseInt(body.count ?? "5")));
  } catch { /* use default */ }

  const supabase = createAdminClient();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("title, company, location, role_category, batch_eligible, experience_required, apply_link")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(count);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const job of jobs ?? []) {
    const batches = (job.batch_eligible ?? []).filter(Boolean).join(", ");

    const text =
      `💼 <b>${job.title}</b>\n` +
      `🏢 ${job.company}  |  📍 ${job.location ?? "India"}\n` +
      (batches ? `🎓 Batch: ${batches}\n` : "") +
      (job.experience_required ? `💼 ${job.experience_required}\n` : "") +
      `\n🔗 <a href="${job.apply_link}">Apply Now →</a>\n` +
      `\n━━━━━━━━━━━━━━━━\n` +
      `🤖 Find 100+ more jobs with AI-powered matching`;

    await tg("sendMessage", {
      chat_id:                  CHANNEL_ID,
      text,
      parse_mode:               "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[
          { text: "🤖 AI Job Search", web_app: { url: `${APP_URL}?tab=ai` } },
          { text: "🔍 Browse All",    url: `https://t.me/${BOT_USERNAME}`  },
        ]],
      },
    });

    sent++;
    // 1s delay between posts to avoid hitting Telegram rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  return NextResponse.json({ ok: true, sent });
}
