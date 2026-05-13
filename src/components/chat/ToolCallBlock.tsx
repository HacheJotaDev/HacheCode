"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  FileEdit,
  Terminal,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { ToolUse } from "@/store/chat-store";

const TOOL_ICONS = {
  file_read: FileSearch,
  file_write: FileEdit,
  bash_command: Terminal,
  search: Search,
};

const TOOL_COLORS = {
  file_read: "text-sky-400",
  file_write: "text-emerald-400",
  bash_command: "text-amber-400",
  search: "text-violet-400",
};

const TOOL_BG = {
  file_read: "bg-sky-400/8 border-sky-400/15",
  file_write: "bg-emerald-400/8 border-emerald-400/15",
  bash_command: "bg-amber-400/8 border-amber-400/15",
  search: "bg-violet-400/8 border-violet-400/15",
};

interface ToolCallBlockProps {
  tool: ToolUse;
}

export function ToolCallBlock({ tool }: ToolCallBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = TOOL_ICONS[tool.type];
  const colorClass = TOOL_COLORS[tool.type];
  const bgClass = TOOL_BG[tool.type];

  return (
    <div className="my-2">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${bgClass}`}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${colorClass}`} />
        <span className={colorClass}>{tool.label}</span>
        {tool.detail && (
          <span className="text-muted-foreground truncate">
            {tool.detail}
          </span>
        )}
        <CheckCircle2 className="h-3 w-3 ml-auto shrink-0 text-emerald-500/60" />
      </motion.button>

      <AnimatePresence>
        {isExpanded && (tool.output || tool.detail) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mt-1 px-3 py-2 rounded-md bg-[#0d0e14] border border-border/50 font-mono text-[11px] text-muted-foreground max-h-40 overflow-y-auto">
              {tool.output || (tool.detail ? `Path: ${tool.detail}` : "No output")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
