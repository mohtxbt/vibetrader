import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import PixelBackground from "@/components/PixelBackground";
import TokenEventBackground from "@/components/TokenEventBackground";
import AsciiFooter from "@/components/AsciiFooter";

export const metadata: Metadata = {
  title: "Vibe Trader",
  description: "Pitch tokens to an AI agent",
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
        </body>
      </html>
    </ClerkProvider>
  );
}
