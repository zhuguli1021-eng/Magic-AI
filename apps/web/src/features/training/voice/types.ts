// 实时语音陪练协议（前端视角）。
// 服务端事件名与设计文档一致：asr.partial / asr.final / ai.text.delta / tts.audio.chunk / message.completed。

export type CallState = "connecting" | "listening" | "thinking" | "speaking" | "closed";

export type VoiceEvent =
  | { type: "state"; state: CallState }
  /** 销售正在说的话（实时识别中） */
  | { type: "asr.partial"; text: string }
  /** 销售一句话识别完成 */
  | { type: "asr.final"; text: string }
  /** AI 家长回复的文字增量 */
  | { type: "ai.text.delta"; text: string }
  /** 一条消息完成（销售或家长） */
  | { type: "message.completed"; role: "sales" | "parent"; text: string }
  /** 麦克风音量 0–1，用于波形动画 */
  | { type: "level"; value: number }
  | { type: "error"; message: string };

export interface VoiceClient {
  /** 是否支持语音输入；不支持时页面只提供键盘输入 */
  readonly supportsSpeechInput: boolean;
  connect(): Promise<void>;
  setMuted(muted: boolean): void;
  /** 键盘输入兜底：把文字当成销售的一句话 */
  sendText(text: string): void;
  close(): void;
  on(listener: (e: VoiceEvent) => void): () => void;
}

export class Emitter {
  private listeners = new Set<(e: VoiceEvent) => void>();
  on(l: (e: VoiceEvent) => void) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }
  emit(e: VoiceEvent) {
    this.listeners.forEach((l) => l(e));
  }
}
