import type { MagicPocketApi } from "./contract";
import { httpApi } from "./http";
import { mockApi } from "./mock";

/** NEXT_PUBLIC_USE_MOCK=false 时走真实后端，默认用模拟数据 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const api: MagicPocketApi = USE_MOCK ? mockApi : httpApi;

export type { MagicPocketApi } from "./contract";
export * from "./types";
