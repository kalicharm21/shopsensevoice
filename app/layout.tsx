import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaisonCart — Smart Voice Shopping Assistant",
  description: "AI-powered voice grocery shopping cart",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col antialiased font-sans"
      >
        {children}
      </body>
    </html>
  );
}