"use client";

import { AudioOutlined, CheckCircleFilled, HistoryOutlined } from "@ant-design/icons";
import { App, Avatar, Button, Card, Col, Row, Skeleton, Steps, Tag, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api";
import { DIFFICULTY_LABELS, SCENARIO_TYPE_LABELS } from "@/lib/labels";

export default function SalesTrainingPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const { data: scenarios, loading: loadingScenarios } = useAsync(() => api.training.listScenarios());
  const { data: personas, loading: loadingPersonas } = useAsync(() => api.training.listPersonas());
  const [scenarioId, setScenarioId] = useState<string>();
  const [personaId, setPersonaId] = useState<string>();
  const [starting, setStarting] = useState(false);

  const scenario = scenarios?.find((s) => s.id === scenarioId);
  const persona = personas?.find((p) => p.id === personaId);

  async function start() {
    if (!scenario || !persona) return;
    setStarting(true);
    try {
      const { sessionId } = await api.training.createSession({
        scenarioId: scenario.id,
        personaId: persona.id,
        difficulty: persona.difficulty,
        mode: "voice",
      });
      router.push(`/sales-training/session/${sessionId}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "创建训练失败");
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography.Title level={3} className="!mb-1">
            AI 语音销售陪练
          </Typography.Title>
          <Typography.Text type="secondary">选一个场景和一位模拟家长，像真实电话一样实时对话，结束后 AI 自动评分。</Typography.Text>
        </div>
        <Link href="/sales-training/history">
          <Button icon={<HistoryOutlined />}>训练记录</Button>
        </Link>
      </div>

      <Steps
        size="small"
        responsive={false}
        current={!scenario ? 0 : !persona ? 1 : 2}
        items={[{ title: "选择场景" }, { title: "选择家长" }, { title: "开始通话" }]}
      />

      <section>
        <Typography.Title level={5}>1. 训练场景</Typography.Title>
        {loadingScenarios ? (
          <Skeleton active />
        ) : (
          <Row gutter={[16, 16]}>
            {scenarios?.map((s) => {
              const selected = s.id === scenarioId;
              return (
                <Col key={s.id} xs={24} md={8}>
                  <Card
                    hoverable
                    onClick={() => setScenarioId(s.id)}
                    className={selected ? "!border-orange-500 !shadow-md" : ""}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{s.name}</span>
                      {selected && <CheckCircleFilled className="text-orange-500" />}
                    </div>
                    <div className="mt-2 flex gap-1">
                      <Tag>{SCENARIO_TYPE_LABELS[s.scenarioType]}</Tag>
                      <Tag color={DIFFICULTY_LABELS[s.difficulty].color}>{DIFFICULTY_LABELS[s.difficulty].text}</Tag>
                      <Tag>约 {s.defaultDuration} 分钟</Tag>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">{s.description}</div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-400">目标：</span>
                      {s.trainingGoal}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </section>

      <section>
        <Typography.Title level={5}>2. 模拟家长</Typography.Title>
        {loadingPersonas ? (
          <Skeleton active />
        ) : (
          <Row gutter={[16, 16]}>
            {personas?.map((p) => {
              const selected = p.id === personaId;
              return (
                <Col key={p.id} xs={24} md={8}>
                  <Card
                    hoverable
                    onClick={() => setPersonaId(p.id)}
                    className={selected ? "!border-orange-500 !shadow-md" : ""}
                    styles={{ body: { padding: 16 } }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size={44} className="!bg-orange-100 !text-orange-600">
                        {p.name.slice(-2)}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{p.name}</span>
                          {selected && <CheckCircleFilled className="text-orange-500" />}
                        </div>
                        <div className="text-xs text-gray-500">{p.personalityType}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Tag color={DIFFICULTY_LABELS[p.difficulty].color}>{DIFFICULTY_LABELS[p.difficulty].text}</Tag>
                      <Tag>
                        孩子 {p.childAge} 岁 · {p.childGrade}
                      </Tag>
                      <Tag>{p.consultationChannel}</Tag>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">{p.briefing}</div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-14 z-10 lg:bottom-0 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur lg:left-[220px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0 truncate text-sm text-gray-600">
            {scenario && persona ? `${scenario.name} · ${persona.name}` : "请选择场景和家长"}
          </div>
          <Button
            type="primary"
            size="large"
            icon={<AudioOutlined />}
            disabled={!scenario || !persona}
            loading={starting}
            onClick={start}
          >
            开始语音通话
          </Button>
        </div>
      </div>
    </div>
  );
}
