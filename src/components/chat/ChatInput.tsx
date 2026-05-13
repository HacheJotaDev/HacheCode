"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  ChevronDown,
  Sparkles,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useChatStore, MODELS } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChatStore();
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-all duration-200 hover:bg-surface-hover/60 shrink-0 border border-transparent hover:border-border/30"
        >
          <Sparkles className="h-3 w-3 text-orange-accent/70" />
          <span>{currentModel.name}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-40" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 p-1.5 bg-popover/95 backdrop-blur-xl border-border/30 rounded-xl shadow-2xl shadow-black/10"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`flex flex-col w-full px-3 py-2 rounded-lg text-left transition-all duration-150
                ${
                  selectedModel === model.id
                    ? "bg-orange-accent/8 text-orange-accent ring-1 ring-orange-accent/10"
                    : "text-foreground hover:bg-surface-hover"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{model.name}</span>
                {selectedModel === model.id && (
                  <div className="h-1 w-1 rounded-full bg-orange-accent" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground/50 mt-0.5">
                {model.description}
              </span>
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="border-t border-border/15 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 py-3 max-w-4xl mx-auto w-full">
        <div className="flex-1 flex items-center gap-2 bg-surface/70 border border-border/30 rounded-2xl px-3.5 py-1.5 input-glow transition-all duration-300 focus-within:border-orange-accent/20 focus-within:bg-surface/90">
          <ModelSelector />

          <div className="h-4 w-px bg-border/20 shrink-0" />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none disabled:opacity-50 transition-all font-mono leading-relaxed py-1 min-w-0"
            style={{ minHeight: "22px", maxHeight: "120px" }}
          />

          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-accent to-orange-600 hover:from-orange-accent/90 hover:to-orange-600/90 text-white shadow-lg shadow-orange-accent/15 disabled:opacity-25 disabled:shadow-none transition-all duration-200 shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 pb-2">
        <p className="text-[10px] text-muted-foreground/20 font-mono">
          Enter enviar · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  );
}
