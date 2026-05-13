"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  MessageSquare,
  Plus,
  Sparkles,
  Moon,
  Sun,
  Trash2,
  Code2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useChatStore } from "@/store/chat-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, clearChat, messages } = useChatStore();
  const { theme, setTheme } = useTheme();
  const userMessages = messages.filter((m) => m.role === "user").length;

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence mode="wait" initial={false}>
        {sidebarOpen ? (
          <motion.aside
            key="sidebar-open"
            initial={{ width: 240, opacity: 1 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full flex flex-col border-r border-border/40 bg-sidebar overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground tracking-tight">
                    Hache Code
                  </h1>
                  <p className="text-[10px] text-muted-foreground/50">
                    Asistente IA
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground/50 hover:text-foreground"
                    onClick={toggleSidebar}
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar panel</TooltipContent>
              </Tooltip>
            </div>

            <Separator className="bg-border/30" />

            {/* Nueva sesión */}
            <div className="px-3 py-2.5">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-9 text-xs rounded-lg border-border/50 hover:border-orange-accent/30 hover:bg-orange-accent/5 hover:text-orange-accent transition-all"
                onClick={clearChat}
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva sesión
              </Button>
            </div>

            {/* Sesión activa */}
            <div className="px-3 py-1">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-orange-accent/5 border border-orange-accent/10">
                <MessageSquare className="h-3.5 w-3.5 text-orange-accent" />
                <span className="text-xs font-medium text-orange-accent">
                  Sesión actual
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] h-4 px-1.5 bg-orange-accent/8 text-orange-accent border-orange-accent/10"
                >
                  {messages.length}
                </Badge>
              </div>
            </div>

            {/* Info rápida */}
            <div className="px-3 py-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-surface-hover transition-colors">
                  <Code2 className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[11px] text-muted-foreground/50">
                    Mensajes tuyos
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground/70 ml-auto">
                    {userMessages}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-surface-hover transition-colors">
                  <Sparkles className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[11px] text-muted-foreground/50">
                    Respuestas IA
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground/70 ml-auto">
                    {messages.filter((m) => m.role === "assistant").length}
                  </span>
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="border-t border-border/30 p-2 space-y-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs rounded-md text-muted-foreground/50 hover:text-foreground"
                    onClick={clearChat}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Limpiar chat
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Limpiar conversación</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs rounded-md text-muted-foreground/50 hover:text-foreground"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? (
                      <Sun className="h-3.5 w-3.5" />
                    ) : (
                      <Moon className="h-3.5 w-3.5" />
                    )}
                    {theme === "dark" ? "Modo claro" : "Modo oscuro"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Cambiar tema</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs rounded-md text-muted-foreground/50 hover:text-foreground"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configuración
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Ajustes</TooltipContent>
              </Tooltip>
            </div>
          </motion.aside>
        ) : (
          <motion.div
            key="sidebar-collapsed"
            initial={{ width: 48, opacity: 1 }}
            animate={{ width: 48, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full flex flex-col items-center border-r border-border/40 bg-sidebar py-3 gap-3 shrink-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-muted-foreground/50 hover:text-foreground"
                  onClick={toggleSidebar}
                >
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Abrir panel</TooltipContent>
            </Tooltip>
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
