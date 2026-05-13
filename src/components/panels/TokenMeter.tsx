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

  const getGlowColor = () => {
    if (isHigh) return "shadow-red-500/30";
    if (isMedium) return "shadow-amber-500/20";
    return "shadow-orange-accent/20";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Token Usage
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {used.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor()} shadow-lg ${getGlowColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60">
          {percentage.toFixed(1)}% used
        </span>
        {isHigh && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-red-400"
          >
            Approaching limit
          </motion.span>
        )}
      </div>
    </div>
  );
}
