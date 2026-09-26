import { missingKeyError } from "../config";
import { formatExaResults } from "../formatters";
import { fetchWithTimeout } from "../http";
import type { SearchProviderAdapter, SearchRequest } from "./types";

const baseUrl = "https://api.exa.ai";

async function executeSearch(request: SearchRequest, apiKey: string, signal?: AbortSignal) {
  if (!apiKey) throw missingKeyError(exa);
  const opts = request.options ?? {};

  const body: Record<string, unknown> = {
    query: request.query,
    type: opts.type ?? "auto",
    numResults: request.numResults ?? 10,
  };
  if (opts.category) body.category = opts.category;
  if (request.includeDomains?.length) body.includeDomains = request.includeDomains;
  if (request.excludeDomains?.length) body.excludeDomains = request.excludeDomains;
  if (request.startDate) body.startPublishedDate = request.startDate;
  if (request.endDate) body.endPublishedDate = request.endDate;

  const contents: Record<string, unknown> = {};
  if (opts.highlights !== false) contents.highlights = true;
  if (opts.text === true) {
    contents.text = opts.maxTextCharacters ? { maxCharacters: opts.maxTextCharacters } : true;
  }
  if (opts.summary === true) contents.summary = true;
  if (opts.maxAgeHours !== undefined) contents.maxAgeHours = opts.maxAgeHours;
  if (Object.keys(contents).length) body.contents = contents;
  if (opts.outputSchema) body.outputSchema = opts.outputSchema;

  const response = await fetchWithTimeout(`${baseUrl}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(body),
    timeoutMs: 60_000,
  }, signal);
  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`Exa API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return {
    content: [{ type: "text" as const, text: formatExaResults(data) }],
    details: {
      provider: "exa",
      requestId: data.requestId,
      costDollars: data.costDollars,
      searchTime: data.searchTime,
      resultCount: Array.isArray(data.results) ? data.results.length : 0,
    },
  };
}

const exa = {
  id: "exa",
  name: "Exa Search",
  apiKeyName: "Exa API Key",
  apiKeyEnv: "EXA_API_KEY",
  authId: "api.exa.ai/default",
  baseUrl,
  executeSearch,
} satisfies SearchProviderAdapter;

export default exa;
