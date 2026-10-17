const articleCards = [...document.querySelectorAll(".article-card")];
const filterButtons = [...document.querySelectorAll(".filter-chip")];
const emptyArticles = document.querySelector(".empty-state");
const librarySearch = document.querySelector("#library-search");
const libraryFilters = [...document.querySelectorAll(".library-filter")];
const libraryItems = [...document.querySelectorAll(".library-entry")];
let activeFilter = "all";
let activeLibraryFilter = "all";
const siteSearchIndex = window.THEOLOGY_SEARCH_INDEX;

function matchingSearchItems(query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length || !Array.isArray(siteSearchIndex)) return [];
  return siteSearchIndex.map((item) => {
    const title = String(item.title || "").toLowerCase();
    const haystack = `${title} ${item.description || ""} ${item.content || ""} ${item.category || ""} ${item.author || ""}`.toLowerCase();
    const matchedTerms = terms.filter((term) => haystack.includes(term)).length;
    const score = matchedTerms * 10 +
      (title.startsWith(query.trim().toLowerCase()) ? 15 : title.includes(query.trim().toLowerCase()) ? 10 : 0);
    return { item, score, matchedTerms };
  }).filter((result) => result.matchedTerms === terms.length)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map(({ item }) => item);
}

const savedArticleStorageKey = "theology-saved-articles";
const savedToggle = document.querySelector("[data-saved-toggle]");
const savedPanel = document.querySelector("[data-saved-panel]");
const savedList = document.querySelector("[data-saved-list]");
const savedStatus = document.querySelector("[data-saved-status]");
const savedCount = document.querySelector("[data-saved-count]");
const articleSaveButton = document.querySelector("[data-save-article]");
const articleSaveStatus = document.querySelector("[data-save-status]");
let savedArticleUrls = [];
let savedArticleStorageAvailable = true;

function readSavedArticleUrls() {
  try {
    const stored = localStorage.getItem(savedArticleStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.some((url) => typeof url !== "string")) {
      throw new TypeError("Saved articles data must be a list of URLs.");
    }
    return parsed;
  } catch (error) {
    if (error.name === "SecurityError") {
      savedArticleStorageAvailable = false;
      return [];
    }
    throw error;
  }
}

function updateSavedArticleControls() {
  if (savedCount) {
    savedCount.textContent = String(savedArticleUrls.length);
    savedCount.hidden = savedArticleUrls.length === 0;
  }
  if (articleSaveButton) {
    const saved = savedArticleUrls.includes(articleSaveButton.dataset.articleUrl);
    articleSaveButton.setAttribute("aria-pressed", String(saved));
    articleSaveButton.setAttribute("aria-label", saved ? "Remove article from saved reading list" : "Save article to reading list");
    articleSaveButton.title = saved ? "Remove from saved articles" : "Save for later";
    const label = articleSaveButton.querySelector("[data-save-label]");
    if (label) label.textContent = saved ? "Saved" : "Save for later";
  }
  if (savedToggle) {
    savedToggle.setAttribute("aria-label", savedToggle.getAttribute("aria-expanded") === "true" ? "Close saved articles" : "Open saved articles");
  }
}

