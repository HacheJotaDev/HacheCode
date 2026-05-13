"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex items-center gap-1.5">
        <motion.span
          className="typing-dot-1 h-2 w-2 rounded-full bg-orange-accent"
        />
        <motion.span
          className="typing-dot-2 h-2 w-2 rounded-full bg-orange-accent/70"
        />
        <motion.span
          className="typing-dot-3 h-2 w-2 rounded-full bg-orange-accent/40"
        />
      </div>
      <span className="text-[11px] text-muted-foreground/50 ml-0.5">Pensando...</span>
    </div>
  );
}
