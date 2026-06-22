import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchWeb, WebSearchConfigurationError } from "@/lib/web-search";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  const limit = Number(payload.limit ?? 8);

  if (query.length < 2) {
    return NextResponse.json({ error: "请输入至少两个字符的搜索关键词。" }, { status: 400 });
  }

  try {
    const result = await searchWeb(query, {
      limit: Number.isInteger(limit) ? limit : 8,
      userId: user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WebSearchConfigurationError) {
      return NextResponse.json({ error: error.message, code: "WEB_SEARCH_NOT_CONFIGURED" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "全网搜索失败，请稍后再试。",
      },
      { status: 502 },
    );
  }
}
