var SITE = {
    name: "Theology and Apologetics",
    whatsapp: "255703338311",
    email: "anthonywilliam8311@gmail.com"
};

var POSTS = [
    {id: 7, cat: "Theology", date: "Sep 2026", title: "Mary Mother of God", ex: "Exploring the biblical and historical foundations of the title Theotokos.", link: "articles/mary-mother-of-god.html"},
    {id:1, cat:"Apologetics", date:"Sep 2026", title:"Why Reason and Faith Belong Together", ex:"Faith is not the enemy of thinking. How Scripture invites us to reason.", link:"articles/why-reason-faith.html"},
    {id:2, cat:"Theology", date:"Sep 2026", title:"Who Is Jesus? Reading the Gospels Carefully", ex:"The person and identity of Christ through the Gospel accounts.", link:"articles/who-is-jesus.html"},
    {id:3, cat:"Scripture", date:"Aug 2026", title:"How to Study the Bible for Yourself", ex:"A simple method: observe, interpret, apply.", link:"articles/how-to-study-bible.html"},
    {id:4, cat:"Apologetics", date:"Aug 2026", title:"Answering Objections with Gentleness", ex:"Giving a reasoned answer with respect for the one who asks.", link:"articles/answering-objections.html"},
    {id:5, cat:"Islamic Dilemma", date:"Jul 2026", title:"The Islamic Dilemma: A Logical Challenge", ex:"Examining the internal consistency of Islamic claims about revelation.", link:"articles/islamic-dilemma.html"},
    {id:6, cat:"Catholicism", date:"Jun 2026", title:"Sola Scriptura vs. Catholic Tradition", ex:"Understanding the Protestant-Catholic divide on authority.", link:"articles/sola-scriptura.html"}
];

var QA = [
    {q:"Can a person be intellectually honest and still believe?", a:"Yes. Honest inquiry means following the evidence and asking hard questions, and many thoughtful people have found that faith and careful thinking go together."},
    {q:"How do I start reading the Bible?", a:"Begin with one of the Gospels, such as John or Mark, read a short passage each day, and write down what you notice."},
    {q:"What is the Islamic Dilemma?", a:"The Islamic Dilemma is a logical argument that challenges the epistemological basis for believing the Quran is from God."},
    {q:"Why do Protestants disagree with Catholic Marian doctrines?", a:"Protestants hold that Scripture alone is the final authority, and they find doctrines like the Immaculate Conception to lack clear biblical support."}
];

var RES = [
    ["Blue Letter Bible", "Word studies, interlinear texts and commentaries.", "https://www.blueletterbible.org"],
    ["Bible Gateway", "Read and compare many Bible translations.", "https://www.biblegateway.com"],
    ["Christian Classics Ethereal Library", "Free classic works from church history.", "https://ccel.org"],
    ["Ligonier Ministries", "Clear teaching on systematic theology.", "https://www.ligonier.org"],
    ["Monergism", "A large directory of resources by topic.", "https://www.monergism.com"],
    ["Reasonable Faith", "Philosophical and historical apologetics.", "https://www.reasonablefaith.org"],
    ["Answering Islam", "Resources on Christian-Muslim dialogue.", "https://www.answering-islam.org"],
    ["Catholic Answers", "Apologetics from a Catholic perspective.", "https://www.catholic.com"]
];

var app = document.getElementById("app");

function esc(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
        return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
}

function contact() {
    return '<div class="contact">' +
        '<a href="https://wa.me/' + SITE.whatsapp + '" target="_blank" rel="noopener" aria-label="WhatsApp">' +
        '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 21l1.6-4.9A9 9 0 1 1 8 19.6L3 21Z"/>' +
        '<path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-1-2L9 9.5Z"/>' +
        '</svg></a>' +
        '<a href="mailto:' + SITE.email + '" aria-label="Email">' +
        '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
        '<path d="m3 7 9 6 9-6"/>' +
        '</svg></a></div>';
}

function row(p) {
    return '<div class="row">' +
        '<div class="d">' + p.date + '</div>' +
        '<a href="' + p.link + '">' +
        '<span class="tag">' + p.cat + '</span>' +
        '<div class="t">' + p.title + '</div>' +
        '<p>' + p.ex + '</p>' +
        '</a></div>';
}

function wrap(inner) {
    return '<section><div class="w">' + inner + '</div></section>';
}

function head(t, s) {
    return '<h2 class="sec serif">' + t + '</h2><p class="sub">' + s + '</p>';
}

var cats = [];
POSTS.forEach(function(p) {
    if (cats.indexOf(p.cat) < 0) cats.push(p.cat);
});
cats.sort();

