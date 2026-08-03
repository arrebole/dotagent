import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { discoverAgentDefinitions } from "./loader";
import { Type } from "typebox";
import { THINKING_LEVELS } from "./agent";

export default function subagentExtension(pi: ExtensionAPI) {
  // 获取定义好的 agents
  const definitions = discoverAgentDefinitions();

  // 构造工具描述，附上当前可用的 agent 名称与描述，供模型选择合适的 agent
  const agentList = definitions.length
    ? "\n\nAvailable agents:\n" +
      definitions.map((d) => `- ${d.name}: ${d.description}`).join("\n")
    : "";
  const description =
    "Launch an autonomous sub-agent to execute a delegated task. Choose a predefined agent type (by name) " +
    "to inherit its system prompt, model, effort, tool access, and skills; optionally override the model or " +
    "thinking effort, fork the parent conversation for context continuity, or run in the background and be " +
    "notified on completion. Use it for complex multi-step work, parallelizable independent queries, or to " +
    "keep voluminous intermediate results out of the main context window." +
    agentList;

  // 注册子 agent 工具
  pi.registerTool({
    name: "subagent_exec",
    label: "Agent",
    description,
    promptSnippet: "Launch autonomous sub-agents for complex multi-step tasks",
    promptGuidelines: [
      "Use Agent with specialized agents when the task matches an agent type's description. Subagents are valuable for parallelizing independent queries or for protecting the main context window from excessive results, but should not be used excessively when not needed. Importantly, avoid duplicating work that subagents are already doing — if you delegate research to a subagent, do not also perform the same searches yourself.",
      "For broad codebase exploration or research, spawn Agent with an appropriate subagent_type (e.g. Explore). Otherwise use direct tools (read, grep, find) when the target is already known.",
      "When an agent runs in the background, you will be notified on completion — do not poll or sleep waiting for it. Continue with other work instead.",
      "Trust but verify: an agent's summary describes intent, not outcome. When an agent writes or edits code, check the actual changes before reporting work as done.",
    ],
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
      fork: Type.Optional(
        Type.Boolean({
          description: "If true, fork parent conversation into the agent. Default: false (fresh context).",
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