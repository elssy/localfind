"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Coins,
  Scale,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/providers", label: "Providers", icon: Users },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/tokens", label: "Token Sales", icon: Coins },
  { href: "/disputes", label: "Disputes", icon: Scale },
  { href: "/users", label: "Users", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center border-b border-border px-5">
        <span className="text-lg font-semibold tracking-tight text-primary">
          LOCAL FIND
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 border-l-[3px] px-5 py-2.5 text-sm transition-colors ${
                active
                  ? "border-primary bg-primaryTint font-medium text-primary"
                  : "border-transparent text-midText hover:bg-background"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            A
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-darkText">Admin</p>
            <button className="flex items-center gap-1 text-xs text-mutedText hover:text-danger">
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
