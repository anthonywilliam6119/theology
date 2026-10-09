# Logos & Truth - website

A plain website (HTML, CSS and JavaScript). There is nothing to build or install:
upload the files to GitHub and turn on GitHub Pages.

## 1. Upload to GitHub
1. Create a public repository. Name it `YOURUSERNAME.github.io`.
2. Upload every file and folder of this project to the repository root, so that `index.html` sits at the top level.
   (On a computer: unzip first, then drag all files and folders into GitHub's "Add file > Upload files".
   On a phone: use "Add file > Create new file", type the file name such as `assets/app.js`, paste the code, and commit.)
3. Open **Settings > Pages**. Source = *Deploy from a branch*, Branch = `main`, Folder = `/ (root)`. Save.
4. After 1-2 minutes your site is live at `https://YOURUSERNAME.github.io`.

## 2. Add your articles
Articles are Markdown files inside the category folders:

```
articles/
  theology/          your-article.md
  apologetics/
  islamic-dilemma/   muhammad.md
  church-fathers/
```

To add one on GitHub: open the category folder, choose **Add file > Create new file**,
name it e.g. `jesus-as-god.md`, paste your text, and commit.

Start the file like this (all lines are optional - the site fills in what is missing):

```
---
title: "Jesus as God"
date: 2026-10-09
excerpt: "One or two sentences shown on article cards and in search."
---

## First heading

Your article text. Use **bold**, *italic*, [links](https://example.com),
lists with "-", numbered lists, and "> quotes".
```

- The folder name is the category. A **new folder** inside `articles/` becomes a new category automatically.
- New articles appear on the site within about 5 minutes.
- Files named `README.md` and files starting with `_` or `.` are ignored.

## 3. Edit settings
Open `config.js` to change your email, WhatsApp number, author name and category names/descriptions.
Daily verses live in `assets/verses.js`.

## Notes
- If you use your own domain name (not github.io), fill in `owner` and `repo` in `config.js`.
- The site reads your article list from GitHub. If GitHub is busy (it allows about 60 requests per hour per visitor), a visitor may need to refresh later.
- Add `?nocache` to the web address to see a brand-new article immediately.
