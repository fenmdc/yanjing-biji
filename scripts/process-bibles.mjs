import fs from "node:fs";
import path from "node:path";

const selectedModules = process.argv.slice(2);
const defaultModules = ["chinese_union_simp", "chinese_union_trad", "kjv", "web"];
const modulesToProcess = selectedModules.length > 0 ? selectedModules : defaultModules;
const inboxDir = path.resolve(process.cwd(), "data/bibles/inbox");
const processedDir = path.resolve(process.cwd(), "data/bibles/processed");
const versionsDir = path.join(processedDir, "versions");

const bookCodes = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (!entry.name.endsWith(".json") || fullPath.includes(`${path.sep}Extras${path.sep}`)) {
      return [];
    }
    return [fullPath];
  });
}

function readBookNames(language) {
  const booksFile = path.join(inboxDir, "Extras", `books_${language}.json`);
  if (!fs.existsSync(booksFile)) return null;
  return new Map(JSON.parse(fs.readFileSync(booksFile, "utf8")).map((book) => [book.id, book]));
}

function normalizeWhitespace(text) {
  const normalized = String(text ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    .replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, "$1")
    .replace(/([\u3400-\u9fff])\s+([，。！？；：、）])/g, "$1$2")
    .replace(/([，。！？；：、（「『《])\s+([\u3400-\u9fff])/g, "$1$2")
    .replace(/\s+([（「『《])/g, "$1")
    .replace(/([）】》])\s+([，。！？；：、])/g, "$1$2")
    .replace(/([）])/g, "$1");
}

const sourceFiles = new Map();

for (const filePath of walk(inboxDir)) {
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (payload.metadata?.module) sourceFiles.set(payload.metadata.module, filePath);
}

fs.mkdirSync(versionsDir, { recursive: true });

const manifest = [];

for (const moduleCode of modulesToProcess) {
  const filePath = sourceFiles.get(moduleCode);
  if (!filePath) {
    console.warn(`Skipping missing module: ${moduleCode}`);
    continue;
  }

  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const language = payload.metadata.lang_short || "unknown";
  const bookNames = readBookNames(language);
  const books = new Map();

  for (const verse of payload.verses) {
    const bookNumber = verse.book;
    const bookMeta = bookNames?.get(bookNumber);
    const bookCode = bookCodes[bookNumber - 1] ?? String(bookNumber);
    const bookName = bookMeta?.name ?? verse.book_name ?? bookCode;
    const shortName = bookMeta?.shortname ?? bookName;

    if (!books.has(bookNumber)) {
      books.set(bookNumber, {
        id: bookNumber,
        code: bookCode,
        name: bookName,
        shortName,
        chapters: [],
      });
    }

    const book = books.get(bookNumber);
    let chapter = book.chapters.find((item) => item.chapter === verse.chapter);
    if (!chapter) {
      chapter = { chapter: verse.chapter, verses: [] };
      book.chapters.push(chapter);
    }

    chapter.verses.push({
      verse: verse.verse,
      text: normalizeWhitespace(verse.text),
    });
  }

  const version = {
    metadata: {
      code: moduleCode,
      shortName: payload.metadata.shortname,
      name: payload.metadata.name,
      language,
      copyright: payload.metadata.copyright,
      copyrightStatement: payload.metadata.copyright_statement,
      source: path.relative(process.cwd(), filePath),
    },
    books: [...books.values()].map((book) => ({
      ...book,
      chapters: book.chapters.sort((a, b) => a.chapter - b.chapter),
    })),
  };

  const outputFile = path.join(versionsDir, `${moduleCode}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(version));

  manifest.push({
    code: version.metadata.code,
    shortName: version.metadata.shortName,
    name: version.metadata.name,
    language: version.metadata.language,
    books: version.books.length,
    verses: payload.verses.length,
    copyright: version.metadata.copyright,
    copyrightStatement: version.metadata.copyrightStatement,
    file: path.relative(processedDir, outputFile),
  });

  console.log(`Processed ${moduleCode}: ${payload.verses.length} verses`);
}

fs.writeFileSync(path.join(processedDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nWrote ${manifest.length} processed version(s) to ${path.relative(process.cwd(), processedDir)}`);
