"use client";

import { usePathname } from "next/navigation";

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/providers": "Providers",
  "/transactions": "Transactions",
  "/tokens": "Token Sales",
  "/disputes": "Disputes",
  "/users": "Users",
  "/settings": "Settings",
};

export default function Header() {
  const pathname = usePathname() ?? "";
  const matchedKey = Object.keys(TITLE_MAP).find((key) =>
    pathname.startsWith(key)
  );
  const title = matchedKey ? TITLE_MAP[matchedKey] : "Local Find Admin";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white px-8">
      <h1 className="text-lg font-semibold text-darkText">{title}</h1>
      <div className="text-sm text-mutedText">Local Find Admin Console</div>
    </header>
  );
}
