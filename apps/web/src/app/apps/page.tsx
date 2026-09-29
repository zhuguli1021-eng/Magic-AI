"use client";

import { Col, Row, Skeleton, Typography } from "antd";
import { AppCard } from "@/components/app-card";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api";

export default function AppsPage() {
  const { data: apps, loading } = useAsync(() => api.apps.list());
  return (
    <div>
      <Typography.Title level={3}>AI 应用中心</Typography.Title>
      <Typography.Paragraph type="secondary">按你的角色展示可用的 AI 应用，规划中的应用会陆续上线。</Typography.Paragraph>
      {loading ? (
        <Skeleton active />
      ) : (
        <Row gutter={[16, 16]}>
          {apps?.map((app) => (
            <Col key={app.id} xs={24} md={12} lg={8}>
              <AppCard app={app} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
