import { arr, bool, int, map, obj, oneOf, opt, str, unknown } from "@earendil-works/pi-schema";

// 统一工具暴露的高级参数；服务商只读取属于自己的字段。
export const searchOptions = obj(
  {
    type: opt(oneOf(["auto", "fast", "instant", "deep-lite", "deep", "deep-reasoning"], { default: "auto", description: "[Exa] Default auto. Choose deep or deep-reasoning only for multi-step research; may increase latency and cost." })),
    highlights: opt(bool({ default: true, description: "[Exa/Firecrawl] Return query-relevant highlight snippets (on by default)." })),
    text: opt(bool({ default: false, description: "[Exa] Request full page text; may increase latency. The tool shows only the first 2000 characters per result." })),
    maxTextCharacters: opt(int({ minimum: 1, description: "[Exa] Server-side max characters of full text; only applies when text=true. The tool still shows only the first 2000 characters." })),
    summary: opt(bool({ default: false, description: "[Exa] Generate a summary for each result; may increase latency and cost. Enable only when needed." })),
    category: opt(oneOf(["company", "people", "research paper", "news", "personal site", "financial report"], { description: "[Exa] Restrict to a content category." })),
    maxAgeHours: opt(int({ minimum: -1, description: "[Exa] Max content cache age in hours; 0 forces a live crawl, -1 uses cache only." })),
    outputSchema: opt(map(unknown(), { description: "[Exa] JSON Schema for structured output." })),

    searchDepth: opt(oneOf(["basic", "advanced", "fast", "ultra-fast"], { default: "basic", description: "[Tavily] Default basic. advanced is more accurate but slower and uses more credits." })),
    topic: opt(oneOf(["general", "news", "finance"], { default: "general", description: "[Tavily] Search topic." })),
    days: opt(int({ minimum: 1, description: "[Tavily] Limit to the last N days; mainly for news." })),
    timeRange: opt(oneOf(["day", "week", "month", "year", "d", "w", "m", "y"], { description: "[Tavily/Firecrawl] Relative publish time range. For Firecrawl, cannot be combined with startDate/endDate." })),
    chunksPerSource: opt(int({ minimum: 1, maximum: 3, description: "[Tavily] Number of content chunks per source." })),
    includeAnswer: opt(bool({ default: true, description: "[Tavily] This tool generates an answer by default; set false when you only need sources, to reduce latency and cost." })),
    answerDepth: opt(oneOf(["basic", "advanced"], { description: "[Tavily] Answer detail level; ignored when includeAnswer=false." })),
    includeRawContent: opt(bool({ default: false, description: "[Tavily] Request cleaned full page content. The tool shows only the first 1500 characters per result." })),
    rawContentFormat: opt(oneOf(["markdown", "text"], { description: "[Tavily] Format of full page content; ignored when includeRawContent=false." })),
    includeImages: opt(bool({ default: false, description: "[Tavily] Include image results." })),
    includeImageDescriptions: opt(bool({ default: false, description: "[Tavily] Include image descriptions." })),
    includeFavicon: opt(bool({ default: false, description: "[Tavily] Include favicon URLs." })),
    country: opt(str({ description: "[Tavily/Firecrawl] Prefer sources from this country. Tavily uses the full English country name (e.g. china); Firecrawl uses a two-letter country code (e.g. CN)." })),
    autoParameters: opt(bool({ default: false, description: "[Tavily] Let Tavily choose search parameters automatically." })),
    exactMatch: opt(bool({ default: false, description: "[Tavily] Require exact matches of the query." })),
    includeUsage: opt(bool({ default: false, description: "[Tavily] Include credit usage." })),
    safeSearch: opt(bool({ default: false, description: "[Tavily/Firecrawl] Enable safe search." })),

    sources: opt(arr(oneOf(["web", "news", "images"]), { description: "[Firecrawl] Sources to search, default web only. With multiple sources, numResults applies per source." })),
    categories: opt(arr(oneOf(["developer", "research", "pdf", "gov"]), { description: "[Firecrawl] Restrict to categories: developer (code repositories and developer docs), research (academic sites), pdf (PDF files), gov (government statutes and regulations). developer and gov must be used alone." })),
    scrape: opt(oneOf(["markdown", "summary"], { description: "[Firecrawl] Scrape each result's full content (markdown) or a summary (summary); uses extra credits and is slower. The tool shows only the first 2000 characters per result." })),
    sortByDate: opt(bool({ default: false, description: "[Firecrawl] Sort results by date." })),
    location: opt(str({ description: "[Firecrawl] Geographic location, e.g. Shanghai,China; also set country for best results." })),
  },
  { description: "Provider-specific advanced options; options for other providers are ignored. Prefer defaults for ordinary queries, and enable deep search, answers, or content extraction only when needed." },
);
