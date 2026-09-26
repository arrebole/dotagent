import type { SearchOptions } from "./options";

export type SearchProvider = "exa" | "tavily";

export interface SearchRequest {
  query: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startDate?: string;
  endDate?: string;
  options?: SearchOptions;
}

export interface SearchResult {
  content: Array<{ type: "text"; text: string }>;
  details: Record<string, unknown>;
}

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
