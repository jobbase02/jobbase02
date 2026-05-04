"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot } from "lucide-react";
import JobCard from "./JobCard";
import { AIMessage, Job } from "@/lib/types";
import { cn, haptic } from "@/lib/utils";

const EXAMPLES = [
  "I'm a 2025 passout with React & Node.js skills, looking for remote SDE roles",
  "CSE fresher with Python and ML basics, want data analyst roles in Bangalore",
  "2024 graduate, finance background, interested in fintech roles in Mumbai",
];

export default function AISearchTab() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuery = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    haptic("medium");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-search", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      haptic("success");
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.message, jobs: data.jobs },
      ]);
    } catch (err) {
      haptic("error");
      setMessages(prev => [
        ...prev,
        {
          role: "error",
          content: "Something went wrong. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery(query);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {/* Heaer */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--tg-bg)]/80 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--tg-button)]" />
          <h1 className="font-extrabold text-[var(--tg-text)] text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--tg-text)] to-[var(--tg-hint)]">Jobbase AI Search</h1>
        </div>
        <p className="text-[13px] text-[var(--tg-hint)] mt-1 font-medium">
          Describe your profile, and let AI do the heavy lifting
        </p>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Empty state with example prompts */}
        {messages.length === 0 && (
          <div className="animate-fade-in">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[var(--tg-button)] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-[var(--tg-button-text)]" />
              </div>
              <div className="bg-[var(--tg-secondary-bg)] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[var(--tg-text)] max-w-[85%] shadow-sm leading-relaxed border border-[var(--border)]">
                <span className="font-bold text-[15px] block mb-1 bg-clip-text text-transparent bg-gradient-to-r from-[var(--tg-button)] to-blue-500">Welcome to Jobbase AI! 👋</span>
                I&apos;m your personal career assistant. To help me find the most perfect job matches for you, please tell me about:
                <ul className="list-disc pl-5 mt-2 mb-2 space-y-1 text-[var(--tg-hint)] font-medium">
                  <li>Your <span className="text-[var(--tg-text)] font-semibold">Skills</span> & <span className="text-[var(--tg-text)] font-semibold">Experience</span></li>
                  <li>Your <span className="text-[var(--tg-text)] font-semibold">Graduation Batch</span></li>
                  <li>Preferred <span className="text-[var(--tg-text)] font-semibold">Location</span></li>
                  <li>The <span className="text-[var(--tg-text)] font-semibold">Role</span> you&apos;re looking for</li>
                </ul>
                Let&apos;s get started!
              </div>
            </div>

            <p className="text-xs text-[var(--tg-hint)] font-medium mb-2 text-center">
              Try an example
            </p>
            <div className="space-y-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => sendQuery(ex)}
                  className="w-full text-left text-sm px-4 py-3 rounded-xl bg-[var(--tg-secondary-bg)] text-[var(--tg-text)] border border-[var(--border)] active:opacity-70 transition-opacity"
                >
                  &ldquo;{ex}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message thread */}
        {messages.map((msg, i) => (
          <div key={i} className="animate-fade-in">
            {msg.role === "user" ? (
              /* User bubble — right aligned */
              <div className="flex justify-end">
                <div className="bg-[var(--tg-button)] text-[var(--tg-button-text)] rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[85%]">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* AI / error bubble — left aligned */
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "error" ? "bg-red-500" : "bg-[var(--tg-button)]"
                  )}
                >
                  <Bot size={16} className="text-white" />
                </div>
                <div className="flex-1 space-y-3 max-w-[85%]">
                  <div className="bg-[var(--tg-secondary-bg)] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[var(--tg-text)] whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  {/* Matched job cards */}
                  {msg.jobs && msg.jobs.length > 0 && (
                    <div>
                      <p className="text-[11px] text-[var(--tg-hint)] font-medium mb-2">
                        {msg.jobs.length} matched job{msg.jobs.length > 1 ? "s" : ""}
                      </p>
                      {msg.jobs.map((job: Job) => (
                        <JobCard key={job.id} job={job} showSimilarity className="!mb-2" />
                      ))}
                    </div>
                  )}
                  {msg.role === "assistant" && msg.jobs?.length === 0 && (
                    <p className="text-xs text-[var(--tg-hint)] px-1">
                      No close matches yet — the scraper runs daily, check back tomorrow!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-[var(--tg-button)] flex items-center justify-center shrink-0">
              <Bot size={16} className="text-[var(--tg-button-text)]" />
            </div>
            <div className="bg-[var(--tg-secondary-bg)] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-2 h-2 rounded-full bg-[var(--tg-hint)] animate-[dotPulse_1.4s_infinite_ease-in-out]"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] bg-[var(--tg-bg)] pb-safe">
        <div className="flex items-end gap-2 bg-[var(--tg-secondary-bg)] rounded-2xl px-4 py-2 border border-[var(--border)]">
          <textarea
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your profile and goals…"
            rows={1}
            style={{ resize: "none" }}
            className="flex-1 bg-transparent text-sm text-[var(--tg-text)] placeholder:text-[var(--tg-hint)] outline-none py-1.5 max-h-28 overflow-y-auto"
          />
          <button
            onClick={() => sendQuery(query)}
            disabled={!query.trim() || loading}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all mb-0.5",
              query.trim() && !loading
                ? "bg-[var(--tg-button)] text-[var(--tg-button-text)] active:scale-95"
                : "bg-[var(--tg-hint)]/20 text-[var(--tg-hint)]"
            )}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-[var(--tg-hint)] text-center mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
