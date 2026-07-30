export type SearchProvider = "exa" | "tavily";

const AUTH_PROVIDER_ID: Record<SearchProvider, string> = {
  exa: "api.exa.ai/default",
  tavily: "api.tavily.com/default",
};

const API_KEY_ENV: Record<SearchProvider, "EXA_API_KEY" | "TAVILY_API_KEY"> = {
  exa: "EXA_API_KEY",
  tavily: "TAVILY_API_KEY",
};

export function providerAuthId(provider: SearchProvider): string {
  return AUTH_PROVIDER_ID[provider];
}

export function getApiKey(provider: SearchProvider): string | undefined {
  return process.env[API_KEY_ENV[provider]]?.trim() || undefined;
}

export function missingKeyError(provider: SearchProvider): Error {
  const envName = API_KEY_ENV[provider];
  return new Error(
    `No API key is configured for ${provider}. Add ${providerAuthId(provider)} to ~/.pi/agent/auth.json or set ${envName}.`,
  );
}
