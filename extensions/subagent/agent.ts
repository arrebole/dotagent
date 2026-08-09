export type AgentSource = "user" | "project";

export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

// 子agent定义，于 $CONFIG_PATH/agents/*.md 定义
export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  effort?: string;
  tools?: string[];
  skills?: string[];
  background?: boolean;
  prompt: string;
}

export class SubAgent {

}