# Magic AI · 开心口袋 AI 工作平台

企业内部 AI 工作平台（钉钉 H5 入口）。V1 重点做两件事：

- **AI 语音销售陪练**：销售和 AI 模拟家长实时语音对话，挂断后 AI 按维度评分、给出复盘建议，并累积个人能力画像。
- **AI 教研助手**：按课程、级别、单元生成教案、练习题、测评方案，支持上传参考资料，结果可复制或下载。

当前阶段**只搭了前端**。所有后端能力都通过接口预留，默认用前端模拟数据运行，不需要后端就能体验完整流程。

## 目录

```text
apps/
  web/                  Next.js 16 + React 19 + TypeScript + Ant Design 6 + Tailwind 4
    src/app/            页面：工作台、AI 应用中心、销售陪练、教研助手
    src/lib/api/        接口层：contract.ts（接口定义）、http.ts（真实后端）、mock/（模拟数据）
    src/features/training/voice/   实时语音通道：WebSocket 版 + 浏览器演示版
docs/api/               前后端接口约定
```

后续 `apps/api`（NestJS）、`packages/*` 按技术方案加入同一个 Turborepo。

## 本地运行

需要 Node 22 和 pnpm 10。

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # 生产构建
pnpm lint
```

语音陪练演示版使用浏览器自带的语音识别和语音合成，**请用 Chrome 或 Edge** 打开并允许麦克风。不支持语音识别的浏览器会自动切换到键盘输入。

## 接入真实后端

复制 `apps/web/.env.example` 为 `apps/web/.env.local`，设置：

```bash
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_VOICE_WS_URL=wss://api.example.com
```

页面代码只依赖 `src/lib/api/contract.ts` 中的接口，切换后不用改页面。后端需要实现的接口和语音协议见 [docs/api/frontend-contract.md](docs/api/frontend-contract.md)。

## 架构原则

- 前端只调用 MagicPocket API，**不直接调用 FastGPT 或模型服务**，API Key 不出现在前端。
- 家长 Persona 的隐藏信息和 Prompt 只在后端使用，前端只拿公开信息。
- 评分结果是结构化 JSON（各维度分数、优点、问题、建议、证据），不使用自然语言当成绩。
