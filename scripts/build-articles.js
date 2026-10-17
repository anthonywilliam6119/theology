const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const articlesRoot = path.join(root, "articles");
const categories = {
  theology: { title: "Theology", filter: "theology", heading: "THEOLOGY" },
  scripture: { title: "Scripture", filter: "scripture", heading: "SCRIPTURE" },
  "faith-and-culture": { title: "Faith & culture", filter: "faith", heading: "FAITH & CULTURE" },
  "spiritual-formation": { title: "Spiritual formation", filter: "formation", heading: "SPIRITUAL FORMATION" },
  "islamic-dilemma": { title: "Islamic dilemma", filter: "islamic-dilemma", heading: "ISLAMIC DILEMMA" },
};
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
})[character]);
const toSitePath = (fromDirectory, target) => path.relative(fromDirectory, path.join(root, target)).split(path.sep).join("/");
const categoryOf = (slug) => categories[slug];
const categoryMarker = (slug) => ({
  "faith-and-culture": "FAITH",
  "spiritual-formation": "FORMATION",
  "islamic-dilemma": "ISLAMIC-DILEMMA",
}[slug] || slug.toUpperCase());

function blogSidebarMarkup(directory) {
  const categoryLinks = Object.entries(categories).map(([slug, category]) =>
    `<a href="${toSitePath(directory, `articles/${slug}/index.html`)}">${escapeHtml(category.title)}</a>`).join("");
  return `<aside class="blog-sidebar" data-blog-sidebar aria-label="Explore Theology"><section class="sidebar-card"><p class="sidebar-kicker">Browse topics</p><h2>Explore by category</h2><nav class="sidebar-categories" aria-label="Article categories">${categoryLinks}</nav></section><section class="sidebar-card sidebar-about"><p class="sidebar-kicker">Theology</p><h2>Faith, thought, and everyday life.</h2><p>Thoughtful Christian writing on scripture, belief, culture, and spiritual formation.</p><a href="${toSitePath(directory, "about.html")}">About this journal <span aria-hidden="true">→</span></a></section></aside>`;
}

function topicStripMarkup(directory) {
  const categoryLinks = Object.entries(categories).map(([slug, category]) =>
    `<a href="${toSitePath(directory, `articles/${slug}/index.html`)}">${escapeHtml(category.title)}</a>`).join("");
  return `<nav class="topic-strip" aria-label="Browse topics"><span>Explore</span><a href="${toSitePath(directory, "articles/index.html")}">Latest</a>${categoryLinks}</nav>`;
}

function addArchiveSidebar(html, directory) {
  const start = html.indexOf('<section class="page-content archive-content');
  if (start < 0 || html.includes('data-blog-sidebar')) return html;
  const end = html.indexOf("</section>", start);
  if (end < 0) throw new Error(`${path.relative(root, directory)}: could not find the end of the article archive.`);
  return `${html.slice(0, end)}${blogSidebarMarkup(directory)}${html.slice(end)}`;
}

