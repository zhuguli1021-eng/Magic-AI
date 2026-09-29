import { mockParentOpening, mockParentReply } from "@/lib/api/mock";
import { startMicCapture, type MicCapture } from "./audio";
import { Emitter, type VoiceClient, type VoiceEvent } from "./types";

// 浏览器自带语音识别的最小类型声明（Chrome / Edge 提供 webkitSpeechRecognition）
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * 演示用语音通道：不连后端。
 * - 销售说话：浏览器语音识别（Chrome / Edge）；不支持时用键盘输入
 * - AI 家长：按关键词挑选脚本回复，用浏览器语音合成读出来
 */
export class MockVoiceClient implements VoiceClient {
  readonly supportsSpeechInput = getRecognitionCtor() !== null;
  private emitter = new Emitter();
  private recognition: Recognition | null = null;
  private mic: MicCapture | null = null;
  private muted = false;
  private speaking = false;
  private closed = false;
  private turn = 0;

  constructor(private personaId: string) {}

  on(listener: (e: VoiceEvent) => void) {
    return this.emitter.on(listener);
  }

  async connect() {
    this.emitter.emit({ type: "state", state: "connecting" });
    try {
      this.mic = await startMicCapture({
        onLevel: (value) => this.emitter.emit({ type: "level", value: this.muted || this.speaking ? 0 : value }),
      });
    } catch {
      this.emitter.emit({ type: "error", message: "无法打开麦克风，可以先用键盘输入对话" });
    }

    const Ctor = getRecognitionCtor();
    if (Ctor) {
      const rec = new Ctor();
      rec.lang = "zh-CN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        if (this.speaking || this.muted) return;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          const text = r[0].transcript.trim();
          if (!text) continue;
          if (r.isFinal) this.handleSalesUtterance(text);
          else this.emitter.emit({ type: "asr.partial", text });
        }
      };
      // 浏览器识别会自动停止，通话中需要持续重启
      rec.onend = () => {
        if (!this.closed) {
          try {
            rec.start();
          } catch {
            // 已在运行
          }
        }
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed") this.emitter.emit({ type: "error", message: "麦克风权限被拒绝" });
      };
      this.recognition = rec;
      rec.start();
    }

    // 家长先开口
    await this.parentSay(mockParentOpening(this.personaId));
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  sendText(text: string) {
    this.handleSalesUtterance(text);
  }

  close() {
    this.closed = true;
    this.recognition?.abort();
    this.mic?.stop();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    this.emitter.emit({ type: "state", state: "closed" });
  }

  private handleSalesUtterance(text: string) {
    if (this.closed) return;
    this.emitter.emit({ type: "asr.final", text });
    this.emitter.emit({ type: "message.completed", role: "sales", text });
    const reply = mockParentReply(this.personaId, text, this.turn++);
    this.emitter.emit({ type: "state", state: "thinking" });
    setTimeout(() => void this.parentSay(reply), 700);
  }

  private async parentSay(text: string) {
    if (this.closed) return;
    this.speaking = true;
    this.emitter.emit({ type: "state", state: "speaking" });

    // 文字逐段出现，模拟 ai.text.delta
    const stream = (async () => {
      for (let i = 0; i < text.length; i += 2) {
        if (this.closed) return;
        this.emitter.emit({ type: "ai.text.delta", text: text.slice(i, i + 2) });
        await new Promise((r) => setTimeout(r, 60));
      }
    })();

    const speak = new Promise<void>((resolve) => {
      if (typeof speechSynthesis === "undefined") return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 1.05;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });

    await Promise.all([stream, speak]);
    if (this.closed) return;
    this.emitter.emit({ type: "message.completed", role: "parent", text });
    this.speaking = false;
    this.emitter.emit({ type: "state", state: "listening" });
  }
}
