import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  applicationName: "研经笔记",
  title: "研经笔记",
  description: "面向日常圣经分析、笔记整理与 Obsidian 知识库沉淀的研经工具。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "研经笔记",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#b42318",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${notoSansSc.variable} antialiased`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