function parseDate(value, file) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${file}: date must use YYYY-MM-DD.`);
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`${file}: date is not a valid calendar date.`);
  }
  return date;
}

function parseMarkdownFile(file, categorySlug) {
  const content = fs.readFile(file, "utf8");
  return content.then((text) => {
    const match = text.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) throw new Error(`${path.relative(root, file)}: add YAML-style front matter between --- lines.`);
    const metadata = {};
    for (const line of match[1].split(/\r?\n/)) {
      const field = line.match(/^([a-z_]+):\s*(.*?)\s*$/);
      if (!field) throw new Error(`${path.relative(root, file)}: invalid front matter line "${line}".`);
      metadata[field[1]] = field[2].replace(/^(['"])(.*)\1$/, "$2");
    }
    for (const field of ["title", "date", "description"]) {
      if (!metadata[field]) throw new Error(`${path.relative(root, file)}: front matter requires "${field}".`);
    }
    const slug = path.basename(file, ".md");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`${path.relative(root, file)}: filename must be a lowercase, hyphenated slug.`);
    }
    if (!categoryOf(categorySlug)) throw new Error(`${path.relative(root, file)}: unknown article category.`);
    const date = parseDate(metadata.date, path.relative(root, file));
    const readTime = metadata.read_time || "5 min read";
    if (!/^\d+\s+min(?:ute)?s?\s+read$/.test(readTime)) {
      throw new Error(`${path.relative(root, file)}: read_time should look like "6 min read".`);
    }
    return {
      title: metadata.title,
      description: metadata.description,
      date,
      readTime,
      author: metadata.author || "Anthony William",
      categorySlug,
      categoryTitle: categoryOf(categorySlug).title,
      filter: categoryOf(categorySlug).filter,
      slug,
      markdown: match[2].trim(),
      sourceFile: file,
      pagePath: path.join("articles", categorySlug, slug, "index.html"),
    };
  });
}

function decodeHtml(value) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
}

function parseDateLabel(value) {
  const match = value.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (match) {
    const month = monthNames.findIndex((name) => name.toLowerCase() === match[1].slice(0, 3).toLowerCase());
    if (month >= 0) return new Date(Date.UTC(Number(match[3]), month, Number(match[2])));
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? new Date(0) : new Date(timestamp);
}

function readExistingArchive(html) {
  const records = [];
  const rowPattern = /<a class="topic-row" data-archive-article href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g;
  for (const match of html.matchAll(rowPattern)) {
    const row = match[3];
    const date = row.match(/<span class="topic-date">([^<]+)<\/span>/);
    const meta = row.match(/<span class="article-meta"><span>([\s\S]*?)<\/span><span>·<\/span><span>([\s\S]*?)<\/span><\/span><strong>([\s\S]*?)<\/strong><span>([\s\S]*?)<\/span>/);
    const route = match[1].split("/");
    const categorySlug = route[0];
    if (!date || !meta || !categoryOf(categorySlug)) continue;
    records.push({
      title: decodeHtml(meta[3].replace(/<[^>]+>/g, "")),
      description: decodeHtml(meta[4].replace(/<[^>]+>/g, "")),
      date: parseDateLabel(date[1]),
      readTime: decodeHtml(meta[2]),
      author: "Anthony William",
      categorySlug,
      categoryTitle: decodeHtml(meta[1].replace(/<[^>]+>/g, "")),
      filter: categoryOf(categorySlug).filter,
      slug: route[1],
      markdown: "",
      markdownSource: match[2].includes("data-markdown-source"),
      pagePath: path.join("articles", categorySlug, route[1], "index.html"),
    });
  }
  if (!records.length) throw new Error("Could not find existing article rows in articles/index.html.");
  return records;
}

function inlineMarkdown(text) {
  const tokens = [];
  const token = (html) => {
    const key = `@@TOKEN${tokens.length}@@`;
    tokens.push(html);
    return key;
  };
  let rendered = text.replace(/`([^`]+)`/g, (_, code) => token(`<code>${escapeHtml(code)}</code>`));
  rendered = rendered.replace(/\[\[CITATION:([a-zA-Z0-9_-]+)\]\]/g, (_, id) =>
    token(`<sup class="citation" id="citation-ref-${id}"><a href="#source-${id}" aria-label="Source ${id}">[${id}]</a></sup>`));
  rendered = rendered.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/|#)[^\s)]+)\)/g, (_, label, href) =>
    token(`<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`));
  rendered = escapeHtml(rendered)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
  return rendered.replace(/@@TOKEN(\d+)@@/g, (_, index) => tokens[Number(index)]);
}

