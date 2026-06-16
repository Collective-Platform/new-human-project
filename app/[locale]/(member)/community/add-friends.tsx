"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Search, User } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { requestFriend } from "@/src/features/community/actions";

interface SearchResult {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  searchHandle: string | null;
  connectionStatus: "none" | "sent" | "friends";
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("search failed");
    return r.json() as Promise<{ results: SearchResult[] }>;
  });

function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function AddFriends({
  onRequestSent,
  onCancel,
}: {
  onRequestSent: () => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("community");
  const [query, setQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Strip a leading "@" so users can paste "@alice" or type "alice"
  const normalized = query.trim().replace(/^@+/, "");
  const debounced = useDebounced(normalized, 250);
  const shouldSearch = debounced.length >= 2;

  const { data, error, isLoading } = useSWR(
    shouldSearch ? `/api/friends/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true },
  );

  const results = data?.results ?? [];

  function getStatus(user: SearchResult): "friends" | "sent" | "none" {
    if (user.connectionStatus === "friends") return "friends";
    if (user.connectionStatus === "sent" || addedIds.has(user.id)) return "sent";
    return "none";
  }

  async function handleAdd(userId: number) {
    const result = await requestFriend({ receiverId: userId });
    if (!("error" in result)) {
      setAddedIds((prev) => new Set(prev).add(userId));
      onRequestSent();
    }
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            className="w-full rounded-xl border border-outline-variant bg-white py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="shrink-0 text-primary font-bold font-headline active:scale-95 transition-transform"
          >
            {t("cancel")}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {error && !isLoading && (
        <p className="text-center text-sm text-error py-6">{t("searchFailed")}</p>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="flex flex-col gap-4">
          {results.map((user) => (
            <div
              key={user.id}
              className="group bg-white p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-card"
            >
              <Link
                href={`/community/${user.searchHandle ?? user.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.searchHandle ?? ""}
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
                    <User size={24} className="text-on-surface-variant" />
                  </div>
                )}
                <p className="truncate font-headline text-sm font-bold text-on-surface">
                  {user.searchHandle ? `@${user.searchHandle}` : "User"}
                </p>
              </Link>
              {/* Add friend button */}
              {(() => {
                const status = getStatus(user);
                return (
                  <button
                    onClick={() => handleAdd(user.id)}
                    disabled={status !== "none"}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-opacity shrink-0 ${
                      status !== "none"
                        ? "bg-surface-container-highest text-on-surface-variant"
                        : "bg-on-surface text-surface hover:opacity-90"
                    }`}
                  >
                    {status === "friends"
                      ? t("friends")
                      : status === "sent"
                        ? t("requestSent")
                        : t("addFriend")}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {!isLoading && shouldSearch && !error && results.length === 0 && (
        <p className="text-center text-sm text-on-surface-variant py-6">{t("noUsersFound")}</p>
      )}
    </div>
  );
}
