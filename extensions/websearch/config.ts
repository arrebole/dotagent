import type { SearchProviderAdapter } from "./providers/types.ts";

export function missingKeyError(provider: SearchProviderAdapter): Error {
  return new Error(
    `未配置 ${provider.name} 的 API 密钥。请运行 /login ${provider.authId}，或设置 ${provider.apiKeyEnv}。`,
  );
}
