import { setRequestLocale } from "next-intl/server";

export default async function SignupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div className="min-h-screen flex items-center justify-center bg-surface">{children}</div>;
}
