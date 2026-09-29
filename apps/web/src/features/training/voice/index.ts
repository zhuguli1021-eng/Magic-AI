import { USE_MOCK } from "@/lib/api";
import { MockVoiceClient } from "./mock-client";
import type { VoiceClient } from "./types";
import { WebSocketVoiceClient } from "./websocket-client";

export function createVoiceClient(sessionId: string, personaId: string): VoiceClient {
  if (USE_MOCK) return new MockVoiceClient(personaId);
  let token: string | null = null;
  try {
    token = localStorage.getItem("mp_access_token");
  } catch {
    // 忽略
  }
  return new WebSocketVoiceClient(sessionId, token);
}

export type { CallState, VoiceClient, VoiceEvent } from "./types";
