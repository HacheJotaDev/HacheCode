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
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="h-full flex flex-col border-l border-border/40 bg-sidebar overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs font-semibold text-foreground/80">Contexto</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-muted-foreground/50 hover:text-foreground"
              onClick={toggleContextPanel}
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator className="bg-border/30" />

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Sesión */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30 mb-2.5">
                Sesión
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-orange-accent/70" />
                  <span className="text-[11px] text-foreground/60">Modelo</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[9px] h-4 px-1.5 bg-orange-accent/8 text-orange-accent border-orange-accent/10"
                  >
                    {currentModel?.name || "Desconocido"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[11px] text-foreground/60">Mensajes</span>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto font-mono">
                    {userMessages} tuyos · {assistantMessages} IA
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[11px] text-foreground/60">Estado</span>
                  <Badge
                    variant="secondary"
                    className={`ml-auto text-[9px] h-4 ${
                      isStreaming
                        ? "bg-amber-500/8 text-amber-400 border-amber-500/10"
                        : "bg-emerald-500/8 text-emerald-400 border-emerald-500/10"
                    }`}
                  >
                    {isStreaming ? "Procesando" : "Listo"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="bg-border/20" />

            {/* Tokens */}
            <TokenMeter
              used={sessionContext.totalTokens}
              max={sessionContext.maxTokens}
            />

            <Separator className="bg-border/20" />

            {/* Archivos activos */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30 mb-2.5">
                Archivos activos
              </h3>
              <div className="space-y-1">
                {sessionContext.files.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/25 italic">
                    Sin archivos en contexto
                  </p>
                ) : (
                  sessionContext.files.map((file) => (
                    <motion.div
                      key={file}
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface/60 border border-border/25 text-[11px]"
                    >
                      <FileCode2 className="h-3 w-3 shrink-0 text-orange-accent/40" />
                      <span className="font-mono text-muted-foreground/50 truncate">
                        {file}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <Separator className="bg-border/20" />

            {/* Stats */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30 mb-2.5">
                Resumen rápido
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="px-2 py-2 rounded-lg bg-surface/50 border border-border/20 text-center">
                  <p className="text-base font-bold text-orange-accent">
                    {messages.length}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">Mensajes</p>
                </div>
                <div className="px-2 py-2 rounded-lg bg-surface/50 border border-border/20 text-center">
                  <p className="text-base font-bold text-orange-accent">
                    {sessionContext.files.length}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">Archivos</p>
                </div>
                <div className="px-2 py-2 rounded-lg bg-surface/50 border border-border/20 text-center">
                  <p className="text-base font-bold text-emerald-400">
                    {(sessionContext.totalTokens / 1000).toFixed(1)}k
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">Tokens</p>
                </div>
                <div className="px-2 py-2 rounded-lg bg-surface/50 border border-border/20 text-center">
                  <p className="text-base font-bold text-sky-400">
                    {currentModel?.name.split(" ").pop() || "—"}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">Modelo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cerrar */}
          <div className="border-t border-border/30 p-2.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[11px] rounded-lg border-border/30 h-8"
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
