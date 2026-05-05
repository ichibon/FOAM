"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  accentBorder?: boolean;
  delay?: number;
  animate?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = true,
  accentBorder = false,
  delay = 0,
  animate = true,
}: CardProps) {
  const base = `bg-foam-elevated rounded-card border shadow-level-1 ${
    accentBorder ? "border-foam-accent" : "border-foam-border"
  } ${className}`;

  if (!animate) {
    return <div className={base}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" as const }}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.12), 0 0 0 2px rgba(51,157,199,0.3)",
              transition: { duration: 0.2, ease: "easeOut" as const },
            }
          : {}
      }
      className={base}
    >
      {children}
    </motion.div>
  );
}