function renderMarkdown(markdown) {
  const definitions = new Map();
  const lines = markdown.split(/\r?\n/).filter((line) => {
    const definition = line.match(/^\[\^([a-zA-Z0-9_-]+)\]:\s*(.+)$/);
    if (!definition) return true;
    if (definitions.has(definition[1])) throw new Error(`Citation [^${definition[1]}] is defined more than once.`);
    definitions.set(definition[1], definition[2]);
    return false;
  });
  const output = [];
  let paragraph = [];
  let listType = "";
  let codeLines = null;
  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = "";
  };
  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      if (codeLines !== null) {
        output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = null;
      } else codeLines = [];
      continue;
    }
    if (codeLines !== null) {
      codeLines.push(line);
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (heading) {
      flushParagraph(); closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
    } else if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) { closeList(); output.push(`<${nextType}>`); listType = nextType; }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`);
    } else if (quote) {
      flushParagraph(); closeList();
      output.push(`<blockquote><p>${inlineMarkdown(quote[1])}</p></blockquote>`);
    } else if (/^\s*---+\s*$/.test(line)) {
      flushParagraph(); closeList(); output.push("<hr>");
    } else if (!line.trim()) {
      flushParagraph(); closeList();
    } else {
      closeList();
      paragraph.push(line.trim().replace(/\[\^([a-zA-Z0-9_-]+)\]/g, (_, id) => `[[CITATION:${id}]]`));
    }
  }
  flushParagraph();
  closeList();
  if (codeLines !== null) throw new Error("Markdown article has an unclosed fenced code block.");
  const usedCitations = new Set([...lines.join("\n").matchAll(/\[\^([a-zA-Z0-9_-]+)\]/g)].map((match) => match[1]));
  for (const citation of usedCitations) {
    if (!definitions.has(citation)) throw new Error(`Citation [^${citation}] has no matching source definition.`);
  }
  for (const id of definitions.keys()) {
    if (!usedCitations.has(id)) throw new Error(`Source [^${id}] is not cited in the article.`);
  }
  if (definitions.size) {
    const sources = [...definitions].map(([id, source]) =>
      `<li id="source-${id}">${inlineMarkdown(source)} <a class="citation-backlink" href="#citation-ref-${id}" aria-label="Back to citation">↩</a></li>`).join("");
    output.push(`<section class="article-sources" aria-labelledby="sources-title"><h2 id="sources-title">Sources</h2><ol>${sources}</ol></section>`);
  }
  return output.join("\n");
}

function formatDate(date) {
  return `${monthNames[date.getUTCMonth()].toUpperCase()} ${String(date.getUTCDate()).padStart(2, "0")}, ${date.getUTCFullYear()}`;
}

function archiveRow(article, hidden = false) {
  const href = `${article.categorySlug}/${article.slug}/index.html`;
  const sourceAttribute = article.sourceFile || article.markdownSource ? ' data-markdown-source="true"' : "";
  return `<a class="topic-row" data-archive-article href="${href}"${sourceAttribute}${hidden ? " hidden" : ""}><span class="topic-date">${formatDate(article.date)}</span><span class="topic-copy"><span class="article-meta"><span>${escapeHtml(article.categoryTitle)}</span><span>·</span><span>${escapeHtml(article.readTime)}</span></span><strong>${escapeHtml(article.title)}</strong><span>${escapeHtml(article.description)}</span></span><span class="topic-arrow" aria-hidden="true">↗</span></a>`;
}

function homeCard(article, homeDirectory) {
  const href = toSitePath(homeDirectory, article.pagePath);
  const search = `${article.title} ${article.description} ${article.categoryTitle}`.toLowerCase();
  return `<article class="article-card" data-category="${article.filter}" data-search="${escapeHtml(search)}"><div class="article-card-body"><p class="article-meta"><span>${escapeHtml(article.categoryTitle)}</span><span>·</span><span>${escapeHtml(article.readTime)}</span></p><h3><a href="${href}">${escapeHtml(article.title)}</a></h3><p>${escapeHtml(article.description)}</p><span class="card-author">By ${escapeHtml(article.author)}</span></div></article>`;
}

function replaceBetweenMarkers(html, start, end, replacement, file) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) throw new Error(`${file}: missing generated content markers.`);
  return html.slice(0, startIndex + start.length) + "\n" + replacement + "\n" + html.slice(endIndex);
}

function extractPlainText(markup) {
  return decodeHtml(markup.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ")).trim();
}

function markdownSearchText(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, " ").replace(/^\s*---[\s\S]*?---\s*/m, " ")
    .replace(/^\s*#{1,6}\s+/gm, "").replace(/^\s*[-*]\s+/gm, "")
    .replace(/\[\^([a-zA-Z0-9_-]+)\]:\s*/g, "").replace(/\[\^([a-zA-Z0-9_-]+)\]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`>#]/g, " ").replace(/\s+/g, " ").trim();
}

