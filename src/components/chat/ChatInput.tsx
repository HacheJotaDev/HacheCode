"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  ChevronDown,
  Sparkles,
  Loader2,
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
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-3 text-xs rounded-lg text-muted-foreground/60 hover:text-foreground border border-border/40 hover:border-border/60 transition-all"
        >
          <Sparkles className="h-3 w-3 text-orange-accent" />
          <span className="font-medium">{currentModel.name}</span>
          <ChevronDown className="h-3 w-3 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 p-1 bg-popover border-border/50 rounded-xl shadow-xl"
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
                    ? "bg-orange-accent/8 text-orange-accent"
                    : "text-foreground hover:bg-surface-hover"
                }
              `}
            >
              <span className="text-xs font-medium">{model.name}</span>
              <span className="text-[10px] text-muted-foreground/50">
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  }, [input]);

  return (
    <div className="border-t border-border/30 bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border/40 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-orange-accent/15 focus-within:border-orange-accent/25 transition-all">
          <ModelSelector />

          <div className="h-5 w-px bg-border/30 shrink-0" />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none disabled:opacity-50 transition-all font-mono leading-relaxed py-1.5 min-w-0"
            style={{ minHeight: "24px", maxHeight: "140px" }}
          />

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 hover:from-orange-accent/90 hover:to-orange-600/90 text-white shadow-md shadow-orange-accent/10 disabled:opacity-30 disabled:shadow-none transition-all shrink-0"
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

      <div className="flex items-center justify-center px-4 pb-2">
        <p className="text-[10px] text-muted-foreground/25">
          Enter para enviar · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  );
}
