"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelRight, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ContextPanel } from "@/components/panels/ContextPanel";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function HomePage() {
  const { messages, isStreaming, contextPanelOpen, toggleContextPanel } =
    useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-gradient-to-br from-orange-accent/80 to-orange-600/80 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">
                claude-code
              </span>
              <span className="text-[10px] text-muted-foreground/40 font-mono">
                ~/workspace
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] text-amber-400 font-medium">
                    Processing
                  </span>
                </motion.div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${contextPanelOpen ? "text-orange-accent" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={toggleContextPanel}
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle context panel</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="max-w-4xl mx-auto py-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                  />
                ))}
              </AnimatePresence>

              {/* Streaming indicator at bottom */}
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-2"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/40">
                    <div className="h-1 w-8 rounded-full bg-gradient-to-r from-orange-accent/40 to-transparent meter-flow" />
                    <span>Generating response...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="max-w-4xl mx-auto w-full">
            <ChatInput />
          </div>
        </div>

        {/* Right Context Panel */}
        <ContextPanel />
      </div>
    </TooltipProvider>
  );
}
