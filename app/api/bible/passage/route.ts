import { getSessionUser } from "@/src/features/auth";
import { getBilingualPassage } from "@/src/features/bible";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");
  if (!reference) {
    return Response.json(
      { error: "Missing 'reference' query parameter" },
      { status: 400 },
    );
  }

  try {
    const result = await getBilingualPassage(reference);
    if (!result) {
      return Response.json(
        { error: `Could not parse reference: ${reference}` },
        { status: 400 },
      );
    }
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
