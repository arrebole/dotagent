import { missingKeyError } from "../config";
import { formatTavilyResults } from "../formatters";
import { fetchWithTimeout } from "../http";
import type { SearchProviderAdapter, SearchRequest } from "./types";

const baseUrl = "https://api.tavily.com";

function validate(request: SearchRequest): void {
  if (request.numResults !== undefined && request.numResults > 20) {
    throw new Error("Tavily 的 numResults 最大为 20，请调整参数后重试。");
  }
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  for (const [name, value] of [["startDate", request.startDate], ["endDate", request.endDate]] as const) {
    if (value !== undefined && !datePattern.test(value)) {
      throw new Error(`Tavily 的 ${name} 必须使用 YYYY-MM-DD 格式。`);
    }
  }
  if (request.startDate && request.endDate && request.startDate > request.endDate) {
    throw new Error("Tavily 的 startDate 不能晚于 endDate。");
  }
}

async function executeSearch(request: SearchRequest, apiKey: string, signal?: AbortSignal) {
  if (!apiKey) throw missingKeyError(tavily);
  const opts = request.options ?? {};
  const includeAnswer = opts.includeAnswer === false ? false : opts.answerDepth ?? opts.includeAnswer ?? true;
  const includeRawContent = opts.includeRawContent === false
    ? false
    : opts.rawContentFormat ?? opts.includeRawContent ?? false;
  const body: Record<string, unknown> = {
    query: request.query,
    max_results: request.numResults ?? 10,
    search_depth: opts.searchDepth ?? "basic",
    topic: opts.topic ?? "general",
    include_answer: includeAnswer,
    include_raw_content: includeRawContent,
    include_images: opts.includeImages ?? false,
    include_image_descriptions: opts.includeImageDescriptions ?? false,
    include_favicon: opts.includeFavicon ?? false,
    auto_parameters: opts.autoParameters ?? false,
    exact_match: opts.exactMatch ?? false,
    include_usage: opts.includeUsage ?? false,
    safe_search: opts.safeSearch ?? false,
  };
  if (opts.days !== undefined) body.days = opts.days;
  if (opts.timeRange) body.time_range = opts.timeRange;
  if (request.startDate) body.start_date = request.startDate;
  if (request.endDate) body.end_date = request.endDate;
  if (opts.chunksPerSource !== undefined) body.chunks_per_source = opts.chunksPerSource;
  if (request.includeDomains?.length) body.include_domains = request.includeDomains;
  if (request.excludeDomains?.length) body.exclude_domains = request.excludeDomains;
  if (opts.country) body.country = opts.country;

  const response = await fetchWithTimeout(`${baseUrl}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: 60_000,
  }, signal);
  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`Tavily API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return {
    content: [{ type: "text" as const, text: formatTavilyResults(data, includeRawContent !== false) }],
    details: {
      provider: "tavily",
      query: data.query,
      responseTime: data.response_time,
      resultCount: Array.isArray(data.results) ? data.results.length : 0,
      imageCount: Array.isArray(data.images) ? data.images.length : 0,
      usage: data.usage,
    },
  };
}

const tavily = {
  id: "tavily",
  name: "Tavily Search",
  apiKeyName: "Tavily API Key",
  apiKeyEnv: "TAVILY_API_KEY",
  authId: "api.tavily.com/default",
  baseUrl,
  validate,
  executeSearch,
} satisfies SearchProviderAdapter;

export default tavily;
