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
          animate={{ width: 272, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="h-full flex flex-col border-l border-border/60 bg-sidebar overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <h2 className="text-sm font-semibold text-foreground">Contexto</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground/60 hover:text-foreground"
              onClick={toggleContextPanel}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="bg-border/40" />

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Sesion */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">
                Sesion
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-orange-accent" />
                  <span className="text-xs text-foreground/80">Modelo</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] h-5 bg-orange-accent/8 text-orange-accent border-orange-accent/15"
                  >
                    {currentModel?.name || "Desconocido"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-foreground/80">Mensajes</span>
                  <span className="text-xs text-muted-foreground/50 ml-auto">
                    {userMessages} tuyos · {assistantMessages} IA
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-xs text-foreground/80">Estado</span>
                  <Badge
                    variant="secondary"
                    className={`ml-auto text-[10px] h-5 ${
                      isStreaming
                        ? "bg-amber-500/8 text-amber-400 border-amber-500/15"
                        : "bg-emerald-500/8 text-emerald-400 border-emerald-500/15"
                    }`}
                  >
                    {isStreaming ? "Procesando" : "Listo"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Tokens */}
            <div>
              <TokenMeter
                used={sessionContext.totalTokens}
                max={sessionContext.maxTokens}
              />
            </div>

            <Separator className="bg-border/30" />

            {/* Archivos activos */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">
                Archivos activos
              </h3>
              <div className="space-y-1.5">
                {sessionContext.files.length === 0 ? (
                  <p className="text-xs text-muted-foreground/30 italic">
                    Sin archivos en contexto
                  </p>
                ) : (
                  sessionContext.files.map((file) => (
                    <motion.div
                      key={file}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface/80 border border-border/30 text-xs"
                    >
                      <FileCode2 className="h-3 w-3 shrink-0 text-orange-accent/50" />
                      <span className="font-mono text-muted-foreground/60 truncate">
                        {file}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Stats */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">
                Resumen rapido
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="px-2.5 py-2.5 rounded-lg bg-surface/60 border border-border/30 text-center">
                  <p className="text-lg font-bold text-orange-accent">
                    {messages.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">Mensajes</p>
                </div>
                <div className="px-2.5 py-2.5 rounded-lg bg-surface/60 border border-border/30 text-center">
                  <p className="text-lg font-bold text-orange-accent">
                    {sessionContext.files.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">Archivos</p>
                </div>
                <div className="px-2.5 py-2.5 rounded-lg bg-surface/60 border border-border/30 text-center">
                  <p className="text-lg font-bold text-emerald-400">
                    {(sessionContext.totalTokens / 1000).toFixed(1)}k
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">Tokens</p>
                </div>
                <div className="px-2.5 py-2.5 rounded-lg bg-surface/60 border border-border/30 text-center">
                  <p className="text-lg font-bold text-sky-400">
                    {currentModel?.name.split(" ").pop() || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">Modelo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cerrar */}
          <div className="border-t border-border/40 p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-lg border-border/40"
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
