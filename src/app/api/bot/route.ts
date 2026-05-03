import { NextRequest, NextResponse } from "next/server";

// ── Env ───────────────────────────────────────────────────────────────────────
const BOT_TOKEN      = process.env.BOT_TOKEN!;
const APP_URL        = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const WEBHOOK_SECRET = process.env.BOT_WEBHOOK_SECRET ?? "";
const ADMIN_CHAT_ID  = process.env.ADMIN_CHAT_ID ?? "";    // optional: your personal chat id

// ── Telegram API helper ───────────────────────────────────────────────────────
async function tg(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) console.error(`[bot] ${method} failed:`, await res.text());
  return res.json();
}

async function sendMessage(chatId: number | string, html: string, extra: object = {}) {
  return tg("sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML", ...extra });
}

// ── Web App inline button helper ──────────────────────────────────────────────
function appButton(label = "🔍 Browse Jobs") {
  return { inline_keyboard: [[{ text: label, web_app: { url: APP_URL } }]] };
}

// ── Webhook POST ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Verify the request really comes from Telegram
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

  // ── Route the update ────────────────────────────────────────────────────────
  const message = update.message;
  if (message?.text) {
    const chatId = message.chat.id;
    const cmd    = message.text.split(" ")[0].replace(/@\w+$/, ""); // strip @botname

    switch (cmd) {
      case "/start":
        await sendMessage(
          chatId,
          `👋 <b>Welcome to JobBase!</b>\n\n` +
          `Find fresher jobs from <b>30+ MNC career pages</b> & top Indian platforms.\n\n` +
          `🔍 <b>Manual Browse</b> — filter by role, location, batch &amp; experience\n` +
          `✨ <b>AI Context Search</b> — describe yourself, AI finds your best matches\n` +
          `📋 <b>100+ live listings</b> from TCS, Infosys, Amazon, Deloitte &amp; more\n\n` +
          `<i>Jobs refreshed daily. All listings link to the official apply page.</i>`,
          { reply_markup: appButton("🚀 Open JobBase") }
        );
        break;

      case "/jobs":
        await sendMessage(
          chatId,
          `📋 <b>Browse live job listings</b> — filter by:\n` +
          `• Role (SDE, Data, DevOps, QA, Design…)\n` +
          `• Location (Bangalore, Remote, Mumbai…)\n` +
          `• Experience (Fresher, 1-3 Yrs…)\n` +
          `• Batch Year (2023 – 2026)\n\n` +
          `Tap below to open ↓`,
          { reply_markup: appButton("🔍 Browse Jobs") }
        );
        break;

      case "/ai":
        await sendMessage(
          chatId,
          `✨ <b>AI Context Search</b>\n\n` +
          `Tell the AI your profile — graduation year, skills, preferred location &amp; role type — and it will surface the top matching jobs from our database.\n\n` +
          `<i>Example: "2025 passout, React &amp; Node.js, looking for remote SDE roles"</i>`,
          { reply_markup: appButton("✨ Try AI Search") }
        );
        break;

      case "/help":
        await sendMessage(
          chatId,
          `<b>How to use JobBase:</b>\n\n` +
          `1️⃣ Tap <b>Browse Jobs</b> button or send /jobs\n` +
          `2️⃣ Use the <b>Filter</b> button to narrow down results\n` +
          `3️⃣ Switch to <b>AI Search</b> tab, describe your profile\n` +
          `4️⃣ Tap <b>Apply Now</b> on any card — goes to the official page\n\n` +
          `<b>Commands:</b>\n` +
          `/jobs — Browse jobs\n` +
          `/ai — Open AI search\n` +
          `/help — This message`,
          { reply_markup: appButton() }
        );
        break;

      default:
        // Any other message in private chat gets the app button
        if (message.chat.type === "private") {
          await sendMessage(
            chatId,
            `Use the button below to browse jobs, or try /help for a guide.`,
            { reply_markup: appButton() }
          );
        }
    }
  }

  // Always return 200 quickly so Telegram doesn't retry
  return NextResponse.json({ ok: true });
}

// ── GET: health check ─────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({ status: "JobBase bot webhook active" });
}

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
