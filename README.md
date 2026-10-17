# Theology website

Complete source for the static Theology articles and library website.

The site includes an icon-only dark/light theme control, instant search across articles and library resources, a private saved-articles reading list stored on the visitor's device, a daily Bible verse, article reading progress and tables of contents, SEO/social metadata, and Markdown footnote-style source citations.

## Run locally

Open `index.html` in a browser. To preview Markdown articles after editing or adding them, run `node scripts/build-articles.js` from this project folder first.

## Publish with GitHub Pages

1. Upload the contents of this project to a GitHub repository on its `main` or `master` branch.
2. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the deployment source.
3. Push to `main`/`master`, or manually start **Build and deploy Theology** in the repository's **Actions** tab.

The included workflow builds Markdown article pages and deploys the static website.

## Add an article

Create a lowercase, hyphenated `.md` file in one of:

- `articles/theology/`
- `articles/scripture/`
- `articles/faith-and-culture/`
- `articles/spiritual-formation/`
- `articles/islamic-dilemma/`

For example, create `articles/theology/did-jesus-rise.md` or `articles/islamic-dilemma/muhammad-and-mahdi.md` directly inside its category folder. Copy the front matter format from [`articles/TEMPLATE.md`](articles/TEMPLATE.md). Keep filenames lowercase and hyphenated. On push, the GitHub Actions workflow builds the new article and updates the article archive, category page, search index, and five newest homepage articles. Generated website pages are placed separately in a slug folder, such as `articles/theology/did-jesus-rise/index.html`; keep writing the source in the category folder as a `.md` file.

For local builds and supported Markdown formatting, see [`articles/README.md`](articles/README.md).
