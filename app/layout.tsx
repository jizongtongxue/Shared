import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "共享菜园 - Shared Garden",
  description: "Community shared garden platform",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-stone-50 min-h-screen pb-20 md:pb-0`}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
