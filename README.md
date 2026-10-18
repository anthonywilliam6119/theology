# Bible & Truth — Jekyll website starter

This is a responsive Jekyll/GitHub Pages starter based on the supplied homepage mockup.

## Included
- Instant article search dropdown that shows matching results while typing without opening a separate search page
- Responsive homepage, navigation, latest articles, category cards, sidebar and footer
- Dedicated article-reading layout with a mobile menu
- - Daily Bible verse (King James Version) that changes every day
- Theology, Islamic Dilemma, Church Fathers, Latest Articles and About pages
- Three sample article posts
- Contact icons linked to WhatsApp and Gmail

## Publish on GitHub Pages
1. Download and unzip this folder.
2. Copy the contents into the root of your existing GitHub Pages repository.
3. Commit and push the files to your publishing branch (usually `main`).
4. In GitHub, open **Settings → Pages** and ensure Pages publishes from the correct branch/folder.
5. Wait for the build to finish, then open your site.

## Add articles using folders and categories

Articles are Markdown (`.md`) files stored in the **`_articles/`** folder, with one sub-folder per category. (Jekyll requires the leading underscore for a collection folder; the published address is still `/articles/<category>/<article-name>/`.)

```text
_articles/
├── theology/
│   ├── why-did-god-help-david-kill-goliath.md
│   └── what-does-the-bible-say-about-the-divinity-of-jesus.md
├── islamic-dilemma/
│   └── does-islam-really-teach-that-jesus-is-god.md
└── church-fathers/
    └── your-new-article.md
```

To add an article, create a `.md` file inside the right category folder and start it with this front matter:

```yaml
---
title: "Your Article Title"
date: 2026-10-18
author: Anthony William
categories: [theology]
description: "One or two sentences shown on article cards and in search."
image: "https://example.com/optional-photo.jpg"   # optional
---
```

Then write the article in plain Markdown below the second `---` (use `##` for headings; footnotes, lists, quotes and tables work). Do **not** add `<main>` or `<h1>` tags; the page title and layout are added automatically. The reading time is calculated automatically (set `reading_time: "8 min read"` to override).

A new article automatically appears on the home page (3 newest), Latest Articles, its category page, the article sidebar and instant search. Nothing else needs editing.

### Add a new category

1. Create the folder `_articles/<category-name>/` and add an article with `categories: [<category-name>]`.
2. Create `<category-name>/index.html` containing only this front matter (copy `theology/index.html`):

```yaml
---
layout: category
title: Category Name
category: category-name
permalink: /category-name/
intro: "One-sentence description."
---
```

3. Add a link to it in `_includes/header.html` and `_includes/footer.html`.

## Notes
- The hero and card photos are loaded from Unsplash URLs and therefore require an internet connection.
- Search is generated automatically from every Markdown file in `_articles/` (see `_includes/search-index.html`), plus the Theology, Islamic Dilemma and Church Fathers topic pages. Just add a `.md` file; no manual index to update.
- Search sits in the sticky header on every page, and in the sidebar of article pages. Press `/` to jump to it;
- Check the displayed contact details before publishing.
- The sample pages and article text are starting content and should be reviewed/expanded before publication.
