// 前后端接口契约。字段与《数据库、API 与工程结构设计》保持一致，
// 后端（NestJS）实现时以此为准；前端只依赖这些类型，不依赖具体实现。

/** 统一返回格式 */
export type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string }; requestId: string };

// ---------- 用户 / 权限 ----------

export interface CurrentUser {
  id: string;
  name: string;
  avatarUrl?: string;
  department?: string;
  campus?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
}

// ---------- AI 应用中心 ----------

export type AiAppCategory = "sales" | "research" | "teaching" | "content" | "knowledge" | "general";

export interface AiApplication {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AiAppCategory;
  /** 前端路由 */
  path: string;
  /** available：已上线；planned：规划中，仅展示 */
  status: "available" | "planned";
}

// ---------- 销售陪练 ----------

export type ScenarioType =
  | "online_consultation"
  | "phone_invitation"
  | "onsite_consultation"
  | "trial_followup"
  | "objection"
  | "closing";

export type Difficulty = "easy" | "normal" | "hard";

export interface TrainingScenario {
  id: string;
  code: string;
  name: string;
  description: string;
  trainingGoal: string;
  scenarioType: ScenarioType;
  /** 建议时长（分钟） */
  defaultDuration: number;
  difficulty: Difficulty;
}

/**
 * 家长 Persona 的公开信息。
 * hidden_information / persona_prompt 绝不能下发到销售前端。
 */
export interface PublicPersona {
  id: string;
  code: string;
  name: string;
  avatarUrl?: string;
  difficulty: Difficulty;
  personalityType: string;
  childAge: number;
  childGrade: string;
  consultationChannel: string;
  learningHistory: string;
  /** 销售事先可知的背景，不含隐藏信息 */
  briefing: string;
  /** TTS 音色，由后端决定 */
  voice?: string;
}

export type SessionStatus = "created" | "in_progress" | "evaluating" | "completed" | "failed";

export interface TrainingMessage {
  id: string;
  role: "sales" | "parent";
  content: string;
  /** 相对训练开始的毫秒数 */
  offsetMs: number;
  createdAt: string;
}

export interface TrainingSession {
  id: string;
  scenario: TrainingScenario;
  persona: PublicPersona;
  trainingGoal: string;
  mode: "voice" | "text";
  status: SessionStatus;
  messages: TrainingMessage[];
  startedAt?: string;
  endedAt?: string;
  totalScore?: number;
}

export interface CreateSessionInput {
  scenarioId: string;
  personaId: string;
  difficulty: Difficulty;
  mode: "voice" | "text";
}

export interface CreateSessionResult {
  sessionId: string;
  publicPersona: PublicPersona;
  trainingGoal: string;
}

export type AbilityDimension =
  | "trust"
  | "discovery"
  | "diagnosis"
  | "matching"
  | "value"
  | "objection"
  | "closing"
  | "communication";

export interface EvaluationEvidence {
  dimension: AbilityDimension;
  quote: string;
  comment: string;
}

/** AI 评分结果：必须是结构化 JSON，不能用自然语言当成绩 */
export interface TrainingEvaluation {
  sessionId: string;
  evaluatorVersion: string;
  totalScore: number;
  scores: Record<AbilityDimension, number>;
  strengths: string[];
  problems: string[];
  suggestions: string[];
  evidence: EvaluationEvidence[];
  createdAt: string;
}

export type EvaluationResponse = { status: "evaluating" } | ({ status: "completed" } & TrainingEvaluation);

export interface AbilityProfile {
  overall: number;
  dimensions: Partial<Record<AbilityDimension, number>>;
  weakest: AbilityDimension[];
}

// ---------- 教研 ----------

export type ResearchTaskType = "lesson-plan" | "question-generation" | "assessment";

export interface ResearchTaskInput {
  course: string;
  level: string;
  unit: string;
  age: string;
  /** 课时（分钟） */
  duration?: number;
  goal?: string;
  /** 题目数量（出题用） */
  questionCount?: number;
  /** 已上传资料的文件 ID */
  fileIds?: string[];
  extra?: string;
}

export interface ResearchTaskResult {
  id: string;
  type: ResearchTaskType;
  title: string;
  input: ResearchTaskInput;
  content: string;
  createdAt: string;
}
