import { truncateHead } from "@earendil-works/pi-coding-agent";

const MAX_OUTPUT_BYTES = 24 * 1024;
const MAX_OUTPUT_LINES = 240;
const TRUNCATION_NOTICE = "\n\n[输出已截断，请缩小搜索范围或减少结果数量后重试。]";

function limitField(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…[已截断]` : value;
}

function limitOutput(text: string): string {
  const result = truncateHead(text, {
    maxBytes: MAX_OUTPUT_BYTES - Buffer.byteLength(TRUNCATION_NOTICE),
    maxLines: MAX_OUTPUT_LINES,
  });
  return result.truncated ? result.content + TRUNCATION_NOTICE : text;
}

export function formatExaResults(data: Record<string, unknown>): string {
  const results = Array.isArray(data.results) ? data.results as Array<Record<string, unknown>> : [];
  const output = data.output as
    | { content?: string | object; grounding?: Array<{
        field?: string;
        citations?: Array<{ title?: string; url?: string }>;
        confidence?: string;
      }> }
    | undefined;
  const parts: string[] = [];

  if (output?.content != null) {
    const content = typeof output.content === "string" ? output.content : JSON.stringify(output.content, null, 2);
    parts.push(`## 综合答案\n${limitField(content, 8000)}`, "");
  }
  if (output?.grounding?.length) {
    parts.push("## 答案引用");
    for (const source of output.grounding) {
      if (!Array.isArray(source.citations)) continue;
      for (const citation of source.citations) {
        if (typeof citation.url !== "string") continue;
        const field = typeof source.field === "string" ? limitField(source.field, 100) : "答案";
        const title = typeof citation.title === "string" ? limitField(citation.title, 200) : citation.url;
        parts.push(`- ${field}：${title} — ${citation.url}`);
      }
    }
    parts.push("");
  }

  if (results.length === 0) {
    if (!parts.length) parts.push("未找到结果。");
    return limitOutput(parts.join("\n"));
  }

  parts.push(`## 搜索结果（${results.length}）`, "");
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const title = result.title ?? "(no title)";
    const url = result.url ?? "";
    const date = result.publishedDate ?? "";
    const author = result.author ?? "";
    const text = result.text as string | undefined;
    const highlights = result.highlights as string[] | undefined;
    const summary = result.summary as string | undefined;
    const meta = [date, author].filter(Boolean).join(" · ");

    parts.push(`### ${i + 1}. ${limitField(String(title), 200)}`);
    if (url) parts.push(`**URL:** ${url}`);
    if (meta) parts.push(`**Meta:** ${limitField(meta, 300)}`);
    if (summary) parts.push(`**Summary:** ${limitField(summary, 1500)}`);
    if (highlights?.length) {
      parts.push("**Highlights:**");
      for (const highlight of highlights.slice(0, 5)) parts.push(`- ${limitField(highlight, 1000)}`);
    }
    if (text) {
      parts.push("", limitField(text, 2000));
    }
    parts.push("");
  }

  if (data.costDollars) {
    const cost = data.costDollars as Record<string, number>;
    parts.push("---", `Cost: $${cost.total?.toFixed(6) ?? "unknown"}`);
  }

  return limitOutput(parts.join("\n"));
}

export function formatTavilyResults(data: Record<string, unknown>, preferRawContent: boolean): string {
  const results = data.results as Array<Record<string, unknown>> | undefined;
  const answer = data.answer as string | undefined;
  const images = data.images as Array<string | Record<string, unknown>> | undefined;
  const query = data.query as string | undefined;
  const parts: string[] = [];

  if (answer) parts.push(`## 回答\n${limitField(answer, 8000)}`, "");
  if (results?.length) {
    parts.push(`## Search Results for "${query ?? "unknown"}" (${results.length})`, "");
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const title = result.title ?? "(no title)";
      const url = result.url ?? "";
      const rawContent = typeof result.raw_content === "string" ? result.raw_content : "";
      const snippet = typeof result.content === "string" ? result.content : "";
      const content = preferRawContent ? rawContent || snippet : snippet || rawContent;
      const score = result.score as number | undefined;
      const publishedDate = result.published_date as string | undefined;
      const favicon = typeof result.favicon === "string" ? result.favicon : "";

      parts.push(`### ${i + 1}. ${limitField(String(title), 200)}`);
      if (url) parts.push(`**URL:** ${url}`);
      if (favicon) parts.push(`**Favicon:** ${favicon}`);
      if (score !== undefined) parts.push(`**Relevance:** ${(score * 100).toFixed(0)}%`);
      if (publishedDate) parts.push(`**Published:** ${publishedDate}`);
      if (content) parts.push("", limitField(content, 1500));
      parts.push("");
    }
  } else {
    parts.push("No results found.");
  }

  if (images?.length) {
    const formattedImages = images.slice(0, 10).flatMap((image) => {
      if (typeof image === "string") return [`- ${image}`];
      const imageUrl = typeof image.url === "string" ? image.url : "";
      if (!imageUrl) return [];
      const description = typeof image.description === "string" ? image.description : "";
      return [`- ${description ? `${description}: ` : ""}${imageUrl}`];
    });
    if (formattedImages.length) parts.push(`## Images (${images.length})`, ...formattedImages, "");
  }

  if (data.response_time) parts.push("---", `Response time: ${data.response_time}s`);
  return limitOutput(parts.join("\n"));
}
