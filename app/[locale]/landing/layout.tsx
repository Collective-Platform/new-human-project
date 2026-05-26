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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">{children}</div>
  );
}
