import fs from "node:fs";
import path from "node:path";

export type BibleManifestItem = {
  code: string;
  shortName: string;
  name: string;
  language: string;
  books: number;
  verses: number;
  copyright: number;
  copyrightStatement?: string;
  file: string;
};

type ProcessedBible = {
  metadata: {
    code: string;
    shortName: string;
    name: string;
    language: string;
    copyrightStatement?: string;
  };
  books: Array<{
    id: number;
    code: string;
    name: string;
    shortName: string;
    chapters: Array<{
      chapter: number;
      verses: Array<{
        verse: number;
        text: string;
      }>;
    }>;
  }>;
};

const processedDir = path.join(process.cwd(), "data/bibles/processed");

export function getBibleManifest(): BibleManifestItem[] {
  const manifestFile = path.join(processedDir, "manifest.json");
  if (!fs.existsSync(manifestFile)) return [];
  return JSON.parse(fs.readFileSync(manifestFile, "utf8"));
}

export function getBibleVersion(code = "chinese_union_simp"): ProcessedBible | null {
  const manifest = getBibleManifest();
  const selected = manifest.find((item) => item.code === code) ?? manifest[0];
  if (!selected) return null;

  const filePath = path.join(processedDir, selected.file);
  if (!fs.existsSync(filePath)) return null;

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function getBibleChapter({
  versionCode = "chinese_union_simp",
  bookCode = "John",
  chapter = 3,
}: {
  versionCode?: string;
  bookCode?: string;
  chapter?: number;
}) {
  const bible = getBibleVersion(versionCode);
  const book = bible?.books.find((item) => item.code === bookCode);
  const selectedChapter = book?.chapters.find((item) => item.chapter === chapter);

  return {
    bible,
    book,
    chapter: selectedChapter,
  };
}
