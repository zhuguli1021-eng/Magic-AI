import type { AbilityDimension, Difficulty, ResearchTaskType, ScenarioType } from "./api/types";

export const DIMENSION_LABELS: Record<AbilityDimension, string> = {
  trust: "建立信任",
  discovery: "需求挖掘",
  diagnosis: "学情诊断",
  matching: "课程匹配",
  value: "价值塑造",
  objection: "异议处理",
  closing: "促成邀约",
  communication: "沟通表达",
};

export const DIFFICULTY_LABELS: Record<Difficulty, { text: string; color: string }> = {
  easy: { text: "简单", color: "green" },
  normal: { text: "普通", color: "blue" },
  hard: { text: "困难", color: "red" },
};

export const SCENARIO_TYPE_LABELS: Record<ScenarioType, string> = {
  online_consultation: "线上咨询",
  phone_invitation: "电话邀约",
  onsite_consultation: "到店咨询",
  trial_followup: "试听跟进",
  objection: "异议处理",
  closing: "促单成交",
};

export const RESEARCH_TASK_LABELS: Record<ResearchTaskType, { name: string; description: string }> = {
  "lesson-plan": { name: "教案生成", description: "按课程、级别、单元生成完整课时教案" },
  "question-generation": { name: "练习题生成", description: "按知识点生成分层练习题和答案" },
  assessment: { name: "测评方案", description: "生成阶段测评的题型、评分标准和反馈模板" },
};
