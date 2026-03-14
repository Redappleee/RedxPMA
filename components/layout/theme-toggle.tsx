"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/ui/button";

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button size="icon" variant="ghost" className="opacity-0" />;
  }

  const darkMode = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(darkMode ? "light" : "dark")}
      className="relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={darkMode ? "moon" : "sun"}
          initial={{ y: 10, opacity: 0, rotate: -20 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -10, opacity: 0, rotate: 20 }}
          transition={{ duration: 0.2 }}
        >
          {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
};
