"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  ChevronDown,
  Sparkles,
  Loader2,
  X,
  FileCode2,
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
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
        >
          <Sparkles className="h-3 w-3 text-orange-accent" />
          <span className="font-medium">{currentModel.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-1.5 bg-popover border-border"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`flex flex-col w-full px-3 py-2 rounded-md text-left transition-colors
                ${
                  selectedModel === model.id
                    ? "bg-orange-accent/10 text-orange-accent"
                    : "text-foreground hover:bg-surface-hover"
                }
              `}
            >
              <span className="text-xs font-medium">{model.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {model.description}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ContextFilesIndicator() {
  const { sessionContext, removeContextFile } = useChatStore();
  const files = sessionContext.files;

  if (files.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap px-3 pb-2">
      <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
      {files.slice(0, 4).map((file) => (
        <motion.span
          key={file}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-hover text-muted-foreground border border-border/50"
        >
          <FileCode2 className="h-2.5 w-2.5" />
          {file.split("/").pop()}
          <button
            onClick={() => removeContextFile(file)}
            className="hover:text-foreground ml-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </motion.span>
      ))}
      {files.length > 4 && (
        <span className="text-[10px] text-muted-foreground">
          +{files.length - 4} more
        </span>
      )}
    </div>
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

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm">
      <ContextFilesIndicator />

      <div className="flex items-end gap-2 px-3 py-2.5">
        <ModelSelector />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Claude Code anything..."
            rows={1}
            disabled={isStreaming}
            className="w-full resize-none rounded-lg bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-orange-accent/50 focus:border-orange-accent/30 disabled:opacity-50 transition-all font-mono"
            style={{ minHeight: "36px", maxHeight: "200px" }}
          />
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="h-9 w-9 rounded-lg bg-gradient-to-r from-orange-accent to-orange-600 hover:from-orange-accent/90 hover:to-orange-600/90 text-white shadow-lg shadow-orange-accent/20 disabled:opacity-40 disabled:shadow-none"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      </div>

      <div className="flex items-center justify-between px-3 pb-2">
        <p className="text-[10px] text-muted-foreground/40">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
