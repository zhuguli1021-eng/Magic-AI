"use client";

import {
  AudioMutedOutlined,
  AudioOutlined,
  CloseOutlined,
  EditOutlined,
  PhoneFilled,
  SendOutlined,
} from "@ant-design/icons";
import { App, Avatar, Button, Input, Result, Spin, Tag } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createVoiceClient, type CallState, type VoiceClient } from "@/features/training/voice";
import { useAsync } from "@/hooks/use-async";
import { api, type TrainingMessage } from "@/lib/api";

const STATE_TEXT: Record<CallState, string> = {
  connecting: "正在接通…",
  listening: "请说话",
  thinking: "家长在想…",
  speaking: "家长正在说话",
  closed: "通话已结束",
};

function formatTime(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export default function TrainingSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message } = App.useApp();
  const { data: session, loading, error } = useAsync(() => api.training.getSession(id), [id]);

  const clientRef = useRef<VoiceClient | null>(null);
  const messagesRef = useRef<TrainingMessage[]>([]);
  const startRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<"ready" | "calling" | "ending">("ready");
  const [callState, setCallState] = useState<CallState>("connecting");
  const [messages, setMessages] = useState<TrainingMessage[]>([]);
  const [partial, setPartial] = useState("");
  const [aiDraft, setAiDraft] = useState("");
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const [text, setText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => () => clientRef.current?.close(), []);

  useEffect(() => {
    if (phase !== "calling") return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, partial, aiDraft]);

  async function connect() {
    if (!session) return;
    setPhase("calling");
    startRef.current = Date.now();
    await api.training.startSession(session.id);

    const client = createVoiceClient(session.id, session.persona.id);
    clientRef.current = client;
    setSpeechSupported(client.supportsSpeechInput);
    if (!client.supportsSpeechInput) setKeyboard(true);

    client.on((e) => {
      switch (e.type) {
        case "state":
          setCallState(e.state);
          break;
        case "level":
          setLevel(e.value);
          break;
        case "asr.partial":
          setPartial(e.text);
          break;
        case "asr.final":
          setPartial("");
          break;
        case "ai.text.delta":
          setAiDraft((d) => d + e.text);
          break;
        case "message.completed": {
          const msg: TrainingMessage = {
            id: `${Date.now()}-${messagesRef.current.length}`,
            role: e.role,
            content: e.text,
            offsetMs: Date.now() - startRef.current,
            createdAt: new Date().toISOString(),
          };
          messagesRef.current = [...messagesRef.current, msg];
          setMessages(messagesRef.current);
          if (e.role === "parent") setAiDraft("");
          break;
        }
        case "error":
          message.warning(e.message);
          break;
      }
    });

    try {
      await client.connect();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "接通失败");
    }
  }

  async function hangUp() {
    if (!session) return;
    setPhase("ending");
    clientRef.current?.close();
    clientRef.current = null;
    await api.training.syncTranscript(session.id, messagesRef.current);
    await api.training.endSession(session.id);
    router.replace(`/sales-training/result/${session.id}`);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    clientRef.current?.setMuted(next);
  }

  function sendTyped() {
    const t = text.trim();
    if (!t) return;
    clientRef.current?.sendText(t);
    setText("");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Spin />
      </div>
    );
  }
  if (error || !session) {
    return (
      <Result
        status="404"
        title="训练不存在"
        subTitle={error?.message}
        extra={<Button onClick={() => router.push("/sales-training")}>返回陪练</Button>}
      />
    );
  }

  const persona = session.persona;
  const listening = callState === "listening" && !muted;

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          type="text"
          icon={<CloseOutlined />}
          className="!text-white/70"
          onClick={() => (phase === "calling" ? hangUp() : router.push("/sales-training"))}
        />
        <div className="text-center">
          <div className="text-sm text-white/60">{session.scenario.name}</div>
          <div className="font-mono text-lg">{phase === "ready" ? "--:--" : formatTime(elapsed)}</div>
        </div>
        <div className="w-8" />
      </div>

      {/* 家长信息 + 状态 */}
      <div className="flex flex-col items-center px-4 pt-2 pb-4">
        <div className="relative">
          {phase === "calling" && callState === "speaking" && (
            <span
              className="absolute inset-0 rounded-full bg-orange-400"
              style={{ animation: "mp-pulse 1.2s ease-out infinite" }}
            />
          )}
          <Avatar size={88} className="!bg-orange-100 !text-2xl !text-orange-600">
            {persona.name.slice(-2)}
          </Avatar>
        </div>
        <div className="mt-3 text-lg font-semibold">{persona.name}</div>
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          <Tag bordered={false} color="orange">
            孩子 {persona.childAge} 岁 · {persona.childGrade}
          </Tag>
          <Tag bordered={false}>{persona.consultationChannel}</Tag>
        </div>
        {phase === "calling" && (
          <div className="mt-2 flex h-6 items-center gap-2 text-sm text-white/70">
            {listening && (
              <span className="flex h-4 items-end gap-0.5">
                {[0.6, 1, 0.8, 1, 0.6].map((k, i) => (
                  <span
                    key={i}
                    className="w-1 rounded bg-green-400 transition-all"
                    style={{ height: `${Math.max(3, level * 16 * k)}px` }}
                  />
                ))}
              </span>
            )}
            {muted ? "已静音" : STATE_TEXT[callState]}
          </div>
        )}
      </div>

      {/* 对话 */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {phase === "ready" ? (
          <div className="mx-auto max-w-md rounded-2xl bg-white/5 p-5 text-sm leading-relaxed">
            <div className="mb-2 font-semibold">通话前须知</div>
            <p className="text-white/80">{persona.briefing}</p>
            <p className="mt-3">
              <span className="text-white/50">本次目标：</span>
              {session.trainingGoal}
            </p>
            <p className="mt-3 text-white/50">接通后家长会先开口。直接说话即可，AI 会实时识别并回应；说完一句稍作停顿。</p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "sales" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    m.role === "sales" ? "bg-orange-500" : "bg-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {aiDraft && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-white/10 px-4 py-2 text-sm leading-relaxed">{aiDraft}</div>
              </div>
            )}
            {partial && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-orange-500/50 px-4 py-2 text-sm italic">{partial}…</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 键盘输入 */}
      {phase === "calling" && keyboard && (
        <div className="px-4 pb-2">
          {!speechSupported && (
            <div className="mb-2 text-center text-xs text-white/50">当前浏览器不支持语音识别，请用键盘输入（推荐 Chrome / Edge）</div>
          )}
          <div className="mx-auto flex max-w-xl gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPressEnter={sendTyped}
              placeholder="输入你要对家长说的话"
            />
            <Button type="primary" icon={<SendOutlined />} onClick={sendTyped} />
          </div>
        </div>
      )}

      {/* 底部控制 */}
      <div className="flex items-center justify-center gap-8 px-4 pt-3 pb-8">
        {phase === "ready" ? (
          <Button
            type="primary"
            shape="circle"
            className="!h-16 !w-16 !bg-green-500 !text-2xl"
            icon={<PhoneFilled />}
            onClick={connect}
            aria-label="接通"
          />
        ) : (
          <>
            <Button
              shape="circle"
              className="!h-12 !w-12"
              icon={muted ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={toggleMute}
              aria-label={muted ? "取消静音" : "静音"}
            />
            <Button
              danger
              type="primary"
              shape="circle"
              className="!h-16 !w-16 !text-2xl"
              icon={<PhoneFilled rotate={135} />}
              loading={phase === "ending"}
              onClick={hangUp}
              aria-label="挂断并评分"
            />
            <Button
              shape="circle"
              className="!h-12 !w-12"
              icon={<EditOutlined />}
              onClick={() => setKeyboard((k) => !k)}
              aria-label="键盘输入"
            />
          </>
        )}
      </div>
    </div>
  );
}