async function createSearchIndex(articles) {
  const items = [];
  for (const article of articles) {
    let articleContent = article.markdown
      ? markdownSearchText(article.markdown)
      : "";
    if (!articleContent) {
      const file = path.join(root, article.pagePath);
      const page = await fs.readFile(file, "utf8").catch((error) => {
        if (error.code === "ENOENT") return "";
        throw error;
      });
      const content = page.match(/<article\b[^>]*class="[^"]*reading-article-content[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
      if (content) articleContent = extractPlainText(content[1]);
    }
    items.push({
      title: article.title,
      description: article.description,
      content: articleContent,
      category: article.categoryTitle,
      author: article.author || "Anthony William",
      type: "Article",
      url: article.pagePath.split(path.sep).join("/"),
      date: article.date.toISOString().slice(0, 10),
    });
  }

  const library = await fs.readFile(path.join(root, "library.html"), "utf8");
  const resourcePattern = /<article class="library-entry" id="([^"]+)"([^>]*)>([\s\S]*?)<\/article>/g;
  for (const match of library.matchAll(resourcePattern)) {
    const title = match[3].match(/<h2>([\s\S]*?)<\/h2>/);
    if (!title) continue;
    const author = match[3].match(/<span class="resource-author">([\s\S]*?)<\/span>/);
    const type = match[3].match(/<span class="resource-type">([\s\S]*?)<\/span>/);
    const description = match[3].match(/<p>([\s\S]*?)<\/p>/);
    items.push({
      title: extractPlainText(title[1]),
      description: description ? extractPlainText(description[1]) : "Library resource",
      content: extractPlainText(`${match[2]} ${match[3]}`),
      category: "Library",
      author: author ? extractPlainText(author[1]) : "",
      type: type ? extractPlainText(type[1]) : "Resource",
      url: `library.html#${match[1]}`,
    });
  }
  return items;
}