function renderSavedArticles() {
  if (!savedList || !savedStatus) return;
  savedList.replaceChildren();
  if (!savedArticleStorageAvailable) {
    savedStatus.textContent = "Your browser doesn't allow saving articles on this device.";
    return;
  }
  const articles = Array.isArray(siteSearchIndex)
    ? siteSearchIndex.filter((item) => item.type === "Article" && savedArticleUrls.includes(new URL(item.url, document.querySelector("script[data-search-index]").src).href))
    : [];
  articles.forEach((item) => {
    const row = document.createElement("div");
    row.className = "saved-article-row";
    const link = document.createElement("a");
    link.className = "saved-article-link";
    link.href = new URL(item.url, document.querySelector("script[data-search-index]").src).href;
    link.textContent = item.title;
    const remove = document.createElement("button");
    remove.className = "saved-article-remove";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${item.title} from saved articles`);
    remove.addEventListener("click", () => {
      const previousUrls = savedArticleUrls;
      savedArticleUrls = savedArticleUrls.filter((url) => url !== link.href);
      if (!persistSavedArticles()) {
        savedArticleUrls = previousUrls;
        updateSavedArticleControls();
      }
    });
    row.append(link, remove);
    savedList.append(row);
  });
  savedStatus.textContent = articles.length
    ? `${articles.length} ${articles.length === 1 ? "article" : "articles"} saved on this device.`
    : "No saved articles yet. Use “Save for later” while reading an article.";
  updateSavedArticleControls();
}

function persistSavedArticles() {
  try {
    localStorage.setItem(savedArticleStorageKey, JSON.stringify(savedArticleUrls));
  } catch (error) {
    if (error.name === "SecurityError" || error.name === "QuotaExceededError") {
      savedArticleStorageAvailable = false;
      if (savedStatus) savedStatus.textContent = "Couldn't save your list in this browser. Check its storage settings and try again.";
      console.error("Could not store the saved reading list.", error);
      return false;
    }
    throw error;
  }
  renderSavedArticles();
  return true;
}

savedArticleUrls = readSavedArticleUrls();
if (articleSaveButton) {
  const currentArticleUrl = new URL(window.location.href);
  currentArticleUrl.hash = "";
  currentArticleUrl.search = "";
  articleSaveButton.dataset.articleUrl = currentArticleUrl.href;
  articleSaveButton.addEventListener("click", () => {
    const previousUrls = savedArticleUrls;
    const articleUrl = articleSaveButton.dataset.articleUrl;
    savedArticleUrls = savedArticleUrls.includes(articleUrl)
      ? savedArticleUrls.filter((url) => url !== articleUrl)
      : [...savedArticleUrls, articleUrl];
    if (!persistSavedArticles()) {
      savedArticleUrls = previousUrls;
      updateSavedArticleControls();
      if (articleSaveStatus) {
        articleSaveStatus.dataset.state = "error";
        articleSaveStatus.textContent = "Couldn't save this article. Check your browser's storage settings and try again.";
      }
    } else if (articleSaveStatus) {
      articleSaveStatus.dataset.state = "success";
      articleSaveStatus.textContent = savedArticleUrls.includes(articleUrl)
        ? "Article saved to your reading list on this device."
        : "Article removed from your saved reading list.";
    }
  });
}

if (savedToggle && savedPanel) {
  const closeSavedPanel = () => {
    savedPanel.hidden = true;
    savedToggle.setAttribute("aria-expanded", "false");
    savedToggle.setAttribute("aria-label", "Open saved articles");
  };
  savedToggle.addEventListener("click", () => {
    const opening = savedPanel.hidden;
    if (opening && quickSearchPanel) {
      quickSearchPanel.hidden = true;
      quickSearchToggle?.setAttribute("aria-expanded", "false");
      quickSearchToggle?.setAttribute("aria-label", "Open site search");
    }
    savedPanel.hidden = !opening;
    savedToggle.setAttribute("aria-expanded", String(opening));
    savedToggle.setAttribute("aria-label", opening ? "Close saved articles" : "Open saved articles");
    if (opening) renderSavedArticles();
  });
  savedPanel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSavedPanel();
      savedToggle.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !savedPanel.hidden) {
      event.preventDefault();
      closeSavedPanel();
      savedToggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!savedPanel.hidden && !savedPanel.contains(event.target) && !savedToggle.contains(event.target)) {
      closeSavedPanel();
    }
  });
}
renderSavedArticles();

function renderQuickSearchResults(query, resultsElement, statusElement) {
  if (!Array.isArray(siteSearchIndex)) {
    const message = "Search data is unavailable. Rebuild the site with node scripts/build-articles.js.";
    statusElement.textContent = message;
    console.error(message);
    return;
  }
  const matches = matchingSearchItems(query).slice(0, 7);
  resultsElement.replaceChildren();
  matches.forEach((item) => {
    const link = document.createElement("a");
    link.className = "quick-search-result";
    link.href = new URL(item.url, document.querySelector("script[data-search-index]").src).href;
    const meta = document.createElement("span");
    meta.className = "article-meta";
    meta.textContent = `${item.category} · ${item.type}`;
    const title = document.createElement("strong");
    title.textContent = item.title;
    const description = document.createElement("span");
    description.textContent = item.description;
    link.append(meta, title, description);
    resultsElement.append(link);
  });
  statusElement.textContent = matches.length
    ? `${matches.length} ${matches.length === 1 ? "match" : "matches"}${matchingSearchItems(query).length > matches.length ? " (showing the first 7)" : ""}`
    : "No matches found. Try another search.";
}

function updateResults() {
  let visibleArticles = 0;

  articleCards.forEach((card) => {
    const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
    card.hidden = !matchesFilter;
    if (matchesFilter) visibleArticles += 1;
  });

  if (emptyArticles) emptyArticles.hidden = visibleArticles > 0;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle("is-active", selected);
      filter.setAttribute("aria-pressed", String(selected));
    });
    updateResults();
  });
});

const quickSearchToggle = document.querySelector("[data-quick-search-toggle]");
const quickSearchPanel = document.querySelector("[data-quick-search-panel]");
const quickSearchInput = document.querySelector("[data-quick-search-input]");
if (quickSearchToggle && quickSearchPanel && quickSearchInput) {
  const closeQuickSearch = () => {
    quickSearchPanel.hidden = true;
    quickSearchToggle.setAttribute("aria-expanded", "false");
    quickSearchToggle.setAttribute("aria-label", "Open site search");
  };
  quickSearchToggle.addEventListener("click", () => {
    const opening = quickSearchPanel.hidden;
    if (opening && savedPanel) {
      savedPanel.hidden = true;
      savedToggle?.setAttribute("aria-expanded", "false");
      savedToggle?.setAttribute("aria-label", "Open saved articles");
    }
    quickSearchPanel.hidden = !opening;
    quickSearchToggle.setAttribute("aria-expanded", String(opening));
    quickSearchToggle.setAttribute("aria-label", opening ? "Close site search" : "Open site search");
    if (opening) quickSearchInput.focus();
  });
  quickSearchInput.addEventListener("input", () => {
    const status = quickSearchPanel.querySelector("[data-quick-search-status]");
    const results = quickSearchPanel.querySelector("[data-quick-search-results]");
    if (quickSearchInput.value.trim()) renderQuickSearchResults(quickSearchInput.value, results, status);
    else {
      results.replaceChildren();
      status.textContent = "Type to search articles and library resources.";
    }
  });
  quickSearchPanel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeQuickSearch();
      quickSearchToggle.focus();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !quickSearchPanel.hidden) {
      event.preventDefault();
      closeQuickSearch();
      quickSearchToggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!quickSearchPanel.hidden && !quickSearchPanel.contains(event.target) && !quickSearchToggle.contains(event.target)) {
      closeQuickSearch();
    }
  });
}

const globalSearchForm = document.querySelector("[data-global-search-form]");
if (globalSearchForm) {
  const globalSearchInput = globalSearchForm.querySelector("input[name='q']");
  const resultsContainer = document.querySelector("[data-global-search-results]");
  const searchCount = document.querySelector("[data-global-search-count]");
  const noSearchResults = document.querySelector("[data-global-search-empty]");
  const searchDataElement = document.querySelector("#global-search-data");
  let searchIndex = [];
  try {
    searchIndex = JSON.parse(searchDataElement.textContent || "[]");
    if (!Array.isArray(searchIndex)) throw new TypeError("Search index must be a list.");
  } catch (error) {
    throw new Error(`Could not read the site search index: ${error.message}`);
  }

  const renderGlobalResults = () => {
    const query = globalSearchInput.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const matches = terms.length ? searchIndex.map((item) => {
      const title = String(item.title || "").toLowerCase();
      const body = `${item.description || ""} ${item.content || ""} ${item.category || ""} ${item.author || ""}`.toLowerCase();
      const haystack = `${title} ${body}`;
      const matchedTerms = terms.filter((term) => haystack.includes(term)).length;
      const score = matchedTerms === 0 ? 0 : matchedTerms * 10 +
        (title.startsWith(query) ? 15 : title.includes(query) ? 10 : 0) +
        (String(item.category || "").toLowerCase().includes(query) ? 5 : 0);
      return { item, score, matchedTerms };
    }).filter((result) => result.matchedTerms === terms.length)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .map((result) => result.item) : [];

    resultsContainer.replaceChildren();
    matches.forEach((item) => {
      const link = document.createElement("a");
      link.className = "global-search-result";
      link.href = item.url;
      const meta = document.createElement("span");
      meta.className = "article-meta";
      meta.textContent = `${item.category} · ${item.type}`;
      const title = document.createElement("strong");
      title.textContent = item.title;
      const description = document.createElement("span");
      description.textContent = item.description;
      link.append(meta, title, description);
      resultsContainer.append(link);
    });
    searchCount.textContent = terms.length
      ? `${matches.length} ${matches.length === 1 ? "result" : "results"} for “${globalSearchInput.value.trim()}”`
      : "Enter a word or phrase to search.";
    noSearchResults.hidden = !terms.length || matches.length > 0;
  };

  globalSearchInput.value = new URLSearchParams(window.location.search).get("q") || "";
  globalSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (globalSearchInput.value.trim()) params.set("q", globalSearchInput.value.trim());
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
    renderGlobalResults();
  });
  globalSearchInput.addEventListener("input", renderGlobalResults);
  renderGlobalResults();
}

const readingArticle = document.querySelector(".reading-article-content");
if (readingArticle) {
  const headingElements = [...readingArticle.querySelectorAll("h2, h3")];
  const usedIds = new Set();
  const tocDetails = document.createElement("details");
  tocDetails.className = "article-toc";
  tocDetails.open = true;
  const tocSummary = document.createElement("summary");
  tocSummary.textContent = "In this article";
  const tocList = document.createElement("ul");
  headingElements.forEach((heading, index) => {
    const baseId = heading.id || heading.textContent.trim().toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || `section-${index + 1}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
    usedIds.add(id);
    heading.id = id;
    const item = document.createElement("li");
    if (heading.tagName === "H3") item.className = "article-toc-subsection";
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = heading.textContent;
    item.append(link);
    tocList.append(item);
  });
  if (headingElements.length > 1) {
    tocDetails.append(tocSummary, tocList);
    readingArticle.prepend(tocDetails);
  }

  const progress = document.createElement("div");
  progress.className = "reading-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Article reading progress");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  progress.setAttribute("aria-valuenow", "0");
  const progressFill = document.createElement("span");
  progress.append(progressFill);
  document.body.prepend(progress);
  let progressFrame = 0;
  const updateReadingProgress = () => {
    progressFrame = 0;
    const articleTop = readingArticle.getBoundingClientRect().top + window.scrollY;
    const articleHeight = readingArticle.offsetHeight;
    const articleProgress = window.scrollY + window.innerHeight * 0.35 - articleTop;
    const percentage = articleHeight > 0
      ? Math.min(100, Math.max(0, Math.round((articleProgress / articleHeight) * 100)))
      : 100;
    progress.setAttribute("aria-valuenow", String(percentage));
    progressFill.style.transform = `scaleX(${percentage / 100})`;
  };
  const scheduleProgressUpdate = () => {
    if (!progressFrame) progressFrame = window.requestAnimationFrame(updateReadingProgress);
  };
  window.addEventListener("scroll", scheduleProgressUpdate, { passive: true });
  window.addEventListener("resize", scheduleProgressUpdate);
  updateReadingProgress();
}

