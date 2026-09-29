"use client";

import { AudioOutlined, BookOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, List, Row, Statistic, Tag, Typography } from "antd";
import Link from "next/link";
import { AppCard } from "@/components/app-card";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api";
import { DIMENSION_LABELS, RESEARCH_TASK_LABELS } from "@/lib/labels";

export default function DashboardPage() {
  const { data: apps } = useAsync(() => api.apps.list());
  const { data: history } = useAsync(() => api.training.listHistory());
  const { data: ability } = useAsync(() => api.training.getMyAbility());
  const { data: research } = useAsync(() => api.research.listHistory());

  return (
    <div className="flex flex-col gap-5">
      <Card className="!border-none !bg-gradient-to-r !from-orange-500 !to-amber-400" styles={{ body: { padding: 24 } }}>
        <div className="text-white">
          <div className="text-xl font-semibold">你好，欢迎来到开心口袋 AI 工作台</div>
          <div className="mt-1 opacity-90">今天练一通电话，或者让 AI 帮你把教研成果写出来。</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/sales-training">
              <Button size="large" icon={<AudioOutlined />}>
                开始语音陪练
              </Button>
            </Link>
            <Link href="/research">
              <Button size="large" ghost icon={<BookOutlined />}>
                打开教研助手
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="累计陪练次数" value={history?.length ?? 0} suffix="次" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="综合能力分" value={ability?.overall || "--"} />
            {ability && ability.weakest.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                待提升：{ability.weakest.map((d) => DIMENSION_LABELS[d]).join("、")}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="教研产出" value={research?.length ?? 0} suffix="份" />
          </Card>
        </Col>
      </Row>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Typography.Title level={5} className="!mb-0">
            我的 AI 应用
          </Typography.Title>
          <Link href="/apps">
            全部应用 <RightOutlined />
          </Link>
        </div>
        <Row gutter={[16, 16]}>
          {apps
            ?.filter((a) => a.status === "available")
            .map((app) => (
              <Col key={app.id} xs={24} md={12}>
                <AppCard app={app} />
              </Col>
            ))}
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近陪练" extra={<Link href="/sales-training/history">查看全部</Link>}>
            {history && history.length > 0 ? (
              <List
                dataSource={history.slice(0, 5)}
                renderItem={(s) => (
                  <List.Item
                    extra={s.totalScore != null ? <Tag color="orange">{s.totalScore} 分</Tag> : <Tag>未完成</Tag>}
                  >
                    <Link href={s.totalScore != null ? `/sales-training/result/${s.id}` : `/sales-training`}>
                      {s.scenario.name} · {s.persona.name}
                    </Link>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="还没有陪练记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近教研产出" extra={<Link href="/research">去生成</Link>}>
            {research && research.length > 0 ? (
              <List
                dataSource={research.slice(0, 5)}
                renderItem={(r) => (
                  <List.Item extra={<Tag color="blue">{RESEARCH_TASK_LABELS[r.type].name}</Tag>}>{r.title}</List.Item>
                )}
              />
            ) : (
              <Empty description="还没有教研产出" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
