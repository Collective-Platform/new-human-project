// Server-only helpers that let the design board find a piece of text in the
// source files and rewrite it. Dev only. Writes only inside app/, src/, messages/.

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SEARCH_DIRS = ["app", "src", "messages"];
const SKIP = ["node_modules", ".next", "src/dev-board", "app/api/dev", "app/[locale]/dev"];
const EXTS = new Set([".tsx", ".ts", ".json", ".css"]);

export interface Match {
  file: string;
  line: number;
  kind: "messages" | "source";
  /** The whole source line, trimmed, for context. */
  context: string;
  /** Messages only: the translation key path. */
  key?: string;
}

function isSkipped(rel: string) {
  return SKIP.some((s) => rel === s || rel.startsWith(`${s}/`));
}

async function walk(dir: string, out: string[]) {
  const abs = path.join(ROOT, dir);
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const rel = `${dir}/${e.name}`;
    if (isSkipped(rel)) continue;
    if (e.isDirectory()) await walk(rel, out);
    else if (EXTS.has(path.extname(e.name))) out.push(rel);
  }
}

/** Resolve a repo-relative path and make sure it stays inside the allowed folders. */
export function safePath(rel: string): string {
  const abs = path.resolve(ROOT, rel);
  const ok = SEARCH_DIRS.some((d) => abs.startsWith(path.join(ROOT, d) + path.sep));
  if (!ok) throw new Error("Path not allowed");
  return abs;
}

function lineOf(text: string, index: number) {
  let n = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

function jsonKeyFor(json: unknown, value: string): string | undefined {
  const walkJson = (node: unknown, trail: string[]): string | undefined => {
    if (typeof node === "string") return node === value ? trail.join(".") : undefined;
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const hit = walkJson(v, [...trail, k]);
        if (hit) return hit;
      }
    }
    return undefined;
  };
  return walkJson(json, []);
}

export async function findText(text: string, locale: string): Promise<Match[]> {
  if (!text.trim() || text.length > 400) return [];
  const files: string[] = [];
  for (const d of SEARCH_DIRS) await walk(d, files);
  // The matching language file first, then source, then the other language file.
  const rank = (f: string) =>
    f === `messages/${locale}.json` ? 0 : f.startsWith("messages/") ? 2 : 1;
  files.sort((a, b) => rank(a) - rank(b));

  const matches: Match[] = [];
  for (const rel of files) {
    if (rel.endsWith(".css")) continue;
    const isJson = rel.endsWith(".json");
    if (isJson && rel !== `messages/${locale}.json`) continue;
    const content = await fs.readFile(path.join(ROOT, rel), "utf8");
    const needle = isJson ? JSON.stringify(text).slice(1, -1) : text;
    let from = 0;
    while (matches.length < 12) {
      const i = content.indexOf(needle, from);
      if (i === -1) break;
      from = i + needle.length;
      const line = lineOf(content, i);
      const context = content.split("\n")[line - 1].trim().slice(0, 160);
      let key: string | undefined;
      if (isJson) {
        // Only whole-value matches count for translations.
        if (content[i - 1] !== '"' || content[i + needle.length] !== '"') continue;
        key = jsonKeyFor(JSON.parse(content), text);
      }
      matches.push({ file: rel, line, kind: isJson ? "messages" : "source", context, key });
    }
  }
  return matches;
}

function escapeFor(file: string, before: string, after: string, to: string): string {
  if (file.endsWith(".json")) return JSON.stringify(to).slice(1, -1);
  const quote = before;
  if (quote === '"' || quote === "'" || quote === "`") {
    if (after !== quote)
      throw new Error("Text is only part of a longer string. Edit it in the file.");
    const escaped = to.replaceAll("\\", "\\\\").replaceAll(quote, `\\${quote}`);
    return quote === "`" ? escaped.replaceAll("${", "\\${") : escaped;
  }
  // JSX text
  if (/[{}<>]/.test(to)) throw new Error("Characters { } < > are not allowed in page text.");
  return to;
}

export async function replaceText(opts: { file: string; line: number; from: string; to: string }) {
  const abs = safePath(opts.file);
  const content = await fs.readFile(abs, "utf8");
  const lines = content.split("\n");
  const lineText = lines[opts.line - 1];
  if (lineText === undefined) throw new Error("Line not found. The file changed — reselect.");
  const needle = opts.file.endsWith(".json") ? JSON.stringify(opts.from).slice(1, -1) : opts.from;
  // Multi-line text starts on the given line; search from there.
  const lineStart = lines.slice(0, opts.line - 1).join("\n").length + (opts.line > 1 ? 1 : 0);
  const idx = content.indexOf(needle, lineStart);
  if (idx === -1 || lineOf(content, idx) !== opts.line) {
    throw new Error("Text no longer at that line. The file changed — reselect.");
  }
  const replacement = escapeFor(opts.file, content[idx - 1], content[idx + needle.length], opts.to);
  await fs.writeFile(abs, content.slice(0, idx) + replacement + content.slice(idx + needle.length));
}

export interface Token {
  name: string;
  value: string;
  line: number;
}

export async function readTokens(): Promise<Token[]> {
  const content = await fs.readFile(path.join(ROOT, "app/globals.css"), "utf8");
  const tokens: Token[] = [];
  content.split("\n").forEach((l, i) => {
    const m = l.match(/^\s*(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/);
    if (m) tokens.push({ name: m[1], value: m[2], line: i + 1 });
  });
  return tokens;
}

export async function replaceToken(line: number, from: string, to: string) {
  if (!/^#[0-9a-fA-F]{3,8}$/.test(to)) throw new Error("Not a hex colour.");
  const abs = path.join(ROOT, "app/globals.css");
  const lines = (await fs.readFile(abs, "utf8")).split("\n");
  if (!lines[line - 1]?.includes(from)) throw new Error("Line changed. Reload tokens.");
  lines[line - 1] = lines[line - 1].replace(from, to);
  await fs.writeFile(abs, lines.join("\n"));
}
