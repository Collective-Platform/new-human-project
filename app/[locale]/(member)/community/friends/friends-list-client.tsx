"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { User, Minus, ChevronRight } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { removeFriend } from "@/src/features/community/actions";

interface Friend {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  lastActivity: string | null;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={48}
        height={48}
        unoptimized
        className="w-12 h-12 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
      <User size={20} className="text-on-surface-variant" />
    </div>
  );
}

export function FriendsListClient({
  friends: initialFriends,
}: {
  friends: Friend[];
}) {
  const router = useRouter();
  const t = useTranslations("community");
  const [editing, setEditing] = useState(false);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [pendingRemove, setPendingRemove] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const visible = initialFriends.filter((f) => !removed.has(f.id));

  function confirmRemove() {
    if (!pendingRemove) return;
    const { id } = pendingRemove;
    setRemoved((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await removeFriend({ friendId: id });
    });
    setPendingRemove(null);
  }

  function handleDone() {
    setEditing(false);
    if (removed.size > 0) router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface antialiased">
      {/* Header */}
      <header className="w-full sticky top-0 z-40 bg-surface">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 h-14 max-w-2xl mx-auto">
          {editing ? (
            <div />
          ) : (
            <button
              onClick={() => router.back()}
              className="text-primary font-bold active:scale-95 transition-transform justify-self-start"
            >
              <ChevronRight size={22} className="rotate-180" />
            </button>
          )}

          <h2 className="font-headline font-bold text-on-surface">
            {t("friendsCount", { count: visible.length })}
          </h2>

          <div className="flex justify-end">
            {editing ? (
              <button
                onClick={handleDone}
                disabled={isPending}
                className="text-primary font-bold font-headline active:scale-95 transition-transform disabled:opacity-50"
              >
                {t("done")}
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-on-surface-variant font-semibold font-headline hover:text-primary transition-colors active:scale-95"
              >
                {t("edit")}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-4 pb-32">
        {visible.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center text-on-surface-variant">
            <User size={40} className="mb-3 opacity-30" />
            <p className="font-headline font-medium">{t("noFriendsYet")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((friend) => {
              const name = friend.searchHandle
                ? `@${friend.searchHandle}`
                : "User";

              return (
                <div
                  key={friend.id}
                  className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(53,50,47,0.03)]"
                >
                  {editing && (
                    <button
                      onClick={() => setPendingRemove({ id: friend.id, name })}
                      aria-label={t("removeAriaLabel", { name })}
                      className="w-7 h-7 flex items-center justify-center bg-primary rounded-full text-surface shrink-0 active:scale-90 transition-transform"
                    >
                      <Minus size={14} />
                    </button>
                  )}

                  {editing ? (
                    <>
                      <Avatar url={friend.avatarUrl} name={name} />
                      <span className="font-headline font-bold text-on-surface flex-1 truncate">
                        {name}
                      </span>
                    </>
                  ) : (
                    <Link
                      href={`/community/${friend.searchHandle ?? friend.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <Avatar url={friend.avatarUrl} name={name} />
                      <span className="font-headline font-bold text-on-surface flex-1 truncate">
                        {name}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-outline shrink-0"
                      />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Unfriend confirmation dialog */}
      {pendingRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setPendingRemove(null)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-headline font-bold text-lg text-primary">
                {t("unfriendTitle")}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {t("unfriendConfirm", { name: pendingRemove.name })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingRemove(null)}
                className="flex-1 py-3 rounded-2xl border border-outline-variant font-bold font-headline text-on-surface active:scale-95 transition-transform"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmRemove}
                disabled={isPending}
                className="flex-1 py-3 rounded-2xl bg-primary text-on-primary font-bold font-headline active:scale-95 transition-transform disabled:opacity-50"
              >
                {t("unfriend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
