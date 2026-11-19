/**
 * Web search for pi 1.5.2+: native provider auth and pi-schema parameters.
 * Common parameters live at the top level; advanced provider options live
 * under `options`. Credentials are resolved by pi's provider registry.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createProvider, envApiKeyAuth, type ProviderStreams } from "@earendil-works/pi-ai";
import { Container, Text } from "@earendil-works/pi-tui";
import { missingKeyError } from "./config.ts";
import exa from "./providers/exa.ts";
import firecrawl from "./providers/firecrawl.ts";
import tavily from "./providers/tavily.ts";
import { searchParameters, type SearchInput } from "./schema.ts";
import type { SearchProvider, SearchProviderAdapter } from "./providers/types.ts";

const providers: Record<SearchProvider, SearchProviderAdapter> = { exa, tavily, firecrawl };

// createProvider requires an API implementation even for providers with no models.
const authOnlyApi: ProviderStreams = {
  stream() {
    throw new Error("Search authentication providers do not support model streaming.");
  },
  streamSimple() {
    throw new Error("Search authentication providers do not support model streaming.");
  },
};

export default function websearchExtension(pi: ExtensionAPI) {
  for (const provider of Object.values(providers)) {
    pi.registerProvider(createProvider({
      id: provider.authId,
      name: provider.name,
      baseUrl: provider.baseUrl,
      auth: { apiKey: envApiKeyAuth(provider.apiKeyName, [provider.apiKeyEnv]) },
      models: [],
      api: authOnlyApi,
    }));
  }

  pi.registerTool({
    name: "websearch",
    // exposure: "deferred",
    label: "Web Search",
    promptSnippet: "Search the web for up-to-date information",
    description:
      // 开头的关键词供 tool_search（BM25）匹配；工具名 websearch 是单个词，无法命中 "web"/"search"。
      "Web search / internet search: search the web online for up-to-date web pages, news, research papers, PDFs, images and code. " +
      "Choose Tavily for news, finance, or quick lookups; Exa for semantic search, in-depth research, or structured output; " +
      "Firecrawl when you also need full page content, or to search code repositories, papers, PDFs, or images. " +
      "Common parameters are top-level; provider-specific parameters go in options. Page content is truncated, " +
      "and each call returns at most about 24KB. Generated answers are not primary evidence; " +
      "verify important conclusions against the source links in the results. " +
      // 中文关键词供 tool_search 匹配中文查询。
      "关键词：联网搜索、网络搜索、网页搜索、上网查询、新闻、资讯、论文、图片。",
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    parameters: searchParameters,
    async execute(_toolCallId, params: SearchInput, signal, _onUpdate, ctx) {
      signal?.throwIfAborted();
      const { provider: providerId, ...request } = params;
      const provider = providers[providerId];
      provider.validate?.(request);
      const resolvedAuth = await ctx.modelRegistry.getProviderAuth(provider.authId);
      signal?.throwIfAborted();
      const apiKey = resolvedAuth?.auth.apiKey?.trim();
      if (!apiKey) throw missingKeyError(provider);
      return provider.executeSearch(request, apiKey, signal);
    },
    renderCall(args, theme, context) {
      // Renderers also receive incomplete arguments while the model is streaming.
      const input = args !== null && typeof args === "object" ? args : {};
      const provider = "provider" in input && typeof input.provider === "string" ? input.provider : "";
      const query = "query" in input && typeof input.query === "string" ? input.query : "";
      const text = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
      text.setText(
        theme.fg("toolTitle", theme.bold("websearch ")) +
        theme.fg("accent", provider) +
        " " +
        theme.fg("muted", query),
      );
      return text;
    },
    renderResult(result, { expanded }, theme, context) {
      if (!expanded && !context.isError) return new Container();

      const output = result.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");
      const text = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
      text.setText(theme.fg(context.isError ? "error" : "dim", output));
      return text;
    },
  });
}
