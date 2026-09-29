// 浏览器端音频工具：麦克风采集（PCM16）和 PCM 播放队列。

const WORKLET_SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
`;

export interface MicCapture {
  stop(): void;
}

/** 把 Float32 下采样到目标采样率并转成 Int16 */
function toPcm16(input: Float32Array, fromRate: number, toRate: number): Int16Array {
  const ratio = fromRate / toRate;
  const length = Math.floor(input.length / ratio);
  const out = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/**
 * 打开麦克风。onChunk 收到 16k 单声道 PCM16（发给 ASR），onLevel 收到 0–1 音量（画波形）。
 */
export async function startMicCapture(opts: {
  sampleRate?: number;
  onChunk?: (pcm: Int16Array) => void;
  onLevel?: (level: number) => void;
}): Promise<MicCapture> {
  const targetRate = opts.sampleRate ?? 16000;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  const ctx = new AudioContext();
  const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
  await ctx.audioWorklet.addModule(url);
  URL.revokeObjectURL(url);

  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "pcm-capture");
  node.port.onmessage = (e: MessageEvent<Float32Array>) => {
    const frame = e.data;
    if (opts.onLevel) {
      let sum = 0;
      for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
      opts.onLevel(Math.min(1, Math.sqrt(sum / frame.length) * 4));
    }
    opts.onChunk?.(toPcm16(frame, ctx.sampleRate, targetRate));
  };
  source.connect(node);

  return {
    stop() {
      node.port.onmessage = null;
      source.disconnect();
      node.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}

/** 按顺序播放后端推来的 PCM16 音频分片（TTS） */
export class PcmPlayer {
  private ctx: AudioContext | null = null;
  private nextTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  constructor(private sampleRate = 24000) {}

  enqueue(chunk: ArrayBuffer, onEnded?: () => void) {
    this.ctx ??= new AudioContext();
    const pcm = new Int16Array(chunk);
    const buffer = this.ctx.createBuffer(1, pcm.length, this.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 0x8000;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.ctx.destination);
    const start = Math.max(this.ctx.currentTime, this.nextTime);
    src.start(start);
    this.nextTime = start + buffer.duration;
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      if (this.sources.size === 0) onEnded?.();
    };
  }

  /** 打断：销售插话时停止播放 */
  interrupt() {
    this.sources.forEach((s) => s.stop());
    this.sources.clear();
    this.nextTime = 0;
  }

  close() {
    this.interrupt();
    void this.ctx?.close();
    this.ctx = null;
  }
}