var V = {
    home: function() {
        var cards = [
            ['✎', 'Articles', 'Writing on theology, apologetics, and Scripture.', '#/articles'],
            ['?', 'Questions & Answers', 'Answers to reader questions.', '#/qa'],
            ['☰', 'Resources', 'Trusted books and websites.', '#/resources'],
            ['✉', 'Ask a Question', 'Send yours on WhatsApp.', 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent('Hello, I have a question: ')],
            ['ℹ', 'About', 'Who we are and why this site exists.', '#/about']
        ];
        var ext = function(h) { return h.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : ''; };
        
        return '<div class="hero"><div class="w">' +
            '<h1 class="serif">A thoughtful, gracious defence of the Christian faith</h1>' +
            '<p>Articles, questions and answers, and teaching that help you understand what you believe and why.</p>' +
            '<a class="btn" href="#/articles">Read Articles</a>' +
            '<a class="btn o" href="#/qa">Ask a Question</a>' +
            '</div></div>' +
            
            wrap(head("What You'll Find Here", "Start anywhere. Each section stands on its own.") +
            '<div class="grid">' +
            cards.map(function(c) {
                return '<a class="card" href="' + c[3] + '"' + ext(c[3]) + '>' +
                    '<div class="ico">' + c[0] + '</div>' +
                    '<h3 class="serif">' + c[1] + '</h3>' +
                    '<p>' + c[2] + '</p></a>';
            }).join('') +
            '</div>') +
            
            '<section style="background:var(--card)"><div class="w">' +
            head("Latest Articles", "Fresh writing, newest first.") +
            POSTS.slice(0, 5).map(row).join('') +
            '<p><a class="back" href="#/articles">All articles →</a></p>' +
            '</div></section>' +
            
            wrap('<div class="qotw"><span class="tag">Question of the Week</span>' +
            '<q>' + QA[0].q + '</q>' +
            '<p>' + QA[0].a + '</p>' +
            '<a class="btn d" href="#/qa">More questions</a></div>');
    },
    
    articles: function(c) {
        var list = c ? POSTS.filter(function(p) { return p.cat === c; }) : POSTS;
        
        return wrap(head("Articles", c ? esc(c) : "All writing") +
            '<div class="chips">' +
            '<a href="#/articles"' + (!c ? ' class="on"' : '') + '>All</a>' +
            cats.map(function(k) {
                return '<a href="#/articles/' + encodeURIComponent(k) + '"' + (k === c ? ' class="on"' : '') + '>' + k + '</a>';
            }).join('') +
            '</div>' +
            (list.length ? list.map(row).join('') : '<p>No articles in this category yet.</p>'));
    },
    
    qa: function() {
        return wrap(head("Questions & Answers", "Answers to questions from readers.") +
            QA.map(function(x) {
                return '<div class="qotw"><span class="tag">Question</span>' +
                    '<q>' + x.q + '</q>' +
                    '<p>' + x.a + '</p></div>';
            }).join('') +
            '<a class="btn d" href="https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent('Hello, I have a question: ') + '" target="_blank" rel="noopener">Send your question</a>');
    },
    
    resources: function() {
        return wrap(head("Resources", "Websites worth exploring. Read widely and test everything against Scripture.") +
            '<div class="grid">' +
            RES.map(function(r) {
                return '<a class="card" href="' + r[2] + '" target="_blank" rel="noopener">' +
                    '<h3 class="serif">' + r[0] + '</h3>' +
                    '<p>' + r[1] + '</p></a>';
            }).join('') +
            '</div>');
    },
    
    about: function() {
        return wrap(head("About", "Who we are and why this site exists.") +
            '<div class="article">' +
            '<p>' + SITE.name + ' is written by Anthony William to help readers study Scripture carefully and answer questions about the faith with truth and grace.</p>' +
            '<p>We cover topics including apologetics, systematic theology, biblical studies, and engage with other worldviews including Islam and Catholicism.</p>' +
            '<p>To get in touch, use the icons below.</p>' +
            contact() +
            '</div>');
    },
    
    notfound: function() {
        return wrap(head("Page not found", "That page does not exist.") +
            '<a class="btn d" href="#/">Go home</a>');
    }
};

function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var r = parts[0] || '';
    var arg = parts[1] ? decodeURIComponent(parts[1]) : '';
    
    var q = document.getElementById("q");
    q.value = '';
    
    document.title = SITE.name;
    
    var view;
    if (r === '') view = V.home();
    else if (r === 'articles') view = V.articles(arg);
    else if (V[r] && r !== 'notfound' && r !== 'home') view = V[r]();
    else view = V.notfound();
    
    app.innerHTML = view;
    window.scrollTo(0, 0);
    
    Array.prototype.forEach.call(document.querySelectorAll("#nav a"), function(a) {
        var k = a.getAttribute("data-r");
        a.className = (k === r) ? 'on' : '';
    });
}

function search(v) {
    v = v.toLowerCase().trim();
    if (!v) { route(); return; }
    
    var r = POSTS.filter(function(p) {
        return (p.title + ' ' + p.ex + ' ' + p.cat).toLowerCase().indexOf(v) > -1;
    });
    
    app.innerHTML = wrap(head("Search results", r.length + " found") +
        (r.length ? r.map(row).join('') : '<p>No articles match your search.</p>'));
}

document.getElementById("sb").addEventListener("click", function() {
    var s = document.getElementById("s");
    var open = s.style.display === "block";
    s.style.display = open ? "none" : "block";
    if (!open) document.getElementById("q").focus();
});

document.getElementById("q").addEventListener("input", function(e) {
    search(e.target.value);
});

document.getElementById("fc").innerHTML = contact();
document.getElementById("yr").textContent = new Date().getFullYear();

window.addEventListener("hashchange", route);
route();
