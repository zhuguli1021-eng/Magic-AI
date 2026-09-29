"use client";

import { Button, Card, Table, Tag, Typography } from "antd";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { api, type TrainingSession } from "@/lib/api";
import { DIMENSION_LABELS } from "@/lib/labels";

export default function TrainingHistoryPage() {
  const { data: history, loading } = useAsync(() => api.training.listHistory());
  const { data: ability } = useAsync(() => api.training.getMyAbility());

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          训练记录
        </Typography.Title>
        <Link href="/sales-training">
          <Button type="primary">新的陪练</Button>
        </Link>
      </div>

      {ability && ability.overall > 0 && (
        <Card title="我的能力画像">
          <div className="flex flex-wrap gap-2">
            {Object.entries(ability.dimensions).map(([d, v]) => (
              <Tag key={d} color={ability.weakest.includes(d as keyof typeof DIMENSION_LABELS) ? "red" : "default"}>
                {DIMENSION_LABELS[d as keyof typeof DIMENSION_LABELS]} {v}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      <Card styles={{ body: { padding: 0 } }}>
        <Table<TrainingSession>
          rowKey="id"
          loading={loading}
          dataSource={history}
          scroll={{ x: 600 }}
          locale={{ emptyText: "还没有训练记录" }}
          columns={[
            { title: "场景", render: (_, s) => s.scenario.name },
            { title: "家长", render: (_, s) => s.persona.name },
            {
              title: "时间",
              render: (_, s) => (s.startedAt ? new Date(s.startedAt).toLocaleString("zh-CN") : "-"),
            },
            {
              title: "得分",
              render: (_, s) => (s.totalScore != null ? <Tag color="orange">{s.totalScore}</Tag> : <Tag>未完成</Tag>),
            },
            {
              title: "",
              render: (_, s) => (s.totalScore != null ? <Link href={`/sales-training/result/${s.id}`}>查看复盘</Link> : null),
            },
          ]}
        />
      </Card>
    </div>
  );
}
