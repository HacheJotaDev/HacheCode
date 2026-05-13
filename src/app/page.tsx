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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-screen flex overflow-hidden bg-background">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Barra superior */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-foreground/80 tracking-tight">
                Hache Code
              </span>
              <span className="text-[10px] text-muted-foreground/30 font-mono bg-surface px-1.5 py-0.5 rounded">
                ~/proyecto
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-accent/8 border border-orange-accent/15"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-accent animate-pulse" />
                  <span className="text-[10px] text-orange-accent font-medium">
                    Procesando
                  </span>
                </motion.div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 rounded-md ${contextPanelOpen ? "text-orange-accent bg-orange-accent/5" : "text-muted-foreground/50 hover:text-foreground"}`}
                    onClick={toggleContextPanel}
                  >
                    <PanelRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Panel de contexto</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="max-w-3xl mx-auto py-4">
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
                  className="px-4 py-2"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/30">
                    <div className="h-0.5 w-6 rounded-full bg-gradient-to-r from-orange-accent/40 to-transparent meter-flow" />
                    <span>Generando respuesta...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="max-w-3xl mx-auto w-full">
            <ChatInput />
          </div>
        </div>

        <ContextPanel />
      </div>
    </TooltipProvider>
  );
}
