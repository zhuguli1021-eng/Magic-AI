"use client";

import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: { colorPrimary: "#ff7a00", borderRadius: 10 },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
