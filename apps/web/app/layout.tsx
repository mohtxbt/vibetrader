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
        <body className="min-h-screen pb-10">
          <PixelBackground />
          <TokenEventBackground />
          {children}
          <AsciiFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
