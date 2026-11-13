import { bool, int, map, obj, oneOf, opt, str, unknown } from "@earendil-works/pi-schema";

// 统一工具暴露的高级参数；服务商只读取属于自己的字段。
export const searchOptions = obj(
  {
    type: opt(oneOf(["auto", "fast", "instant", "deep-lite", "deep", "deep-reasoning"], { default: "auto", description: "[Exa] 默认 auto；仅在需要多步研究时选 deep 或 deep-reasoning，可能增加耗时和费用。" })),
    highlights: opt(bool({ default: true, description: "[Exa] 默认返回匹配查询的摘要片段。" })),
    text: opt(bool({ default: false, description: "[Exa] 请求网页全文，可能增加耗时；工具每条结果只展示前 2000 字符。" })),
    maxTextCharacters: opt(int({ minimum: 1, description: "[Exa] 服务端全文最大字符数；仅在 text=true 时生效，工具仍只展示前 2000 字符。" })),
    summary: opt(bool({ default: false, description: "[Exa] 为每条结果生成摘要，可能增加耗时和费用；仅在需要时开启。" })),
    category: opt(oneOf(["company", "people", "research paper", "news", "personal site", "financial report"], { description: "[Exa] 限定搜索类别。" })),
    maxAgeHours: opt(int({ minimum: -1, description: "[Exa] 内容缓存时间；0 表示实时抓取，-1 表示仅使用缓存。" })),
    outputSchema: opt(map(unknown(), { description: "[Exa] 结构化输出的 JSON Schema。" })),

    searchDepth: opt(oneOf(["basic", "advanced", "fast", "ultra-fast"], { default: "basic", description: "[Tavily] 默认 basic；advanced 精度更高但更慢、消耗更多额度。" })),
    topic: opt(oneOf(["general", "news", "finance"], { default: "general", description: "[Tavily] 搜索主题。" })),
    days: opt(int({ minimum: 1, description: "[Tavily] 限定最近天数，主要用于新闻。" })),
    timeRange: opt(oneOf(["day", "week", "month", "year", "d", "w", "m", "y"], { description: "[Tavily] 相对发布时间范围。" })),
    chunksPerSource: opt(int({ minimum: 1, maximum: 3, description: "[Tavily] 每条来源的片段数。" })),
    includeAnswer: opt(bool({ default: true, description: "[Tavily] 本工具默认生成回答；只需来源列表时设为 false，以减少耗时和费用。" })),
    answerDepth: opt(oneOf(["basic", "advanced"], { description: "[Tavily] 回答详细程度；includeAnswer=false 时无效。" })),
    includeRawContent: opt(bool({ default: false, description: "[Tavily] 请求清理后的网页全文；工具每条结果只展示前 1500 字符。" })),
    rawContentFormat: opt(oneOf(["markdown", "text"], { description: "[Tavily] 网页全文格式；includeRawContent=false 时无效。" })),
    includeImages: opt(bool({ default: false, description: "[Tavily] 搜索图片。" })),
    includeImageDescriptions: opt(bool({ default: false, description: "[Tavily] 返回图片描述。" })),
    includeFavicon: opt(bool({ default: false, description: "[Tavily] 返回网站图标地址。" })),
    country: opt(str({ description: "[Tavily] 优先返回指定国家的来源。" })),
    autoParameters: opt(bool({ default: false, description: "[Tavily] 自动选择搜索参数。" })),
    exactMatch: opt(bool({ default: false, description: "[Tavily] 要求精确匹配查询。" })),
    includeUsage: opt(bool({ default: false, description: "[Tavily] 返回额度使用情况。" })),
    safeSearch: opt(bool({ default: false, description: "[Tavily] 启用安全搜索。" })),
  },
  { description: "服务商专属高级参数；不属于当前服务商的参数会被忽略。普通查询优先使用默认模式，按需开启深度搜索、生成回答或正文提取。" },
);
