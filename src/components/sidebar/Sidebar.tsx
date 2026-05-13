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
            initial={{ width: 260, opacity: 1 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full flex flex-col border-r border-border bg-sidebar overflow-hidden shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-sidebar" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground tracking-tight">
                    Claude Code
                  </h1>
                  <p className="text-[10px] text-muted-foreground">
                    AI Coding Assistant
                  </p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={toggleSidebar}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Close sidebar</TooltipContent>
              </Tooltip>
            </div>

            <Separator className="bg-border" />

            {/* New Chat */}
            <div className="px-3 py-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-8 text-xs border-dashed border-border hover:border-orange-accent/40 hover:bg-orange-accent/5 hover:text-orange-accent"
                onClick={clearChat}
              >
                <Plus className="h-3.5 w-3.5" />
                New Session
              </Button>
            </div>

            {/* Active Session */}
            <div className="px-3 py-1">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-orange-accent/8 border border-orange-accent/15">
                <MessageSquare className="h-3.5 w-3.5 text-orange-accent" />
                <span className="text-xs font-medium text-orange-accent truncate">
                  Current Session
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] h-4 px-1.5 bg-orange-accent/10 text-orange-accent border-orange-accent/20"
                >
                  {messages.length}
                </Badge>
              </div>
            </div>

            <Separator className="bg-border my-1" />

            {/* File Explorer */}
            <div className="flex-1 overflow-y-auto min-h-0 px-1">
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Explorer
                </p>
              </div>
              <FileTree />
            </div>

            {/* Footer */}
            <div className="border-t border-border p-2 space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? (
                      <Sun className="h-3.5 w-3.5" />
                    ) : (
                      <Moon className="h-3.5 w-3.5" />
                    )}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Toggle theme</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            </div>
          </motion.aside>
        ) : (
          <motion.div
            key="sidebar-collapsed"
            initial={{ width: 44, opacity: 1 }}
            animate={{ width: 44, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full flex flex-col items-center border-r border-border bg-sidebar py-3 gap-2 shrink-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={toggleSidebar}
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Open sidebar</TooltipContent>
            </Tooltip>
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-accent to-orange-600 flex items-center justify-center mt-1">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
