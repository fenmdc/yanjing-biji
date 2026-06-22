import {
  getPreferredUserSearchProvider,
  getUserGoogleSearchCredentials,
  getUserSearchApiKey,
  normalizeSearchApiProvider,
} from "@/lib/user-api-keys";

export type SearchProviderName = "brave" | "tavily" | "google";

export type WebSearchResult = {
  id: string;
  title: string;
  url: string;
  source: string;
  snippet: string;
  publishedAt: string | null;
};

type SearchProvider = {
  name: SearchProviderName;
  search(query: string, options?: { limit?: number }): Promise<WebSearchResult[]>;
};

export class WebSearchConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebSearchConfigurationError";
  }
}

export async function searchWeb(query: string, options?: { limit?: number; userId?: string }) {
  const provider = await getSearchProvider(options?.userId);
  const results = await provider.search(query, options);

  return {
    provider: provider.name,
    results,
  };
}

export function getConfiguredSearchProviderName(): SearchProviderName | null {
  const requested = normalizeSearchApiProvider(process.env.SEARCH_PROVIDER);
  if (requested) return requested;
  if (process.env.BRAVE_SEARCH_API_KEY) return "brave";
  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) return "google";
  return null;
}

async function getSearchProvider(userId?: string): Promise<SearchProvider> {
  const userProviderName = userId ? await getPreferredUserSearchProvider(userId) : null;
  const providerName = userProviderName ?? getConfiguredSearchProviderName();

  if (providerName === "brave") {
    const apiKey = userId ? await getUserSearchApiKey(userId, "brave") : null;
    return createBraveProvider(apiKey ?? process.env.BRAVE_SEARCH_API_KEY);
  }

  if (providerName === "tavily") {
    const apiKey = userId ? await getUserSearchApiKey(userId, "tavily") : null;
    return createTavilyProvider(apiKey ?? process.env.TAVILY_API_KEY);
  }

  if (providerName === "google") {
    const credentials = userId ? await getUserGoogleSearchCredentials(userId) : null;
    return createGoogleProvider({
      apiKey: credentials?.apiKey ?? process.env.GOOGLE_SEARCH_API_KEY,
      searchEngineId: credentials?.searchEngineId ?? process.env.GOOGLE_SEARCH_ENGINE_ID,
    });
  }

  throw new WebSearchConfigurationError(
    "尚未配置全网搜索。请在设置中保存 Brave、Tavily 或 Google API key，或在 .env 中配置搜索服务。",
  );
}

function createBraveProvider(apiKey?: string | null): SearchProvider {
  if (!apiKey) {
    throw new WebSearchConfigurationError("缺少 BRAVE_SEARCH_API_KEY。");
  }

  return {
    name: "brave",
    async search(query, options) {
      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", query);
      url.searchParams.set("count", String(Math.min(Math.max(options?.limit ?? 8, 1), 20)));
      url.searchParams.set("text_decorations", "false");
      url.searchParams.set("search_lang", "zh-hans");

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search 请求失败：${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload.web?.results) ? payload.web.results : [];

      return items.map((item: Record<string, unknown>, index: number) => ({
        id: stableResultId(String(item.url ?? ""), index),
        title: cleanText(item.title, "未命名网页"),
        url: String(item.url ?? ""),
        source: hostnameFromUrl(String(item.url ?? "")),
        snippet: cleanText(item.description, "暂无摘要。"),
        publishedAt: typeof item.age === "string" ? item.age : null,
      })).filter((item: WebSearchResult) => item.url);
    },
  };
}

function createTavilyProvider(apiKey?: string | null): SearchProvider {
  if (!apiKey) {
    throw new WebSearchConfigurationError("缺少 TAVILY_API_KEY。");
  }

  return {
    name: "tavily",
    async search(query, options) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          max_results: Math.min(Math.max(options?.limit ?? 8, 1), 20),
          search_depth: "basic",
          include_answer: false,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily Search 请求失败：${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload.results) ? payload.results : [];

      return items.map((item: Record<string, unknown>, index: number) => ({
        id: stableResultId(String(item.url ?? ""), index),
        title: cleanText(item.title, "未命名网页"),
        url: String(item.url ?? ""),
        source: hostnameFromUrl(String(item.url ?? "")),
        snippet: cleanText(item.content, "暂无摘要。"),
        publishedAt: typeof item.published_date === "string" ? item.published_date : null,
      })).filter((item: WebSearchResult) => item.url);
    },
  };
}

function createGoogleProvider({
  apiKey,
  searchEngineId,
}: {
  apiKey?: string | null;
  searchEngineId?: string | null;
}): SearchProvider {
  if (!apiKey) {
    throw new WebSearchConfigurationError("缺少 GOOGLE_SEARCH_API_KEY。");
  }
  if (!searchEngineId) {
    throw new WebSearchConfigurationError("缺少 GOOGLE_SEARCH_ENGINE_ID。");
  }

  return {
    name: "google",
    async search(query, options) {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("cx", searchEngineId);
      url.searchParams.set("q", query);
      url.searchParams.set("num", String(Math.min(Math.max(options?.limit ?? 8, 1), 10)));

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Google Search 请求失败：${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload.items) ? payload.items : [];

      return items.map((item: Record<string, unknown>, index: number) => ({
        id: stableResultId(String(item.link ?? ""), index),
        title: cleanText(item.title, "未命名网页"),
        url: String(item.link ?? ""),
        source: hostnameFromUrl(String(item.link ?? "")),
        snippet: cleanText(item.snippet, "暂无摘要。"),
        publishedAt: null,
      })).filter((item: WebSearchResult) => item.url);
    },
  };
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

function stableResultId(url: string, index: number) {
  return `${index}-${Buffer.from(url).toString("base64url").slice(0, 18)}`;
}
