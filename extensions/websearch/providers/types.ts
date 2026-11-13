import type { AgentToolResult } from "@earendil-works/pi-coding-agent";
import type { SearchInput } from "../schema.ts";

export type SearchProvider = SearchInput["provider"];
export type SearchRequest = Omit<SearchInput, "provider">;
export type SearchResult = AgentToolResult<Record<string, unknown>>;

// 新服务商只需提供认证元数据、参数适配及搜索实现。
export interface SearchProviderAdapter {
  id: string;
  name: string;
  apiKeyName: string;
  apiKeyEnv: string;
  authId: string;
  baseUrl: string;
  validate?(request: SearchRequest): void;
  executeSearch(request: SearchRequest, apiKey: string, signal?: AbortSignal): Promise<SearchResult>;
}
