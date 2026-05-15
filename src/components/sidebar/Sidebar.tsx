"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Plus,
  Moon,
  Sun,
  Trash2,
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

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, clearChat } = useChatStore();
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
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full flex flex-col border-r border-border/15 bg-sidebar overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-hache-ia.png"
                  alt="Hache IA"
                  className="h-8 w-8 rounded-xl object-cover"
                />
                <div>
                  <h1 className="text-sm font-bold text-foreground tracking-tight">
                    Hache IA
                  </h1>
                  <p className="text-[10px] text-muted-foreground/40 font-medium">
                    Tu Asistente Inteligente
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
        ) : null}
      </AnimatePresence>
    </TooltipProvider>
  );
}
