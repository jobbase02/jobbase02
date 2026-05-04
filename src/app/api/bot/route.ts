import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// ── Env ───────────────────────────────────────────────────────────────────────
const BOT_TOKEN      = process.env.BOT_TOKEN!;
const APP_URL        = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const WEBHOOK_SECRET = process.env.BOT_WEBHOOK_SECRET ?? "";
const CHANNEL_ID     = process.env.TELEGRAM_CHANNEL_ID ?? "";

// ── Telegram API helper ───────────────────────────────────────────────────────
async function tg(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`[bot] ${method} failed:`, await res.text());
    return null;
  }
  return res.json();
}

async function sendMessage(chatId: number | string, html: string, extra: object = {}) {
  return tg("sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML", ...extra });
}

// ── Persistent keyboard — web_app buttons open the correct tab directly ───────
const MAIN_KEYBOARD = {
  keyboard: [
    [
      { text: "🔍 Find Jobs",     web_app: { url: `${APP_URL}?tab=browse` } },
      { text: "🤖 AI Job Search", web_app: { url: `${APP_URL}?tab=ai`     } },
    ],
    [{ text: "❓ Help" }],
  ],
  resize_keyboard: true,
  persistent:      true,
};

// ── In-chat job search (for users who prefer not to open the Mini App) ────────
async function searchJobsInChat(chatId: number, queryText: string) {
  const supabase = createAdminClient();

  const keywords = queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 4);

  if (keywords.length === 0) {
    await sendMessage(chatId,
      `I couldn't find keywords in your message. Try something like:\n<i>"SDE fresher React Bangalore 2025"</i>`,
      { reply_markup: MAIN_KEYBOARD }
    );
    return;
  }

  const orFilter = keywords
    .map(k => `title.ilike.%${k}%,role_category.ilike.%${k}%,description_text.ilike.%${k}%`)
    .join(",");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("title, company, location, experience_required, apply_link")
    .eq("is_active", true)
    .or(orFilter)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!jobs || jobs.length === 0) {
    await sendMessage(chatId,
      `😕 No jobs found for <b>${queryText.slice(0, 60)}</b>.\n\nTry different keywords or open the app to browse all listings.`,
      { reply_markup: MAIN_KEYBOARD }
    );
    return;
  }

  const lines = jobs.map((j, i) =>
    `${i + 1}. <b>${j.title}</b>\n` +
    `   🏢 ${j.company} · 📍 ${j.location ?? "India"} · 💼 ${j.experience_required ?? "Fresher"}\n` +
    `   🔗 <a href="${j.apply_link}">Apply Now</a>`
  ).join("\n\n");

  await sendMessage(chatId,
    `Found <b>${jobs.length} job${jobs.length > 1 ? "s" : ""}</b> matching "<b>${queryText.slice(0, 50)}</b>":\n\n${lines}\n\n` +
    `<i>Open the app for 100+ more listings with AI-powered matching 👇</i>`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: "🤖 AI Search in App", web_app: { url: `${APP_URL}?tab=ai` } },
        ]],
      },
      disable_web_page_preview: true,
    }
  );
}

// ── Webhook POST ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const message = update.message;
  if (message?.text) {
    const chatId = message.chat.id;
    const text   = message.text.trim();
    const cmd    = text.split(" ")[0].replace(/@\w+$/, "");

    switch (cmd) {
      case "/start":
        await sendMessage(chatId,
          `👋 <b>Welcome to JobBase!</b>\n\n` +
          `Find fresher &amp; entry-level jobs from <b>30+ top companies</b> — TCS, Infosys, Amazon, Deloitte &amp; more.\n\n` +
          `Use the buttons below to get started 👇`,
          { reply_markup: MAIN_KEYBOARD }
        );
        break;

      case "/jobs":
      case "🔍 Find Jobs":
        await sendMessage(chatId,
          `📋 <b>Browse Jobs</b>\n\nFilter by role, location, batch year &amp; experience level. All listings link to the official apply page.`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: "🔍 Open Browse Tab", web_app: { url: `${APP_URL}?tab=browse` } }]],
            },
          }
        );
        break;

      case "/ai":
      case "🤖 AI Job Search":
        await sendMessage(chatId,
          `🤖 <b>AI Job Search</b>\n\nDescribe your profile — skills, batch year, preferred location &amp; role — and AI finds your best matches.\n\n` +
          `<i>Or just type what you're looking for right here and I'll search for you!</i>`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: "🤖 Open AI Search Tab", web_app: { url: `${APP_URL}?tab=ai` } }]],
            },
          }
        );
        break;

      case "/help":
      case "❓ Help":
        await sendMessage(chatId,
          `<b>📖 How to use JobBase</b>\n\n` +
          `<b>🔍 Find Jobs button</b>\n` +
          `Opens the job browser inside Telegram. Filter by:\n` +
          `• Role (SDE, Data, DevOps, QA, Design…)\n` +
          `• Location (Bangalore, Remote, Mumbai…)\n` +
          `• Experience (Fresher, 1-3 Yrs…)\n` +
          `• Batch Year (2023–2026)\n\n` +
          `<b>🤖 AI Job Search button</b>\n` +
          `Opens AI-powered search. Describe yourself and AI finds your best matches.\n` +
          `<i>Example: "2025 CSE passout, React &amp; Node.js, want remote SDE role"</i>\n\n` +
          `<b>💬 Search right here in chat</b>\n` +
          `Just type what you're looking for — no need to open the app!\n` +
          `<i>Example: "SDE fresher Bangalore" or "data analyst 2025 batch"</i>\n\n` +
          `<b>Commands:</b>\n` +
          `/jobs — Browse all jobs\n` +
          `/ai — Open AI search\n` +
          `/help — This message`,
          { reply_markup: MAIN_KEYBOARD }
        );
        break;

      default:
        // Any free text in private chat → treat as in-chat job search
        if (message.chat.type === "private") {
          await searchJobsInChat(chatId, text);
        }
    }
  }

  return NextResponse.json({ ok: true });
}

// ── GET: health check + set menu button once ──────────────────────────────────
export async function GET() {
  // Set the bot's menu button to open the Mini App directly
  await tg("setChatMenuButton", {
    menu_button: {
      type:    "web_app",
      text:    "🔍 JobBase",
      web_app: { url: APP_URL },
    },
  });
  return NextResponse.json({ status: "JobBase bot webhook active" });
}

// ── Stopwords for keyword extraction ─────────────────────────────────────────
const STOPWORDS = new Set([
  "i", "am", "a", "an", "the", "and", "or", "for", "in", "with",
  "looking", "want", "need", "have", "my", "me", "to", "at", "of",
  "is", "are", "be", "do", "get", "can", "will", "job", "jobs",
  "role", "roles", "work", "position", "fresher", "graduate", "find",
  "search", "please", "help", "hi", "hello", "hey",
]);

// ── Minimal Telegram types ────────────────────────────────────────────────────
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; username?: string };
    text?: string;
  };
}