const articlePagination = document.querySelector("[data-article-pagination]");
const archiveArticles = [...document.querySelectorAll("[data-archive-article]")];
if (articlePagination && archiveArticles.length) {
  const pageSize = Number(articlePagination.dataset.pageSize) || 5;
  const moreButton = articlePagination.querySelector("[data-more-articles]");
  const collapseButton = articlePagination.querySelector("[data-collapse-articles]");
  let visibleCount = Math.min(pageSize, archiveArticles.length);

  const updateArchiveVisibility = () => {
    archiveArticles.forEach((article, index) => {
      article.hidden = index >= visibleCount;
    });
    moreButton.hidden = visibleCount >= archiveArticles.length;
    collapseButton.hidden = visibleCount <= pageSize;
  };

  moreButton.addEventListener("click", () => {
    visibleCount = Math.min(visibleCount + pageSize, archiveArticles.length);
    updateArchiveVisibility();
  });
  collapseButton.addEventListener("click", () => {
    visibleCount = pageSize;
    updateArchiveVisibility();
  });
  updateArchiveVisibility();
}

function updateLibrary() {
  const query = librarySearch.value.trim().toLowerCase();
  let visibleCount = 0;
  libraryItems.forEach((item) => {
    const matchesCategory = activeLibraryFilter === "all" || item.dataset.category === activeLibraryFilter;
    const matchesQuery = !query || `${item.dataset.search} ${item.textContent}`.toLowerCase().includes(query);
    item.hidden = !(matchesCategory && matchesQuery);
    if (!item.hidden) visibleCount += 1;
  });
  document.querySelector("#library-result-count").textContent = `${visibleCount} ${visibleCount === 1 ? "resource" : "resources"}`;
  document.querySelector(".library-no-results").hidden = visibleCount > 0;
}

