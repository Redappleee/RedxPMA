import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export const Logo = () => {
  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 shadow-glow transition-transform duration-300 group-hover:rotate-6" />
      <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
};
