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
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full flex flex-col border-l border-border/15 bg-sidebar overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-orange-accent/60" />
              <h2 className="text-xs font-semibold text-foreground/70 tracking-wide">Contexto</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-surface/60 transition-all duration-200"
              onClick={toggleContextPanel}
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator className="bg-border/10" />

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Sesión */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/25 mb-3">
                Sesión
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface/40 border border-border/10">
                  <Zap className="h-3.5 w-3.5 text-orange-accent/50" />
                  <span className="text-[11px] text-foreground/50 font-medium">Modelo</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[9px] h-5 px-2 bg-orange-accent/6 text-orange-accent border-orange-accent/8 rounded-lg font-medium"
                  >
                    {currentModel?.name || "Desconocido"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface/40 border border-border/10">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <span className="text-[11px] text-foreground/50 font-medium">Mensajes</span>
                  <span className="text-[10px] text-muted-foreground/30 ml-auto font-mono">
                    {userMessages} tuyos · {assistantMessages} IA
                  </span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface/40 border border-border/10">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <span className="text-[11px] text-foreground/50 font-medium">Estado</span>
                  <Badge
                    variant="secondary"
                    className={`ml-auto text-[9px] h-5 px-2 rounded-lg font-medium ${
                      isStreaming
                        ? "bg-amber-500/6 text-amber-400 border-amber-500/8"
                        : "bg-emerald-500/6 text-emerald-400 border-emerald-500/8"
                    }`}
                  >
                    {isStreaming ? "Procesando" : "Listo"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="bg-border/8" />

            {/* Tokens */}
            <TokenMeter
              used={sessionContext.totalTokens}
              max={sessionContext.maxTokens}
            />

            <Separator className="bg-border/8" />

            {/* Archivos activos */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/25 mb-3">
                Archivos activos
              </h3>
              <div className="space-y-1.5">
                {sessionContext.files.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/20 italic px-2">
                    Sin archivos en contexto
                  </p>
                ) : (
                  sessionContext.files.map((file) => (
                    <motion.div
                      key={file}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/40 border border-border/10 text-[11px]"
                    >
                      <FileCode2 className="h-3 w-3 shrink-0 text-orange-accent/30" />
                      <span className="font-mono text-muted-foreground/40 truncate">
                        {file}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <Separator className="bg-border/8" />

            {/* Stats */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/25 mb-3">
                Resumen rápido
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-3 rounded-xl bg-surface/30 border border-border/8 text-center">
                  <p className="text-lg font-bold text-orange-accent">
                    {messages.length}
                  </p>
                  <p className="text-[9px] text-muted-foreground/30 font-medium mt-0.5">Mensajes</p>
                </div>
                <div className="px-3 py-3 rounded-xl bg-surface/30 border border-border/8 text-center">
                  <p className="text-lg font-bold text-orange-accent/70">
                    {sessionContext.files.length}
                  </p>
                  <p className="text-[9px] text-muted-foreground/30 font-medium mt-0.5">Archivos</p>
                </div>
                <div className="px-3 py-3 rounded-xl bg-surface/30 border border-border/8 text-center">
                  <p className="text-lg font-bold text-emerald-400/80">
                    {(sessionContext.totalTokens / 1000).toFixed(1)}k
                  </p>
                  <p className="text-[9px] text-muted-foreground/30 font-medium mt-0.5">Tokens</p>
                </div>
                <div className="px-3 py-3 rounded-xl bg-surface/30 border border-border/8 text-center">
                  <p className="text-lg font-bold text-sky-400/80">
                    {currentModel?.name.split(" ").pop() || "—"}
                  </p>
                  <p className="text-[9px] text-muted-foreground/30 font-medium mt-0.5">Modelo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cerrar */}
          <div className="border-t border-border/10 p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] rounded-xl border-border/20 h-9 hover:bg-surface/40 transition-all duration-200"
              onClick={toggleContextPanel}
            >
              <X className="h-3 w-3 mr-1.5" />
              Cerrar panel
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
