"use client";

import { CopyOutlined, DownloadOutlined, StopOutlined, ThunderboltOutlined, UploadOutlined } from "@ant-design/icons";
import {
  App,
  AutoComplete,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Segmented,
  Tag,
  Typography,
  Upload,
} from "antd";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAsync } from "@/hooks/use-async";
import { api, type ResearchTaskInput, type ResearchTaskResult, type ResearchTaskType } from "@/lib/api";
import { RESEARCH_TASK_LABELS } from "@/lib/labels";

const COURSES = ["CPP", "自然拼读", "英语阅读", "英语口语"].map((v) => ({ value: v }));

interface FormValues extends ResearchTaskInput {
  files?: { originFileObj?: File }[];
}

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResearchPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [type, setType] = useState<ResearchTaskType>("lesson-plan");
  const [output, setOutput] = useState("");
  const [current, setCurrent] = useState<ResearchTaskResult | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { data: history, reload } = useAsync(() => api.research.listHistory());

  async function generate(values: FormValues) {
    setRunning(true);
    setOutput("");
    setCurrent(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const fileIds: string[] = [];
      for (const f of values.files ?? []) {
        if (f.originFileObj) fileIds.push((await api.files.upload(f.originFileObj)).id);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { files, ...input } = values;
      const result = await api.research.runTask(
        type,
        { ...input, fileIds },
        (delta) => setOutput((o) => o + delta),
        controller.signal,
      );
      setCurrent(result);
      void reload();
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        message.error(e instanceof Error ? e.message : "生成失败");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  const text = current?.content ?? output;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Typography.Title level={3} className="!mb-1">
          AI 教研助手
        </Typography.Title>
        <Typography.Text type="secondary">填写课程信息，AI 帮你产出教案、练习题和测评方案，可直接复制或下载。</Typography.Text>
      </div>

      <Segmented<ResearchTaskType>
        block
        value={type}
        onChange={setType}
        options={(Object.keys(RESEARCH_TASK_LABELS) as ResearchTaskType[]).map((k) => ({
          value: k,
          label: RESEARCH_TASK_LABELS[k].name,
        }))}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title={RESEARCH_TASK_LABELS[type].description}>
            <Form<FormValues>
              form={form}
              layout="vertical"
              initialValues={{ course: "CPP", level: "2", unit: "6", age: "6-7", duration: 90, questionCount: 10 }}
              onFinish={generate}
            >
              <Form.Item name="course" label="课程" rules={[{ required: true, message: "请输入课程" }]}>
                <AutoComplete options={COURSES} placeholder="例如 CPP" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="level" label="级别" rules={[{ required: true, message: "必填" }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="unit" label="单元" rules={[{ required: true, message: "必填" }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="age" label="年龄" rules={[{ required: true, message: "必填" }]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              {type === "lesson-plan" && (
                <Form.Item name="duration" label="课时（分钟）">
                  <InputNumber min={15} max={180} step={5} className="!w-full" />
                </Form.Item>
              )}
              {type === "question-generation" && (
                <Form.Item name="questionCount" label="题目数量">
                  <InputNumber min={1} max={50} className="!w-full" />
                </Form.Item>
              )}
              <Form.Item name="goal" label="教学目标 / 要求">
                <Input.TextArea rows={3} placeholder="例如：掌握 can / can't 句型，能描述自己会做的事" />
              </Form.Item>
              <Form.Item
                name="files"
                label="参考资料（教材、往期教案，可选）"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload beforeUpload={() => false} multiple>
                  <Button icon={<UploadOutlined />}>上传文件</Button>
                </Upload>
              </Form.Item>
              <Form.Item name="extra" label="补充说明">
                <Input.TextArea rows={2} placeholder="例如：多加课堂游戏，作业要适合家长陪练" />
              </Form.Item>
              {running ? (
                <Button block danger icon={<StopOutlined />} onClick={() => abortRef.current?.abort()}>
                  停止生成
                </Button>
              ) : (
                <Button block type="primary" htmlType="submit" icon={<ThunderboltOutlined />}>
                  开始生成
                </Button>
              )}
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={15}>
          <Card
            title={current?.title ?? "生成结果"}
            className="h-full"
            extra={
              text && !running ? (
                <div className="flex gap-2">
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => navigator.clipboard.writeText(text).then(() => message.success("已复制"))}
                  >
                    复制
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => download(`${current?.title ?? "教研产出"}.md`, text)}
                  >
                    下载
                  </Button>
                </div>
              ) : null
            }
          >
            {text ? (
              <div className="markdown-output">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                {running && <span className="animate-pulse">▍</span>}
              </div>
            ) : (
              <Empty description={running ? "正在生成…" : "填写左侧信息后点击“开始生成”"} />
            )}
          </Card>
        </Col>
      </Row>

      {history && history.length > 0 && (
        <Card title="历史产出">
          <List
            dataSource={history}
            renderItem={(r) => (
              <List.Item
                actions={[
                  <a
                    key="view"
                    onClick={() => {
                      setCurrent(r);
                      setOutput(r.content);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    查看
                  </a>,
                ]}
              >
                <List.Item.Meta
                  title={r.title}
                  description={new Date(r.createdAt).toLocaleString("zh-CN")}
                />
                <Tag color="blue">{RESEARCH_TASK_LABELS[r.type].name}</Tag>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
