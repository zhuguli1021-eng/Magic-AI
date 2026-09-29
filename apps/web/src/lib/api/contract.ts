import type {
  AbilityProfile,
  AiApplication,
  CreateSessionInput,
  CreateSessionResult,
  CurrentUser,
  EvaluationResponse,
  LoginResult,
  PublicPersona,
  ResearchTaskInput,
  ResearchTaskResult,
  ResearchTaskType,
  TrainingMessage,
  TrainingScenario,
  TrainingSession,
} from "./types";

/**
 * MagicPocket API 的前端接口。
 * 注释里是对应的后端路由（统一前缀 /api/v1）。
 * 目前由 mock 实现；后端就绪后切到 http 实现即可，页面代码不用改。
 */
export interface MagicPocketApi {
  auth: {
    /** POST /auth/dingtalk/login */
    loginWithDingTalk(authCode: string): Promise<LoginResult>;
    /** GET /auth/me */
    me(): Promise<CurrentUser>;
  };
  apps: {
    /** GET /ai-apps（后端按权限过滤） */
    list(): Promise<AiApplication[]>;
  };
  training: {
    /** GET /training/scenarios */
    listScenarios(): Promise<TrainingScenario[]>;
    /** GET /training/personas?scenario=&difficulty= */
    listPersonas(params?: { scenario?: string; difficulty?: string }): Promise<PublicPersona[]>;
    /** POST /training/sessions */
    createSession(input: CreateSessionInput): Promise<CreateSessionResult>;
    /** GET /training/sessions/:id */
    getSession(id: string): Promise<TrainingSession>;
    /** POST /training/sessions/:id/start */
    startSession(id: string): Promise<void>;
    /** POST /training/sessions/:id/messages（文字陪练；语音走 WebSocket） */
    sendMessage(id: string, content: string): Promise<TrainingMessage>;
    /**
     * 语音模式下，把前端已确认的对话同步给后端。
     * 真实后端由语音网关直接落库，这个调用可以是空操作。
     */
    syncTranscript(id: string, messages: TrainingMessage[]): Promise<void>;
    /** POST /training/sessions/:id/end → 进入 evaluating */
    endSession(id: string): Promise<void>;
    /** GET /training/sessions/:id/evaluation */
    getEvaluation(id: string): Promise<EvaluationResponse>;
    /** GET /training/sessions?mine=1 */
    listHistory(): Promise<TrainingSession[]>;
    /** GET /training/abilities/me */
    getMyAbility(): Promise<AbilityProfile>;
  };
  research: {
    /**
     * POST /ai/tasks/research/:type/stream（SSE）
     * onDelta 逐段返回生成内容，Promise 在完成后返回完整结果。
     */
    runTask(
      type: ResearchTaskType,
      input: ResearchTaskInput,
      onDelta: (text: string) => void,
      signal?: AbortSignal,
    ): Promise<ResearchTaskResult>;
    /** GET /ai/tasks/research?mine=1 */
    listHistory(): Promise<ResearchTaskResult[]>;
  };
  files: {
    /** POST /files（上传到 OSS，返回文件 ID） */
    upload(file: File): Promise<{ id: string; name: string }>;
  };
}
