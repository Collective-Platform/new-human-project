import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The New Human Project",
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
      className={`${plusJakartaSans.variable} ${manrope.variable} ${notoSansSC.variable} h-full antialiased`}
    >
      <head />
      <body className="min-h-full">
        <div className="mx-auto flex min-h-screen max-w-93.75 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
