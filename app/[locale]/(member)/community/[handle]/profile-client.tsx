"use client";

import { useState } from "react";
import { toggleLike } from "@/src/features/community/actions";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CheckCircle, User, ChevronRight, X } from "lucide-react";
import { ActivityFeed, type FeedItem } from "../activity-feed";
import { Link, useRouter } from "@/src/i18n/navigation";
import {
  requestFriend,
  withdrawFriendRequest,
  removeFriend,
} from "@/src/features/community/actions";

interface FriendSummary {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
  connectionStatus: "friends" | "sent" | "none" | "self";
}

interface Profile {
  id: number;
  displayName: string | null;
  searchHandle: string | null;
  avatarUrl: string | null;
}

function Avatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-surface-container-highest flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <User size={size * 0.4} className="text-on-surface-variant" />
    </div>
  );
}

export function ProfileClient({
  profile,
  activities,
  friends,
  connectionStatus,
  selfUserId,
}: {
  profile: Profile;
  activities: FeedItem[];
  friends: FriendSummary[];
  connectionStatus: "friends" | "sent" | "none";
  selfUserId: number;
}) {
  const router = useRouter();
  const t = useTranslations("community");
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [unfriendOpen, setUnfriendOpen] = useState(false);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [localStatus, setLocalStatus] = useState(connectionStatus);
  const [likeState, setLikeState] = useState<Map<string, { liked: boolean; count: number }>>(
    () => new Map(activities.map((item) => [item.completionId, { liked: item.likedByMe, count: item.likeCount }])),
  );

  async function handleLike(completionId: string) {
    const snapshot = likeState.get(completionId) ?? { liked: false, count: 0 };
    setLikeState((prev) => {
      const current = prev.get(completionId) ?? { liked: false, count: 0 };
      return new Map(prev).set(completionId, {
        liked: !current.liked,
        count: current.count + (current.liked ? -1 : 1),
      });
    });
    const result = await toggleLike({ completionId });
    if ("error" in result) {
      setLikeState((prev) => new Map(prev).set(completionId, snapshot));
    }
  }

  const handle = profile.searchHandle ? `@${profile.searchHandle}` : "User";

  return (
    <div className="min-h-screen bg-surface antialiased">
      {/* Header */}
      <header className="w-full sticky top-0 z-40 bg-surface">
        <div className="flex items-center justify-between px-6 h-14 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-primary font-bold active:scale-95 transition-transform"
          >
            <ChevronRight size={22} className="rotate-180" />
          </button>
          <div />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6  pb-8">
        {/* Profile header */}
        <section className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col align-middle">
                {profile.searchHandle && (
                  <h2 className="font-headline text-3xl font-medium tracking-tight text-on-surface">
                    {handle}
                  </h2>
                )}
                {localStatus === "friends" && (
                  <button
                    onClick={() => setFriendsOpen(true)}
                    className="self-start mt-4 inline-flex items-center gap-1.5 px-3 py-1 border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                  >
                    <User size={14} />
                    <span className="text-xs font-medium font-headline">
                      {t("friendsCount", { count: friends.length })}
                    </span>
                  </button>
                )}
              </div>
              {localStatus === "friends" ? (
                <button
                  onClick={() => setUnfriendOpen(true)}
                  className="self-start flex items-center gap-2 mt-4 px-5 py-2 rounded-full border border-outline-variant text-on-surface-variant text-xs font-bold font-headline active:scale-95 transition-transform"
                >
                  <CheckCircle size={16} className="text-primary" />
                  {t("friend")}
                </button>
              ) : localStatus === "sent" ? (
                <button
                  onClick={async () => {
                    setLocalStatus("none");
                    await withdrawFriendRequest({ receiverId: profile.id });
                  }}
                  className="self-start flex items-center gap-2 px-5 py-2 rounded-full border border-outline-variant text-on-surface-variant text-xs font-bold font-headline active:scale-95 transition-transform"
                >
                  {t("withdrawRequest")}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    setLocalStatus("sent");
                    await requestFriend({ receiverId: profile.id });
                  }}
                  className="self-start flex items-center justify-center px-5 py-2.5 rounded-full bg-primary text-surface text-sm font-bold font-headline active:scale-95 transition-transform"
                >
                  {t("addFriend")}
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-xl flex items-center justify-center">
                <Avatar url={profile.avatarUrl} name={handle} size={96} />
              </div>
            </div>
          </div>
        </section>

        {/* Activities */}
        <section>
          {connectionStatus !== "friends" ? (
            <></>
          ) : activities.length === 0 ? (
            <>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4 px-1">
                {t("activities")}
              </h3>
              <div className="bg-white p-5 rounded-2xl text-center text-sm text-on-surface-variant">
                {t("noActivitiesYet")}
              </div>
            </>
          ) : (
            <>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4 px-1">
                {t("activities")}
              </h3>
              <ActivityFeed
                items={activities}
                selfUserId={selfUserId}
                onLike={handleLike}
                likeOverrides={likeState}
              />
            </>
          )}
        </section>
      </main>

      {/* Unfriend confirmation dialog */}
      {unfriendOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setUnfriendOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-headline font-bold text-lg text-primary">{t("unfriendTitle")}</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {t("unfriendConfirm", { name: handle })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUnfriendOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-outline-variant font-bold font-headline text-on-surface active:scale-95 transition-transform"
              >
                {t("cancel")}
              </button>
              <button
                onClick={async () => {
                  setUnfriendOpen(false);
                  setLocalStatus("none");
                  await removeFriend({ friendId: profile.id });
                }}
                className="flex-1 py-3 rounded-2xl bg-primary text-surface font-bold font-headline active:scale-95 transition-transform"
              >
                {t("unfriend")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friends popup */}
      {friendsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setFriendsOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                {t("friendsCount", { count: friends.length })}
              </h3>
              <button
                onClick={() => setFriendsOpen(false)}
                className="text-outline hover:text-on-surface transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {friends.length === 0 ? (
              <div className="px-5 pb-6 text-sm text-on-surface-variant text-center">
                {t("noFriendsYet")}
              </div>
            ) : (
              <div className="overflow-y-auto max-h-96 px-4 pb-5 space-y-3">
                {friends.map((f) => {
                  const name = f.searchHandle ? `@${f.searchHandle}` : "User";
                  const popupStatus = sentIds.has(f.id) ? "sent" : f.connectionStatus;
                  return (
                    <div key={f.id} className="flex items-center gap-3">
                      <Link
                        href={`/community/${f.searchHandle ?? f.id}`}
                        onClick={() => setFriendsOpen(false)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <Avatar url={f.avatarUrl} name={name} size={40} />
                        <span className="flex-1 truncate font-headline font-medium text-sm text-on-surface">
                          {name}
                        </span>
                      </Link>
                      {popupStatus === "self" ? null : popupStatus === "friends" ? (
                        <span className="text-xs font-bold text-on-surface-variant px-3 py-1 rounded-full border border-outline-variant shrink-0">
                          {t("friend")}
                        </span>
                      ) : popupStatus === "sent" ? (
                        <span className="text-xs font-bold text-on-surface-variant px-3 py-1 rounded-full border border-outline-variant shrink-0">
                          {t("requestSent")}
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            setSentIds((prev) => new Set(prev).add(f.id));
                            await requestFriend({ receiverId: f.id });
                          }}
                          className="text-xs font-bold text-primary px-3 py-1 rounded-full border border-primary active:scale-95 transition-transform shrink-0"
                        >
                          {t("add")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
