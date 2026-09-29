# 前端接口约定（V1）

前端代码中的唯一依据是 `apps/web/src/lib/api/contract.ts` 和 `types.ts`，本文是其说明。

## 通用

- 前缀：`/api/v1`
- 鉴权：`Authorization: Bearer <accessToken>`（钉钉免登后由后端签发 JWT）
- 返回格式：

```json
{ "success": true, "data": {}, "requestId": "xxx" }
{ "success": false, "error": { "code": "PERMISSION_DENIED", "message": "无权限访问" }, "requestId": "xxx" }
```

## 接口清单

| 功能 | 方法与路径 | 说明 |
|---|---|---|
| 钉钉登录 | `POST /auth/dingtalk/login` | 入参 `{ authCode }`，返回 token 和用户 |
| 当前用户 | `GET /auth/me` | |
| AI 应用 | `GET /ai-apps` | 按权限过滤，`status` 为 `available` / `planned` |
| 训练场景 | `GET /training/scenarios` | |
| 家长列表 | `GET /training/personas?scenario=&difficulty=` | **不能返回** `hidden_information`、`persona_prompt` |
| 创建训练 | `POST /training/sessions` | 入参 `{ scenarioId, personaId, difficulty, mode }` |
| 训练详情 | `GET /training/sessions/:id` | 含场景、公开 Persona、对话记录 |
| 开始训练 | `POST /training/sessions/:id/start` | |
| 文字发言 | `POST /training/sessions/:id/messages` | 入参 `{ content }`，返回家长回复 |
| 结束训练 | `POST /training/sessions/:id/end` | 状态进入 `evaluating`，异步评分 |
| 评分结果 | `GET /training/sessions/:id/evaluation` | 评分中返回 `{ status: "evaluating" }`，前端每 1.5 秒轮询 |
| 我的训练 | `GET /training/sessions?mine=1` | |
| 能力画像 | `GET /training/abilities/me` | |
| 教研生成 | `POST /ai/tasks/research/:type/stream` | `type`：`lesson-plan` / `question-generation` / `assessment`，SSE 流式 |
| 教研记录 | `GET /ai/tasks/research?mine=1` | |
| 文件上传 | `POST /files` | multipart，返回 `{ id, name }`，文件存 OSS |

### 评分结果结构

```json
{
  "status": "completed",
  "sessionId": "ts_xxx",
  "evaluatorVersion": "sales-eval-v1",
  "totalScore": 76,
  "scores": {
    "trust": 80, "discovery": 82, "diagnosis": 78, "matching": 70,
    "value": 66, "objection": 62, "closing": 69, "communication": 85
  },
  "strengths": ["..."],
  "problems": ["..."],
  "suggestions": ["..."],
  "evidence": [{ "dimension": "discovery", "quote": "孩子之前学过英语吗？", "comment": "..." }],
  "createdAt": "2026-09-29T12:00:00Z"
}
```

### 教研 SSE

每行 `data:` 为一个 JSON：

```text
data: {"type":"delta","text":"# CPP Level 2 ..."}
data: {"type":"done","result":{ ResearchTaskResult }}
data: {"type":"error","code":"...","message":"..."}
```

生成内容为 Markdown，前端直接渲染（支持表格）。

## 实时语音协议

连接：`{NEXT_PUBLIC_VOICE_WS_URL}/v1/voice/training/:sessionId?token=<accessToken>`

**前端 → 后端**

| 帧 | 内容 |
|---|---|
| 文本 | `{"type":"session.start","format":"pcm16","sampleRate":16000}`（连接后第一帧） |
| 二进制 | 麦克风音频，16kHz 单声道 PCM16，约每 3ms–10ms 一片 |
| 文本 | `{"type":"input.text","text":"..."}`（键盘输入兜底） |
| 文本 | `{"type":"session.end"}`（挂断） |

**后端 → 前端**

| 帧 | 内容 |
|---|---|
| 文本 | `{"type":"state","state":"listening" \| "thinking" \| "speaking"}` |
| 文本 | `{"type":"asr.partial","text":"孩子之前有没有学过"}` 销售实时识别 |
| 文本 | `{"type":"asr.final","text":"..."}` 一句识别完成 |
| 文本 | `{"type":"ai.text.delta","text":"之前"}` 家长回复文字增量 |
| 文本 | `{"type":"message.completed","role":"sales" \| "parent","text":"..."}` 一条消息完成 |
| 二进制 | TTS 音频，PCM16 单声道，采样率由 `NEXT_PUBLIC_TTS_SAMPLE_RATE` 约定（默认 24000） |
| 文本 | `{"type":"error","message":"..."}` |

前端收到 `asr.partial` 时会立即停止播放家长语音（支持插话打断）。对话记录由后端语音网关落库，前端挂断后调用 `POST /training/sessions/:id/end`。
