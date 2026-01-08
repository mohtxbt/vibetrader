import type { Metadata } from "next";
import "./globals.css";
import PixelBackground from "@/components/PixelBackground";
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
    <html lang="en">
      <body className="min-h-screen pb-10">
        <PixelBackground />
        {children}
        <AsciiFooter />
      </body>
    </html>
  );
}
