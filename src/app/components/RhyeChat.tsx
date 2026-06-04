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
  "What should I avoid?",
  "Can we reduce travel fatigue?",
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

/* Minimal rhino head SVG — front-facing, clean, premium */
export function RhinoIcon({ size = 28, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main head */}
      <ellipse cx="14" cy="15" rx="8.5" ry="8" fill={color} fillOpacity="0.13" stroke={color} strokeWidth="1.55"/>
      {/* Horn — single tapered spike above forehead */}
      <path d="M14 7C14 7 12.6 3.8 14 2.2C15.4 3.8 14 7 14 7Z" fill={color}/>
      {/* Left ear */}
      <path d="M5.5 11.5C5.5 11.5 4 9.8 4.5 8C5.5 7.5 6.5 8 5.5 11.5Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      {/* Right ear */}
      <path d="M22.5 11.5C22.5 11.5 24 9.8 23.5 8C22.5 7.5 21.5 8 22.5 11.5Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      {/* Eyes */}
      <circle cx="10" cy="14" r="1.4" fill={color}/>
      <circle cx="18" cy="14" r="1.4" fill={color}/>
      {/* Smile */}
      <path d="M10.5 19C10.5 19 11.8 20.5 14 20.5C16.2 20.5 17.5 19 17.5 19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Nostrils */}
      <ellipse cx="12" cy="17" rx="0.9" ry="0.55" fill={color} fillOpacity="0.5"/>
      <ellipse cx="16" cy="17" rx="0.9" ry="0.55" fill={color} fillOpacity="0.5"/>
    </svg>
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
  const hasTripContext = Object.keys(tripContext).length > 0;

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[2px] md:bg-black/15"
            onClick={onClose}
          />

          {/* Panel
              Mobile  — full-width bottom sheet, slides up
              Desktop — anchored bottom-right above FAB, fixed width */}
          <motion.div
            key="rhye-panel"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={[
              "fixed z-[70] flex flex-col",
              "bg-white/97 backdrop-blur-[20px]",
              "border border-[#E8EDF5]",
              "shadow-[0_-4px_40px_rgba(14,22,64,0.12),0_2px_12px_rgba(14,22,64,0.06)]",
              /* mobile */
              "inset-x-0 bottom-0 rounded-t-[28px]",
              /* desktop override */
              "md:inset-auto md:bottom-[88px] md:right-6 md:rounded-[28px] md:w-[400px]",
            ].join(" ")}
            style={{ maxHeight: "82vh" }}
          >
            {/* Drag handle — mobile only */}
            <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-[#DDE8F7]" />
            </div>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-[#EEF3FB] shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF385C 0%, #D62B4B 100%)" }}
                >
                  <RhinoIcon size={22} />
                </div>
                <div>
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
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">

              {/* Empty state */}
              {isEmpty && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-[#1C2333]">
                      {hasTripContext ? "Ask anything about this trip." : "Ask me about Northeast India."}
                    </p>
                    <p className="text-[12.5px] text-[#6B7280] leading-relaxed">
                      Ask me about routes, weather, permits, packing, stays or whether your trip is realistic.
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
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 self-start"
                      style={{ background: "linear-gradient(135deg, #FF385C 0%, #D62B4B 100%)" }}
                    >
                      <RhinoIcon size={15} />
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
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #FF385C 0%, #D62B4B 100%)" }}
                  >
                    <RhinoIcon size={15} />
                  </div>
                  <div className="bg-[#F4F7FD] border border-[#EEF3FB] rounded-2xl rounded-tl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Input ── */}
            <div className="px-4 pb-5 pt-3 border-t border-[#EEF3FB] shrink-0"
              style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 1.25rem))" }}
            >
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
                      ? "bg-[#FF385C] hover:bg-[#D62B4B] cursor-pointer"
                      : "bg-[#DDE8F7] cursor-not-allowed"
                  }`}
                  aria-label="Send"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 11.5L11.5 6.5L1.5 1.5V5.5L8.5 6.5L1.5 7.5V11.5Z" fill="white" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-[#C8D2E0] text-center mt-2 font-medium">
                RHYE can&apos;t book hotels or confirm live conditions — always verify before travel.
              </p>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
