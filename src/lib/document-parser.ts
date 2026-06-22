import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export type ParsedDocumentFile = {
  title: string;
  fileType: "Markdown" | "TXT" | "PDF" | "DOCX";
  originalFilename: string;
  extractedText: string;
  warning: string | null;
};

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export async function parseDocumentFile(file: File): Promise<ParsedDocumentFile> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("文件太大。当前单个资料文件限制为 12MB。");
  }

  const extension = file.name.split(".").pop()?.toLocaleLowerCase() ?? "";
  const title = file.name.replace(/\.[^.]+$/, "").trim() || "未命名资料";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "txt" || file.type.startsWith("text/")) {
    return {
      title,
      fileType: "TXT",
      originalFilename: file.name,
      extractedText: buffer.toString("utf8"),
      warning: null,
    };
  }

  if (extension === "md" || extension === "markdown") {
    return {
      title,
      fileType: "Markdown",
      originalFilename: file.name,
      extractedText: buffer.toString("utf8"),
      warning: null,
    };
  }

  if (extension === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeText(result.value);
    if (!text) {
      throw new Error("DOCX 没有解析出正文。请确认文件内容不是图片扫描件。");
    }

    return {
      title,
      fileType: "DOCX",
      originalFilename: file.name,
      extractedText: text,
      warning: result.messages.length > 0 ? "DOCX 已解析，但部分复杂格式可能没有保留。" : null,
    };
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    PDFParse.setWorker(
      pathToFileURL(
        join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs"),
      ).toString(),
    );
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      const text = normalizeText(result.text);
      if (!text) {
        throw new Error("PDF 没有解析出可复制文本。扫描版 PDF 需要 OCR，当前请先手动粘贴摘录。");
      }

      return {
        title,
        fileType: "PDF",
        originalFilename: file.name,
        extractedText: text,
        warning: null,
      };
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  throw new Error("当前支持 .txt、.md、.markdown、.pdf、.docx 文件。");
}

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
