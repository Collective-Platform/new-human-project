"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const tabs = [
  { key: "home" as const, href: "/", icon: "home" },
  { key: "progress" as const, href: "/progress", icon: "trending_up" },
  { key: "community" as const, href: "/community", icon: "group" },
  { key: "profile" as const, href: "/profile", icon: "person" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/20 bg-white/70 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-5xl items-center justify-around px-4 pt-2 pb-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-w-16"
            >
              <span
                className={`flex items-center justify-center w-12 h-8 rounded-full transition-colors ${
                  active ? "bg-primary" : ""
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    active ? "text-white" : "text-zinc-500"
                  }`}
                  style={
                    active ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {tab.icon}
                </span>
              </span>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-primary" : "text-zinc-500"
                }`}
              >
                {t(tab.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
