import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Sans_SC } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const nowstalgic = localFont({
  src: [
    { path: "../public/fonts/Nowstalgic-Light.otf", weight: "300" },
    { path: "../public/fonts/Nowstalgic-Regular.otf", weight: "400" },
    { path: "../public/fonts/Nowstalgic-Medium.otf", weight: "500" },
    { path: "../public/fonts/Nowstalgic-Semibold.otf", weight: "600" },
    { path: "../public/fonts/Nowstalgic-Bold.otf", weight: "700" },
    { path: "../public/fonts/Nowstalgic-Black.otf", weight: "900" },
  ],
  variable: "--font-nowstalgic",
  display: "swap",
});

const gtAmerica = localFont({
  src: [
    { path: "../public/fonts/GT-America-Thin.otf", weight: "100" },
    { path: "../public/fonts/GT-America-Light.otf", weight: "300" },
    { path: "../public/fonts/GT-America-Regular.otf", weight: "400" },
    { path: "../public/fonts/GT-America-Medium.otf", weight: "500" },
    // No semibold in GT-America — 600 resolves to Bold via browser fallback
    { path: "../public/fonts/GT-America-Bold.otf", weight: "700" },
    { path: "../public/fonts/GT-America-Black.otf", weight: "900" },
  ],
  variable: "--font-gt-america",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rhythm",
  description:
    "A spiritual formation journey across Mental, Emotional, and Physical dimensions",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nowstalgic.variable} ${gtAmerica.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <head />
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
