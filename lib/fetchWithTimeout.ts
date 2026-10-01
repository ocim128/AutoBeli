export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, deadline]) : deadline;

  try {
    // Keep the signal attached after headers arrive so body reads also abort.
    return await fetch(input, { ...init, signal });
  } catch (error) {
    if (signal.reason === deadline.reason && deadline.aborted) {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    throw error;
  }
}

export async function readBodyWithTimeout(response: Response, timeoutMs: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Response body read timed out after ${timeoutMs}ms`));
      void reader.cancel().catch(() => {});
    }, timeoutMs);
  });
  const read = async () => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks).toString("utf8");
      chunks.push(value);
    }
  };

  try {
    return await Promise.race([read(), deadline]);
  } finally {
    clearTimeout(timer!);
    reader.releaseLock();
  }
}
