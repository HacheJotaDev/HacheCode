"use client";

import { motion } from "framer-motion";

interface TokenMeterProps {
  used: number;
  max: number;
}

export function TokenMeter({ used, max }: TokenMeterProps) {
  const percentage = Math.min((used / max) * 100, 100);
  const isHigh = percentage > 80;
  const isMedium = percentage > 50 && !isHigh;

  const getBarColor = () => {
    if (isHigh) return "from-red-500 to-red-400";
    if (isMedium) return "from-amber-500 to-amber-400";
    return "from-orange-accent to-orange-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider">
          Uso de tokens
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {used.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/30">
          {percentage.toFixed(1)}% usado
        </span>
        {isHigh && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-red-400/70"
          >
            Cerca del limite
          </motion.span>
        )}
      </div>
    </div>
  );
}
