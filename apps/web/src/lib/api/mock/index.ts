import type { MagicPocketApi } from "../contract";
import type {
  AbilityDimension,
  AbilityProfile,
  ResearchTaskResult,
  TrainingEvaluation,
  TrainingMessage,
  TrainingSession,
} from "../types";
import { mockApps, mockPersonas, mockScenarios, type MockPersona } from "./data";
import { buildResearchContent, researchTitle } from "./research";
import { DIMENSION_LABELS } from "@/lib/labels";

// 前端演示用的模拟后端。数据存在 sessionStorage，刷新页面不丢，关闭标签页清空。

const STORE_KEY = "mp_mock_store_v1";

interface Store {
  sessions: Record<string, TrainingSession>;
  evaluations: Record<string, TrainingEvaluation & { readyAt: number }>;
  research: ResearchTaskResult[];
}

function load(): Store {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // 忽略
  }
  return { sessions: {}, evaluations: {}, research: [] };
}

function save(store: Store) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // 忽略
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function toPublic(p: MockPersona) {
  // 不把应答脚本（相当于 hidden_information / persona_prompt）暴露给页面
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { opening, replies, fallbacks, ...rest } = p;
  return rest;
}

function findPersona(id: string): MockPersona {
  const p = mockPersonas.find((x) => x.id === id);
  if (!p) throw new Error(`未找到家长角色：${id}`);
  return p;
}

/** 模拟家长的开场白 */
export function mockParentOpening(personaId: string): string {
  return findPersona(personaId).opening;
}

/** 根据销售说的话，按关键词挑一句家长回复 */
export function mockParentReply(personaId: string, salesText: string, turn: number): string {
  const p = findPersona(personaId);
  const hit = p.replies.find((r) => r.keywords.some((k) => salesText.includes(k)));
  return hit ? hit.text : p.fallbacks[turn % p.fallbacks.length];
}

const DIMENSION_KEYWORDS: Record<AbilityDimension, string[]> = {
  trust: ["您好", "理解", "放心", "感谢", "谢谢"],
  discovery: ["学过", "多大", "年级", "之前", "平时", "怎么样"],
  diagnosis: ["薄弱", "问题", "原因", "情况", "测评"],
  matching: ["适合", "课程", "班型", "方案", "针对"],
  value: ["效果", "老师", "体系", "进步", "案例"],
  objection: ["确实", "理解", "对比", "担心", "其实"],
  closing: ["试听", "预约", "周六", "周日", "时间", "报名"],
  communication: ["？", "?", "吗", "呢"],
};

function evaluate(session: TrainingSession): TrainingEvaluation {
  const salesLines = session.messages.filter((m) => m.role === "sales");
  const all = salesLines.map((m) => m.content).join("\n");
  const scores = {} as Record<AbilityDimension, number>;
  const evidence: TrainingEvaluation["evidence"] = [];
  (Object.keys(DIMENSION_KEYWORDS) as AbilityDimension[]).forEach((dim) => {
    const words = DIMENSION_KEYWORDS[dim];
    const hits = words.filter((w) => all.includes(w)).length;
    scores[dim] = Math.min(95, 50 + hits * 9 + Math.min(salesLines.length, 8) * 2);
    const quote = salesLines.find((m) => words.some((w) => m.content.includes(w)));
    if (quote) evidence.push({ dimension: dim, quote: quote.content, comment: "这句话体现了该项能力。" });
  });
  const values = Object.values(scores);
  const totalScore = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const sorted = (Object.entries(scores) as [AbilityDimension, number][]).sort((a, b) => a[1] - b[1]);
  const label = DIMENSION_LABELS;
  return {
    sessionId: session.id,
    evaluatorVersion: "mock-0.1",
    totalScore,
    scores,
    strengths: sorted.slice(-2).reverse().map(([d]) => `${label[d]}表现较好`),
    problems: sorted.slice(0, 2).map(([d]) => `${label[d]}偏弱，对话中相关动作不足`),
    suggestions: [
      "开场先确认家长身份和孩子基本情况，再介绍课程。",
      "多用开放式问题挖掘家长真正的顾虑。",
      "结尾给出明确的试听时间选项，推动家长做决定。",
    ],
    evidence,
    createdAt: new Date().toISOString(),
  };
}