if (librarySearch) {
  librarySearch.addEventListener("input", updateLibrary);
  libraryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      activeLibraryFilter = button.dataset.filter;
      libraryFilters.forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle("is-active", selected);
        filter.setAttribute("aria-pressed", String(selected));
      });
      updateLibrary();
    });
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeIcon = themeToggle?.querySelector(".theme-toggle-icon");
const themePreferenceKey = "theology-color-theme";

function setTheme(theme, savePreference = false) {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    const nextTheme = theme === "dark" ? "light" : "dark";
    themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    if (themeIcon) themeIcon.textContent = theme === "dark" ? "\u2600" : "\u263E";
  }
  if (savePreference) {
    try {
      localStorage.setItem(themePreferenceKey, theme);
    } catch (error) {
      if (error.name !== "SecurityError" && error.name !== "QuotaExceededError") throw error;
    }
  }
}

if (themeToggle) {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(themePreferenceKey);
  } catch (error) {
    if (error.name !== "SecurityError") throw error;
  }
  const preferredTheme = savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(preferredTheme);
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
  });
}

if (menuToggle && siteNav) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
  };
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteNav.classList.toggle("is-open", !isExpanded);
  });
  menuToggle.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !event.defaultPrevented && menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuToggle.focus();
    }
  });
}

const dailyVerseText = document.querySelector("[data-daily-verse-text]");
const dailyVerseReference = document.querySelector("[data-daily-verse-reference]");
if (dailyVerseText && dailyVerseReference) {
  const dailyVerses = [
    ["Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.", "Psalm 46:10"],
    ["The LORD is my shepherd; I shall not want.", "Psalm 23:1"],
    ["Come unto me, all ye that labour and are heavy laden, and I will give you rest.", "Matthew 11:28"],
    ["Rejoicing in hope; patient in tribulation; continuing instant in prayer;", "Romans 12:12"],
    ["And the light shineth in darkness; and the darkness comprehended it not.", "John 1:5"],
    ["But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.", "Isaiah 40:31"],
    ["He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", "Micah 6:8"],
  ];
  const today = new Date();
  const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
  const [verse, reference] = dailyVerses[dayNumber % dailyVerses.length];
  dailyVerseText.textContent = verse;
  dailyVerseReference.textContent = `${reference} · King James Version`;
}

