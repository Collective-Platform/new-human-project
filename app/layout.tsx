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
  description: "A spiritual formation journey across Mental, Emotional, and Physical dimensions",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Rhythm",
    statusBarStyle: "default",
    capable: true,
    startupImage: [
      {
        url: "/splash/splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/splash/splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-2048x2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/splash/splash-1536x2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
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
        <div
          id="splash"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fef8f5",
            animation: "splashFadeOut 0.4s ease 1.2s forwards",
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/rhythm-512x512.png"
            width="120"
            height="120"
            alt=""
            style={{ borderRadius: "24px" }}
          />
        </div>
        <div className="flex min-h-screen flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
