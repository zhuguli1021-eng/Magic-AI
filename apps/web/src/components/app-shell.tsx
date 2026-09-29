"use client";

import {
  AppstoreOutlined,
  AudioOutlined,
  BookOutlined,
  HomeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Layout, Menu, Tag, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { USE_MOCK } from "@/lib/api";

const NAV = [
  { key: "/", icon: <HomeOutlined />, label: "工作台", short: "工作台" },
  { key: "/apps", icon: <AppstoreOutlined />, label: "AI 应用中心", short: "应用" },
  { key: "/sales-training", icon: <AudioOutlined />, label: "语音销售陪练", short: "陪练" },
  { key: "/research", icon: <BookOutlined />, label: "教研助手", short: "教研" },
];

function activeKey(pathname: string) {
  if (pathname === "/") return "/";
  return NAV.find((n) => n.key !== "/" && pathname.startsWith(n.key))?.key ?? "/";
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 !text-inherit">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-lg font-bold text-white">
        开
      </div>
      <div className="leading-tight">
        <div className="font-semibold">开心口袋 AI</div>
        <div className="text-xs text-gray-400">MagicPocket</div>
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // 训练通话页全屏，不显示导航
  if (pathname.startsWith("/sales-training/session/")) return <>{children}</>;

  return (
    <Layout className="min-h-screen">
      <Layout.Sider width={220} theme="light" className="!hidden border-r border-gray-100 lg:!block">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey(pathname)]}
          items={NAV.map((n) => ({ key: n.key, icon: n.icon, label: <Link href={n.key}>{n.label}</Link> }))}
          style={{ borderInlineEnd: "none" }}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="flex items-center justify-end gap-3 border-b border-gray-100 !bg-white !px-4 md:!px-5">
          <div className="mr-auto lg:hidden">
            <Logo />
          </div>
          {USE_MOCK && <Tag color="orange">演示数据</Tag>}
          <Avatar size="small" icon={<UserOutlined />} />
          <Typography.Text className="!hidden sm:!inline">开发体验账号</Typography.Text>
        </Layout.Header>
        <Layout.Content className="p-4 pb-20 md:p-6 lg:pb-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </Layout.Content>
      </Layout>

      {/* 手机（钉钉 H5）底部导航 */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex h-14 border-t border-gray-100 bg-white lg:hidden">
        {NAV.map((n) => {
          const active = activeKey(pathname) === n.key;
          return (
            <Link
              key={n.key}
              href={n.key}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
                active ? "text-orange-500" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{n.icon}</span>
              {n.short}
            </Link>
          );
        })}
      </nav>
    </Layout>
  );
}
