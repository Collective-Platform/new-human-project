import { isBoardEnabled, isBoardLiveDataEnabled } from "@/src/dev-board/enabled";
import { listBoardMembers } from "@/src/dev-board/board-user";
import { NextResponse, type NextRequest } from "next/server";
import { execFile } from "node:child_process";
import {
  findText,
  readTokens,
  replaceText,
  replaceToken,
  safePath,
} from "@/src/dev-board/source-edit";

// Dev-only API for the design board. It edits source files, so it refuses to run
// in production, from a non-local host, or without the board's header.

function guard(req: NextRequest): NextResponse | null {
  if (!isBoardEnabled()) return new NextResponse("Not found", { status: 404 });
  const host = (req.headers.get("host") ?? "").split(":")[0];
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    return NextResponse.json({ error: "Local only" }, { status: 403 });
  }
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  if (req.headers.get("x-board") !== "1") {
    return NextResponse.json({ error: "Missing board header" }, { status: 403 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = guard(req);
  if (denied) return denied;
  const p = req.nextUrl.searchParams;
  if (p.get("action") === "tokens") return NextResponse.json({ tokens: await readTokens() });
  if (p.get("action") === "members") {
    if (!isBoardLiveDataEnabled()) {
      return NextResponse.json(
        { error: "Local DB mode needs DATABASE_PROVIDER=local on localhost." },
        { status: 403 },
      );
    }
    return NextResponse.json({ members: await listBoardMembers() });
  }
  if (p.get("action") === "find") {
    const matches = await findText(p.get("text") ?? "", p.get("locale") === "zh" ? "zh" : "en");
    return NextResponse.json({ matches });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

function openInEditor(file: string, line: number) {
  const abs = safePath(file);
  const tryEditors = [
    ["cursor", ["-g", `${abs}:${line}`]],
    ["code", ["-g", `${abs}:${line}`]],
    ["open", ["-t", abs]],
  ] as const;
  const next = (i: number) => {
    if (i >= tryEditors.length) return;
    const [cmd, args] = tryEditors[i];
    execFile(cmd, [...args], (err) => {
      if (err) next(i + 1);
    });
  };
  next(0);
}

export async function POST(req: NextRequest) {
  const denied = guard(req);
  if (denied) return denied;
  const body = await req.json();
  try {
    if (body.action === "replace") {
      await replaceText({ file: body.file, line: body.line, from: body.from, to: body.to });
    } else if (body.action === "token") {
      await replaceToken(body.line, body.from, body.to);
    } else if (body.action === "open") {
      openInEditor(body.file, body.line ?? 1);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
