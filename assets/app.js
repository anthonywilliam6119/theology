/* Logos & Truth - website script
   Articles are plain Markdown files in /articles/<category>/<name>.md
   The site lists them straight from your GitHub repository, so there is nothing to build. */
(function () {
  'use strict';
  var C = window.LT || {};
  var app = document.getElementById('app'), hdr = document.getElementById('hdr'), ftr = document.getElementById('ftr');
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var titleize = function (s) { return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };
  var norm = function (s) { return String(s).trim().toLowerCase().replace(/[\s_]+/g, '-'); };
  var gcd = function (a, b) { return b ? gcd(b, a % b) : a; };

  function fmt(d, long) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
    if (!m) return d || '';
    var dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return dt.toLocaleDateString('en-GB', long ? { day: '2-digit', month: 'long', year: 'numeric' } : { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* ---------- icons ---------- */
  var I = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    moon: '<svg class="ico-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>',
    sun: '<svg class="ico-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.7 11.7 0 0 0 12.17 0C5.67 0 .38 5.28.38 11.78c0 2.08.54 4.1 1.57 5.88L.28 24l6.49-1.7a11.78 11.78 0 0 0 5.39 1.3h.01c6.5 0 11.79-5.29 11.79-11.79 0-3.14-1.22-6.1-3.46-8.31ZM12.18 21.6h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.85 1.01 1.03-3.75-.23-.39a9.82 9.82 0 1 1 8.42 4.71Zm5.39-7.36c-.29-.15-1.71-.84-1.98-.94-.27-.1-.47-.15-.67.15-.2.29-.76.94-.93 1.13-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.09 1.71-.7 1.95-1.37.24-.67.24-1.24.17-1.36-.07-.12-.27-.2-.56-.34Z"/></svg>'
  };
  var MAIL_SUBJECT = (C.siteName || 'Website') + ' enquiry';
  var MAIL_BODY = 'Hello ' + (C.author || '') + ',\n\n';
  var MAILTO = 'mailto:' + (C.email || '') + '?subject=' + encodeURIComponent(MAIL_SUBJECT) + '&body=' + encodeURIComponent(MAIL_BODY);
  var GMAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(C.email || '') + '&su=' + encodeURIComponent(MAIL_SUBJECT) + '&body=' + encodeURIComponent(MAIL_BODY);
  function contactIcons(small) {
    return '<div class="contact-icons' + (small ? ' sm' : '') + '">' +
      '<a class="wa" data-tip="WhatsApp" href="https://wa.me/' + esc(C.whatsapp || '') + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + I.wa + '</a>' +
      '<a class="em" data-tip="Email" href="' + MAILTO + '" aria-label="Email">' + I.mail + '</a></div>';
  }

  /* ---------- markdown ---------- */
  function inline(t) {
    t = esc(t);
    var safe = function (u) { return /^\s*(javascript|data|vbscript):/i.test(u) ? '#' : u; };
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, a, u) { return '<img alt="' + a + '" src="' + safe(u) + '">'; })
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, a, u) { return '<a href="' + safe(u) + '" target="_blank" rel="noopener">' + a + '</a>'; })
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>');
    return t;
  }
  function md(src) {
    var lines = src.replace(/\r\n?/g, '\n').split('\n'), out = [], para = [], i = 0;
    function flush() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    while (i < lines.length) {
      var l = lines[i], m;
      if (/^```/.test(l)) {
        flush(); var code = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); i++; continue;
      }
      if (!l.trim()) { flush(); i++; continue; }
      if ((m = /^(#{1,6})\s+(.*?)\s*#*$/.exec(l))) {
        flush(); var n = m[1].length, lv = n <= 2 ? 2 : (n === 3 ? 3 : 4);
        out.push('<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'); i++; continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { flush(); out.push('<hr>'); i++; continue; }
      if (/^>/.test(l)) {
        flush(); var q = [];
        while (i < lines.length && /^>/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>'); continue;
      }
      if (/^\s*[-*+]\s+/.test(l)) {
        flush(); var u = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { u.push('<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>'); i++; }
        out.push('<ul>' + u.join('') + '</ul>'); continue;
      }
      if (/^\s*\d+[.)]\s+/.test(l)) {
        flush(); var o = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { o.push('<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>'); i++; }
        out.push('<ol>' + o.join('') + '</ol>'); continue;
      }
      para.push(l.trim()); i++;
    }
    flush();
    return out.join('\n');
  }
  function plain(s) { return s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim(); }

  function parse(text, path) {
    var parts = path.split('/'), cat = norm(parts[1]), file = parts[2].replace(/\.md$/i, '');
    var fm = {}, body = text.replace(/^\uFEFF/, ''), m = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(\n|$)/.exec(body);
    if (m) {
      m[1].split('\n').forEach(function (ln) {
        var k = /^([A-Za-z_]+)\s*:\s*(.*)$/.exec(ln);
        if (k) fm[k[1].toLowerCase()] = k[2].trim().replace(/^["']|["']$/g, '');
      });
      body = body.slice(m[0].length);
    }
    var title = fm.title, h1 = /^\s*#\s+(.+?)\s*\n/.exec(body + '\n');
    if (h1 && (!title || plain(h1[1]).toLowerCase() === title.toLowerCase())) { title = title || plain(h1[1]); body = body.replace(/^\s*#\s+.+\n?/, ''); }
    title = title || titleize(file);
    var excerpt = fm.excerpt || fm.description;
    if (!excerpt) {
      var first = body.split(/\n\s*\n/).map(function (b) { return b.trim(); }).filter(function (b) { return b && !/^(#|>|```|[-*+]\s|\d+[.)]\s)/.test(b); })[0] || '';
      excerpt = plain(first); if (excerpt.length > 170) excerpt = excerpt.slice(0, 167).replace(/\s+\S*$/, '') + '…';
    }
    return { cat: cat, slug: file, title: title, date: fm.date || '', author: fm.author || C.author || '', excerpt: excerpt, html: md(body), path: path };
  }

  /* ---------- loading articles from the GitHub repository ---------- */
  var S = { arts: [], cats: [], loaded: false, failed: false };
  // Categories you type in config.js (shown in this order, even before they have articles)
  var manual = (C.categories || []).map(function (c) {
    c = typeof c === 'string' ? { name: c } : c;
    var id = norm(c.folder || c.name || '');
    return { id: id, name: c.name || titleize(id), description: c.description || '' };
  }).filter(function (c) { return c.id; });
  var info = {}; manual.forEach(function (c) { info[c.id] = c; });

  function repo() {
    if (C.owner && C.repo) return { o: C.owner, r: C.repo };
    var h = location.hostname;
    if (/\.github\.io$/i.test(h)) {
      var ow = h.split('.')[0], seg = location.pathname.split('/')[1] || '';
      return { o: C.owner || ow, r: C.repo || ((seg && !/\.html?$/i.test(seg)) ? seg : ow + '.github.io') };
    }
    return null;
  }
  function pickMd(list) {
    return list.filter(function (p) {
      return /^articles?\/[^\/]+\/[^\/]+\.md$/i.test(p) && !/\/readme\.md$/i.test(p) && !/\/[._][^\/]*$/.test(p);
    });
  }
  function listPaths() {
    var R = repo(), api = R ? fetch('https://api.github.com/repos/' + R.o + '/' + R.r + '/git/trees/' + (C.branch || 'HEAD') + '?recursive=1')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { return pickMd(j.tree.filter(function (t) { return t.type === 'blob'; }).map(function (t) { return t.path; })); }) : Promise.reject();
    return api.catch(function () {
      return fetch('articles.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (a) { return pickMd(a.map(function (p) { return /^articles?\//i.test(p) ? p : 'articles/' + p; })); });
    });
  }
  function getText(path) {
    var R = repo(), rel = function () { return fetch(path).then(function (r) { if (!r.ok) throw 0; return r.text(); }); };
    if (!R) return rel();
    var enc = path.split('/').map(encodeURIComponent).join('/');
    return fetch('https://raw.githubusercontent.com/' + R.o + '/' + R.r + '/' + (C.branch || 'HEAD') + '/' + enc)
      .then(function (r) { if (!r.ok) throw 0; return r.text(); }).catch(rel);
  }
  function sortA(a) {
    return a.sort(function (x, y) { return (y.date || '').localeCompare(x.date || '') || x.title.localeCompare(y.title); });
  }
  function mergeCats() {
    var map = {}, own = [], found = [];
    manual.forEach(function (m) { if (!map[m.id]) { map[m.id] = { id: m.id, name: m.name, description: m.description, count: 0 }; own.push(m.id); } });
    S.arts.forEach(function (a) {
      a.cat = norm(a.cat);
      if (!map[a.cat]) { map[a.cat] = { id: a.cat, name: titleize(a.cat), description: '', count: 0 }; found.push(a.cat); }
      map[a.cat].count++;
    });
    found.sort(function (x, y) { return map[y].count - map[x].count || map[x].name.localeCompare(map[y].name); });
    S.cats = own.concat(found).map(function (id) { return map[id]; });
  }
  function finish() { S.loaded = true; mergeCats(); chrome(); route(true); }
  function load() {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('lt:v1') || 'null'); } catch (e) { }
    if (cached && location.search.indexOf('nocache') < 0 && Date.now() - cached.t < 300000) { S.arts = cached.a; finish(); return; }
    listPaths().then(function (paths) {
      return Promise.all(paths.map(function (p) { return getText(p).then(function (t) { return parse(t, p); }).catch(function () { return null; }); }));
    }).then(function (list) {
      S.arts = sortA(list.filter(Boolean));
      try { localStorage.setItem('lt:v1', JSON.stringify({ t: Date.now(), a: S.arts })); } catch (e) { }
      finish();
    }).catch(function () { S.failed = true; finish(); });
  }

  /* ---------- toast + clipboard ---------- */
  function toast(m) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function copy(text, msg) {
    function fb() { var x = document.createElement('textarea'); x.value = text; x.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(x); x.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { } x.remove(); toast(ok ? msg : 'Copy is not available here'); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast(msg); }, fb); else fb();
  }

  /* ---------- helpers ---------- */
  function catOf(id) { var inf = info[id] || {}; return S.cats.filter(function (c) { return c.id === id; })[0] || { id: id, name: inf.name || titleize(id), description: inf.description || '', count: 0 }; }
  function chips(cur) {
    return S.cats.length ? '<div class="chips">' + S.cats.map(function (c) { return '<a class="chip' + (c.id === cur ? ' on' : '') + '" href="#/cat/' + esc(c.id) + '">' + esc(c.name) + (c.count ? '<small>' + c.count + '</small>' : '') + '</a>'; }).join('') + '</div>' : '';
  }
  function href(a) { return '#/a/' + encodeURIComponent(a.cat) + '/' + encodeURIComponent(a.slug); }
  function card(a) {
    return '<article class="card"><a class="pill" href="#/cat/' + esc(a.cat) + '">' + esc(catOf(a.cat).name) + '</a><h3><a href="' + href(a) + '">' + esc(a.title) + '</a></h3><p>' + esc(a.excerpt) + '</p>' +
      '<div class="card-foot"><span>' + fmt(a.date) + '</span><a class="more" href="' + href(a) + '">Read →</a></div></article>';
  }
  function note(h, p) { return '<div class="empty-note"><h3>' + h + '</h3><p>' + p + '</p></div>'; }
  function listHTML(list, emptyMsg) {
    if (!S.loaded) return note('Loading articles…', 'Please wait a moment.');
    if (S.failed && !S.arts.length) return note('Articles could not be loaded', 'Please check your connection and refresh the page.');
    if (list.length) return list.map(card).join('');
    return emptyMsg || note('Articles are coming soon', 'New articles will appear here. Please check back shortly.');
  }
  function hero(eyebrow, title, text) {
    return '<section class="page-hero"><div class="wrap"><div class="eyebrow">' + eyebrow + '</div><h1>' + title + '</h1>' + (text ? '<p>' + text + '</p>' : '') + '</div></section>';
  }
  function setTitle(t) { document.title = t ? t + ' · ' + (C.siteName || '') : (C.siteName || ''); }
  function matchArts(q) { q = q.trim().toLowerCase(); return S.arts.filter(function (a) { return !q || (a.title + ' ' + catOf(a.cat).name + ' ' + a.excerpt).toLowerCase().indexOf(q) > -1; }); }
  function dropdown(input, out) {
    input.addEventListener('input', function () {
      var t = input.value.trim(); if (!t) { out.classList.remove('show'); out.innerHTML = ''; return; }
      var m = matchArts(t).slice(0, 8);
      out.innerHTML = m.length ? m.map(function (a) { return '<a href="' + href(a) + '"><span class="rc">' + esc(catOf(a.cat).name) + '</span><strong>' + esc(a.title) + '</strong><small>' + esc(a.excerpt) + '</small></a>'; }).join('') : '<a>No articles found.</a>';
      out.classList.add('show');
    });
    out.addEventListener('click', function () { out.classList.remove('show'); input.value = ''; var hs = $('hs'); if (hs) hs.hidden = true; });
  }

  /* ---------- header & footer ---------- */
  function chrome() {
    var MAXN = 4, nav = '<a href="#/">Home</a><a href="#/articles">Articles</a>' + S.cats.map(function (c, i) { return '<a' + (i >= MAXN ? ' class="extra"' : '') + ' href="#/cat/' + esc(c.id) + '">' + esc(c.name) + '</a>'; }).join('') + (S.cats.length > MAXN ? '<a class="more-link" href="#/articles">More</a>' : '');
    hdr.innerHTML = '<div class="wrap nav"><a class="brand" href="#/"><span class="brand-mark">✝</span><span class="brand-text">Logos <span>&amp;</span> Truth</span></a>' +
      '<nav class="nav-links" id="nl" aria-label="Main">' + nav + '</nav><div class="nav-actions">' +
      '<button class="icon-btn" id="st" aria-label="Search articles" aria-expanded="false" title="Search">' + I.search + '</button>' +
      '<button class="icon-btn" id="tb" aria-label="Toggle light or dark theme" title="Toggle theme">' + I.moon + I.sun + '</button>' +
      '<a class="icon-btn" href="' + MAILTO + '" aria-label="Email" title="Email">' + I.mail + '</a>' +
      '<button class="icon-btn menu-btn" id="mb" aria-label="Menu" aria-expanded="false">' + I.menu + '</button></div></div>' +
      '<div class="hsearch" id="hs" hidden><div class="wrap"><div class="search"><span class="ico">' + I.search + '</span><input id="hi" type="search" placeholder="Search articles..." autocomplete="off" aria-label="Search articles"><div id="ho" class="results" aria-live="polite"></div></div></div></div>';
    ftr.innerHTML = '<div class="wrap"><div class="foot-grid">' +
      '<div><a class="brand" href="#/"><span class="brand-mark">✝</span><span class="brand-text">Logos <span>&amp;</span> Truth</span></a><p>Rigorous study for thoughtful belief — theology, apologetics, and history, prepared for real questions.</p></div>' +
      '<div><h4>Explore</h4><ul><li><a href="#/">Home</a></li><li><a href="#/articles">All articles</a></li><li><a href="#/search">Search</a></li></ul></div>' +
      '<div><h4>Categories</h4><ul>' + (S.cats.length ? S.cats.map(function (c) { return '<li><a href="#/cat/' + esc(c.id) + '">' + esc(c.name) + '</a></li>'; }).join('') : '<li>Coming soon</li>') + '</ul></div>' +
      '<div><h4>About the Author</h4><div class="author-box"><strong>' + esc(C.author || '') + '</strong><p>Owner and author of ' + esc(C.siteName || '') + ', bringing together biblical theology, historical evidence, and Christian-Muslim apologetics.</p><p><a class="more" href="#/about">Read more about the author →</a></p>' + contactIcons(true) + '</div></div>' +
      '</div><div class="foot-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(C.siteName || '') + '. All rights reserved.</span><span>Resources for thoughtful Christians</span></div></div>';
    $('tb').onclick = function () {
      var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('theme', t); } catch (e) { }
    };
    $('mb').onclick = function () { var o = $('nl').classList.toggle('open'); $('mb').setAttribute('aria-expanded', o); };
    $('nl').onclick = function () { $('nl').classList.remove('open'); };
    var hs = $('hs'), hi = $('hi'), ho = $('ho');
    $('st').onclick = function () { hs.hidden = !hs.hidden; $('st').setAttribute('aria-expanded', !hs.hidden); if (!hs.hidden) hi.focus(); else ho.classList.remove('show'); };
    dropdown(hi, ho);
  }

  /* ---------- verse of the day: new verse every 5 minutes, every day and every visit ---------- */
  var vTimer = null, visit = 0;
  try { visit = (parseInt(localStorage.getItem('lt:visits'), 10) || 0) + 1; localStorage.setItem('lt:visits', visit); } catch (e) { visit = Math.floor(Math.random() * 1000); }
  function verseHTML() {
    return '<section class="verse" id="verse" aria-label="Verse of the day"><div class="verse-frame"><button class="vbtn" id="versePrev" aria-label="Previous verse">' + I.left + '</button>' +
      '<div class="verse-center"><div class="eyebrow"><i>✠</i> Verse of the Day · KJV</div><div class="verse-body" id="verseBody" aria-live="polite"><p id="verseText"></p>' +
      '<div class="verse-ref"><span class="rule"></span><cite id="verseRef"></cite><span class="verse-tag" id="verseTag"></span><span class="rule"></span></div></div></div>' +
      '<button class="vbtn" id="verseNext" aria-label="Next verse">' + I.right + '</button></div></section>';
  }
  function initVerse() {
    var V = window.VERSES || [], box = $('verse'); if (!V.length || !box) return;
    var n = V.length, SLOT = 300000, step = 7; while (gcd(step, n) !== 1) step++;
    var offset = visit, slot = Math.floor(Date.now() / SLOT);
    function idx() { return (((slot + offset) * step) % n + n) % n; }
    function paint(i, an) {
      function set() { var v = V[i]; $('verseText').textContent = v.text; $('verseRef').textContent = v.ref; $('verseTag').textContent = v.tag; }
      if (!an) { set(); return; }
      box.classList.add('swapping'); setTimeout(function () { set(); box.classList.remove('swapping'); }, 350);
    }
    paint(idx(), false);
    $('verseNext').onclick = function () { offset++; paint(idx(), true); };
    $('versePrev').onclick = function () { offset--; paint(idx(), true); };
    vTimer = setInterval(function () { var s = Math.floor(Date.now() / SLOT); if (s !== slot) { slot = s; paint(idx(), true); } }, 15000);
  }

  /* ---------- pages ---------- */
  function homePage() {
    setTitle('');
    var t = S.arts[0];
    app.innerHTML = '<section class="hero"><div class="wrap hero-grid' + (t ? '' : ' solo') + '"><div><div class="eyebrow">Theology · Apologetics · Scholarly</div>' +
      '<h1>Theology that thinks.<br><em>Faith that defends.</em></h1><p class="lead">Rigorous study for thoughtful belief. Explore Scripture, theology, philosophy, history, and apologetics—rooted in the Christian faith and prepared for real questions.</p>' +
      '<div class="search"><span class="ico">' + I.search + '</span><input id="sb" type="search" placeholder="Search articles..." autocomplete="off" aria-label="Search articles"><kbd>⌘ K</kbd><div id="sr" class="results" aria-live="polite"></div></div></div>' +
      (t ? '<aside class="featured"><div class="tag">Featured · ' + esc(catOf(t.cat).name) + '</div><h3>' + esc(t.title) + '</h3><p>' + esc(t.excerpt) + '</p><a class="more" href="' + href(t) + '">Read article →</a></aside>' : '') +
      '</div></section>' +
      '<section class="section alt"><div class="wrap"><div class="sec-head"><div><h2>Latest articles</h2><p>New research, biblical studies, and apologetic discussions.</p></div><a class="link" href="#/articles">All articles →</a></div><div class="card-grid">' + listHTML(S.arts.slice(0, 6)) + '</div></div></section>' +
      verseHTML() +
      '<section class="section"><div class="wrap"><div class="contact-bar"><div><div class="eyebrow">Get in touch</div><h2>Have a question or topic to discuss?</h2><p>Reach ' + esc(C.author || '') + ' directly.</p></div>' + contactIcons(false) + '</div></div></section>';
    dropdown($('sb'), $('sr'));
    initVerse();
  }
  function articlesPage() {
    setTitle('Articles');
    app.innerHTML = hero('Library', 'Articles', 'Browse theology, apologetics, Islamic dilemmas, Church Fathers, and more.') +
      '<section class="section"><div class="wrap">' + chips('') + '<div class="sec-head"><div><h2>All articles</h2><p>The newest articles appear first.</p></div></div><div class="card-grid">' + listHTML(S.arts) + '</div></div></section>';
  }
  function catPage(id) {
    id = norm(id); var c = catOf(id); setTitle(c.name);
    var list = S.arts.filter(function (a) { return a.cat === id; });
    app.innerHTML = hero('Category', esc(c.name), esc(c.description || '')) +
      '<section class="section"><div class="wrap">' + chips(id) + '<div class="card-grid">' + listHTML(list, S.arts.length ? note('No articles in this category yet', 'Please check back soon, or <a href="#/articles">browse all articles</a>.') : null) + '</div></div></section>';
  }
  function aboutPage() {
    setTitle('About the Author');
    app.innerHTML = hero('About the author', esc(C.author || ''), esc(C.siteName || '') + ' is a personal theology and apologetics resource dedicated to thoughtful Christian study and reasoned defense of the faith.') +
      '<section class="section"><div class="wrap prose"><h2>About the Author</h2><p><strong>' + esc(C.author || '') + '</strong> is the owner and author of ' + esc(C.siteName || '') + '. The site brings together biblical theology, historical evidence, philosophy, Church Fathers, and Christian-Muslim apologetics in one organized library.</p><h2>Contact</h2><p>Reach out directly:</p>' + contactIcons(false) + '</div></section>';
  }
  function searchPage() {
    setTitle('Search');
    app.innerHTML = hero('Article search', 'Search articles', 'Search across every article by title, category, or description.') +
      '<section class="section"><div class="wrap"><div class="search" style="max-width:720px;margin-bottom:32px"><span class="ico">' + I.search + '</span><input id="fs" type="search" placeholder="Search articles..." style="border-color:var(--line)" aria-label="Search articles"></div><div id="fr" class="card-grid"></div></div></section>';
    var i = $('fs'), o = $('fr');
    function run() { var m = matchArts(i.value); o.innerHTML = m.length ? m.map(card).join('') : (S.loaded ? note('No articles found', 'Try a different word.') : note('Loading articles…', 'Please wait a moment.')); }
    i.addEventListener('input', run); run();
  }

  function readerTools() {
    return '<div class="reader-tools" id="readerTools" role="toolbar" aria-label="Reading tools"><div class="rt-inner">' +
      '<button class="rt-btn" data-act="copy" title="Copy article text" aria-label="Copy article">' + I.copy + '<span>Copy</span></button>' +
      '<div class="rt-share"><button class="rt-btn" data-act="share" aria-expanded="false" aria-haspopup="true" title="Share this article" aria-label="Share">' + I.share + '<span>Share</span></button>' +
      '<div class="share-menu" id="shareMenu" hidden><button data-act="native" hidden>Share via device…</button>' +
      '<a data-net="wa" target="_blank" rel="noopener">WhatsApp</a><a data-net="tg" target="_blank" rel="noopener">Telegram</a><a data-net="fb" target="_blank" rel="noopener">Facebook</a><a data-net="x" target="_blank" rel="noopener">X (Twitter)</a><a data-net="mail" target="_blank" rel="noopener">Email (Gmail)</a><a data-net="mailto">Email (mail app)</a><button data-act="copylink">Copy link</button></div></div>' +
      '<span class="rt-sep" aria-hidden="true"></span>' +
      '<button class="rt-btn" data-act="smaller" title="Minimize text" aria-label="Minimize text"><b class="aa">A<small>−</small></b><span>Minimize</span></button>' +
      '<button class="rt-btn" data-act="larger" title="Maximize text" aria-label="Maximize text"><b class="aa">A<small>+</small></b><span>Maximize</span></button>' +
      '<span class="rt-size" id="rtSize" aria-live="polite">100%</span></div></div>';
  }
  function relatedList(a) {
    var same = S.arts.filter(function (x) { return x.path !== a.path && x.cat === a.cat; }), rest = S.arts.filter(function (x) { return x.path !== a.path; }), seen = {}, out = [];
    same.concat(rest).forEach(function (x) { if (!seen[x.path] && out.length < 3) { seen[x.path] = 1; out.push(x); } });
    return out;
  }
  /* slim bar fixed to the bottom of the screen while reading */
  function relatedBar(a) {
    var items = '<a class="chip on" href="#/cat/' + esc(a.cat) + '">' + esc(catOf(a.cat).name) + '</a>' +
      relatedList(a).map(function (x) { return '<a class="chip art" href="' + href(x) + '" title="' + esc(x.title) + '">' + esc(x.title) + '</a>'; }).join('') +
      S.cats.filter(function (c) { return c.id !== a.cat; }).slice(0, 5).map(function (c) { return '<a class="chip" href="#/cat/' + esc(c.id) + '">' + esc(c.name) + '</a>'; }).join('') +
      '<a class="chip" href="#/articles">All articles →</a>';
    return '<div class="rbar" id="rbar" role="complementary" aria-label="Related topics"><div class="rbar-in"><span class="rbar-label">Related topics</span><div class="rbar-scroll">' + items + '</div>' +
      '<button class="rbar-x" id="rbarX" aria-label="Hide related topics bar" title="Hide">' + I.down + '</button></div></div>' +
      '<button class="rbar-tab" id="rbarTab" aria-label="Show related topics" hidden>Related topics ' + I.up + '</button>';
  }
  var rbObs = null;
  function initRBar() {
    var bar = $('rbar'), tab = $('rbarTab'), rel = document.querySelector('.related'); if (!bar) return;
    var min = false, atEnd = false;
    try { min = sessionStorage.getItem('lt:rb') === '1'; } catch (e) { }
    function paint() { bar.classList.toggle('off', min || atEnd); tab.hidden = !(min && !atEnd); document.body.classList.toggle('has-rbar', !(min || atEnd)); }
    $('rbarX').onclick = function () { min = true; try { sessionStorage.setItem('lt:rb', '1'); } catch (e) { } paint(); };
    tab.onclick = function () { min = false; try { sessionStorage.removeItem('lt:rb'); } catch (e) { } paint(); };
    if ('IntersectionObserver' in window) {
      var vis = { rel: false, ftr: false }, ft = $('ftr');   /* hide the bar once the end-of-article section or the footer is on screen */
      rbObs = new IntersectionObserver(function (en) {
        en.forEach(function (e) { vis[e.target === rel ? 'rel' : 'ftr'] = e.isIntersecting; });
        atEnd = vis.rel || vis.ftr; paint();
      });
      if (rel) rbObs.observe(rel);
      if (ft) rbObs.observe(ft);
    }
    paint();
  }
  function related(a) {
    var same = S.arts.filter(function (x) { return x.path !== a.path && x.cat === a.cat; }), rest = S.arts.filter(function (x) { return x.path !== a.path; }), seen = {}, out = [];
    same.concat(rest).forEach(function (x) { if (!seen[x.path] && out.length < 3) { seen[x.path] = 1; out.push(x); } });
    return '<section class="section alt related" aria-labelledby="relatedTitle"><div class="wrap"><div class="sec-head"><div><h2 id="relatedTitle">Related topics</h2><p>Continue your study with more articles and topics.</p></div><a class="link" href="#/articles">All articles →</a></div>' + chips(a.cat) +
      '<div class="card-grid">' + (out.length ? out.map(card).join('') : note('More related articles are coming soon', 'Please check back shortly, or <a href="#/articles">browse all articles</a>.')) + '</div></div></section>';
  }
  function articlePage(cat, slug) {
    var a = S.arts.filter(function (x) { return x.cat === cat && x.slug === slug; })[0];
    if (!a) {
      setTitle('Article');
      app.innerHTML = hero('Article', S.loaded ? 'Article not found' : 'Loading…', '') + '<section class="section"><div class="wrap">' + (S.loaded ? note('We could not find that article', '<a href="#/articles">Browse all articles</a>') : note('Loading article…', 'Please wait a moment.')) + '</div></section>';
      return;
    }
    setTitle(a.title);
    app.innerHTML = '<article><header class="article-head"><a class="pill" href="#/cat/' + esc(a.cat) + '">' + esc(catOf(a.cat).name) + '</a><h1>' + esc(a.title) + '</h1><div class="meta">By ' + esc(a.author) + (a.date ? ' · ' + fmt(a.date, true) : '') + '</div></header>' +
      readerTools() + '<div class="article-body">' + a.html + '</div>' +
      '<div class="article-contact"><h3>Have a question about this article?</h3><p>Reach out directly.</p>' + contactIcons(false) + '</div></article>' + related(a) + relatedBar(a);
    initReader(a); initRBar();
  }

  /* ---------- reading tools: copy, share, text size ---------- */
  function initReader(a) {
    var bar = $('readerTools'); if (!bar) return;
    var body = document.querySelector('.article-body'), root = document.documentElement;
    var steps = [0.8, 0.9, 1, 1.15, 1.3, 1.5], i = 2;
    try { var s = parseInt(localStorage.getItem('readStep'), 10); if (s >= 0 && s < steps.length) i = s; } catch (e) { }
    var label = $('rtSize'), menu = $('shareMenu'), shareBtn = bar.querySelector('[data-act=share]'), title = a.title;
    function apply() {
      root.style.setProperty('--read-scale', steps[i]); label.textContent = Math.round(steps[i] * 100) + '%';
      try { localStorage.setItem('readStep', i); } catch (e) { }
      bar.querySelector('[data-act=smaller]').disabled = i === 0; bar.querySelector('[data-act=larger]').disabled = i === steps.length - 1;
    }
    function enc(x) { return encodeURIComponent(x); }
    function setLinks() {
      var u = location.href, q = function (n) { return menu.querySelector('[data-net=' + n + ']'); };
      q('wa').href = 'https://wa.me/?text=' + enc(title + ' — ' + u);
      q('tg').href = 'https://t.me/share/url?url=' + enc(u) + '&text=' + enc(title);
      q('fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + enc(u);
      q('x').href = 'https://twitter.com/intent/tweet?text=' + enc(title) + '&url=' + enc(u);
      q('mail').href = 'https://mail.google.com/mail/?view=cm&fs=1&su=' + enc(title) + '&body=' + enc(title + '\n' + u);
      q('mailto').href = 'mailto:?subject=' + enc(title) + '&body=' + enc(title + '\n' + u);
    }
    function toggle(o) { menu.hidden = !o; shareBtn.setAttribute('aria-expanded', o); if (o) setLinks(); }
    if (navigator.share) menu.querySelector('[data-act=native]').hidden = false;
    bar.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b || b.disabled) return; var act = b.getAttribute('data-act');
      if (act === 'copy') copy(title + '\n' + (document.querySelector('.article-head .meta') || {}).textContent + '\n\n' + body.innerText.trim() + '\n\nRead online: ' + location.href, 'Article copied to clipboard');
      else if (act === 'copylink') { copy(location.href, 'Link copied'); toggle(false); }
      else if (act === 'native') { try { navigator.share({ title: title, text: title, url: location.href }).catch(function () { }); } catch (x) { } toggle(false); }
      else if (act === 'share') toggle(menu.hidden);
      else if (act === 'smaller' && i > 0) { i--; apply(); }
      else if (act === 'larger' && i < steps.length - 1) { i++; apply(); }
    };
    menu.addEventListener('click', function (e) { if (e.target.closest('[data-net]')) toggle(false); });
    apply();
  }
  document.addEventListener('click', function (e) {
    var m = $('shareMenu'); if (m && !m.hidden && !e.target.closest('.rt-share')) m.hidden = true;
    if (!e.target.closest('.search') && !e.target.closest('#st')) document.querySelectorAll('.results').forEach(function (r) { r.classList.remove('show'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var m = $('shareMenu'); if (m) m.hidden = true; var hs = $('hs'); if (hs) hs.hidden = true; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); var b = $('sb'); if (b) b.focus(); else { var h = $('hs'); if (h) { h.hidden = false; $('hi').focus(); } } }
  });

  /* ---------- email: the icon is a plain mailto: link, so one click opens the visitor's mail app/inbox ---------- */
  /* Email works exactly like the WhatsApp icon: a plain link that opens the visitor's mail app with a new message ready. */
  function closeMail() {}

  /* ---------- router ---------- */
  function route(keepScroll) {
    clearInterval(vTimer); closeMail();
    if (rbObs) { rbObs.disconnect(); rbObs = null; }
    document.body.classList.remove('has-rbar');
    var hsp = $('hs'); if (hsp) hsp.hidden = true;
    var h = location.hash.replace(/^#\/?/, '').split('/'), r = h[0], d = function (x) { try { return decodeURIComponent(x || ''); } catch (e) { return x || ''; } };
    if (r === 'articles') articlesPage();
    else if (r === 'cat') catPage(d(h[1]));
    else if (r === 'a') articlePage(d(h[1]), d(h[2]));
    else if (r === 'about') aboutPage();
    else if (r === 'search') searchPage();
    else homePage();
    if (keepScroll !== true) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { route(); });

  mergeCats(); chrome(); route(); load();
})();
