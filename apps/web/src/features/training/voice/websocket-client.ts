import { PcmPlayer, startMicCapture, type MicCapture } from "./audio";
import { Emitter, type VoiceClient, type VoiceEvent } from "./types";

/**
 * 真实语音通道：WebSocket 连接 MagicPocket 语音服务
 * （后端再对接 Fun-ASR-Realtime、FastGPT、CosyVoice）。
 *
 * 上行：
 *   - 文本帧 {"type":"session.start","format":"pcm16","sampleRate":16000}
 *   - 二进制帧：16k 单声道 PCM16 音频分片
 *   - 文本帧 {"type":"input.text","text":"..."}（键盘输入兜底）
 *   - 文本帧 {"type":"session.end"}
 * 下行：
 *   - 文本帧：VoiceEvent JSON（asr.partial / asr.final / ai.text.delta / message.completed / state / error）
 *   - 二进制帧：TTS 音频分片（PCM16，采样率见 NEXT_PUBLIC_TTS_SAMPLE_RATE，默认 24000）
 */
export class WebSocketVoiceClient implements VoiceClient {
  readonly supportsSpeechInput = true;
  private emitter = new Emitter();
  private ws: WebSocket | null = null;
  private mic: MicCapture | null = null;
  private player = new PcmPlayer(Number(process.env.NEXT_PUBLIC_TTS_SAMPLE_RATE ?? 24000));
  private muted = false;

  constructor(
    private sessionId: string,
    private token: string | null,
  ) {}

  on(listener: (e: VoiceEvent) => void) {
    return this.emitter.on(listener);
  }

  async connect() {
    this.emitter.emit({ type: "state", state: "connecting" });
    const base = process.env.NEXT_PUBLIC_VOICE_WS_URL ?? "";
    const url = `${base}/v1/voice/training/${this.sessionId}${this.token ? `?token=${encodeURIComponent(this.token)}` : ""}`;
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("语音服务连接失败"));
    });

    ws.send(JSON.stringify({ type: "session.start", format: "pcm16", sampleRate: 16000 }));
    ws.onmessage = (msg) => {
      if (msg.data instanceof ArrayBuffer) {
        this.player.enqueue(msg.data, () => this.emitter.emit({ type: "state", state: "listening" }));
        return;
      }
      const event = JSON.parse(msg.data as string) as VoiceEvent;
      // 销售开口说话时打断 AI 家长
      if (event.type === "asr.partial") this.player.interrupt();
      this.emitter.emit(event);
    };
    ws.onclose = () => this.emitter.emit({ type: "state", state: "closed" });
    ws.onerror = () => this.emitter.emit({ type: "error", message: "语音连接中断" });

    this.mic = await startMicCapture({
      sampleRate: 16000,
      onChunk: (pcm) => {
        if (!this.muted && ws.readyState === WebSocket.OPEN) ws.send(pcm.buffer);
      },
      onLevel: (value) => this.emitter.emit({ type: "level", value: this.muted ? 0 : value }),
    });
    this.emitter.emit({ type: "state", state: "listening" });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  sendText(text: string) {
    this.ws?.send(JSON.stringify({ type: "input.text", text }));
  }

  close() {
    this.mic?.stop();
    this.player.close();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "session.end" }));
      this.ws.close();
    }
    this.ws = null;
  }
}
