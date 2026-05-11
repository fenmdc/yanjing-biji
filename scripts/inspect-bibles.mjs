import fs from "node:fs";
import path from "node:path";

const inboxDir = path.resolve(process.cwd(), "data/bibles/inbox");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
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

const rows = [];

for (const filePath of walk(inboxDir)) {
  try {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!payload.metadata || !Array.isArray(payload.verses)) continue;
    rows.push({
      module: payload.metadata.module,
      shortname: payload.metadata.shortname,
      name: payload.metadata.name,
      language: payload.metadata.lang || payload.metadata.lang_short || "unknown",
      copyright: payload.metadata.copyright,
      publicDomain: payload.metadata.copyright_statement?.includes("Public Domain") ?? false,
      strongs: payload.metadata.strongs,
      verses: payload.verses.length,
      file: path.relative(process.cwd(), filePath),
    });
  } catch (error) {
    console.error(`Could not read ${filePath}: ${error.message}`);
  }
}

rows.sort((a, b) => a.language.localeCompare(b.language) || a.module.localeCompare(b.module));

console.log(`Found ${rows.length} Bible JSON files.\n`);
console.table(
  rows.map(({ module, shortname, name, language, verses, publicDomain, strongs }) => ({
    module,
    shortname,
    language,
    verses,
    publicDomain,
    strongs,
    name,
  })),
);
