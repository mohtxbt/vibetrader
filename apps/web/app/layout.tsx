import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import PixelBackground from "@/components/PixelBackground";
import TokenEventBackground from "@/components/TokenEventBackground";
import AsciiFooter from "@/components/AsciiFooter";
import DevTools from "@/components/DevTools";

export const metadata: Metadata = {
  title: "Vibe Trader",
  description: "Pitch tokens to an AI agent",
  metadataBase: new URL("https://vibetrader.tech"),
  openGraph: {
    title: "Vibe Trader",
    description: "Pitch tokens to an AI agent",
    url: "https://vibetrader.tech",
    siteName: "Vibe Trader",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Vibe Trader",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibe Trader",
    description: "Pitch tokens to an AI agent",
    images: ["/banner.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </head>
        <body className="min-h-screen pb-10 pb-safe">
          <PixelBackground />
          <TokenEventBackground />
          {children}
          <AsciiFooter />
          <DevTools />
        </body>
      </html>
    </ClerkProvider>
  );
}
