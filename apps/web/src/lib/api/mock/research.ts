import type { ResearchTaskInput, ResearchTaskType } from "../types";

// 模拟的教研产出模板。真实环境由 FastGPT 教研 Workflow 生成。

export function researchTitle(type: ResearchTaskType, i: ResearchTaskInput): string {
  const base = `${i.course} Level ${i.level} Unit ${i.unit}`;
  if (type === "lesson-plan") return `${base} 教案`;
  if (type === "question-generation") return `${base} 练习题`;
  return `${base} 测评方案`;
}

export function buildResearchContent(type: ResearchTaskType, i: ResearchTaskInput): string {
  const head = `# ${researchTitle(type, i)}\n\n> 适用年龄：${i.age} 岁${i.duration ? `　课时：${i.duration} 分钟` : ""}\n>\n> 教学目标：${i.goal || "（未填写，按单元默认目标生成）"}\n\n`;
  const note = "\n\n---\n*当前为前端演示内容，接入 FastGPT 教研工作流后将基于教材知识库生成。*\n";

  if (type === "lesson-plan") {
    const d = i.duration ?? 90;
    return (
      head +
      `## 一、教学目标\n1. 语言目标：掌握本单元核心词汇与句型。\n2. 能力目标：能在情景中完成简单问答。\n3. 情感目标：敢于开口，乐于参与课堂游戏。\n\n` +
      `## 二、教学重难点\n- 重点：核心句型的理解与运用\n- 难点：自然拼读规则迁移到新单词\n\n` +
      `## 三、教学流程\n| 环节 | 时长 | 活动 | 设计意图 |\n|---|---|---|---|\n` +
      `| Warm-up | ${Math.round(d * 0.1)} 分钟 | 歌曲 + TPR 热身 | 调动课堂气氛 |\n` +
      `| Presentation | ${Math.round(d * 0.25)} 分钟 | 情景导入新词汇与句型 | 建立语义理解 |\n` +
      `| Practice | ${Math.round(d * 0.3)} 分钟 | 分组操练、闪卡游戏 | 强化记忆 |\n` +
      `| Production | ${Math.round(d * 0.25)} 分钟 | 角色扮演任务 | 迁移运用 |\n` +
      `| Wrap-up | ${Math.round(d * 0.1)} 分钟 | 总结 + 布置作业 | 巩固与反馈 |\n\n` +
      `## 四、课堂游戏\n- **Magic Box**：学生摸出卡片并用句型描述。\n- **Run and Touch**：听指令触摸对应图片。\n\n` +
      `## 五、课后作业\n1. 跟读本单元音频 3 遍并打卡。\n2. 用今天的句型和家人完成一次对话。\n` +
      note
    );
  }

  if (type === "question-generation") {
    const n = i.questionCount ?? 10;
    const items = Array.from({ length: n }, (_, k) => {
      const level = k < n * 0.4 ? "基础" : k < n * 0.8 ? "提高" : "拓展";
      return `${k + 1}. 【${level}】（示例题目 ${k + 1}，围绕 Unit ${i.unit} 核心知识点）\n   - 答案：略\n   - 考查点：词汇 / 句型`;
    }).join("\n");
    return head + `## 练习题（共 ${n} 题，基础 40% / 提高 40% / 拓展 20%）\n\n${items}\n` + note;
  }

  return (
    head +
    `## 一、测评结构\n| 模块 | 题型 | 分值 |\n|---|---|---|\n| 听力 | 听音选图 | 30 |\n| 口语 | 看图说话 | 30 |\n| 阅读 | 图文匹配 | 20 |\n| 书写 | 字母/单词书写 | 20 |\n\n` +
    `## 二、评分标准\n- A（90–100）：能流利运用本单元句型\n- B（75–89）：基本掌握，偶有错误\n- C（60–74）：需要老师提示\n- D（<60）：建议课后辅导\n\n` +
    `## 三、家长反馈模板\n> 孩子本次在【模块】表现突出，【模块】还需加强，建议在家每天……\n` +
    note
  );
}
