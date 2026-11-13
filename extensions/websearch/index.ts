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
import tavily from "./providers/tavily.ts";
import { searchParameters, type SearchInput } from "./schema.ts";
import type { SearchProvider, SearchProviderAdapter } from "./providers/types.ts";

const providers: Record<SearchProvider, SearchProviderAdapter> = { exa, tavily };

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
    label: "Web Search",
    promptSnippet: "从网络上搜索资料",
    description:
      "联网检索：新闻、财经或快速查询选 Tavily；语义检索、深入研究或结构化输出选 Exa。" +
      "常用参数在顶层，服务商专属参数放在 options；网页正文只返回截取内容，单次输出最多约 24KB。" +
      "生成的回答不是原始证据，重要结论请核验结果中的来源链接。",
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
