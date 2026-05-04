"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface SearchResult {
  id: number;
  displayName: string | null;
  avatarUrl: string | null;
  searchHandle: string | null;
}

export function AddFriends({
  onRequestSent,
}: {
  onRequestSent: () => void;
}) {
  const t = useTranslations("community");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  async function handleSearch(q: string) {
    setQuery(q);
    // Strip a leading "@" so users can paste "@alice" or type "alice"
    const normalized = q.trim().replace(/^@+/, "");
    if (normalized.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(
      `/api/friends/search?q=${encodeURIComponent(normalized)}`
    );
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
    }
    setLoading(false);
  }

  async function handleAdd(userId: number) {
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    });
    if (res.ok) {
      setSentIds((prev) => new Set(prev).add(userId));
      onRequestSent();
    }
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search username (e.g. alice)…"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-xl border border-outline-variant bg-white py-3 pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-4">
          {results.map((user) => (
            <div
              key={user.id}
              className="group bg-white p-5 rounded-2xl flex items-center gap-4 transition-all hover:shadow-card"
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName ?? ""}
                  width={56}
                  height={56}
                  unoptimized
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    person
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-headline text-sm font-bold text-on-surface">
                  {user.displayName ?? "User"}
                </p>
                {user.searchHandle && (
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    @{user.searchHandle}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleAdd(user.id)}
                disabled={sentIds.has(user.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-opacity shrink-0 ${
                  sentIds.has(user.id)
                    ? "bg-surface-container-highest text-on-surface-variant"
                    : "bg-on-surface text-surface hover:opacity-90"
                }`}
              >
                {sentIds.has(user.id) ? "Sent" : t("addFriend")}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-center text-sm text-on-surface-variant py-6">
          No users found
        </p>
      )}
    </div>
  );
}
