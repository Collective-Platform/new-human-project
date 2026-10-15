"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/src/i18n/navigation";
import { Home, Grid2x2, Users, User, type LucideIcon } from "lucide-react";
import { useNavVisibility } from "./nav-visibility";

const tabs: {
  key: "home" | "block" | "community" | "profile";
  href: string;
  Icon: LucideIcon;
}[] = [
  { key: "home", href: "/", Icon: Home },
  { key: "block", href: "/progress", Icon: Grid2x2 },
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

  const activeIndex = tabs.findIndex((tab) => isActive(tab.href));

  return (
    <nav className="shrink-0 bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 pt-3 pb-3">
        <div className="relative grid grid-cols-4">
          {/* One shared pill that glides to the active tab. A CSS transition
              re-targets from the current position, so a quick second tap
              redirects it mid-flight. Critically damped, no overshoot. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 flex h-9 w-1/4 justify-center transition-[transform,opacity] duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
              opacity: activeIndex === -1 ? 0 : 1,
            }}
          >
            <span className="h-9 w-14 rounded-full bg-primary" />
          </div>
          {tabs.map((tab, i) => {
            const active = i === activeIndex;
            const TabIcon = tab.Icon;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="press relative flex flex-col items-center gap-1"
              >
                <span className="flex h-9 w-14 items-center justify-center">
                  <TabIcon
                    size={22}
                    className={`transition-colors duration-200 ${active ? "text-white" : "text-on-surface-variant"}`}
                  />
                </span>
                <span
                  className={`text-[10px] font-medium transition-colors duration-200 ${active ? "text-primary" : "text-on-surface-variant"}`}
                >
                  {t(tab.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
