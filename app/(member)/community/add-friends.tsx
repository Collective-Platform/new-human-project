"use client";

import { useState } from "react";
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
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(
      `/api/friends/search?q=${encodeURIComponent(q.trim())}`
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
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-zinc-400">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or handle..."
          className="w-full rounded-full bg-zinc-100 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="rounded-md bg-white shadow-card divide-y divide-zinc-100">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName ?? ""}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
                  <span className="material-symbols-outlined text-[18px] text-zinc-500">
                    person
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-headline text-sm font-semibold text-foreground">
                  {user.displayName ?? "User"}
                </p>
                {user.searchHandle && (
                  <p className="text-xs text-foreground/50">
                    @{user.searchHandle}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleAdd(user.id)}
                disabled={sentIds.has(user.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  sentIds.has(user.id)
                    ? "bg-zinc-100 text-foreground/40"
                    : "bg-primary text-white active:bg-primary/80"
                }`}
              >
                {sentIds.has(user.id) ? "Sent" : t("addFriend")}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-center text-sm text-foreground/50 py-6">
          No users found
        </p>
      )}
    </div>
  );
}
