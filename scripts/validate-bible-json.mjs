import fs from "node:fs";
import path from "node:path";

const [, , inputPath] = process.argv;

if (!inputPath) {
  console.error("Usage: npm run bible:validate -- data/bibles/inbox/your-bible.json");
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), inputPath);

if (!fs.existsSync(absolutePath)) {
  console.error(`File not found: ${absolutePath}`);
  process.exit(1);
}

let payload;

try {
  payload = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(1);
}

const errors = [];

if (!payload.translation || typeof payload.translation !== "object") {
  errors.push("Missing translation object.");
}

for (const key of ["code", "name", "language", "source", "license"]) {
  if (!payload.translation?.[key]) {
    errors.push(`Missing translation.${key}.`);
  }
}

if (!Array.isArray(payload.verses) || payload.verses.length === 0) {
  errors.push("verses must be a non-empty array.");
}

const seen = new Set();

for (const [index, verse] of (payload.verses ?? []).entries()) {
  const label = `verses[${index}]`;
  for (const key of ["book", "bookZh", "chapter", "verse", "text"]) {
    if (verse[key] === undefined || verse[key] === null || verse[key] === "") {
      errors.push(`${label} missing ${key}.`);
    }
  }

  if (!Number.isInteger(verse.chapter) || verse.chapter < 1) {
    errors.push(`${label}.chapter must be a positive integer.`);
  }

  if (!Number.isInteger(verse.verse) || verse.verse < 1) {
    errors.push(`${label}.verse must be a positive integer.`);
  }

  const key = `${verse.book}:${verse.chapter}:${verse.verse}`;
  if (seen.has(key)) {
    errors.push(`Duplicate verse: ${key}.`);
  }
  seen.add(key);
}

if (errors.length > 0) {
  console.error("Bible JSON validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Bible JSON looks good: ${payload.translation.code}`);
console.log(`Verses: ${payload.verses.length}`);
