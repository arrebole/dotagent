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
import type { AgentDefinition, AgentSource } from "./agent";

/**
 * 读取指定的 agent 定义文件，返回 utf8 的字符串的内容
 * @param filePath 文件路径
 * @returns 
 */
function readAgentFile(filePath: string): string | undefined {
  let fileDescriptor: number | undefined;
  let result: string | undefined = undefined;
  try {
    fileDescriptor = openSync(filePath, constants.O_RDONLY);
    const stats = fstatSync(fileDescriptor);
    if (!stats.isFile()) return undefined;

    const content = Buffer.alloc(stats.size);
    let offset = 0;
    while (offset < content.length) {
      const bytesRead = readSync(
        fileDescriptor,
        content,
        offset,
        content.length - offset,
        offset,
      );
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    result = content.subarray(0, offset).toString("utf8");
  } finally {
    if (fileDescriptor !== undefined) closeSync(fileDescriptor);
  }

  // 去掉所有开头的 BOM 变体
  if (result && result.startsWith("\uFEFF")) {
    result = result.slice(1)
  }
  return result;
}

type ParsedAgentDefinition = Omit<AgentDefinition, "source">;

type AgentFrontmatter = Record<string, unknown>;

function getValue(frontmatter: AgentFrontmatter, ...keys: string[]): unknown {
  for (const key of keys) {
    if (frontmatter[key] !== undefined && frontmatter[key] !== null) {
      return frontmatter[key];
    }
  }
  return undefined;
}

function parseString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const result = value.trim();
    return result || undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function parseStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value) && typeof value !== "string") return undefined;
  const values = Array.isArray(value) ? value : value.split(",");
  return values
    .filter(
      (item): item is string | number | boolean =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean",
    )
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

function serializeValue(value: unknown): string | undefined {
  const text = parseString(value);
  if (text !== undefined) return text;
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

/**
 * 将 Markdown 中的 agent 定义转换为标准定义结构。
 * 支持逗号分隔和 YAML 数组形式的 tools/skills，并兼容 CRLF 换行。
 *
 * @param content agent 定义文件内容
 * @param fallbackName frontmatter 未提供 name 时使用的文件名
 */
export function parseAgentDefinition(
  content: string,
  fallbackName: string,
): ParsedAgentDefinition | null {
  if (!/^---(?:\r\n|\n|\r)/.test(content)) return null;

  try {
    const { frontmatter, body } =
      parseFrontmatter<AgentFrontmatter>(content);
    const name = parseString(frontmatter.name) ?? fallbackName.trim();
    const description = parseString(frontmatter.description);
    if (!name || !description) return null;

    const systemPrompt = body.trim();
    return {
      name,
      description,
      systemPrompt,
      model: parseString(frontmatter.model),
      thinking: parseString(frontmatter.thinking),
      tools: parseStringList(frontmatter.tools),
      disallowedTools: parseString(
        getValue(frontmatter, "disallowed-tools", "disallowedTools"),
      ),
      skills: parseStringList(getValue(frontmatter, "skills", "skill")),
      background: parseBoolean(frontmatter.background),
      inputSchema: serializeValue(
        getValue(frontmatter, "input-schema", "inputSchema"),
      ),
      outputSchema: serializeValue(
        getValue(frontmatter, "output-schema", "outputSchema"),
      ),
      version: parseString(frontmatter.version),
      metadata: serializeValue(frontmatter.metadata),
      body: systemPrompt,
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
export function discoverAgentDefinitions(): AgentDefinition[] {
  const agents = new Map<string, AgentDefinition>();
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
      const parsed = parseAgentDefinition(content, file.replace(/\.md$/, ""));
      if (!parsed) {
        continue;
      }
      agents.set(parsed.name, { ...parsed, source });
    }
  }

  return [...agents.values()];
}

