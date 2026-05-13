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
} from "lucide-react";
import { useTheme } from "next-themes";
import { FileTree } from "./FileTree";
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

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence mode="wait" initial={false}>
        {sidebarOpen ? (
          <motion.aside
            key="sidebar-open"
            initial={{ width: 256, opacity: 1 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="h-full flex flex-col border-r border-border/60 bg-sidebar overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-sidebar" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground tracking-tight">
                    Claude Code
                  </h1>
                  <p className="text-[10px] text-muted-foreground/60">
                    Asistente IA de codigo
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground/60 hover:text-foreground"
                    onClick={toggleSidebar}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar panel</TooltipContent>
              </Tooltip>
            </div>

            <Separator className="bg-border/50" />

            {/* Nueva sesion */}
            <div className="px-3 py-2.5">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-9 text-xs rounded-lg border-border/60 hover:border-orange-accent/30 hover:bg-orange-accent/5 hover:text-orange-accent transition-all"
                onClick={clearChat}
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva sesion
              </Button>
            </div>

            {/* Sesion activa */}
            <div className="px-3 py-1">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-orange-accent/6 border border-orange-accent/10">
                <MessageSquare className="h-3.5 w-3.5 text-orange-accent" />
                <span className="text-xs font-medium text-orange-accent">
                  Sesion actual
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] h-4.5 px-1.5 bg-orange-accent/8 text-orange-accent border-orange-accent/15"
                >
                  {messages.length}
                </Badge>
              </div>
            </div>

            <Separator className="bg-border/40 my-1" />

            {/* Explorador */}
            <div className="flex-1 overflow-y-auto min-h-0 px-1">
              <div className="px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                  Explorador
                </p>
              </div>
              <FileTree />
            </div>

            {/* Footer */}
            <div className="border-t border-border/40 p-2 space-y-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs rounded-md text-muted-foreground/70 hover:text-foreground"
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
                    className="w-full justify-start gap-2 h-8 text-xs rounded-md text-muted-foreground/70 hover:text-foreground"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configuracion
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
            className="h-full flex flex-col items-center border-r border-border/60 bg-sidebar py-3 gap-3 shrink-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-muted-foreground/60 hover:text-foreground"
                  onClick={toggleSidebar}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Abrir panel</TooltipContent>
            </Tooltip>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
