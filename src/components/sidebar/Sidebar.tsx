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
  Zap,
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
  const aiMessages = messages.filter((m) => m.role === "assistant").length;

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence mode="wait" initial={false}>
        {sidebarOpen ? (
          <motion.aside
            key="sidebar-open"
            initial={{ width: 256, opacity: 1 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full flex flex-col border-r border-border/15 bg-sidebar overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center shadow-md shadow-orange-accent/15 glow-orange-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground tracking-tight">
                    Hache Code
                  </h1>
                  <p className="text-[10px] text-muted-foreground/40 font-medium">
                    Asistente IA de Codigo
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-surface/60 transition-all duration-200"
                    onClick={toggleSidebar}
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar panel</TooltipContent>
              </Tooltip>
            </div>

            <Separator className="bg-border/15" />

            {/* Nueva sesión */}
            <div className="px-3 py-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2.5 h-10 text-xs rounded-xl border-border/30 hover:border-orange-accent/25 hover:bg-orange-accent/5 hover:text-orange-accent transition-all duration-200 font-medium"
                onClick={clearChat}
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva sesión
              </Button>
            </div>

            {/* Sesión activa */}
            <div className="px-3 py-1">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-orange-accent/4 border border-orange-accent/8 transition-all duration-200 hover:bg-orange-accent/6">
                <div className="h-7 w-7 rounded-lg bg-orange-accent/8 flex items-center justify-center">
                  <MessageSquare className="h-3.5 w-3.5 text-orange-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground/80 block">
                    Sesión actual
                  </span>
                  <span className="text-[10px] text-muted-foreground/30">
                    {messages.length} mensajes
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 px-2 bg-orange-accent/6 text-orange-accent border-orange-accent/8 rounded-lg"
                >
                  {messages.length}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="px-3 py-3">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="px-3 py-2.5 rounded-xl bg-surface/50 border border-border/15 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Code2 className="h-2.5 w-2.5 text-muted-foreground/30" />
                    <p className="text-sm font-bold text-foreground/70">{userMessages}</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground/30 font-medium">Tuyos</p>
                </div>
                <div className="px-3 py-2.5 rounded-xl bg-surface/50 border border-border/15 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Sparkles className="h-2.5 w-2.5 text-orange-accent/40" />
                    <p className="text-sm font-bold text-orange-accent/80">{aiMessages}</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground/30 font-medium">IA</p>
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="border-t border-border/10 p-2.5 space-y-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2.5 h-9 text-xs rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
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
                    className="w-full justify-start gap-2.5 h-9 text-xs rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-surface/40 transition-all duration-200"
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
                    className="w-full justify-start gap-2.5 h-9 text-xs rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-surface/40 transition-all duration-200"
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
            initial={{ width: 52, opacity: 1 }}
            animate={{ width: 52, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full flex flex-col items-center border-r border-border/15 bg-sidebar py-4 gap-3 shrink-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-surface/60 transition-all duration-200"
                  onClick={toggleSidebar}
                >
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Abrir panel</TooltipContent>
            </Tooltip>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center shadow-md shadow-orange-accent/15 glow-orange-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
