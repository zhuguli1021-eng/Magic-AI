"use client";

import { AudioOutlined, BookOutlined, BulbOutlined, DatabaseOutlined, EditOutlined, TeamOutlined } from "@ant-design/icons";
import { Card, Tag } from "antd";
import Link from "next/link";
import type { AiApplication, AiAppCategory } from "@/lib/api";

const ICONS: Record<AiAppCategory, { icon: React.ReactNode; bg: string }> = {
  sales: { icon: <AudioOutlined />, bg: "bg-orange-50 text-orange-500" },
  research: { icon: <BookOutlined />, bg: "bg-blue-50 text-blue-500" },
  teaching: { icon: <TeamOutlined />, bg: "bg-green-50 text-green-600" },
  content: { icon: <EditOutlined />, bg: "bg-pink-50 text-pink-500" },
  knowledge: { icon: <DatabaseOutlined />, bg: "bg-purple-50 text-purple-500" },
  general: { icon: <BulbOutlined />, bg: "bg-gray-100 text-gray-600" },
};

export function AppCard({ app }: { app: AiApplication }) {
  const planned = app.status === "planned";
  const { icon, bg } = ICONS[app.category];
  const card = (
    <Card hoverable={!planned} className={planned ? "opacity-60" : ""} styles={{ body: { padding: 18 } }}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${bg}`}>{icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{app.name}</span>
            {planned && <Tag>规划中</Tag>}
          </div>
          <div className="mt-1 text-sm text-gray-500">{app.description}</div>
        </div>
      </div>
    </Card>
  );
  return planned ? card : <Link href={app.path}>{card}</Link>;
}
