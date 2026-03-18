"use client";

import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { useSettingsStore } from "@/store/settings-store";

export const Logo = () => {
  const { companyName, logoUrl } = useSettingsStore((state) => state.settings.workspace);

  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <div
        className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 shadow-glow transition-transform duration-300 group-hover:rotate-6"
        style={
          logoUrl
            ? {
                backgroundImage: `url(${logoUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }
            : undefined
        }
      />
      <span className="text-lg font-semibold tracking-tight">{companyName || APP_NAME}</span>
    </Link>
  );
};
