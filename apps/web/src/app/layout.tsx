import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "开心口袋 AI 工作平台",
  description: "MagicPocket AI：销售陪练、教研提效等 AI 工作应用",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">
        <AntdRegistry>
          <AppProviders>
            <AppShell>{children}</AppShell>
          </AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
