export type AgentSource = "user" | "project";

// 子agent定义，于 agents/*.md 定义
export interface AgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  thinking?: string;
  tools?: string[];
  disallowedTools?: string;
  skills?: string[];
  background?: boolean;
  inputSchema?: string;
  outputSchema?: string;
  version?: string;
  metadata?: string;
  source: AgentSource;
  body: string;
}

export class SubAgent {

}