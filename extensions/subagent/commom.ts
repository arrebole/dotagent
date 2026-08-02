import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * 获取 pi agent 配置根目录
 * @returns 
 */
export function getAgentConfigDir() {
  return join(homedir(), CONFIG_DIR_NAME, "agent");
}


export function getFrontmatterValue(frontmatter: string, key: string): string | undefined {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : undefined;
}