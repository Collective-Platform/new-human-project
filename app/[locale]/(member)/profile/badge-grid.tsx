import Image from "next/image";

interface Badge {
  name: string;
  description: string | null;
  iconUrl: string | null;
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
    <div>
      <h3 className="font-headline text-xl font-bold text-on-surface mb-4 px-1">
        {title}
      </h3>
      <div className="rounded-md bg-white p-5 shadow-card grid grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div key={badge.earnedAt} className="flex flex-col items-center">
            {badge.iconUrl ? (
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
    </div>
  );
}
