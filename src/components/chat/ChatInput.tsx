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
          className="h-8 gap-1.5 px-2.5 text-xs rounded-lg text-muted-foreground hover:text-foreground border border-transparent hover:border-border/60"
        >
          <Sparkles className="h-3 w-3 text-orange-accent" />
          <span className="font-medium">{currentModel.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-1 bg-popover border-border/60 rounded-xl shadow-xl"
        align="start"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`flex flex-col w-full px-3 py-2.5 rounded-lg text-left transition-all duration-150
                ${
                  selectedModel === model.id
                    ? "bg-orange-accent/8 text-orange-accent"
                    : "text-foreground hover:bg-surface-hover"
                }
              `}
            >
              <span className="text-xs font-medium">{model.name}</span>
              <span className="text-[10px] text-muted-foreground/60">
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
    <div className="flex items-center gap-1.5 flex-wrap px-3 pb-1.5">
      <Paperclip className="h-3 w-3 text-muted-foreground/50 shrink-0" />
      {files.slice(0, 4).map((file) => (
        <motion.span
          key={file}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-surface text-muted-foreground/70 border border-border/40"
        >
          <FileCode2 className="h-2.5 w-2.5" />
          {file.split("/").pop()}
          <button
            onClick={() => removeContextFile(file)}
            className="hover:text-foreground ml-0.5 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </motion.span>
      ))}
      {files.length > 4 && (
        <span className="text-[10px] text-muted-foreground/50">
          +{files.length - 4} mas
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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [input]);

  return (
    <div className="border-t border-border/40 bg-background/90 backdrop-blur-md">
      <ContextFilesIndicator />

      <div className="flex items-end gap-2 px-4 py-3">
        <ModelSelector />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta lo que necesites..."
            rows={1}
            disabled={isStreaming}
            className="w-full resize-none rounded-xl bg-surface border border-border/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-orange-accent/20 focus:border-orange-accent/30 disabled:opacity-50 transition-all font-mono leading-relaxed"
            style={{ minHeight: "40px", maxHeight: "180px" }}
          />
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-accent to-orange-600 hover:from-orange-accent/90 hover:to-orange-600/90 text-white shadow-lg shadow-orange-accent/15 disabled:opacity-30 disabled:shadow-none transition-all"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </motion.div>
      </div>

      <div className="flex items-center justify-center px-4 pb-2.5">
        <p className="text-[10px] text-muted-foreground/30">
          Enter para enviar · Shift+Enter nueva linea
        </p>
      </div>
    </div>
  );
}
