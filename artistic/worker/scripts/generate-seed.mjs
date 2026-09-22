import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);

const INPUT = path.join(ROOT, "data", "prompts.json");
const OUTPUT = path.join(
  ROOT,
  "worker",
  "migrations",
  "0002_seed_initial.sql"
);

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return `'${String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")}'`;
}

function sqlInteger(value, fallback = 0) {
  const number = Number(value);

  return Number.isInteger(number) ? String(number) : String(fallback);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const json = fs.readFileSync(INPUT, "utf8");
const prompts = JSON.parse(json);

if (!Array.isArray(prompts)) {
  throw new Error(
    "Expected data/prompts.json to contain an array of prompts."
  );
}

const statements = [];

//
// Migration header
//

statements.push("-- ARTISTIC initial seed");
statements.push("-- Generated from data/prompts.json");
statements.push("-- DO NOT EDIT MANUALLY");
statements.push("");

//
// 1. Add the canonical prompt text to prompts.
//
// The original 0001 schema did not have this column.
//

statements.push(
  "ALTER TABLE prompts ADD COLUMN prompt TEXT NOT NULL DEFAULT '';"
);
statements.push("");

//
// 2. Rebuild prompt_translations without the old prompt column.
//
// The old 0001 schema stored prompt inside translations.
// Prompt is now canonical and stored once in prompts.prompt.
//

statements.push(`
CREATE TABLE prompt_translations_new (
  prompt_id TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (prompt_id, language),
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);
`);

statements.push(`
INSERT INTO prompt_translations_new (
  prompt_id,
  language,
  title,
  description
)
SELECT
  prompt_id,
  language,
  title,
  description
FROM prompt_translations;
`);

statements.push("DROP TABLE prompt_translations;");

statements.push(`
ALTER TABLE prompt_translations_new
RENAME TO prompt_translations;
`);

statements.push(`
CREATE INDEX idx_prompt_translations_language
ON prompt_translations(language);
`);

statements.push("");

//
// 3. Collect unique categories.
//

const categories = new Map();

for (const prompt of prompts) {
  if (!prompt.category) {
    continue;
  }

  const categoryId = slugify(prompt.category);

  if (!categories.has(categoryId)) {
    categories.set(categoryId, {
      id: categoryId,
      slug: categoryId,
      name: prompt.category,
    });
  }
}

//
// 4. Seed categories.
//

for (const category of categories.values()) {
  const now = new Date().toISOString();

  statements.push(
    `INSERT OR IGNORE INTO categories ` +
      `(id, slug, name, created_at, updated_at) VALUES ` +
      `(${sqlString(category.id)}, ` +
      `${sqlString(category.slug)}, ` +
      `${sqlString(category.name)}, ` +
      `${sqlString(now)}, ` +
      `${sqlString(now)});`
  );
}

statements.push("");

//
// 5. Seed prompts, translations and tags.
//

for (const prompt of prompts) {
  if (!prompt.id) {
    throw new Error("Prompt is missing required field: id");
  }

  const categoryId = prompt.category
    ? slugify(prompt.category)
    : null;

  const status =
    prompt.published === false ? "draft" : "published";

  const createdAt =
    prompt.createdAt || new Date().toISOString();

  const promptText = prompt.prompt || "";

  //
  // Canonical prompt record.
  // The large prompt text is stored ONLY here.
  //

  statements.push(
    `INSERT OR REPLACE INTO prompts ` +
      `(id, category_id, type, status, order_index, ` +
      `created_at, updated_at, copy_count, prompt) VALUES ` +
      `(${sqlString(prompt.id)}, ` +
      `${sqlString(categoryId)}, ` +
      `${sqlString(prompt.type || "vertical")}, ` +
      `${sqlString(status)}, ` +
      `${sqlInteger(prompt.order)}, ` +
      `${sqlString(createdAt)}, ` +
      `${sqlString(createdAt)}, ` +
      `${sqlInteger(prompt.copyCount)}, ` +
      `${sqlString(promptText)});`
  );

  //
  // Translation data.
  // Only title + description are language-specific.
  //

  const translations = {};

  if (
    prompt.title !== undefined ||
    prompt.description !== undefined
  ) {
    translations.en = {
      title: prompt.title || "",
      description: prompt.description || "",
    };
  }

  if (
    prompt.translations &&
    typeof prompt.translations === "object"
  ) {
    for (const [language, translation] of Object.entries(
      prompt.translations
    )) {
      if (!translation || typeof translation !== "object") {
        continue;
      }

      translations[language] = {
        title: translation.title || "",
        description: translation.description || "",
      };
    }
  }

  for (const [language, translation] of Object.entries(
    translations
  )) {
    statements.push(
      `INSERT OR REPLACE INTO prompt_translations ` +
        `(prompt_id, language, title, description) VALUES ` +
        `(${sqlString(prompt.id)}, ` +
        `${sqlString(language)}, ` +
        `${sqlString(translation.title)}, ` +
        `${sqlString(translation.description)});`
    );
  }

  //
  // Tags.
  //

  if (Array.isArray(prompt.tags)) {
    for (const tag of prompt.tags) {
      if (!tag) {
        continue;
      }

      statements.push(
        `INSERT OR IGNORE INTO prompt_tags ` +
          `(prompt_id, tag) VALUES ` +
          `(${sqlString(prompt.id)}, ${sqlString(tag)});`
      );
    }
  }

  //
  // Images are intentionally NOT imported here.
  // They will be handled later through R2.
  //

  statements.push("");
}

//
// Write migration.
//

const output =
  `${statements.join("\n").trim()}\n`;

fs.writeFileSync(OUTPUT, output, "utf8");

console.log(
  `Generated: ${path.relative(ROOT, OUTPUT)}`
);
console.log(`Prompts: ${prompts.length}`);
console.log(`Categories: ${categories.size}`);
