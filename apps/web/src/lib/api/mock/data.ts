import type { AiApplication, PublicPersona, TrainingScenario } from "../types";

// 仅供前端演示的模拟数据。上线后由后端 /api/v1 返回。

export const mockApps: AiApplication[] = [
  {
    id: "app-sales-voice",
    code: "sales_voice_training",
    name: "AI 语音销售陪练",
    description: "和 AI 模拟家长实时语音对话，结束后自动评分和复盘。",
    category: "sales",
    path: "/sales-training",
    status: "available",
  },
  {
    id: "app-research",
    code: "research_assistant",
    name: "AI 教研助手",
    description: "生成教案、练习题和测评方案，把教研成果快速产出成文。",
    category: "research",
    path: "/research",
    status: "available",
  },
  {
    id: "app-teacher",
    code: "teacher_assistant",
    name: "AI 教师助手",
    description: "备课、作业生成、家长反馈。",
    category: "teaching",
    path: "/apps",
    status: "planned",
  },
  {
    id: "app-content",
    code: "content_assistant",
    name: "AI 内容助手",
    description: "朋友圈、公众号、招生海报文案。",
    category: "content",
    path: "/apps",
    status: "planned",
  },
  {
    id: "app-knowledge",
    code: "knowledge_base",
    name: "企业知识库",
    description: "教材、SOP、家长 FAQ 统一检索问答。",
    category: "knowledge",
    path: "/apps",
    status: "planned",
  },
  {
    id: "app-homeroom",
    code: "homeroom_assistant",
    name: "AI 班主任助手",
    description: "学情跟进、家长沟通记录与提醒。",
    category: "teaching",
    path: "/apps",
    status: "planned",
  },
];

export const mockScenarios: TrainingScenario[] = [
  {
    id: "sc-phone",
    code: "phone_invitation",
    name: "电话邀约试听",
    description: "家长在抖音留资后第一次接到电话，需要建立信任并邀约到店试听。",
    trainingGoal: "完成需求挖掘并邀约试听",
    scenarioType: "phone_invitation",
    defaultDuration: 8,
    difficulty: "normal",
  },
  {
    id: "sc-onsite",
    code: "onsite_consultation",
    name: "到店咨询",
    description: "家长带孩子到校区咨询，需要诊断孩子情况并匹配课程。",
    trainingGoal: "完成学情诊断并推荐合适课程",
    scenarioType: "onsite_consultation",
    defaultDuration: 12,
    difficulty: "normal",
  },
  {
    id: "sc-objection",
    code: "price_objection",
    name: "价格异议处理",
    description: "试听后家长觉得价格贵、还在比较其他机构。",
    trainingGoal: "化解价格顾虑并推进报名",
    scenarioType: "objection",
    defaultDuration: 10,
    difficulty: "hard",
  },
];

/** 模拟家长：公开信息 + 仅在 mock 中使用的应答脚本（真实环境由后端 Persona Prompt 驱动） */
export interface MockPersona extends PublicPersona {
  opening: string;
  replies: { keywords: string[]; text: string }[];
  fallbacks: string[];
}

