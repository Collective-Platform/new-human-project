"use client";

import { useEffect, useRef, useState } from "react";

// Runs inside every sample-data frame. Blocks anything that would save data
// (server actions, POST/PUT/DELETE) and answers a few GET calls with sample data.
// Picking text for editing is done from the board side (see board.tsx).

export function FrameBridge({
  stubs,
}: {
  /** Fake answers for GET requests, keyed by path (e.g. "/api/profile"). */
  stubs?: Record<string, unknown>;
}) {
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const realFetch = window.fetch.bind(window);
    const loadedAt = Date.now();
    function showToast() {
      // Popups that save on open (e.g. "mark read") would flash this on load.
      if (Date.now() - loadedAt < 2500) return;
      setToast(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(false), 2200);
    }
    window.fetch = (input, init) => {
      const method = (
        init?.method ?? (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      if (method === "GET" || method === "HEAD") {
        const url = new URL(input instanceof Request ? input.url : String(input), location.href);
        const stub = stubs?.[url.pathname];
        if (stub !== undefined) {
          return Promise.resolve(
            new Response(JSON.stringify(stub), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          );
        }
        return realFetch(input, init);
      }
      showToast();
      const headers = new Headers(init?.headers);
      // A server action: never answer, so the button simply stays busy.
      if (headers.has("next-action")) return new Promise<Response>(() => {});
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true, preview: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    };
    return () => {
      window.fetch = realFetch;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 99999,
        background: "#171616",
        color: "white",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
        textAlign: "center",
      }}
    >
      Preview only — nothing is saved from the board.
    </div>
  );
}
