"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RhyeChatProps {
  open: boolean;
  onClose: () => void;
  tripContext: Record<string, unknown>;
}

const SUGGESTIONS = [
  "Is this route realistic?",
  "What should I pack?",
  "Can we reduce travel fatigue?",
  "What should we avoid?",
  "Is this good for my travel style?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#A8B5C8]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1.1, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function RhyeChat({ open, onClose, tripContext }: RhyeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMsg: ChatMessage = { role: "user", content: trimmed };
    const nextHistory = [...messages, newMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/rhye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          tripContext,
          chatHistory: messages,
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Sorry, I couldn't get a response. Try again.";
      setMessages([...nextHistory, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...nextHistory, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="rhye-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel — bottom sheet on mobile, centered modal on desktop */}
          <motion.div
            key="rhye-panel"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed z-[70] inset-x-0 bottom-0 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex flex-col
              bg-white/96 backdrop-blur-[24px] rounded-t-[28px] md:rounded-[28px]
              border border-[#E8EDF5] shadow-[0_-8px_48px_rgba(14,22,64,0.13),0_2px_12px_rgba(14,22,64,0.06)]
              w-full md:w-[460px]
              max-h-[82vh] md:max-h-[72vh]"
            style={{ minHeight: "400px" }}
          >

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#EEF3FB] shrink-0">
              <div className="flex items-center gap-3">
                {/* RHYE avatar badge */}
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 select-none"
                  style={{ background: "linear-gradient(135deg, #FF385C 0%, #E0324F 100%)" }}
                >
                  <span className="text-[11px] font-black text-white tracking-[0.04em]">R</span>
                </div>
                <div className="flex flex-col gap-0">
                  <p className="text-[15px] font-bold text-[#1C2333] leading-none">RHYE</p>
                  <p className="text-[11px] text-[#A8B5C8] font-medium mt-0.5">Your Northeast travel guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#A8B5C8] hover:bg-[#F4F7FD] hover:text-[#6B7280] transition-colors"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">

              {/* Empty state: intro + suggestions */}
              {isEmpty && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-[#1C2333]">Ask anything about this trip.</p>
                    <p className="text-[12.5px] text-[#6B7280] leading-relaxed">
                      I know your itinerary, dates, season, budget, and travel style. Ask me to help you plan smarter.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="text-left text-[13px] text-[#2551CC] font-medium bg-[#F4F7FD] hover:bg-[#EEF3FB] border border-[#DDE8F7] rounded-2xl px-4 py-2.5 transition-colors leading-snug"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat bubbles */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5 self-start"
                      style={{ background: "linear-gradient(135deg, #FF385C 0%, #E0324F 100%)" }}
                    >
                      <span className="text-[9px] font-black text-white">R</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[#1C2333] text-white rounded-tr-sm"
                        : "bg-[#F4F7FD] text-[#1C2333] rounded-tl-sm border border-[#EEF3FB]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF385C 0%, #E0324F 100%)" }}
                  >
                    <span className="text-[9px] font-black text-white">R</span>
                  </div>
                  <div className="bg-[#F4F7FD] border border-[#EEF3FB] rounded-2xl rounded-tl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Input ── */}
            <div className="px-5 pb-5 pt-3 border-t border-[#EEF3FB] shrink-0">
              <div className="flex items-end gap-2.5 bg-[#F4F7FD] rounded-2xl border border-[#DDE8F7] px-4 py-3 focus-within:border-[#2551CC] focus-within:ring-2 focus-within:ring-[#2551CC]/10 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your trip…"
                  className="flex-1 bg-transparent text-[13.5px] text-[#1C2333] placeholder-[#A8B5C8] resize-none outline-none leading-relaxed min-h-[22px]"
                  style={{ maxHeight: "96px" }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    input.trim() && !loading
                      ? "bg-[#FF385C] hover:bg-[#e0324f] cursor-pointer"
                      : "bg-[#DDE8F7] cursor-not-allowed"
                  }`}
                  aria-label="Send"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 11.5L11.5 6.5L1.5 1.5V5.5L8.5 6.5L1.5 7.5V11.5Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-[#C8D2E0] text-center mt-2.5 font-medium">
                RHYE can't book hotels or confirm live conditions — always verify before travel.
              </p>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
