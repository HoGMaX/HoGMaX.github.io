PRAGMA foreign_keys = ON;

CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE prompts (
    id TEXT PRIMARY KEY,
    category_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('horizontal', 'vertical', 'square')),
    status TEXT NOT NULL DEFAULT 'published'
        CHECK (status IN ('draft', 'published')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    copy_count INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

CREATE TABLE prompt_translations (
    prompt_id TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'uk')),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    prompt TEXT NOT NULL,

    PRIMARY KEY (prompt_id, language),

    FOREIGN KEY (prompt_id)
        REFERENCES prompts(id)
        ON DELETE CASCADE
);

CREATE TABLE prompt_tags (
    prompt_id TEXT NOT NULL,
    tag TEXT NOT NULL,

    PRIMARY KEY (prompt_id, tag),

    FOREIGN KEY (prompt_id)
        REFERENCES prompts(id)
        ON DELETE CASCADE
);

CREATE TABLE prompt_images (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,

    FOREIGN KEY (prompt_id)
        REFERENCES prompts(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_prompts_category
    ON prompts(category_id);

CREATE INDEX idx_prompts_status_order
    ON prompts(status, order_index);

CREATE INDEX idx_prompt_translations_language
    ON prompt_translations(language);

CREATE INDEX idx_prompt_tags_tag
    ON prompt_tags(tag);

CREATE INDEX idx_prompt_images_prompt_order
    ON prompt_images(prompt_id, sort_order);
