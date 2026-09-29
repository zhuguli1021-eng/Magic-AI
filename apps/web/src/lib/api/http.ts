import type { MagicPocketApi } from "./contract";
import type { ApiResponse, ResearchTaskResult } from "./types";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1`;
const TOKEN_KEY = "mp_access_token";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 无痕模式等场景下忽略
  }
}

function headers(json = true): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(body !== undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = (await res.json()) as ApiResponse<T>;
  if (!payload.success) {
    throw new ApiError(payload.error.code, payload.error.message, payload.requestId);
  }
  return payload.data;
}

/** 读取 SSE 流：每个 `data:` 行是 JSON，形如 {type:"delta",text} 或 {type:"done",result} */
async function streamSse(
  path: string,
  body: unknown,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<ResearchTaskResult> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { ...headers(), Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new ApiError("STREAM_FAILED", `请求失败（${res.status}）`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const event = JSON.parse(line.slice(5).trim());
      if (event.type === "delta") onDelta(event.text);
      else if (event.type === "done") return event.result as ResearchTaskResult;
      else if (event.type === "error") throw new ApiError(event.code ?? "STREAM_ERROR", event.message);
    }
  }
  throw new ApiError("STREAM_INCOMPLETE", "生成中断，请重试");
}

export const httpApi: MagicPocketApi = {
  auth: {
    loginWithDingTalk: (authCode) => request("POST", "/auth/dingtalk/login", { authCode }),
    me: () => request("GET", "/auth/me"),
  },
  apps: {
    list: () => request("GET", "/ai-apps"),
  },
  training: {
    listScenarios: () => request("GET", "/training/scenarios"),
    listPersonas: (params) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][],
      ).toString();
      return request("GET", `/training/personas${qs ? `?${qs}` : ""}`);
    },
    createSession: (input) => request("POST", "/training/sessions", input),
    getSession: (id) => request("GET", `/training/sessions/${id}`),
    startSession: (id) => request("POST", `/training/sessions/${id}/start`),
    sendMessage: (id, content) => request("POST", `/training/sessions/${id}/messages`, { content }),
    // 真实后端由语音网关落库，这里无需再同步
    syncTranscript: async () => {},
    endSession: (id) => request("POST", `/training/sessions/${id}/end`),
    getEvaluation: (id) => request("GET", `/training/sessions/${id}/evaluation`),
    listHistory: () => request("GET", "/training/sessions?mine=1"),
    getMyAbility: () => request("GET", "/training/abilities/me"),
  },
  research: {
    runTask: (type, input, onDelta, signal) =>
      streamSse(`/ai/tasks/research/${type}/stream`, input, onDelta, signal),
    listHistory: () => request("GET", "/ai/tasks/research?mine=1"),
  },
  files: {
    upload: async (file) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BASE_URL}/files`, { method: "POST", headers: headers(false), body: form });
      const payload = (await res.json()) as ApiResponse<{ id: string; name: string }>;
      if (!payload.success) throw new ApiError(payload.error.code, payload.error.message, payload.requestId);
      return payload.data;
    },
  },
};
