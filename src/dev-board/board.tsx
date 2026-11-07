"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRAMES, GROUPS, frameUrl, type FrameDef } from "./registry";

// The design board: a pan-and-zoom canvas where every screen is a live frame.
// Dev only. Edits are written to the real source files by /api/dev/board.

type Lang = "en" | "zh";
interface Pos {
  x: number;
  y: number;
}
interface FrameState {
  lang: Lang;
  width: number;
  interact: boolean;
  edit: boolean;
  reload: number;
}
interface Picked {
  frameId: string;
  text: string;
  classes: string;
  tag: string;
}
interface Match {
  file: string;
  line: number;
  kind: "messages" | "source";
  context: string;
  key?: string;
}
interface Member {
  id: number;
  email: string;
  displayName: string | null;
  searchHandle: string | null;
  role: string;
  status: string;
}
interface Token {
  name: string;
  value: string;
  line: number;
  saved?: string;
}

const STORE = "rhythm-board-v2";
// v1 had a different set of frames. Keep its settings, but not its layout.
const OLD_STORE = "rhythm-board-v1";
const TITLE_H = 40;
const GAP_X = 70;
const GAP_Y = 150;
const PER_ROW = 6;
const WIDTHS = [390, 768, 1280];

function defaultLayout(): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  let y = 0;
  for (const g of GROUPS) {
    const frames = FRAMES.filter((f) => f.group === g.id);
    for (let i = 0; i < frames.length; i += PER_ROW) {
      const row = frames.slice(i, i + PER_ROW);
      let x = 0;
      for (const f of row) {
        out[f.id] = { x, y: y + 70 };
        x += f.width + GAP_X;
      }
      y += 70 + TITLE_H + Math.max(...row.map((f) => f.height)) + GAP_Y;
    }
  }
  return out;
}

function groupLabelPositions(layout: Record<string, Pos>) {
  return GROUPS.map((g) => {
    const first = FRAMES.find((f) => f.group === g.id)!;
    return { ...g, x: layout[first.id].x, y: layout[first.id].y - 56 };
  });
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "x-board": "1", "content-type": "application/json", ...init?.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json as T;
}

