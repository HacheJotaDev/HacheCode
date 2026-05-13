"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ChevronDown,
  Sparkles,
  Loader2,
  ArrowUp,
} from "lucide-react";
import { useChatStore, MODELS } from "@/store/chat-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChatStore();
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground/70 hover:text-foreground transition-all duration-200 hover:bg-surface-hover/50 shrink-0"
        >
          <Sparkles className="h-3 w-3 text-orange-accent/80" />
          <span className="tracking-wide">{currentModel.name}</span>
          <ChevronDown className={`h-2.5 w-2.5 opacity-40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-1 bg-popover/98 backdrop-blur-2xl border-border/20 rounded-xl shadow-2xl shadow-black/20"
        align="start"
        sideOffset={12}
      >
        <div className="space-y-0.5">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setOpen(false);
              }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-all duration-150
                ${
                  selectedModel === model.id
                    ? "bg-orange-accent/8 text-orange-accent"
                    : "text-foreground/80 hover:bg-surface-hover/60"
                }
              `}
            >
              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${selectedModel === model.id ? "bg-orange-accent" : "bg-muted-foreground/20"}`} />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold block">{model.name}</span>
                <span className="text-[10px] text-muted-foreground/40 block mt-0.5">
                  {model.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isStreaming } = useChatStore();

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(trimmed);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  const hasContent = input.trim().length > 0;

  return (
    <div className="shrink-0">
      <div className="max-w-4xl mx-auto w-full px-4 pb-4 pt-2">
        {/* Main input container - floating card style */}
        <div className="relative flex flex-col bg-surface/60 border border-border/25 rounded-2xl backdrop-blur-xl transition-all duration-300 focus-within:border-orange-accent/15 focus-within:bg-surface/80 focus-within:shadow-[0_0_0_1px_oklch(0.705_0.213_47.604/8%),0_8px_32px_oklch(0.705_0.213_47.604/4%)] shadow-[0_2px_12px_oklch(0_0_0/8%)]">
          {/* Top row: Model selector + Textarea */}
          <div className="flex items-start gap-1 px-2 pt-2">
            <div className="shrink-0 pt-1">
              <ModelSelector />
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame lo que quieras..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none disabled:opacity-50 transition-all leading-relaxed py-2 min-w-0"
              style={{ minHeight: "28px", maxHeight: "150px" }}
            />
          </div>

          {/* Bottom row: hint + send button */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <span className="text-[10px] text-muted-foreground/20 select-none">
              <kbd className="px-1 py-0.5 rounded bg-surface-hover/50 text-[9px] font-mono">Enter</kbd> enviar
              <span className="mx-1">·</span>
              <kbd className="px-1 py-0.5 rounded bg-surface-hover/50 text-[9px] font-mono">Shift+Enter</kbd> nueva línea
            </span>

            <motion.div
              whileHover={hasContent && !isStreaming ? { scale: 1.05 } : {}}
              whileTap={hasContent && !isStreaming ? { scale: 0.95 } : {}}
            >
              <button
                onClick={handleSend}
                disabled={!hasContent || isStreaming}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0
                  ${
                    hasContent && !isStreaming
                      ? "bg-gradient-to-br from-orange-accent to-orange-600 text-white shadow-lg shadow-orange-accent/20 hover:shadow-orange-accent/30"
                      : "bg-surface-hover/40 text-muted-foreground/25"
                  }
                `}
              >
                <AnimatePresence mode="wait">
                  {isStreaming ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.div>
                  ) : hasContent ? (
                    <motion.div
                      key="send-active"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send-inactive"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
