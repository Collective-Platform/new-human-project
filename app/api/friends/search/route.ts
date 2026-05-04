import { getSessionUser } from "@/src/features/auth";
import { searchUsers } from "@/src/features/community";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  // Strip leading "@" so "@alice" matches handles stored as "alice"
  const q =
    url.searchParams
      .get("q")
      ?.trim()
      .replace(/^@+/, "") ?? "";

  if (q.length < 2) {
    return Response.json({ results: [] });
  }

  const results = await searchUsers(q, user.id);

  return Response.json({
    results: results.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      searchHandle: r.search_handle,
    })),
  });
}
