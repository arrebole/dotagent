import { arr, int, obj, oneOf, opt, str, type Static } from "@earendil-works/pi-schema";
import { searchOptions } from "./providers/options.ts";

export const searchParameters = obj({
  provider: oneOf(["exa", "tavily"], {
    description: "搜索服务商：Tavily 用于快速查询、新闻和财经；Exa 用于语义检索、深入研究和结构化输出。",
  }),
  query: str({ minLength: 1, description: "搜索词；尽量聚焦一个具体问题。" }),
  numResults: opt(int({ minimum: 1, maximum: 100, default: 10, description: "结果数量，默认 10。Exa 最多 100；Tavily 最多 20，超出会报错。" })),
  includeDomains: opt(arr(str(), { description: "仅搜索这些域名。" })),
  excludeDomains: opt(arr(str(), { description: "排除这些域名。" })),
  startDate: opt(str({ description: "最早发布日期；Exa 接受 ISO 8601，Tavily 要求 YYYY-MM-DD。" })),
  endDate: opt(str({ description: "最晚发布日期；Exa 接受 ISO 8601，Tavily 要求 YYYY-MM-DD。" })),
  options: opt(searchOptions),
});

export type SearchInput = Static<typeof searchParameters>;