export function Board() {
  const [layout, setLayout] = useState<Record<string, Pos>>(defaultLayout);
  const [states, setStates] = useState<Record<string, FrameState>>({});
  const [view, setView] = useState({ x: 40, y: 140, z: 0.35 });
  const [selected, setSelected] = useState<string | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [tab, setTab] = useState<"selected" | "colours">("selected");
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  // "Local DB data" mode: frames show real rows from the local database as one member.
  const [dataMode, setDataMode] = useState<"sample" | "local">("sample");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [dataMsg, setDataMsg] = useState<string | null>(null);
  const [reloadAll, setReloadAll] = useState(0);
  const useDb = dataMode === "local" && memberId !== null;
  // Frames the user added on the board (saved in this browser only).
  const [custom, setCustom] = useState<FrameDef[]>([]);
  const [adding, setAdding] = useState(false);
  const allFrames = useMemo(() => [...FRAMES, ...custom], [custom]);

  // Restore saved layout.
  useEffect(() => {
    try {
      const current = localStorage.getItem(STORE);
      const saved = JSON.parse(current ?? localStorage.getItem(OLD_STORE) ?? "null");
      if (saved) {
        if (!current) {
          delete saved.layout;
          delete saved.states;
        }
        if (saved.layout) setLayout({ ...defaultLayout(), ...saved.layout });
        if (saved.states) setStates(saved.states);
        if (saved.view) setView(saved.view);
        if (saved.custom) setCustom(saved.custom);
        if (saved.dataMode === "local") setDataMode("local");
        if (saved.memberId) setMemberId(saved.memberId);
      }
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(
      () =>
        localStorage.setItem(
          STORE,
          JSON.stringify({
            layout,
            states: Object.fromEntries(
              Object.entries(states).map(([k, v]) => [k, { ...v, interact: false, edit: false }]),
            ),
            view,
            dataMode,
            memberId,
            custom,
          }),
        ),
      300,
    );
    return () => clearTimeout(id);
  }, [layout, states, view, dataMode, memberId, custom]);

  useEffect(() => {
    const measure = () => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (r) setVp({ w: r.width, h: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Keep the "view as" cookie in step with the mode. It is cleared in sample mode
  // so the rest of the local site is not affected.
  useEffect(() => {
    if (!loaded.current) return;
    document.cookie =
      dataMode === "local" && memberId !== null
        ? `board_user=${memberId}; path=/; SameSite=Lax`
        : "board_user=; path=/; max-age=0";
  }, [dataMode, memberId]);

  useEffect(() => {
    if (dataMode !== "local" || members) return;
    api<{ members: Member[] }>("/api/dev/board?action=members")
      .then((r) => {
        setMembers(r.members);
        setMemberId((cur) => (cur && r.members.some((m) => m.id === cur) ? cur : null));
        setDataMsg(null);
      })
      .catch((e) => {
        setDataMsg(e instanceof Error ? e.message : "Could not read members");
        setDataMode("sample");
      });
  }, [dataMode, members]);

  function addFrame(def: Omit<FrameDef, "id" | "group" | "custom">) {
    const id = `custom-${Date.now().toString(36)}`;
    // Drop it in the middle of what the user is looking at.
    const x = (vp.w / 2 - view.x) / view.z - def.width / 2;
    const y = (vp.h / 2 - view.y) / view.z - def.height / 2;
    setCustom((c) => [...c, { ...def, id, group: "popups", custom: true }]);
    setLayout((l) => ({ ...l, [id]: { x, y } }));
    setSelected(id);
    setAdding(false);
  }

  function removeFrame(id: string) {
    setCustom((c) => c.filter((f) => f.id !== id));
    setSelected((s) => (s === id ? null : s));
  }

  function pickMember(id: number | null) {
    setMemberId(id);
    // Wait one tick so the cookie is set before frames reload.
    setTimeout(() => setReloadAll((n) => n + 1), 50);
  }

  const stateOf = useCallback((f: FrameDef): FrameState => stateOfRaw(f, states), [states]);
  const patch = (id: string, p: Partial<FrameState>) =>
    setStates((s) => ({
      ...s,
      [id]: { ...stateOfRaw(allFrames.find((f) => f.id === id)!, s), ...p },
    }));

  // Pan and zoom.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setView((v) => {
          const z = Math.min(2, Math.max(0.08, v.z * Math.exp(-e.deltaY * 0.01)));
          return { z, x: cx - ((cx - v.x) / v.z) * z, y: cy - ((cy - v.y) / v.z) * z };
        });
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function zoomBy(factor: number) {
    setView((v) => {
      const z = Math.min(2, Math.max(0.08, v.z * factor));
      const cx = vp.w / 2;
      const cy = vp.h / 2;
      return { z, x: cx - ((cx - v.x) / v.z) * z, y: cy - ((cy - v.y) / v.z) * z };
    });
  }

  function onCanvasDown(e: React.PointerEvent) {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.pan) return;
    setSelected(null);
    const start = { x: e.clientX, y: e.clientY };
    const origin = { ...view };
    const move = (ev: PointerEvent) =>
      setView((v) => ({
        ...v,
        x: origin.x + ev.clientX - start.x,
        y: origin.y + ev.clientY - start.y,
      }));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onTitleDown(e: React.PointerEvent, f: FrameDef) {
    if ((e.target as HTMLElement).closest("button,select")) return;
    e.stopPropagation();
    setSelected(f.id);
    const start = { x: e.clientX, y: e.clientY };
    const origin = layout[f.id];
    const move = (ev: PointerEvent) =>
      setLayout((l) => ({
        ...l,
        [f.id]: {
          x: origin.x + (ev.clientX - start.x) / view.z,
          y: origin.y + (ev.clientY - start.y) / view.z,
        },
      }));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // Which frames are on screen (so we only load those).
  const visible = useMemo(() => {
    const out = new Set<string>();
    if (view.z < 0.12) return out;
    for (const f of allFrames) {
      const p = layout[f.id];
      const w = (states[f.id]?.width ?? f.width) * view.z;
      const sx = p.x * view.z + view.x;
      const sy = p.y * view.z + view.y;
      const h = (f.height + TITLE_H) * view.z;
      if (sx < vp.w + 200 && sx + w > -200 && sy < vp.h + 200 && sy + h > -200) out.add(f.id);
    }
    return out;
  }, [layout, states, view, vp, allFrames]);
  useEffect(() => {
    setSeen((s) => {
      let changed = false;
      const next = new Set(s);
      visible.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : s;
    });
  }, [visible]);

  // Edit mode: pick text/classes inside the (same-origin) frame.
  function attachPicker(f: FrameDef, iframe: HTMLIFrameElement) {
    const doc = iframe.contentDocument;
    if (!doc || (doc as unknown as { __boardPicker?: boolean }).__boardPicker) return;
    (doc as unknown as { __boardPicker?: boolean }).__boardPicker = true;
    const style = doc.createElement("style");
    style.textContent =
      "[data-board-hover]{outline:2px solid #2563eb !important;outline-offset:-2px;cursor:crosshair !important}";
    doc.head.appendChild(style);
    let hovered: Element | null = null;
    const editing = () => iframe.dataset.edit === "1";
    doc.addEventListener(
      "mouseover",
      (e) => {
        if (!editing()) return;
        hovered?.removeAttribute("data-board-hover");
        hovered = e.target as Element;
        hovered.setAttribute("data-board-hover", "");
      },
      true,
    );
    doc.addEventListener(
      "click",
      (e) => {
        if (!editing()) return;
        e.preventDefault();
        e.stopPropagation();
        const el = e.target as HTMLElement;
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent ?? "")
          .join("")
          .trim();
        const text = el.children.length === 0 ? (el.textContent ?? "").trim() : own;
        el.removeAttribute("data-board-hover");
        const classes = (el.getAttribute("class") ?? "").replace(/\s+/g, " ").trim();
        setPicked({ frameId: f.id, text, classes, tag: el.tagName.toLowerCase() });
        setSelected(f.id);
        setTab("selected");
      },
      true,
    );
  }

  const labels = groupLabelPositions(layout);
  const sel = allFrames.find((f) => f.id === selected) ?? null;

  return (
    <div className="fixed inset-0 flex bg-[#e9e9e7] text-[13px] text-neutral-800">
      <div className="relative flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md">
          <strong className="mr-1">Rhythm board</strong>
          <button
            className="rounded px-2 py-1 hover:bg-neutral-100"
            onClick={() => zoomBy(1 / 1.25)}
          >
            −
          </button>
          <span className="w-10 text-center tabular-nums">{Math.round(view.z * 100)}%</span>
          <button className="rounded px-2 py-1 hover:bg-neutral-100" onClick={() => zoomBy(1.25)}>
            +
          </button>
          <span className="mx-1 h-4 w-px bg-neutral-300" />
          <button
            className="rounded px-2 py-1 hover:bg-neutral-100"
            onClick={() => setView({ x: 40, y: 140, z: 0.35 })}
          >
            Top-left
          </button>
          <button
            className="rounded px-2 py-1 hover:bg-neutral-100"
            onClick={() =>
              setStates((s) =>
                Object.fromEntries(
                  allFrames.map((f) => [f.id, { ...stateOfRaw(f, s), lang: "en" as Lang }]),
                ),
              )
            }
          >
            All EN
          </button>
          <button
            className="rounded px-2 py-1 hover:bg-neutral-100"
            onClick={() =>
              setStates((s) =>
                Object.fromEntries(
                  allFrames.map((f) => [f.id, { ...stateOfRaw(f, s), lang: "zh" as Lang }]),
                ),
              )
            }
          >
            All 中文
          </button>
          <span className="mx-1 h-4 w-px bg-neutral-300" />
          <button
            className="rounded bg-neutral-900 px-2 py-1 text-white"
            onClick={() => setAdding(true)}
          >
            + Add frame
          </button>
          <span className="mx-1 h-4 w-px bg-neutral-300" />
          <span className="text-neutral-500">Data:</span>
          <div className="flex overflow-hidden rounded border border-neutral-300">
            <button
              className={`px-2 py-1 ${dataMode === "sample" ? "bg-blue-600 text-white" : "hover:bg-neutral-100"}`}
              onClick={() => {
                setDataMode("sample");
                setReloadAll((n) => n + 1);
              }}
            >
              Sample
            </button>
            <button
              title="Real rows from your local database (read-only)"
              className={`px-2 py-1 ${dataMode === "local" ? "bg-blue-600 text-white" : "hover:bg-neutral-100"}`}
              onClick={() => setDataMode("local")}
            >
              Local DB
            </button>
          </div>
          {dataMode === "local" && members && (
            <select
              value={memberId ?? ""}
              onChange={(e) => pickMember(e.target.value ? Number(e.target.value) : null)}
              className="max-w-[200px] rounded border border-neutral-300 px-1 py-1"
            >
              <option value="">Pick a member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.searchHandle ? `@${m.searchHandle}` : m.email} · {m.role}
                </option>
              ))}
            </select>
          )}
          <span className="mx-1 h-4 w-px bg-neutral-300" />
          <button
            className="rounded px-2 py-1 hover:bg-neutral-100"
            onClick={() => {
              if (confirm("Put every frame back in its starting place?"))
                setLayout(defaultLayout());
            }}
          >
            Reset layout
          </button>
        </div>
        {(dataMsg || (dataMode === "local" && memberId === null)) && (
          <div className="absolute left-3 top-16 z-20 rounded-lg bg-amber-100 px-3 py-1.5 text-xs text-amber-900 shadow">
            {dataMsg ?? "Pick a member to load their real data from the local database."}
          </div>
        )}
        <div className="absolute bottom-3 left-3 z-20 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-neutral-500 shadow">
          Drag background to pan · Ctrl/⌘ + scroll to zoom · drag a title bar to move · pencil =
          pick text or classes to edit
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          onPointerDown={onCanvasDown}
          style={{
            backgroundImage: "radial-gradient(#c9c9c5 1px, transparent 1px)",
            backgroundSize: `${24 * view.z}px ${24 * view.z}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
        >
          <div
            data-pan
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}
          >
            {labels.map((g) => (
              <div
                key={g.id}
                data-pan
                className="absolute whitespace-nowrap"
                style={{ left: g.x, top: g.y }}
              >
                <div className="text-[28px] font-bold leading-none text-neutral-800">{g.title}</div>
                <div className="mt-1 text-[15px] text-neutral-500">{g.note}</div>
              </div>
            ))}
            {allFrames.map((f) => {
              const st = stateOf(f);
              const p = layout[f.id];
              const isSel = selected === f.id;
              const live = seen.has(f.id);
              const shield = !st.interact && !st.edit;
              return (
                <div
                  key={f.id}
                  className="absolute"
                  style={{ left: p.x, top: p.y, width: st.width }}
                >
                  <div
                    onPointerDown={(e) => onTitleDown(e, f)}
                    className="flex cursor-grab items-center gap-1 rounded-t-lg bg-white px-2 active:cursor-grabbing"
                    style={{
                      height: TITLE_H,
                      fontSize: 13,
                      outline: isSel ? "2px solid #2563eb" : "none",
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {f.title}
                      {useDb && f.liveData && (
                        <span className="ml-1 rounded bg-green-100 px-1 text-[10px] text-green-800">
                          DB
                        </span>
                      )}
                    </span>
                    <button
                      title="Language"
                      className="rounded px-1.5 py-0.5 hover:bg-neutral-100"
                      onClick={() => patch(f.id, { lang: st.lang === "en" ? "zh" : "en" })}
                    >
                      {st.lang === "en" ? "EN" : "中"}
                    </button>
                    <button
                      title="Width: phone / tablet / desktop"
                      className="rounded px-1.5 py-0.5 hover:bg-neutral-100"
                      onClick={() =>
                        patch(f.id, {
                          width: WIDTHS[(WIDTHS.indexOf(st.width) + 1) % WIDTHS.length],
                        })
                      }
                    >
                      {st.width === 390 ? "📱" : st.width === 768 ? "▭" : "🖥"}
                    </button>
                    <button
                      title="Edit: click text or classes on the screen"
                      className={`rounded px-1.5 py-0.5 ${st.edit ? "bg-blue-600 text-white" : "hover:bg-neutral-100"}`}
                      onClick={() => patch(f.id, { edit: !st.edit, interact: false })}
                    >
                      ✎
                    </button>
                    <button
                      title="Interact: tap and scroll inside the screen"
                      className={`rounded px-1.5 py-0.5 ${st.interact ? "bg-blue-600 text-white" : "hover:bg-neutral-100"}`}
                      onClick={() => patch(f.id, { interact: !st.interact, edit: false })}
                    >
                      ☝
                    </button>
                    {f.custom && (
                      <button
                        title="Remove this frame from the board"
                        className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50"
                        onClick={() => removeFrame(f.id)}
                      >
                        ✕
                      </button>
                    )}
                    <button
                      title="Reload"
                      className="rounded px-1.5 py-0.5 hover:bg-neutral-100"
                      onClick={() => patch(f.id, { reload: st.reload + 1 })}
                    >
                      ↻
                    </button>
                    <a
                      title="Open in a new tab"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded px-1.5 py-0.5 hover:bg-neutral-100"
                      href={frameUrl(f, st.lang, useDb)}
                    >
                      ↗
                    </a>
                  </div>
                  <div
                    className="relative overflow-hidden rounded-b-lg bg-white shadow-lg"
                    style={{ height: f.height }}
                  >
                    {live ? (
                      <iframe
                        key={`${st.lang}-${st.reload}-${reloadAll}-${useDb}`}
                        src={frameUrl(f, st.lang, useDb)}
                        title={f.title}
                        data-edit={st.edit ? "1" : "0"}
                        className="h-full w-full border-0"
                        onLoad={(e) => attachPicker(f, e.currentTarget)}
                        ref={(el) => {
                          if (el) el.dataset.edit = st.edit ? "1" : "0";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        {f.title}
                      </div>
                    )}
                    {shield && (
                      <div
                        className="absolute inset-0"
                        onPointerDown={(e) => {
                          setSelected(f.id);
                          onTitleDown(e, f);
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {adding && <AddFrameDialog onAdd={addFrame} onClose={() => setAdding(false)} />}
      <Inspector
        frame={sel}
        lang={sel ? stateOf(sel).lang : "en"}
        picked={picked && sel && picked.frameId === sel.id ? picked : null}
        tab={tab}
        setTab={setTab}
      />
    </div>
  );
}

function freshState(f: FrameDef): FrameState {
  return { lang: "en", width: f.width, interact: false, edit: false, reload: 0 };
}

function stateOfRaw(f: FrameDef, s: Record<string, FrameState>): FrameState {
  return { ...freshState(f), ...s[f.id] };
}

// ───────────────────────── Inspector ─────────────────────────

function Inspector({
  frame,
  lang,
  picked,
  tab,
  setTab,
}: {
  frame: FrameDef | null;
  lang: Lang;
  picked: Picked | null;
  tab: "selected" | "colours";
  setTab: (t: "selected" | "colours") => void;
}) {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-neutral-300 bg-white">
      <div className="flex border-b border-neutral-200">
        {(["selected", "colours"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-3 font-medium capitalize ${tab === t ? "border-b-2 border-blue-600 text-blue-700" : "text-neutral-500"}`}
          >
            {t === "selected" ? "Selected" : "Colours"}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "colours" ? (
          <Colours />
        ) : (
          <SelectedPanel frame={frame} lang={lang} picked={picked} />
        )}
      </div>
    </aside>
  );
}

