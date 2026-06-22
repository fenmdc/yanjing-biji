import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseDocumentFile } from "@/lib/document-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择要解析的资料文件。" }, { status: 400 });
  }

  try {
    const parsed = await parseDocumentFile(file);
    return NextResponse.json({ parsed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "文件解析失败，请手动粘贴正文。" },
      { status: 400 },
    );
  }
}
