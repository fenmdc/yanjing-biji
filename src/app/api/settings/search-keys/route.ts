import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  deleteUserSearchApiKey,
  listUserSearchApiKeys,
  normalizeSearchApiProvider,
  saveUserSearchApiKey,
} from "@/lib/user-api-keys";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  return NextResponse.json({ keys: await listUserSearchApiKeys(user.id) });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const provider = normalizeSearchApiProvider(payload.provider);
  const apiKey = typeof payload.apiKey === "string" ? payload.apiKey : "";
  const searchEngineId = typeof payload.searchEngineId === "string"
    ? payload.searchEngineId
    : "";

  if (!provider) {
    return NextResponse.json({ error: "请选择 Brave、Tavily 或 Google。" }, { status: 400 });
  }

  try {
    await saveUserSearchApiKey({ userId: user.id, provider, apiKey, searchEngineId });
    return NextResponse.json({ keys: await listUserSearchApiKeys(user.id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存 API key 失败。" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const url = new URL(request.url);
  const provider = normalizeSearchApiProvider(url.searchParams.get("provider"));
  if (!provider) {
    return NextResponse.json({ error: "请选择 Brave、Tavily 或 Google。" }, { status: 400 });
  }

  await deleteUserSearchApiKey(user.id, provider);
  return NextResponse.json({ keys: await listUserSearchApiKeys(user.id) });
}
