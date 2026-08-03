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

/**
 * 将字符串分隔为字符串数组
 * @param value
 * @returns
 */
export function safeSplit(value: any): string[] {
  if (typeof value != "string") {
    return []
  }
  return value.split(",");
}