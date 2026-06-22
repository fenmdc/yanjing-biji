import type { ApiKeyProvider } from "@prisma/client";
import { decryptSecret, encryptSecret, previewSecret } from "@/lib/secrets";
import { prisma } from "@/lib/prisma";

export type SearchApiProvider = "brave" | "tavily";

const PROVIDER_TO_DB: Record<SearchApiProvider, ApiKeyProvider> = {
  brave: "BRAVE",
  tavily: "TAVILY",
};

const DB_TO_PROVIDER: Record<ApiKeyProvider, SearchApiProvider> = {
  BRAVE: "brave",
  TAVILY: "tavily",
};

export function normalizeSearchApiProvider(value: unknown): SearchApiProvider | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLocaleLowerCase();
  return normalized === "brave" || normalized === "tavily" ? normalized : null;
}

export async function saveUserSearchApiKey({
  userId,
  provider,
  apiKey,
}: {
  userId: string;
  provider: SearchApiProvider;
  apiKey: string;
}) {
  const trimmed = apiKey.trim();
  if (trimmed.length < 8) {
    throw new Error("API key 太短，请检查后再保存。");
  }

  const dbProvider = PROVIDER_TO_DB[provider];
  return prisma.userApiKey.upsert({
    where: {
      userId_provider: {
        userId,
        provider: dbProvider,
      },
    },
    create: {
      userId,
      provider: dbProvider,
      encryptedKey: encryptSecret(trimmed),
      keyPreview: previewSecret(trimmed),
    },
    update: {
      encryptedKey: encryptSecret(trimmed),
      keyPreview: previewSecret(trimmed),
    },
  });
}

export async function deleteUserSearchApiKey(userId: string, provider: SearchApiProvider) {
  await prisma.userApiKey.deleteMany({
    where: {
      userId,
      provider: PROVIDER_TO_DB[provider],
    },
  });
}

export async function listUserSearchApiKeys(userId: string) {
  const keys = await prisma.userApiKey.findMany({
    where: { userId },
    orderBy: { provider: "asc" },
    select: {
      provider: true,
      keyPreview: true,
      updatedAt: true,
    },
  });

  return keys.map((key) => ({
    provider: DB_TO_PROVIDER[key.provider],
    keyPreview: key.keyPreview,
    updatedAt: key.updatedAt.toISOString(),
  }));
}

export async function getUserSearchApiKey(userId: string, provider: SearchApiProvider) {
  const key = await prisma.userApiKey.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: PROVIDER_TO_DB[provider],
      },
    },
    select: {
      encryptedKey: true,
    },
  });

  return key ? decryptSecret(key.encryptedKey) : null;
}

export async function getPreferredUserSearchProvider(userId: string) {
  const requested = normalizeSearchApiProvider(process.env.SEARCH_PROVIDER);
  if (requested && await getUserSearchApiKey(userId, requested)) return requested;

  const existing = await prisma.userApiKey.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { provider: true },
  });

  return existing ? DB_TO_PROVIDER[existing.provider] : null;
}