if (siteNav && menuToggle) siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
  });
});

async function copyCurrentArticleLink() {
  const fallbackCopy = () => {
    const input = document.createElement("textarea");
    input.value = window.location.href;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("The browser did not copy the article link.");
  };

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(window.location.href);
    return;
  }
  fallbackCopy();
}

document.querySelectorAll("[data-article-actions]").forEach((actions) => {
  const status = actions.querySelector(".share-status");
  const articleTitle = document.querySelector(".article-page-hero h1").innerText.replace(/\s+/g, " ").trim();

  actions.querySelector("[data-copy-article]").addEventListener("click", async () => {
    try {
      await copyCurrentArticleLink();
      status.textContent = "Article link copied.";
    } catch (error) {
      status.textContent = "Couldn't copy the link. Please copy it from your browser's address bar.";
    }
  });

  actions.querySelector("[data-share-article]").addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: articleTitle, url: window.location.href });
        status.textContent = "Thanks for sharing.";
      } catch (error) {
        if (error.name !== "AbortError") status.textContent = "Couldn't open the share menu. You can copy the article link instead.";
      }
      return;
    }

    try {
      await copyCurrentArticleLink();
      status.textContent = "Sharing isn't available here, so the article link was copied.";
    } catch (error) {
      status.textContent = "Sharing isn't available here. Please copy the link from your browser's address bar.";
    }
  });
});
