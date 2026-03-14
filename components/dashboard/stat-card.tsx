"use client";

import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

import { Card, CardContent } from "@/ui/card";
import { cn } from "@/lib/utils";

export const StatCard = ({
  title,
  value,
  prefix,
  suffix,
  highlight,
  icon: Icon,
  trend = "neutral"
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  highlight?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
}) => {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 24
  });
  const rounded = useTransform(springValue, (latest) => Math.round(latest).toLocaleString("en-US"));

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full p-5">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{title}</p>
            {Icon ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-card/70 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
              </span>
            ) : null}
            {!Icon && trend === "up" && (
              <span className="inline-flex items-center text-success">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
            )}
            {!Icon && trend === "down" && (
              <span className="inline-flex items-center text-danger">
                <TrendingDown className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {prefix}
            <motion.span>{rounded}</motion.span>
            {suffix}
          </p>
          {highlight && (
            <p
              className={cn("mt-2 text-xs", {
                "text-success": trend === "up" || trend === "neutral",
                "text-danger": trend === "down"
              })}
            >
              {highlight}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
