import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TelegramAuthBootstrap from "@/components/TelegramAuthBootstrap";

export const metadata: Metadata = {
  title: "Mahalla Cinema",
  description: "Кинотеатр под открытым небом в Ташкенте",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${inter.className} h-full antialiased`}
    >
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0404]">
        <TelegramAuthBootstrap />
        <Header />
        <div className="flex-1 w-full max-w-[600px] mx-auto pb-24">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
