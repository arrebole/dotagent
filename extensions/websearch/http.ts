export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number },
  signal?: AbortSignal,
): Promise<Response> {
  const { timeoutMs = 30_000, ...fetchOptions } = options;
  const controller = new AbortController();
  let timedOut = false;

  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    // 在计时器仍然有效时读取完整响应体，避免 fetch 只收到响应头后超时失效。
    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    if (timedOut) {
      throw new Error(`Web search request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
