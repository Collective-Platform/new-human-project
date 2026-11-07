export async function GET() {
  return Response.json(
    { error: "Progress is available through a member-started plan." },
    { status: 410 },
  );
}