export const mockApi: MagicPocketApi = {
  auth: {
    loginWithDingTalk: async () => {
      await delay(300);
      return { accessToken: "mock", refreshToken: "mock", user: await mockApi.auth.me() };
    },
    me: async () => ({
      id: "u-dev",
      name: "开发体验账号",
      department: "市场销售部",
      campus: "北京朝阳校区",
      roles: ["sales", "researcher"],
      permissions: ["ai_app:use"],
    }),
  },
  apps: {
    list: async () => {
      await delay(150);
      return mockApps;
    },
  },
  training: {
    listScenarios: async () => {
      await delay(150);
      return mockScenarios;
    },
    listPersonas: async (params) => {
      await delay(150);
      return mockPersonas
        .filter((p) => !params?.difficulty || p.difficulty === params.difficulty)
        .map(toPublic);
    },
    createSession: async (input) => {
      await delay(200);
      const scenario = mockScenarios.find((s) => s.id === input.scenarioId);
      if (!scenario) throw new Error("未找到训练场景");
      const persona = toPublic(findPersona(input.personaId));
      const store = load();
      const id = uid("ts");
      store.sessions[id] = {
        id,
        scenario,
        persona,
        trainingGoal: scenario.trainingGoal,
        mode: input.mode,
        status: "created",
        messages: [],
      };
      save(store);
      return { sessionId: id, publicPersona: persona, trainingGoal: scenario.trainingGoal };
    },
    getSession: async (id) => {
      const s = load().sessions[id];
      if (!s) throw new Error("训练不存在或已过期");
      return s;
    },
    startSession: async (id) => {
      const store = load();
      const s = store.sessions[id];
      if (!s) throw new Error("训练不存在");
      s.status = "in_progress";
      s.startedAt = new Date().toISOString();
      save(store);
    },
    sendMessage: async (id, content) => {
      const store = load();
      const s = store.sessions[id];
      const start = s.startedAt ? Date.parse(s.startedAt) : Date.now();
      const turn = s.messages.filter((m) => m.role === "sales").length;
      s.messages.push({ id: uid("m"), role: "sales", content, offsetMs: Date.now() - start, createdAt: new Date().toISOString() });
      await delay(600);
      const reply: TrainingMessage = {
        id: uid("m"),
        role: "parent",
        content: mockParentReply(s.persona.id, content, turn),
        offsetMs: Date.now() - start,
        createdAt: new Date().toISOString(),
      };
      s.messages.push(reply);
      save(store);
      return reply;
    },
    syncTranscript: async (id, messages) => {
      const store = load();
      if (!store.sessions[id]) return;
      store.sessions[id].messages = messages;
      save(store);
    },
    endSession: async (id) => {
      const store = load();
      const s = store.sessions[id];
      s.status = "evaluating";
      s.endedAt = new Date().toISOString();
      const ev = evaluate(s);
      store.evaluations[id] = { ...ev, readyAt: Date.now() + 2500 };
      s.totalScore = ev.totalScore;
      save(store);
    },
    getEvaluation: async (id) => {
      await delay(200);
      const store = load();
      const ev = store.evaluations[id];
      if (!ev || Date.now() < ev.readyAt) return { status: "evaluating" };
      if (store.sessions[id].status !== "completed") {
        store.sessions[id].status = "completed";
        save(store);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { readyAt, ...rest } = ev;
      return { status: "completed", ...rest };
    },
    listHistory: async () => {
      await delay(100);
      return Object.values(load().sessions)
        .filter((s) => s.status !== "created")
        .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
    },
    getMyAbility: async (): Promise<AbilityProfile> => {
      const evs = Object.values(load().evaluations);
      if (evs.length === 0) return { overall: 0, dimensions: {}, weakest: [] };
      const dims = Object.keys(DIMENSION_LABELS) as AbilityDimension[];
      const dimensions = Object.fromEntries(
        dims.map((d) => [d, Math.round(evs.reduce((a, e) => a + e.scores[d], 0) / evs.length)]),
      ) as Record<AbilityDimension, number>;
      const overall = Math.round(evs.reduce((a, e) => a + e.totalScore, 0) / evs.length);
      const weakest = [...dims].sort((a, b) => dimensions[a] - dimensions[b]).slice(0, 2);
      return { overall, dimensions, weakest };
    },
  },
  research: {
    runTask: async (type, input, onDelta, signal) => {
      const content = buildResearchContent(type, input);
      // 模拟流式输出
      for (let i = 0; i < content.length; i += 6) {
        if (signal?.aborted) throw new DOMException("已停止", "AbortError");
        onDelta(content.slice(i, i + 6));
        await delay(12);
      }
      const result: ResearchTaskResult = {
        id: uid("rt"),
        type,
        title: researchTitle(type, input),
        input,
        content,
        createdAt: new Date().toISOString(),
      };
      const store = load();
      store.research.unshift(result);
      save(store);
      return result;
    },
    listHistory: async () => load().research,
  },
  files: {
    upload: async (file) => {
      await delay(300);
      return { id: uid("f"), name: file.name };
    },
  },
};
