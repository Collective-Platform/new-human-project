"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | { error: string } | null>(null);

  async function handleSend() {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: message, url: url.trim() || "/" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ sent: data.sent });
        setTitle("");
        setMessage("");
        setUrl("");
      } else {
        setResult({ error: data.error ?? "Failed to send" });
      }
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="px-4 pb-4 space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-foreground/50">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rhythm Live is happening!"
          maxLength={100}
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-foreground/50">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Join us on 4th July at 7pm"
          maxLength={300}
          rows={3}
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-foreground/50">Link (optional)</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/dashboard"
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {result && (
        <p
          className={`text-xs font-medium ${"error" in result ? "text-red-600" : "text-green-600"}`}
        >
          {"error" in result ? result.error : `Sent to ${result.sent} user${result.sent === 1 ? "" : "s"}`}
        </p>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !title.trim() || !message.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {sending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Send size={15} />
        )}
        {sending ? "Sending…" : "Send to all subscribers"}
      </button>
    </div>
  );
}
