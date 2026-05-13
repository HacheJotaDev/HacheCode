"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelRight, Sparkles, Code2 } from "lucide-react";
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
  const { messages, isStreaming, contextPanelOpen, toggleContextPanel, sidebarOpen } =
    useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Barra superior - Glass morphism */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/20 glass shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center shadow-sm shadow-orange-accent/20">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground/90 tracking-tight">
                  Hache Code
                </span>
                <div className="h-3 w-px bg-border/40" />
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface/80 border border-border/20">
                  <Code2 className="h-2.5 w-2.5 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground/50 font-mono">
                    ~/proyecto
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-accent/6 border border-orange-accent/12"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-accent pulse-soft" />
                  <span className="text-[10px] text-orange-accent font-medium tracking-wide">
                    Procesando
                  </span>
                </motion.div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                      contextPanelOpen
                        ? "text-orange-accent bg-orange-accent/5 hover:bg-orange-accent/10"
                        : "text-muted-foreground/40 hover:text-foreground hover:bg-surface/60"
                    }`}
                    onClick={toggleContextPanel}
                  >
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Panel de contexto</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0 scroll-smooth-area"
          >
            <div className="max-w-4xl mx-auto py-6">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                  />
                ))}
              </AnimatePresence>

              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-5 py-3"
                >
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground/25">
                    <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-orange-accent/30 to-transparent meter-flow" />
                    <span>Generando respuesta...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input - Full width horizontal bar */}
          <ChatInput />
        </div>

        <ContextPanel />
      </div>
    </TooltipProvider>
  );
}