export const mockPersonas: MockPersona[] = [
  {
    id: "p-anxious-mom",
    code: "anxious_mom",
    name: "幼升小焦虑型妈妈",
    difficulty: "normal",
    personalityType: "焦虑、爱比较、重视效果",
    childAge: 6,
    childGrade: "大班",
    consultationChannel: "抖音留资",
    learningHistory: "线上英语 1 年",
    briefing: "孩子明年上一年级，妈妈担心英语跟不上，已经在对比几家机构。",
    voice: "female_warm",
    opening: "喂，你好，我是之前在抖音上留了电话的，想了解一下你们的英语课。",
    replies: [
      { keywords: ["学过", "基础", "之前", "学习"], text: "之前在线上学了一年，但是感觉效果一般，自然拼读还是不太会，也不太敢开口说。" },
      { keywords: ["多大", "年龄", "几岁", "年级"], text: "孩子六岁，现在上大班，明年就要上一年级了。" },
      { keywords: ["担心", "目标", "希望", "期望"], text: "主要是怕上了一年级跟不上，希望她能在班里英语领先一点，至少敢说。" },
      { keywords: ["价格", "多少钱", "费用", "学费"], text: "你们一年大概多少钱？我看另外一家一年八千多。" },
      { keywords: ["试听", "体验", "来一下", "到店"], text: "试听可以啊，不过我这周比较忙，周末可能有时间，要多长时间？" },
      { keywords: ["老师", "外教", "师资"], text: "你们老师是中教还是外教？我比较在意老师有没有经验。" },
      { keywords: ["效果", "保证", "提分", "进步"], text: "效果怎么保证呢？之前那家也说得很好，最后也没看出多大进步。" },
      { keywords: ["其他", "别家", "对比", "机构"], text: "我也试听了两家了，还没决定，感觉都差不多。" },
      { keywords: ["周六", "周日", "周末", "时间", "预约"], text: "那就周六上午吧，我先带她去看看，不过报不报名还得跟孩子爸爸商量。" },
    ],
    fallbacks: ["嗯，你继续说。", "这个我不太懂，你能说具体一点吗？", "好的，那还有别的吗？", "嗯……我主要还是担心效果。"],
  },
  {
    id: "p-busy-dad",
    code: "busy_dad",
    name: "忙碌理性型爸爸",
    difficulty: "hard",
    personalityType: "理性、时间少、看重性价比",
    childAge: 8,
    childGrade: "二年级",
    consultationChannel: "朋友推荐",
    learningHistory: "学校英语，无课外班",
    briefing: "朋友推荐过来，爸爸工作忙，说话直接，只关心结果和价格。",
    voice: "male_calm",
    opening: "你好，朋友推荐的，我时间不多，你简单说一下你们课程怎么上。",
    replies: [
      { keywords: ["学过", "基础", "之前"], text: "没上过外面的班，就学校的英语课，成绩中等吧。" },
      { keywords: ["价格", "多少钱", "费用"], text: "直接说价格吧，一学期多少？有没有优惠？" },
      { keywords: ["时间", "上课", "几点"], text: "我们只有周末有空，平时孩子作业多。" },
      { keywords: ["效果", "进步", "提分"], text: "学完能达到什么水平？有没有测评数据给我看？" },
      { keywords: ["试听", "体验", "预约"], text: "试听可以，但我不想浪费时间，一节课多久？" },
    ],
    fallbacks: ["说重点。", "这个跟我孩子有什么关系？", "嗯，还有吗？"],
  },
  {
    id: "p-hesitant-grandma",
    code: "hesitant_grandma",
    name: "犹豫型奶奶",
    difficulty: "easy",
    personalityType: "和善、做不了主、容易被带跑",
    childAge: 5,
    childGrade: "中班",
    consultationChannel: "地推传单",
    learningHistory: "没有学过",
    briefing: "奶奶接送孩子时拿到传单，来问问，但报名要孩子妈妈决定。",
    voice: "female_elder",
    opening: "小伙子，我拿了你们的单子，想问问孩子这么小能学英语吗？",
    replies: [
      { keywords: ["多大", "年龄", "几岁"], text: "五岁了，上中班，挺活泼的。" },
      { keywords: ["妈妈", "爸爸", "家长", "决定"], text: "报名的事得问她妈妈，我就是先来了解了解。" },
      { keywords: ["试听", "体验"], text: "试听要钱吗？不要钱的话可以带她来玩玩。" },
      { keywords: ["价格", "多少钱"], text: "哎哟，这么贵啊，我回去跟她妈说说。" },
    ],
    fallbacks: ["哦哦，好的。", "我年纪大了听不太懂，你慢慢说。", "那我回去问问她妈妈。"],
  },
];
