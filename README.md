# Bible & Truth — Jekyll website starter

This is a responsive Jekyll/GitHub Pages starter based on the supplied homepage mockup.

## Included
- Instant article search dropdown that shows matching results while typing without opening a separate search page
- Responsive homepage, navigation, latest articles, category cards, sidebar and footer
- Dedicated article-reading layout with a mobile menu
- Daily Bible verse that changes by day
- Basic client-side search for the sample articles
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

Articles are stored in the `articles/` folder. Each category has its own subfolder, and each article is a Markdown (`.md`) file:

```text
articles/
├── theology/
│   ├── why-did-god-help-david-kill-goliath.md
│   └── what-does-the-bible-say-about-the-divinity-of-jesus.md
├── islamic-dilemma/
│   └── does-islam-really-teach-that-jesus-is-god.md
└── church-fathers/
    └── your-new-article.md
```

To add an article, create a `.md` file inside the appropriate category folder. Put this YAML front matter at the top:

```yaml
---
layout: article
title: "Your Article Title"
date: 2026-10-18
author: Anthony William
categories: [theology]
---
```

Then write the article in Markdown below the second `---`. Use `articles/theology/` for theology, `articles/islamic-dilemma/` for Islamic Dilemma, or `articles/church-fathers/` for Church Fathers. The collection is configured in `_config.yml`, so Jekyll can publish Markdown files from these folders.

## Notes
- The hero and card photos are loaded from Unsplash URLs and therefore require an internet connection.
- Search is generated automatically from every Markdown file in `articles/` (see `_includes/search-index.html`), plus the Theology, Islamic Dilemma and Church Fathers topic pages. Just add a `.md` file; no manual index to update.
- Search sits in the sticky header on every page, and in the sidebar of article pages. Press `/` to jump to it;
- Check the displayed contact details before publishing.
- The sample pages and article text are starting content and should be reviewed/expanded before publication.
