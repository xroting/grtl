import { HttpClient } from "@http";

export function newHttpClient(): HttpClient {
  const apiKey = process.env.GENRTL_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("GENRTL_API_KEY or API_KEY environment variable is required for tests");
  }

  return new HttpClient({
    baseUrl: process.env.GENRTL_BASE_URL || "https://genrtl.com/api",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.exp(retryCount) * 50,
    },
    cache: "no-store",
  });
}
