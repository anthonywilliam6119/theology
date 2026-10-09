# Logos & Truth

A Jekyll site for GitHub Pages: theology, apologetics, Church Fathers and Islamic Dilemma articles.

## Upload to GitHub (step by step)
1. Create a new public repository. Name it `YOURUSERNAME.github.io` for the address `https://YOURUSERNAME.github.io`.
2. Unzip this project and upload **everything** (drag the files and folders into the repository, including folders that start with `_`). Commit to `main`.
3. Repository **Settings > Pages**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Save.
4. Wait 1-2 minutes, then open your site. Check the **Actions** tab if it does not appear.
5. If your repository has any other name, open `_config.yml` and set `baseurl: "/your-repo-name"`.

## Folder layout
The four category folders are ready and empty. Each holds a hidden `.gitkeep` file only so GitHub keeps the empty folder (you can delete it after adding your first article).
```
articles/
  theology/            <- put theology articles here
  apologetics/
  islamic-dilemma/
  church-fathers/
```
Until you add articles, the site shows "Articles are coming soon" in place of the article lists.

## Add an article
Create a Markdown file inside its category folder, for example `articles/islamic-dilemma/muhammad.md`:

```yaml
---
title: "Muhammad"
date: 2026-10-09
excerpt: "Short description shown on cards and in search."
---

Your article text here...
```

The category comes from the folder name. No `index.html` is needed.

## Add a category
1. Add it to `_data/categories.yml` (`id` = folder name).
2. Create `_categories/<id>.md` containing only two lines: `---` and `---`.
3. Create the folder `articles/<id>/` and add articles.

## Other things you can edit
- Contact details: `_data/contact.yml` (email, WhatsApp number).
- Daily verses (123, rotate every 5 minutes, daily and on every visit): `_data/verses.yml`.
- Colors and fonts: `assets/css/style.css`.

## Run locally (optional)
`bundle install` then `bundle exec jekyll serve`, and open http://localhost:4000
