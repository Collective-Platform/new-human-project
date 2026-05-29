import { NextResponse } from "next/server";

import { buildOtpEmail } from "@/src/features/auth/send-otp";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { html } = buildOtpEmail("123456", "Rhythm");
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
