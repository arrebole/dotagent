export type AgentSource = "user" | "project";

// 子agent定义，于 agents/*.md 定义
export interface AgentDefinition {
  name: string;
  description: string;
  model?: string;
  effort?: string;
  tools?: string[];
  skills?: string[];
  background?: boolean;
  source: AgentSource;
  prompt: string;
}

export class SubAgent {

}