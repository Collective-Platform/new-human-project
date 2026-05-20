"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/src/i18n/navigation";
import { Home, TrendingUp, Users, User, type LucideIcon } from "lucide-react";
import { useNavVisibility } from "./nav-visibility";

const tabs: {
  key: "home" | "progress" | "community" | "profile";
  href: string;
  Icon: LucideIcon;
}[] = [
  { key: "home", href: "/", Icon: Home },
  { key: "progress", href: "/progress", Icon: TrendingUp },
  { key: "community", href: "/community", Icon: Users },
  { key: "profile", href: "/profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const { hidden } = useNavVisibility();

  useEffect(() => {
    const prefetch = () => {
      router.prefetch("/progress");
      router.prefetch("/community");
      router.prefetch("/profile");
    };
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(prefetch);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(prefetch, 200);
    return () => clearTimeout(id);
  }, [router]);

  if (hidden) return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-93.75 items-center justify-around px-4 pt-3 pb-3">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const TabIcon = tab.Icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-col items-center gap-1 min-w-16"
            >
              <span
                className={`flex items-center justify-center w-14 h-9 rounded-full transition-colors ${
                  active ? "bg-primary" : ""
                }`}
              >
                <TabIcon size={22} className={active ? "text-white" : "text-zinc-500"} />
              </span>
              <span
                className={`text-[10px] font-medium ${active ? "text-primary" : "text-zinc-500"}`}
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