function socialMetadata(html, file) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta name="description" content="([^"]*)"/i);
  if (!titleMatch || !descriptionMatch) return html;
  const title = extractPlainText(titleMatch[1]);
  const description = decodeHtml(descriptionMatch[1]);
  const isArticle = /class="[^"]*\barticle-page-hero\b[^"]*"/.test(html) && /class="[^"]*reading-article-content/.test(html);
  const currentUrl = path.relative(root, file).split(path.sep).join("/");
  const socialTags = `<!-- THEOLOGY_SOCIAL_METADATA_START -->
    <meta property="og:site_name" content="Theology">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="${isArticle ? "article" : "website"}">
    <meta property="og:locale" content="en_US">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <!-- THEOLOGY_SOCIAL_METADATA_END -->`;
  let updated = html.replace(/<!-- THEOLOGY_SOCIAL_METADATA_START -->[\s\S]*?<!-- THEOLOGY_SOCIAL_METADATA_END -->\s*/g, "");
  updated = updated.replace(/(class="theme-toggle-icon" aria-hidden="true">)\?(<\/span>)/g, "$1&#9790;$2");
  updated = updated.replace(/(<button class="theme-toggle"[^>]*?)\s+title="[^"]*"/g, "$1");
  updated = updated.replace(/(<span class="theme-toggle-icon"[^>]*>)[\s\S]*?(<\/span>)\s*<span data-theme-label>[\s\S]*?<\/span>/g, "$1&#9790;$2");
  updated = updated.replace(/<a class="nav-cta"[\s\S]*?<\/a>/g, "");
  updated = updated.replace(/(<meta name="description"[^>]*>\s*)/i, `$1${socialTags}\n    `);
  const articleBodyMatch = updated.match(/<article\b[^>]*class="[^"]*reading-article-content[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
  let schema;
  if (isArticle) {
    const authorMatch = updated.match(/<div class="article-byline">[\s\S]*?<strong>([\s\S]*?)<\/strong>/);
    const dateMatch = updated.match(/<div class="article-byline">[\s\S]*?<small>([\s\S]*?)<\/small>/);
    const categoryMatch = updated.match(/<p class="eyebrow"><span class="eyebrow-line"><\/span>\s*([^<·]+)\s*·/);
    const published = dateMatch ? parseDateLabel(extractPlainText(dateMatch[1])).getTime() : NaN;
    schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      author: { "@type": "Person", name: authorMatch ? extractPlainText(authorMatch[1]) : "Anthony William" },
      publisher: { "@type": "Organization", name: "Theology" },
      ...(Number.isNaN(published) ? {} : { datePublished: new Date(published).toISOString().slice(0, 10) }),
      ...(categoryMatch ? { articleSection: extractPlainText(categoryMatch[1]) } : {}),
      ...(articleBodyMatch ? { articleBody: extractPlainText(articleBodyMatch[1]) } : {}),
    };
  } else if (currentUrl === "index.html") {
    schema = { "@context": "https://schema.org", "@type": "WebSite", name: "Theology", description };
  } else {
    schema = { "@context": "https://schema.org", "@type": "WebPage", name: title, description };
  }
  const jsonLd = `<!-- THEOLOGY_JSONLD_START --><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script><!-- THEOLOGY_JSONLD_END -->`;
  updated = updated.replace(/<!-- THEOLOGY_JSONLD_START -->[\s\S]*?<!-- THEOLOGY_JSONLD_END -->\s*/g, "");
  updated = updated.replace(/^[ \t]*<\/head>/im, `    ${jsonLd}\n  </head>`);

  const searchButton = `<button class="nav-search" type="button" data-quick-search-toggle aria-expanded="false" aria-controls="quick-search-panel" aria-label="Open site search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/></svg></button>`;
  const nav = updated.match(/<nav class="site-nav"[^>]*>[\s\S]*?<\/nav>/);
  if (nav) {
    let updatedNav = nav[0].replace(/<a class="nav-search"[^>]*>[\s\S]*?<\/a>/g, searchButton);
    if (!updatedNav.includes("data-quick-search-toggle")) {
      updatedNav = updatedNav.replace(/<button class="theme-toggle"/, `${searchButton}<button class="theme-toggle"`);
    }
    const savedButton = `<button class="saved-toggle" type="button" data-saved-toggle aria-expanded="false" aria-controls="saved-panel" aria-label="Open saved articles"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.8L6 21z"/></svg><span class="saved-count" data-saved-count hidden></span></button>`;
    if (!updatedNav.includes("data-saved-toggle")) {
      updatedNav = updatedNav.replace(/(<button class="nav-search"[^>]*>[\s\S]*?<\/button>)/, `$1${savedButton}`);
    }
    updated = updated.replace(nav[0], updatedNav);
  }
  if (!updated.includes("data-quick-search-panel")) {
    const panel = `<div class="quick-search-panel" id="quick-search-panel" data-quick-search-panel hidden role="search"><label class="quick-search-box"><span class="sr-only">Search articles and library resources</span><input type="search" data-quick-search-input placeholder="Search articles, books, authors..." autocomplete="off"><kbd>Esc</kbd></label><p class="quick-search-status" data-quick-search-status aria-live="polite">Type to search articles and library resources.</p><div class="quick-search-results" data-quick-search-results></div></div>`;
    updated = updated.replace("</header>", `${panel}</header>`);
  }
  if (!updated.includes("data-saved-panel")) {
    const panel = `<section class="quick-search-panel saved-panel" id="saved-panel" data-saved-panel hidden aria-label="Saved articles"><h2>Saved articles</h2><p class="quick-search-status" data-saved-status aria-live="polite"></p><div class="saved-article-list" data-saved-list></div></section>`;
    updated = updated.replace("</header>", `${panel}</header>`);
  }
  if (isArticle && !updated.includes("data-save-article")) {
    const saveButton = `<button class="article-action save-article-button" type="button" data-save-article aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.8L6 21z"/></svg><span data-save-label>Save for later</span></button><span class="save-confirmation" data-save-status role="status" aria-live="polite"></span>`;
    updated = updated.replace(/(<div class="article-actions"[^>]*>[\s\S]*?<\/span>)(\s*<button)/, `$1${saveButton}$2`);
  } else if (isArticle && !updated.includes("data-save-status")) {
    updated = updated.replace(/(<button class="article-action save-article-button"[^>]*>[\s\S]*?<\/button>)/, `$1<span class="save-confirmation" data-save-status role="status" aria-live="polite"></span>`);
  }
  if (!updated.includes("data-search-index")) {
    const searchIndexPath = path.relative(path.dirname(file), path.join(root, "search-index.js")).split(path.sep).join("/");
    const searchIndexScript = `<script src="${searchIndexPath}" data-search-index defer></script>`;
    updated = updated.replace(/(<script src="[^"]*script\.js" defer><\/script>)/, `${searchIndexScript}\n    $1`);
  }
  updated = updated.replace(/<nav class="topic-strip"[\s\S]*?<\/nav>\s*/g, "");
  const topicStrip = topicStripMarkup(path.dirname(file));
  updated = updated.replace(/<\/header>/i, `${topicStrip}</header>`);
  return updated;
}