function openFile(file: string, line = 1) {
  return api("/api/dev/board", {
    method: "POST",
    body: JSON.stringify({ action: "open", file, line }),
  });
}

function SelectedPanel({
  frame,
  lang,
  picked,
}: {
  frame: FrameDef | null;
  lang: Lang;
  picked: Picked | null;
}) {
  if (!frame) {
    return (
      <div className="space-y-3 text-neutral-600">
        <p>
          <strong>Nothing selected.</strong> Click a screen's title bar.
        </p>
        <p>
          To change words or styling: press <b>✎</b> on a screen, then click any text or box on it.
        </p>
        <p>Edits are written straight into the code files. The screen updates by itself.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div>
        <div className="text-base font-semibold">{frame.title}</div>
        <div className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Code behind this screen
        </div>
        <ul className="mt-1 space-y-1">
          {frame.files.map((f) => (
            <li key={f}>
              <button
                onClick={() => openFile(f)}
                className="w-full truncate rounded px-2 py-1 text-left font-mono text-xs hover:bg-neutral-100"
                title={`Open ${f} in your editor`}
              >
                {f.replace("app/[locale]/(member)/", "…/")}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {picked ? (
        <PickedEditor
          key={`${picked.frameId}|${picked.text}|${picked.classes}`}
          picked={picked}
          lang={lang}
        />
      ) : (
        <p className="text-neutral-500">
          Press ✎ on this screen, then click text or a box to edit it.
        </p>
      )}
    </div>
  );
}

function PickedEditor({ picked, lang }: { picked: Picked; lang: Lang }) {
  return (
    <div className="space-y-6">
      <div className="text-xs text-neutral-500">Picked: &lt;{picked.tag}&gt;</div>
      {picked.text ? (
        <Editable
          label="Words"
          original={picked.text}
          lang={lang}
          multiline
          note={
            lang === "en"
              ? "Chinese version is edited on the 中 screen."
              : "English version is edited on the EN screen."
          }
        />
      ) : (
        <p className="text-neutral-500">This box has no words of its own.</p>
      )}
      {picked.classes ? (
        <Editable
          label="Styling classes (Tailwind)"
          original={picked.classes}
          lang={lang}
          multiline
          mono
        />
      ) : null}
    </div>
  );
}

function Editable({
  label,
  original,
  lang,
  multiline,
  mono,
  note,
}: {
  label: string;
  original: string;
  lang: Lang;
  multiline?: boolean;
  mono?: boolean;
  note?: string;
}) {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [choice, setChoice] = useState(0);
  const [value, setValue] = useState(original);
  const [current, setCurrent] = useState(original);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const find = useCallback(
    async (text: string) => {
      try {
        const r = await api<{ matches: Match[] }>(
          `/api/dev/board?action=find&locale=${lang}&text=${encodeURIComponent(text)}`,
        );
        setMatches(r.matches);
        setChoice(0);
      } catch (e) {
        setMatches([]);
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Search failed" });
      }
    },
    [lang],
  );
  useEffect(() => {
    void find(original);
  }, [find, original]);

  async function save() {
    const m = matches?.[choice];
    if (!m) return;
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/dev/board", {
        method: "POST",
        body: JSON.stringify({
          action: "replace",
          file: m.file,
          line: m.line,
          from: current,
          to: value,
        }),
      });
      setCurrent(value);
      setMsg({ ok: true, text: `Saved to ${m.file.split("/").pop()}:${m.line}` });
      setTimeout(() => void find(value), 800);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={mono ? 5 : 3}
          className={`w-full rounded-lg border border-neutral-300 p-2 ${mono ? "font-mono text-xs" : ""}`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 p-2"
        />
      )}
      {note && <div className="text-xs text-neutral-500">{note}</div>}
      {matches === null ? (
        <div className="text-xs text-neutral-500">Looking in the code…</div>
      ) : matches.length === 0 ? (
        <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          Not found as one piece of text in the code. It may be built from parts (a variable, a
          template). Use the file list above to edit it by hand.
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-xs text-neutral-500">
            {matches.length === 1 ? "Found in:" : `Found in ${matches.length} places — pick one:`}
          </div>
          {matches.map((m, i) => (
            <label
              key={`${m.file}:${m.line}`}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 ${i === choice ? "border-blue-500 bg-blue-50" : "border-neutral-200"}`}
            >
              <input
                type="radio"
                checked={i === choice}
                onChange={() => setChoice(i)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-xs">
                  {m.file.replace("app/[locale]/(member)/", "…/")}:{m.line}
                </span>
                <span className="block truncate text-xs text-neutral-500">
                  {m.kind === "messages" ? `translation: ${m.key}` : m.context}
                </span>
              </span>
              <button
                type="button"
                className="rounded px-1 text-xs text-blue-700 hover:bg-blue-100"
                onClick={(e) => {
                  e.preventDefault();
                  void openFile(m.file, m.line);
                }}
              >
                open
              </button>
            </label>
          ))}
        </div>
      )}
      <button
        disabled={busy || !matches?.length || value === current}
        onClick={save}
        className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save to code"}
      </button>
      {msg && (
        <div className={`text-xs ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</div>
      )}
    </div>
  );
}

function Colours() {
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    api<{ tokens: Token[] }>("/api/dev/board?action=tokens")
      .then((r) => setTokens(r.tokens.map((t) => ({ ...t, saved: t.value }))))
      .catch((e) => setMsg(String(e.message)));
  }, []);

  async function change(t: Token, to: string) {
    try {
      await api("/api/dev/board", {
        method: "POST",
        body: JSON.stringify({ action: "token", line: t.line, from: t.saved, to }),
      });
      setTokens(
        (ts) => ts?.map((x) => (x.line === t.line ? { ...x, value: to, saved: to } : x)) ?? null,
      );
      setMsg(`Saved ${t.name} to app/globals.css`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-neutral-600">
        Site-wide colours from <code>app/globals.css</code>. Changing one changes every screen that
        uses it.
      </p>
      {msg && <div className="text-xs text-neutral-600">{msg}</div>}
      {tokens?.map((t) => {
        const editable = /^#[0-9a-fA-F]{6}$/.test(t.value);
        return (
          <div key={t.line} className="flex items-center gap-3">
            <input
              type="color"
              disabled={!editable}
              value={editable ? t.value : "#000000"}
              onChange={(e) =>
                setTokens(
                  (ts) =>
                    ts?.map((x) => (x.line === t.line ? { ...x, value: e.target.value } : x)) ??
                    null,
                )
              }
              onBlur={(e) => {
                if (editable && e.target.value.toLowerCase() !== t.saved?.toLowerCase())
                  void change(t, e.target.value);
              }}
              className="h-8 w-10 cursor-pointer rounded border border-neutral-300"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-mono text-xs">{t.name}</div>
              <div className="text-xs text-neutral-500">{t.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────── Add frame ─────────────────────────

function AddFrameDialog({
  onAdd,
  onClose,
}: {
  onAdd: (def: Omit<FrameDef, "id" | "group" | "custom">) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<"copy" | "url">("copy");
  const [baseId, setBaseId] = useState(FRAMES[0].id);
  const [path, setPath] = useState("/{locale}/landing");
  const [title, setTitle] = useState("");
  const [width, setWidth] = useState(390);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (kind === "copy") {
      const base = FRAMES.find((f) => f.id === baseId)!;
      onAdd({ ...base, frameId: base.id, title: title.trim() || `${base.title} (copy)`, width });
      return;
    }
    // Same-site paths only, so the frame stays inside this app.
    if (!path.startsWith("/") || path.startsWith("//") || /^\/\/|:/.test(path.split("?")[0])) {
      setError("Use a path on this site, like /{locale}/landing or /live.");
      return;
    }
    const [route, query] = path.split("?");
    onAdd({
      title: title.trim() || path,
      render: "route",
      route,
      query,
      width,
      height: 844,
      files: [],
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-[420px] space-y-4 rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-base font-semibold">Add a frame</div>
        <div className="flex overflow-hidden rounded border border-neutral-300">
          <button
            className={`flex-1 py-1.5 ${kind === "copy" ? "bg-blue-600 text-white" : "hover:bg-neutral-100"}`}
            onClick={() => setKind("copy")}
          >
            Copy a screen
          </button>
          <button
            className={`flex-1 py-1.5 ${kind === "url" ? "bg-blue-600 text-white" : "hover:bg-neutral-100"}`}
            onClick={() => setKind("url")}
          >
            Any page path
          </button>
        </div>
        {kind === "copy" ? (
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">Screen to copy</span>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full rounded border border-neutral-300 p-2"
            >
              {GROUPS.map((g) => (
                <optgroup key={g.id} label={g.title}>
                  {FRAMES.filter((f) => f.group === g.id).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="block text-xs text-neutral-500">
              Handy for side-by-side EN and 中文, or phone and desktop.
            </span>
          </label>
        ) : (
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">Path on this site</span>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full rounded border border-neutral-300 p-2 font-mono text-xs"
            />
            <span className="block text-xs text-neutral-500">
              <code>{"{locale}"}</code> becomes en or zh. Member pages need a signed-in browser
              session.
            </span>
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Name (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-neutral-300 p-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Width</span>
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full rounded border border-neutral-300 p-2"
          >
            <option value={390}>Phone (390)</option>
            <option value={768}>Tablet (768)</option>
            <option value={1280}>Desktop (1280)</option>
          </select>
        </label>
        {error && <div className="text-xs text-red-700">{error}</div>}
        <div className="flex justify-end gap-2">
          <button className="rounded px-3 py-1.5 hover:bg-neutral-100" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded bg-blue-600 px-3 py-1.5 font-medium text-white"
            onClick={submit}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
