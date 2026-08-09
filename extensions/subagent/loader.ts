import { join } from "node:path";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  openSync,
  readdirSync,
  readSync,
} from "node:fs";
import { getAgentDir, parseFrontmatter } from "@earendil-works/pi-coding-agent";
import type { AgentConfig, AgentSource } from "./agent";
import { safeSplit } from "./commom";

/**
 * 读取指定的 agent 定义文件，返回 utf8 的字符串的内容
 * @param filePath 文件路径
 * @returns 
 */
function readAgentFile(filePath: string): string｛
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * 将 Markdown 中的 agent 定义转换为标准定义结构。
 * 支持逗号分隔和 YAML 数组形式的 tools/skills。
 *
 * @param content agent 定义文件内容
 * @param fallbackName frontmatter 未提供 name 时使用的文件名
 */
export function parseAgentConfig(content: string, fallbackName: string): AgentConfig | null {
  // 无 body 属于无效的 agent 定义
  if (!/^---(?:\r\n|\n|\r)/.test(content)) return null;

  try {
    const { frontmatter, body } = parseFrontmatter(content);
    const name = frontmatter.name ?? fallbackName.trim();
    const description = frontmatter.description;
    
    // 名称和描述是必须的
    if (!name || !description) return null;

    return {
      name: name as string,
      description: description as string,
      model: frontmatter.model as string,
      effort: frontmatter.effort as string,
      tools: safeSplit(frontmatter.tools) as  Array<string>,
      skills: safeSplit(frontmatter.skills) as Array<string>,
      background: !!frontmatter.background as boolean,
      systemPrompt: body.trim(),
    };
  } catch {
    // 单个定义的 YAML 无效时跳过，不影响加载其他 agent。
    return null;
  }
}

/**
 * 找出符合要求的 所有 agent 定义
 * 用户全局配置 ${PI_CODING_AGENT_DIR}/agent/agents/*.md
 * 项目级别配置 ${cwd}/.pi/agent/agents/*.md
 * @returns 
 */
export function discoverAgents(): AgentConfig[] {
  const agents = new Map<string, AgentConfig>();
  const dirs: Array<{ path: string; source: AgentSource }> = [
    { path: join(getAgentDir(), "agents"), source: "user" },
    { path: join(process.cwd(), ".pi", "agents"), source: "project" },
  ];

  for (const { path: dir, source } of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((entry) => entry.endsWith(".md"))) {
      const content = readAgentFile(join(dir, file));
      if (!content) {
        continue;
      }
      const parsed = parseAgentConfig(content, file.replace(/\.md$/, ""));
      if (!parsed) {
        continue;
      }
      agents.set(parsed.name, parsed);
    }
  }

  return [...agents.values()];
}

