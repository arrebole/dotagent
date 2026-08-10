import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { discoverAgentConfigs } from "./loader";
import { Type } from "typebox";
import { THINKING_LEVELS } from "./agent";

export default async function subagentExtension(pi: ExtensionAPI) {
  // 获取定义好的 agents
  const definitions = await discoverAgentConfigs();

  // 构造工具描述，附上当前可用的 agent 名称与描述，供模型选择合适的 agent
  const agentList = definitions.length
    ? "\nAvailable agents:\n" +
      definitions.map((d) => `- ${d.name}: ${d.description}`).join("\n")
    : "";

  // 注册子 agent 工具
  pi.registerTool({
    name: "subagent_exec",
    label: "Agent",
    description:
      "Launch a sub-agent to execute a delegated task. Use sub-agents to run independent tasks in parallel and keep verbose intermediate work out of the main conversation, reducing context growth." +
      agentList,
    parameters: Type.Object({
      agent: Type.Optional(Type.String({ description: "Name of the agent to invoke" })),
      task: Type.Optional(Type.String({ description: "Task to delegate" })),
      model: Type.Optional(
        Type.String({
          description:
            'Optional model override. Accepts fuzzy name. Omit to use the agent type\'s default.',
        }),
      ),
      effort: Type.Optional(
        Type.String({
          description: `Thinking level (${THINKING_LEVELS.join(",")}). Overrides agent default.`,
        }),
      ),
      background: Type.Optional(
        Type.Boolean({
          description: "Set to true to run in background. Returns agent ID immediately. You will be notified on completion.",
        }),
      ),
      cwd: Type.Optional(Type.String({ description: "Working directory for the agent process" })),
    }),
    renderCall(args, theme) {
      return new Text("", 0, 0);
    },
    renderResult(result, { expanded, isPartial }, theme) {
      return new Text("", 0, 0);
    },
    execute: async (toolCallId, params, signal, onUpdate, ctx) => {
      return { content: [{ type: "text" as const, text: "" }], details: "" };
    }
  });
}