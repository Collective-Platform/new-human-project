import { Suspense } from "react";
import { isBoardEnabled } from "@/src/dev-board/enabled";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Board } from "@/src/dev-board/board";

// Design board. Dev only — returns 404 in production.
async function BoardBody({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Board />;
}

export default function BoardPage(props: { params: Promise<{ locale: string }> }) {
  if (!isBoardEnabled()) notFound();
  return (
    <Suspense fallback={null}>
      <BoardBody {...props} />
    </Suspense>
  );
}
