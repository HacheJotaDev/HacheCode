"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <motion.span
        className="typing-dot-1 h-1.5 w-1.5 rounded-full bg-orange-accent"
      />
      <motion.span
        className="typing-dot-2 h-1.5 w-1.5 rounded-full bg-orange-accent/70"
      />
      <motion.span
        className="typing-dot-3 h-1.5 w-1.5 rounded-full bg-orange-accent/40"
      />
      <span className="text-[10px] text-muted-foreground/40 ml-1">Pensando...</span>
    </div>
  );
}
