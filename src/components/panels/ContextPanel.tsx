"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileCode2,
  Clock,
  Zap,
  Hash,
  PanelRightClose,
} from "lucide-react";
import { useChatStore, MODELS } from "@/store/chat-store";
import { TokenMeter } from "./TokenMeter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function ContextPanel() {
  const {
    contextPanelOpen,
    toggleContextPanel,
    sessionContext,
    messages,
    selectedModel,
    isStreaming,
  } = useChatStore();

  const currentModel = MODELS.find((m) => m.id === selectedModel);
  const userMessages = messages.filter((m) => m.role === "user").length;
  const assistantMessages = messages.filter((m) => m.role === "assistant").length;

  return (
    <AnimatePresence>
      {contextPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="h-full flex flex-col border-l border-border bg-sidebar overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Context</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={toggleContextPanel}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="bg-border" />

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Session Info */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                Session
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-orange-accent" />
                  <span className="text-xs text-foreground">Model</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] h-5 bg-orange-accent/10 text-orange-accent border-orange-accent/20"
                  >
                    {currentModel?.name || "Unknown"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">Messages</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {userMessages} user · {assistantMessages} assistant
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">Status</span>
                  <Badge
                    variant="secondary"
                    className={`ml-auto text-[10px] h-5 ${
                      isStreaming
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {isStreaming ? "Processing" : "Ready"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Token Usage */}
            <div>
              <TokenMeter
                used={sessionContext.totalTokens}
                max={sessionContext.maxTokens}
              />
            </div>

            <Separator className="bg-border" />

            {/* Active Files */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                Active Files
              </h3>
              <div className="space-y-1.5">
                {sessionContext.files.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 italic">
                    No files in context
                  </p>
                ) : (
                  sessionContext.files.map((file) => (
                    <motion.div
                      key={file}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface border border-border/50 text-xs"
                    >
                      <FileCode2 className="h-3 w-3 shrink-0 text-orange-accent/60" />
                      <span className="font-mono text-muted-foreground truncate">
                        {file}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Quick Stats */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="px-2.5 py-2 rounded-md bg-surface border border-border/50 text-center">
                  <p className="text-lg font-bold text-orange-accent">
                    {messages.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Messages</p>
                </div>
                <div className="px-2.5 py-2 rounded-md bg-surface border border-border/50 text-center">
                  <p className="text-lg font-bold text-orange-accent">
                    {sessionContext.files.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Files</p>
                </div>
                <div className="px-2.5 py-2 rounded-md bg-surface border border-border/50 text-center">
                  <p className="text-lg font-bold text-emerald-400">
                    {(sessionContext.totalTokens / 1000).toFixed(1)}k
                  </p>
                  <p className="text-[10px] text-muted-foreground">Tokens</p>
                </div>
                <div className="px-2.5 py-2 rounded-md bg-surface border border-border/50 text-center">
                  <p className="text-lg font-bold text-sky-400">
                    {currentModel?.name.split(" ").pop() || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Model</p>
                </div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="border-t border-border p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={toggleContextPanel}
            >
              <X className="h-3 w-3 mr-1.5" />
              Close Panel
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
