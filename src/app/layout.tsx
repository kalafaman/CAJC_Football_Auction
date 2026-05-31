import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRANSFER MARKET - Football Franchise Auction",
  description: "Realtime college football franchise auction control room and public leaderboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
