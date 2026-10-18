/* Bible & Truth: instant search (header + article sidebar) */
(function () {
  "use strict";

  var node = document.getElementById("article-search-index");
  var index = [];
  if (node) { try { index = JSON.parse(node.textContent || "[]"); } catch (_) {} }

  var inputs = Array.prototype.slice.call(document.querySelectorAll('input[type="search"]'));
  var panelCount = 0;

  var esc = function (v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var pretty = function (s) {
    return String(s || "article").replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  };
  var norm = function (s) { return String(s || "").toLowerCase().replace(/[’']/g, ""); };

  function highlight(text, terms) {
    var out = esc(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      var safe = esc(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp("(" + safe + ")", "gi"), "<mark>$1</mark>");
    });
    return out;
  }

  function search(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return { terms: terms, hits: [] };
    var hits = index.map(function (a) {
      var title = norm(a.title), cat = norm(a.category).replace(/-/g, " ");
      var body = norm(a.excerpt + " " + a.content);
      var score = 0, matched = 0;
      terms.forEach(function (t) {
        var s = 0;
        if (title.indexOf(t) > -1) s += 6;
        if (cat.indexOf(t) > -1) s += 4;
        if (body.indexOf(t) > -1) s += 1;
        if (s) matched++;
        score += s;
      });
      if (matched < terms.length) score = 0;            // every word must match
      if (a.type === "topic" && score) score += 2;      // surface category pages
      return { a: a, score: score };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (x, y) {
        return y.score - x.score || String(y.a.date || "").localeCompare(String(x.a.date || ""));
      }).slice(0, 8);
    return { terms: terms, hits: hits };
  }

  function panelFor(input) {
    var wrap = input.parentElement;
    var panel = wrap.querySelector(".live-search-results");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "live-search-results";
      panel.id = "search-results-" + (++panelCount);
      panel.setAttribute("role", "listbox");
      panel.hidden = true;
      wrap.classList.add("live-search-wrap");
      wrap.appendChild(panel);
      input.setAttribute("aria-controls", panel.id);
    }
    return panel;
  }

  function render(input, panel) {
    var q = input.value.trim();
    if (!q) { panel.hidden = true; panel.innerHTML = ""; return; }
    var r = search(q);
    if (!r.hits.length) {
      panel.innerHTML = '<div class="live-search-empty">No matches for “' + esc(q) +
        '”. Try a topic such as <b>Jesus</b>, <b>Quran</b> or <b>Church Fathers</b>.</div>';
    } else {
      panel.innerHTML = r.hits.map(function (h) {
        var a = h.a;
        return '<a class="live-search-result" role="option" href="' + esc(a.url) + '">' +
          '<span class="live-result-category">' + esc(a.type === "topic" ? "Topic · " + pretty(a.category) : pretty(a.category)) + '</span>' +
          '<span class="live-result-title">' + highlight(a.title, r.terms) + '</span>' +
          '<span class="live-result-excerpt">' + highlight(a.excerpt || "", r.terms) + '</span></a>';
      }).join("");
    }
    panel.hidden = false;
  }

  inputs.forEach(function (input) {
    var panel = panelFor(input);
    input.setAttribute("autocomplete", "off");
    input.setAttribute("aria-autocomplete", "list");
    input.addEventListener("input", function () { render(input, panel); });
    input.addEventListener("focus", function () { if (input.value.trim()) render(input, panel); });

    input.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(panel.querySelectorAll("a"));
      if (e.key === "Escape") { panel.hidden = true; input.blur(); }
      else if (e.key === "ArrowDown" && items.length && !panel.hidden) { e.preventDefault(); items[0].focus(); }
      else if (e.key === "Enter" && items.length && !panel.hidden) { e.preventDefault(); location.href = items[0].href; }
    });
    panel.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(panel.querySelectorAll("a"));
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); i > 0 ? items[i - 1].focus() : input.focus(); }
      else if (e.key === "Escape") { panel.hidden = true; input.focus(); }
    });
  });

  // Close dropdowns when clicking elsewhere
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".live-search-wrap")) {
      document.querySelectorAll(".live-search-results").forEach(function (p) { p.hidden = true; });
    }
  });

  // Forms never navigate; results appear in place
  document.querySelectorAll("form.header-search, form.search-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="search"]');
      if (input) render(input, panelFor(input));
    });
  });

  // Header search: icon only, expands when clicked
  var headerForm = document.getElementById("header-search-form");
  var headerInput = document.getElementById("header-search");
  var headerBtn = headerForm && headerForm.querySelector(".search-toggle");
  function setOpen(open) {
    if (!headerForm) return;
    headerForm.classList.toggle("open", open);
    if (headerBtn) {
      headerBtn.setAttribute("aria-expanded", String(open));
      headerBtn.setAttribute("aria-label", open ? "Search" : "Open search");
    }
    if (open && headerInput) headerInput.focus();
  }
  if (headerBtn) {
    headerBtn.addEventListener("click", function (e) {
      if (!headerForm.classList.contains("open")) { e.preventDefault(); e.stopPropagation(); setOpen(true); }
    });
  }
  if (headerInput) {
    headerInput.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }
  document.addEventListener("click", function (e) {
    if (headerForm && !e.target.closest("#header-search-form")) setOpen(false);
  });

  // Press "/" anywhere to open the header search
  document.addEventListener("keydown", function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag) && headerInput) {
      e.preventDefault(); openSearch();
    }
  });

  // Jump to the header search
  function openSearch() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setOpen(true);
  }

  // Mobile menu toggle (both layouts)
  var menuBtn = document.querySelector(".mobile-menu-toggle");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var nav = document.querySelector(".main-nav");
      var open = nav.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  // Daily verse (King James Version, public domain): one verse per calendar day
  var verses = [
    ["Jeremiah 29:11", "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end."],
    ["John 17:17", "Sanctify them through thy truth: thy word is truth."],
    ["Psalm 119:105", "Thy word is a lamp unto my feet, and a light unto my path."],
    ["1 Peter 3:15", "But sanctify the Lord God in your hearts: and be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear."],
    ["John 14:6", "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me."],
    ["Romans 8:28", "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."],
    ["Proverbs 3:5-6", "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths."],
    ["Isaiah 41:10", "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness."],
    ["Philippians 4:13", "I can do all things through Christ which strengtheneth me."],
    ["Psalm 46:1", "God is our refuge and strength, a very present help in trouble."],
    ["Matthew 11:28", "Come unto me, all ye that labour and are heavy laden, and I will give you rest."],
    ["John 8:32", "And ye shall know the truth, and the truth shall make you free."],
    ["Joshua 1:9", "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest."],
    ["Psalm 23:1", "The LORD is my shepherd; I shall not want."],
    ["Romans 5:8", "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us."],
    ["2 Timothy 3:16", "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness."],
    ["John 3:16", "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."],
    ["Ephesians 2:8", "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God."],
    ["Hebrews 11:1", "Now faith is the substance of things hoped for, the evidence of things not seen."],
    ["Psalm 27:1", "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?"],
    ["Matthew 6:33", "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you."],
    ["Psalm 119:11", "Thy word have I hid in mine heart, that I might not sin against thee."],
    ["Isaiah 40:31", "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint."],
    ["Acts 17:11", "These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so."],
    ["1 Thessalonians 5:21", "Prove all things; hold fast that which is good."],
    ["John 1:1", "In the beginning was the Word, and the Word was with God, and the Word was God."],
    ["Romans 10:17", "So then faith cometh by hearing, and hearing by the word of God."],
    ["Isaiah 26:3", "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee."],
    ["Micah 6:8", "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?"],
    ["Psalm 119:160", "Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever."]
  ];
  var verseBox = document.getElementById("daily-verse");
  if (verseBox) {
    var today = new Date();
    var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    var pick = verses[dayOfYear % verses.length];
    verseBox.textContent = "\u201C" + pick[1] + "\u201D";
    var ref = document.createElement("small");
    ref.textContent = pick[0] + " \u00B7 KJV";
    verseBox.appendChild(ref);
  }

  // Share links use the page's real address (no site URL needed in _config.yml)
  var here = encodeURIComponent(location.href);
  document.querySelectorAll("[data-share]").forEach(function (a) {
    var kind = a.getAttribute("data-share");
    a.href = kind === "facebook"
      ? "https://www.facebook.com/sharer/sharer.php?u=" + here
      : "https://twitter.com/intent/tweet?url=" + here + "&text=" + encodeURIComponent(document.title);
    a.target = "_blank";
    a.rel = "noopener";
  });
  var copyBtn = document.querySelector(".copy-link");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var btn = this;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(function () { btn.textContent = "\u2713"; }, function () { window.prompt("Copy this article link:", location.href); });
      } else { window.prompt("Copy this article link:", location.href); }
    });
  }
})();
