import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createBackupZip, restoreBackupZip } from "@/lib/backup";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const backup = await createBackupZip(user.id);

  return new NextResponse(backup.blob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(backup.filename)}"`,
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("backup");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择研经笔记备份 zip 文件。" }, { status: 400 });
  }

  if (!file.name.match(/\.zip$/i)) {
    return NextResponse.json({ error: "备份文件必须是 .zip 格式。" }, { status: 400 });
  }

  try {
    const result = await restoreBackupZip(user.id, file);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "恢复失败，请检查备份文件。",
      },
      { status: 400 },
    );
  }
}
