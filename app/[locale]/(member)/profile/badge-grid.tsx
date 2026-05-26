"use client";

import Image from "next/image";

interface Badge {
  name: string;
  description: string | null;
  iconUrl: string | null;
  blockNumber: number;
  earnedAt: string | null;
}

export function BadgeGrid({ badges, title }: { badges: Badge[]; title: string }) {
  return (
    <div className="rounded-md bg-white p-5 shadow-card">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {title}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge) => {
          const earned = badge.earnedAt !== null;
          return (
            <div
              key={badge.blockNumber}
              className="flex flex-col items-center rounded-md bg-zinc-50 p-3"
            >
              {earned ? (
                badge.iconUrl ? (
                  <Image
                    src={badge.iconUrl}
                    alt={badge.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="mb-2 h-12 w-12 object-contain"
                  />
                ) : (
                  <span className="mb-2 text-3xl">🏆</span>
                )
              ) : (
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-zinc-200">
                  <span className="text-2xl font-bold text-zinc-400">?</span>
                </div>
              )}
              <p className="text-center text-xs font-semibold text-foreground">
                {earned ? badge.name : `Block ${badge.blockNumber}`}
              </p>
              {earned ? (
                <p className="text-center text-[10px] text-foreground/40">
                  {new Date(badge.earnedAt!).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-center text-[10px] text-foreground/40">Locked</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