async function updatePage(file, transform) {
  const original = await fs.readFile(file, "utf8");
  const updated = transform(original);
  await fs.writeFile(file, updated, "utf8");
}

async function buildArticlePage(article) {
  const pageDirectory = path.join(root, "articles", article.categorySlug, article.slug);
  const rootLink = toSitePath(pageDirectory, "index.html");
  const categoryLink = toSitePath(pageDirectory, `articles/${article.categorySlug}/index.html`);
  const archiveLink = toSitePath(pageDirectory, "articles/index.html");
  const body = renderMarkdown(article.markdown);
  const related = Object.entries(categories).map(([slug, category]) =>
    `<a class="related-link" href="${toSitePath(pageDirectory, `articles/${slug}/index.html`)}"><span>${escapeHtml(category.title.toUpperCase())}</span><strong>Explore ${escapeHtml(category.title.toLowerCase())}</strong><span>↗</span></a>`).join("");
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(article.description)}">
    <meta name="generated-article" content="true">
    <title>${escapeHtml(article.title)} — Theology</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${toSitePath(pageDirectory, "styles.css")}">
    <script src="${toSitePath(pageDirectory, "search-index.js")}" data-search-index defer></script>
    <script src="${toSitePath(pageDirectory, "script.js")}" defer></script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <a class="brand" href="${rootLink}" aria-label="Theology home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M16 7h4v8h7v4h-7v10h-4V19H9v-4h7z"/></svg></span><span class="brand-name">Theology</span></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="sr-only">Toggle navigation</span><span></span><span></span></button>
      <nav class="site-nav" id="site-nav" aria-label="Main navigation"><a href="${rootLink}">Home</a><a href="${archiveLink}" aria-current="page">Articles</a><a href="${toSitePath(pageDirectory, "library.html")}">Library</a><a href="${toSitePath(pageDirectory, "about.html")}">About</a><button class="nav-search" type="button" data-quick-search-toggle aria-expanded="false" aria-controls="quick-search-panel" aria-label="Open site search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/></svg></button><button class="saved-toggle" type="button" data-saved-toggle aria-expanded="false" aria-controls="saved-panel" aria-label="Open saved articles"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.8L6 21z"/></svg><span class="saved-count" data-saved-count hidden></span></button><button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme"><span class="theme-toggle-icon" aria-hidden="true">&#9790;</span></button></nav>
      <div class="quick-search-panel" id="quick-search-panel" data-quick-search-panel hidden role="search"><label class="quick-search-box"><span class="sr-only">Search articles and library resources</span><input type="search" data-quick-search-input placeholder="Search articles, books, authors..." autocomplete="off"><kbd>Esc</kbd></label><p class="quick-search-status" data-quick-search-status aria-live="polite">Type to search articles and library resources.</p><div class="quick-search-results" data-quick-search-results></div></div>
      <section class="quick-search-panel saved-panel" id="saved-panel" data-saved-panel hidden aria-label="Saved articles"><h2>Saved articles</h2><p class="quick-search-status" data-saved-status aria-live="polite"></p><div class="saved-article-list" data-saved-list></div></section>
    </header>
    <main id="main">
      <section class="page-hero article-page-hero">
        <nav class="article-breadcrumb" aria-label="Breadcrumb"><a href="${archiveLink}">Articles</a><span>/</span><a href="${categoryLink}">${escapeHtml(article.categoryTitle)}</a><span>/</span><span>${escapeHtml(article.title)}</span></nav>
        <p class="eyebrow"><span class="eyebrow-line"></span> ${escapeHtml(article.categoryTitle)} · ${escapeHtml(article.readTime)}</p>
        <h1>${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(article.description)}</p>
        <div class="article-byline"><div class="avatar">AW</div><div><strong>${escapeHtml(article.author)}</strong><small>${formatDate(article.date)}</small></div></div>
      </section>
      <div class="article-actions" data-article-actions><span class="article-actions-label">Enjoyed this article?</span><button class="article-action save-article-button" type="button" data-save-article aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.8L6 21z"/></svg><span data-save-label>Save for later</span></button><span class="save-confirmation" data-save-status role="status" aria-live="polite"></span><button class="article-action" type="button" data-share-article><span aria-hidden="true">↗</span> Share</button><button class="article-action" type="button" data-copy-article><span aria-hidden="true">▢</span> Copy link</button><span class="share-status" role="status" aria-live="polite"></span></div>
      <article class="reading-article-content page-content">${body}</article>
      <section class="related-section"><div class="related-inner"><p class="eyebrow">Keep exploring</p><h2>Related <em>topics.</em></h2><div class="related-links">${related}</div></div></section>
    </main>
    <footer class="site-footer"><a class="brand footer-brand" href="${rootLink}" aria-label="Theology home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M16 7h4v8h7v4h-7v10h-4V19H9v-4h7z"/></svg></span><span class="brand-name">Theology</span></a><p>For the life of the church and the good of the world.</p><div class="footer-links"><a href="${archiveLink}">Articles</a><a href="${toSitePath(pageDirectory, "library.html")}">Library</a><a href="${toSitePath(pageDirectory, "about.html")}">About</a><a href="${toSitePath(pageDirectory, "contact.html")}">Contact</a></div><div class="footer-author"><span>Anthony William - Owner &amp; author</span> <a href="${toSitePath(pageDirectory, "about.html")}">About Anthony</a></div><div class="footer-contact" aria-label="Contact Anthony William"><a class="contact-icon" href="https://wa.me/255746338311" aria-label="WhatsApp Anthony William" title="WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 11.8a8.2 8.2 0 0 1-12.1 7.1L4 20l1.2-4A8.2 8.2 0 1 1 20.2 11.8Z"/><path d="M8.2 8.1c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4 0 .7.5.9 1.3 1.7 2.3 2.2.3.2.5.2.7-.1l.8-1c.2-.2.4-.3.7-.2l1.8.9c.3.1.4.3.4.5 0 .3-.2 1.2-.8 1.7-.5.5-1.2.7-2 .6-.6-.1-1.4-.3-2.4-.8-1.2-.5-2.2-1.4-3.1-2.4-.8-.9-1.3-2-1.5-2.7-.2-.8 0-1.6.4-2.2Z"/></svg></a><a class="contact-icon" href="mailto:anthonywilliam6119@gmail.com" aria-label="Email Anthony William" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg></a></div><span class="copyright">© ${article.date.getUTCFullYear()} Theology</span></footer>
  </body>
