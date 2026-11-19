import { missingKeyError } from "../config.ts";
import { formatFirecrawlResults } from "../formatters.ts";
import { fetchWithTimeout } from "../http.ts";
import type { SearchProviderAdapter, SearchRequest, SearchResult } from "./types.ts";

const baseUrl = "https://api.firecrawl.dev";

const timeRangeTbs: Record<string, string> = {
  day: "qdr:d", d: "qdr:d",
  week: "qdr:w", w: "qdr:w",
  month: "qdr:m", m: "qdr:m",
  year: "qdr:y", y: "qdr:y",
};

function validate(request: SearchRequest): void {
  const opts = request.options ?? {};
  if (request.query.length > 500) {
    throw new Error("Firecrawl 的 query 最长 500 字符，请精简搜索词。");
  }
  if (request.includeDomains?.length && request.excludeDomains?.length) {
    throw new Error("Firecrawl 不支持同时使用 includeDomains 和 excludeDomains。");
  }
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  for (const [name, value] of [["startDate", request.startDate], ["endDate", request.endDate]] as const) {
    if (value !== undefined && !datePattern.test(value)) {
      throw new Error(`Firecrawl 的 ${name} 必须使用 YYYY-MM-DD 格式。`);
    }
  }
  if (request.startDate && request.endDate && request.startDate > request.endDate) {
    throw new Error("Firecrawl 的 startDate 不能晚于 endDate。");
  }
  if (opts.timeRange && (request.startDate || request.endDate)) {
    throw new Error("Firecrawl 的 timeRange 不能与 startDate/endDate 同时使用。");
  }
  const categories = opts.categories ?? [];
  if (categories.length > 1 && (categories.includes("developer") || categories.includes("gov"))) {
    throw new Error("Firecrawl 的 developer 和 gov 分类只能单独使用。");
  }
  if (opts.country !== undefined && !/^[A-Za-z]{2}$/.test(opts.country)) {
    throw new Error("Firecrawl 的 country 必须是 ISO 3166-1 两位国家代码，例如 CN、US。");
  }
}

// startDate/endDate 为 YYYY-MM-DD，Firecrawl 的 cdr 要求 MM/DD/YYYY。
function toCdrDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}

function buildTbs(request: SearchRequest): string | undefined {
  const opts = request.options ?? {};
  const parts: string[] = [];
  if (opts.sortByDate) parts.push("sbd:1");
  if (opts.timeRange) parts.push(timeRangeTbs[opts.timeRange]);
  if (request.startDate || request.endDate) {
    parts.push("cdr:1");
    if (request.startDate) parts.push(`cd_min:${toCdrDate(request.startDate)}`);
    if (request.endDate) parts.push(`cd_max:${toCdrDate(request.endDate)}`);
  }
  return parts.length ? parts.join(",") : undefined;
}

async function executeSearch(request: SearchRequest, apiKey: string, signal?: AbortSignal): Promise<SearchResult> {
  if (!apiKey) throw missingKeyError(firecrawl);
  const opts = request.options ?? {};
  // 抓取正文明显更慢，服务端超时放宽；客户端超时留出余量，避免先于服务端中断。
  const serverTimeoutMs = opts.scrape ? 90_000 : 60_000;

  const body: Record<string, unknown> = {
    query: request.query,
    limit: request.numResults ?? 10,
    highlights: opts.highlights ?? true,
    timeout: serverTimeoutMs,
  };
  if (opts.sources?.length) body.sources = opts.sources.map((type) => ({ type }));
  if (opts.categories?.length) body.categories = opts.categories.map((type) => ({ type }));
  if (request.includeDomains?.length) body.includeDomains = request.includeDomains;
  if (request.excludeDomains?.length) body.excludeDomains = request.excludeDomains;
  const tbs = buildTbs(request);
  if (tbs) body.tbs = tbs;
  if (opts.location) body.location = opts.location;
  if (opts.country) body.country = opts.country.toUpperCase();
  if (opts.safeSearch !== undefined) body.safe = opts.safeSearch;
  if (opts.scrape) body.scrapeOptions = { formats: [{ type: opts.scrape }], onlyMainContent: true };

  const response = await fetchWithTimeout(`${baseUrl}/v2/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: serverTimeoutMs + 10_000,
  }, signal);
  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`Firecrawl API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (data.success === false) {
    throw new Error(`Firecrawl API error: ${typeof data.error === "string" ? data.error : JSON.stringify(data)}`);
  }
  const results = (data.data ?? {}) as Record<string, unknown>;
  const count = (key: string) => Array.isArray(results[key]) ? (results[key] as unknown[]).length : 0;
  return {
    content: [{ type: "text", text: formatFirecrawlResults(data) }],
    details: {
      provider: "firecrawl",
      id: data.id,
      creditsUsed: data.creditsUsed,
      warning: data.warning,
      webCount: count("web"),
      newsCount: count("news"),
      imageCount: count("images"),
    },
  };
}

const firecrawl = {
  id: "firecrawl",
  name: "Firecrawl Search",
  apiKeyName: "Firecrawl API Key",
  apiKeyEnv: "FIRECRAWL_API_KEY",
  authId: "api.firecrawl.dev/default",
  baseUrl,
  validate,
  executeSearch,
} satisfies SearchProviderAdapter;

export default firecrawl;
