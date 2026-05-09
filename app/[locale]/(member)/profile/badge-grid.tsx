"use client";

interface Badge {
  name: string;
  description: string | null;
  iconUrl: string | null;
  blockNumber: number;
  earnedAt: string;
}

export function BadgeGrid({
  badges,
  title,
}: {
  badges: Badge[];
  title: string;
}) {
  return (
    <div className="rounded-md bg-white p-5 shadow-card">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/50">
        {title}
      </p>
      {badges.length === 0 ? (
        <p className="text-sm text-foreground/40">No badges earned yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.blockNumber}
              className="flex flex-col items-center rounded-md bg-zinc-50 p-3"
            >
              {badge.iconUrl ? (
                <img
                  src={badge.iconUrl}
                  alt={badge.name}
                  className="mb-2 h-12 w-12 object-contain"
                />
              ) : (
                <span className="mb-2 text-3xl">🏆</span>
              )}
              <p className="text-center text-xs font-semibold text-foreground">
                {badge.name}
              </p>
              <p className="text-center text-[10px] text-foreground/40">
                {new Date(badge.earnedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
