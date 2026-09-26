/**
 * WebSearch Extension
 *
 * Exposes one websearch tool. Common parameters live at the top level; each
 * provider's advanced options live under `options`. Requests are dispatched to
 * Exa or Tavily based on the provider parameter. API keys live in config.ts.
 */

import { keyHint, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createProvider, StringEnum } from "@earendil-works/pi-ai";
import { Container, Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { getApiKey, missingKeyError } from "./config";
import exa from "./providers/exa";
import tavily from "./providers/tavily";
import { searchOptions } from "./providers/options";
import type { SearchProvider, SearchRequest, SearchProviderAdapter } from "./providers/types";

const providers: Record<SearchProvider, SearchProviderAdapter> = { exa, tavily };


const authOnlyApi = {
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
      auth: {
        apiKey: {
          name: provider.apiKeyName,
          async login(interaction) {
            return {
              type: "api_key",
              key: await interaction.prompt({ type: "secret", message: "API Key" }),
            };
          },
          async resolve({ credential }) {
            return credential?.key
              ? { auth: { apiKey: credential.key }, source: "auth.json" }
              : undefined;
          },
        },
      },
      models: [],
      api: authOnlyApi,
    }));
  }

  pi.registerTool({
    name: "websearch",
    label: "Web Search",
    description:
      "联网检索：新闻、财经或快速查询选 Tavily；语义检索、深入研究或结构化输出选 Exa。" +
      "常用参数在顶层，服务商专属参数放在 options；网页正文只返回截取内容，单次输出最多约 24KB。" +
      "生成的回答不是原始证据，重要结论请核验结果中的来源链接。",
    promptSnippet: "联网搜索：新闻/财经选 Tavily；语义研究/结构化输出选 Exa；重要结论核验来源",
    parameters: Type.Object({
      provider: StringEnum(["exa", "tavily"] as const, {
        description: "搜索服务商：Tavily 用于快速查询、新闻和财经；Exa 用于语义检索、深入研究和结构化输出。",
      }),
      query: Type.String({ description: "搜索词；尽量聚焦一个具体问题。" }),
      numResults: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 10, description: "结果数量，默认 10。Exa 最多 100；Tavily 最多 20，超出会报错。" })),
      includeDomains: Type.Optional(Type.Array(Type.String(), { description: "仅搜索这些域名。" })),
      excludeDomains: Type.Optional(Type.Array(Type.String(), { description: "排除这些域名。" })),
      startDate: Type.Optional(Type.String({ description: "最早发布日期；Exa 接受 ISO 8601，Tavily 要求 YYYY-MM-DD。" })),
      endDate: Type.Optional(Type.String({ description: "最晚发布日期；Exa 接受 ISO 8601，Tavily 要求 YYYY-MM-DD。" })),
      options: Type.Optional(searchOptions),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const searchProvider = params.provider as SearchProvider;
      const provider = providers[searchProvider];
      const request: SearchRequest = {
        query: params.query,
        numResults: params.numResults,
        includeDomains: params.includeDomains,
        excludeDomains: params.excludeDomains,
        startDate: params.startDate,
        endDate: params.endDate,
        options: params.options,
      };
      provider.validate?.(request);
      const resolvedAuth = await ctx.modelRegistry.getProviderAuth(provider.authId);
      const apiKey = resolvedAuth?.auth.apiKey?.trim() || getApiKey(provider);
      if (!apiKey) throw missingKeyError(provider);
      return provider.executeSearch(request, apiKey, signal);
    },
    renderCall(args, theme, context) {
      const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
      text.setText(
        theme.fg("toolTitle", theme.bold("websearch ")) +
        theme.fg("accent", args.provider) +
        " " +
        theme.fg("muted", args.query) +
        (!context.expanded
          ? theme.fg("muted", " (") + keyHint("app.tools.expand", "expand") + theme.fg("muted", ") ")
          : ""),
      );
      return text;
    },
    renderResult(result, { expanded }, theme, context) {
      if (!expanded) return new Container();

      const output = result.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");
      const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
      text.setText(theme.fg(context.isError ? "error" : "dim", output));
      return text;
    },
  });
}