</html>`;
  await fs.mkdir(pageDirectory, { recursive: true });
  await fs.writeFile(path.join(pageDirectory, "index.html"), html, "utf8");
}

async function main() {
  const archivePath = path.join(articlesRoot, "index.html");
  const archiveHtml = await fs.readFile(archivePath, "utf8");
  const archiveRecords = readExistingArchive(archiveHtml);
  const previousMarkdownArticles = archiveRecords.filter((article) => article.markdownSource);
  const existingArticles = archiveRecords.filter((article) => !article.markdownSource);
  const markdownArticles = [];
  for (const categorySlug of Object.keys(categories)) {
    const categoryPath = path.join(articlesRoot, categorySlug);
    const entries = await fs.readdir(categoryPath, { withFileTypes: true });
    for (const entry of entries.filter((item) => item.isFile() && item.name.endsWith(".md"))) {
      markdownArticles.push(await parseMarkdownFile(path.join(categoryPath, entry.name), categorySlug));
    }
  }

  const articlePaths = new Set();
  for (const article of [...existingArticles, ...markdownArticles]) {
    if (articlePaths.has(article.pagePath)) throw new Error(`Duplicate article route: ${article.pagePath}`);
    articlePaths.add(article.pagePath);
  }
  const articles = [...existingArticles, ...markdownArticles].sort((a, b) => b.date - a.date || a.title.localeCompare(b.title));
  const currentMarkdownPaths = new Set(markdownArticles.map((article) => path.resolve(root, article.pagePath)));
  for (const oldArticle of previousMarkdownArticles) {
    const oldPage = path.resolve(root, oldArticle.pagePath);
    if (currentMarkdownPaths.has(oldPage)) continue;
    const oldHtml = await fs.readFile(oldPage, "utf8").catch((error) => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    if (oldHtml.includes('<meta name="generated-article" content="true">')) {
      await fs.rm(oldPage);
      await fs.rmdir(path.dirname(oldPage)).catch((error) => {
        if (error.code !== "ENOENT" && error.code !== "ENOTEMPTY") throw error;
      });
    }
  }
  for (const article of markdownArticles) await buildArticlePage(article);

  let nextArchive = replaceBetweenMarkers(
    archiveHtml,
    "<!-- GENERATED_ARCHIVE_ARTICLES_START -->",
    "<!-- GENERATED_ARCHIVE_ARTICLES_END -->",
    articles.map((article, index) => archiveRow(article, index >= 5)).join("\n          "),
    "articles/index.html",
  );
  nextArchive = nextArchive.replace(/(<span class="archive-count">)\d+ ARTICLES(<\/span>)/, `$1${articles.length} ARTICLES$2`);
  await fs.writeFile(archivePath, nextArchive, "utf8");

  const homePath = path.join(root, "index.html");
  const homeHtml = await fs.readFile(homePath, "utf8");
  const homeCards = articles.slice(0, 5).map((article) => homeCard(article, root)).join("\n          ");
  await fs.writeFile(homePath, replaceBetweenMarkers(homeHtml, "<!-- GENERATED_ARTICLE_CARDS_START -->", "<!-- GENERATED_ARTICLE_CARDS_END -->", homeCards, "index.html"), "utf8");

  await updatePage(archivePath, (html) => addArchiveSidebar(html, path.dirname(archivePath)));
  for (const [categorySlug, category] of Object.entries(categories)) {
    const categoryFile = path.join(articlesRoot, categorySlug, "index.html");
    const categoryArticles = articles.filter((article) => article.categorySlug === categorySlug);
    const marker = categoryMarker(categorySlug);
    await updatePage(categoryFile, (html) => {
      let updated = replaceBetweenMarkers(
        html,
        `<!-- GENERATED_${marker}_ARTICLES_START -->`,
        `<!-- GENERATED_${marker}_ARTICLES_END -->`,
        categoryArticles.map((article) => archiveRow({ ...article, categorySlug: "", slug: article.slug }).replace(
          `href="/${article.slug}/index.html"`, `href="${article.slug}/index.html"`,
        )).join("\n          "),
        path.relative(root, categoryFile),
      );
      updated = updated.replace(/<span class="archive-count">\s*\d+\s+ARTICLES?\s*<\/span>/, `<span class="archive-count">${categoryArticles.length} ${categoryArticles.length === 1 ? "ARTICLE" : "ARTICLES"}</span>`);
      updated = addArchiveSidebar(updated, path.dirname(categoryFile));
      return updated;
    });
  }

  const searchPagePath = path.join(root, "search.html");
  const searchPage = await fs.readFile(searchPagePath, "utf8");
  const searchItems = await createSearchIndex(articles);
  const serializedSearchData = JSON.stringify(searchItems).replace(/</g, "\\u003c");
  await fs.writeFile(path.join(root, "search-index.js"), `window.THEOLOGY_SEARCH_INDEX = ${serializedSearchData};\n`, "utf8");
  const searchDataPattern = /(<script type="application\/json" id="global-search-data">)[\s\S]*?(<\/script>)/;
  if (!searchDataPattern.test(searchPage)) throw new Error("search.html: missing global search data element.");
  await fs.writeFile(searchPagePath, searchPage.replace(searchDataPattern, (_, opening, closing) => `${opening}${serializedSearchData}${closing}`), "utf8");

  const htmlFiles = [];
  async function collectHtml(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "_site" || entry.name === "node_modules") continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await collectHtml(absolute);
      else if (entry.isFile() && entry.name.endsWith(".html")) htmlFiles.push(absolute);
    }
  }
  await collectHtml(root);
  for (const file of htmlFiles) {
    const original = await fs.readFile(file, "utf8");
    const updated = socialMetadata(original, file);
    if (updated !== original) await fs.writeFile(file, updated, "utf8");
  }

  console.log(`Built ${markdownArticles.length} Markdown article(s); ${articles.length} article(s) are listed.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
