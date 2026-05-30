import { setRequestLocale } from "next-intl/server";

export default async function LandingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div className="w-full bg-background text-foreground">{children}</div>;
}
