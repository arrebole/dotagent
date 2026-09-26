import type { SearchProviderAdapter } from "./providers/types";

export function getApiKey(provider: SearchProviderAdapter): string | undefined {
  return process.env[provider.apiKeyEnv]?.trim() || undefined;
}

export function missingKeyError(provider: SearchProviderAdapter): Error {
  return new Error(
    `未配置 ${provider.name} 的 API 密钥。请在 ~/.pi/agent/auth.json 中配置 ${provider.authId}，或设置 ${provider.apiKeyEnv}。`,
  );
}
