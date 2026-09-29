"use client";

import { CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined, BulbOutlined } from "@ant-design/icons";
import { Button, Card, Col, Collapse, Progress, Result, Row, Spin, Tag, Typography } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { api, type AbilityDimension, type EvaluationResponse } from "@/lib/api";
import { DIMENSION_LABELS } from "@/lib/labels";

function scoreColor(score: number) {
  if (score >= 85) return "#52c41a";
  if (score >= 70) return "#ff7a00";
  return "#ff4d4f";
}

export default function TrainingResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, error } = useAsync(() => api.training.getSession(id), [id]);
  const [evaluation, setEvaluation] = useState<EvaluationResponse>({ status: "evaluating" });

  // 评分是异步任务，轮询直到完成
  useEffect(() => {
    let stopped = false;
    async function poll() {
      while (!stopped) {
        try {
          const ev = await api.training.getEvaluation(id);
          if (stopped) return;
          setEvaluation(ev);
          if (ev.status === "completed") return;
        } catch {
          // 网络抖动时继续轮询
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    void poll();
    return () => {
      stopped = true;
    };
  }, [id]);

  if (error) {
    return <Result status="404" title="训练不存在" extra={<Link href="/sales-training">返回陪练</Link>} />;
  }

  if (evaluation.status === "evaluating") {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Spin size="large" />
        <div className="mt-4 text-gray-500">AI 正在复盘这通电话，马上生成评分…</div>
      </div>
    );
  }

  const ev = evaluation;
  const dims = Object.keys(ev.scores) as AbilityDimension[];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={8} className="text-center">
            <Progress
              type="dashboard"
              percent={ev.totalScore}
              format={(p) => (
                <div>
                  <div className="text-3xl font-semibold">{p}</div>
                  <div className="text-xs text-gray-400">综合得分</div>
                </div>
              )}
              strokeColor={scoreColor(ev.totalScore)}
              size={160}
            />
          </Col>
          <Col xs={24} md={16}>
            <Typography.Title level={4} className="!mb-1">
              {session?.scenario.name} · {session?.persona.name}
            </Typography.Title>
            <div className="mb-3 text-sm text-gray-500">
              目标：{session?.trainingGoal}　共 {session?.messages.length ?? 0} 条对话
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {dims.map((d) => (
                <div key={d}>
                  <div className="flex justify-between text-sm">
                    <span>{DIMENSION_LABELS[d]}</span>
                    <span className="font-medium">{ev.scores[d]}</span>
                  </div>
                  <Progress percent={ev.scores[d]} showInfo={false} strokeColor={scoreColor(ev.scores[d])} size="small" />
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title={<><CheckCircleOutlined className="text-green-500" /> 做得好的</>} className="h-full">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {ev.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<><ExclamationCircleOutlined className="text-red-500" /> 需要改进</>} className="h-full">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {ev.problems.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<><BulbOutlined className="text-orange-500" /> 下次这样做</>} className="h-full">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {ev.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: "evidence",
            label: `评分依据（${ev.evidence.length} 条）`,
            children: (
              <div className="space-y-2">
                {ev.evidence.map((e, i) => (
                  <div key={i} className="text-sm">
                    <Tag>{DIMENSION_LABELS[e.dimension]}</Tag>“{e.quote}” <span className="text-gray-400">{e.comment}</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: "transcript",
            label: "完整对话记录",
            children: (
              <div className="space-y-2">
                {session?.messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <Tag color={m.role === "sales" ? "orange" : "default"}>{m.role === "sales" ? "我" : "家长"}</Tag>
                    {m.content}
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />

      <div className="flex flex-wrap gap-3">
        <Link href="/sales-training">
          <Button type="primary" icon={<ReloadOutlined />}>
            再练一次
          </Button>
        </Link>
        <Link href="/sales-training/history">
          <Button>训练记录</Button>
        </Link>
      </div>
      <div className="text-xs text-gray-400">评分模型版本：{ev.evaluatorVersion}</div>
    </div>
  );
}
