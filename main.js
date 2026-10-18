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
})();
