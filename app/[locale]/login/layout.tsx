import { setRequestLocale } from "next-intl/server";

export default async function LoginLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div className="min-h-[100svh] bg-surface">{children}</div>;
}
