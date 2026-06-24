/* =========================================================
   Dania Awin — site script
   Loads content + articles from JSON, renders pages,
   handles language toggle.
   ========================================================= */

(function () {
  "use strict";

  // Veiligheid: oude service workers van Decap/Netlify Identity opruimen,
  // zodat ze niet ergens nog oude versies van pagina's vasthouden.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      for (var r of regs) { r.unregister(); }
    }).catch(function(){});
  }

  const DEFAULT_LANG = "en";

  // Globals that the render functions use
  let content = null;
  let articles = [];

  /* ---------- Language ---------- */

  function getLang() {
    // Engels is de standaard voor iedereen. Alleen als iemand zelf op de NL/EN-knop
    // klikt, wordt die voorkeur opgeslagen. Browser-taal-detectie staat bewust uit.
    try {
      const saved = localStorage.getItem("daw-lang");
      if (saved === "nl" || saved === "en") return saved;
    } catch (e) {}
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    document.body.classList.toggle("lang-nl", lang === "nl");
    document.body.classList.toggle("lang-en", lang === "en");
    document.documentElement.lang = lang;
    try { localStorage.setItem("daw-lang", lang); } catch (e) {}

    const toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.querySelectorAll("span[data-lang]").forEach(s => {
        s.classList.toggle("is-active", s.dataset.lang === lang);
      });
    }
  }

  function initLangToggle() {
    setLang(getLang());
    const toggle = document.getElementById("langToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      const next = getLang() === "nl" ? "en" : "nl";
      setLang(next);
      renderAll();
    });
  }

  /* ---------- Helpers ---------- */

  // Convert all "*_nl" / "*_en" sibling fields into nested { nl, en } objects.
  // Walks arrays and nested objects recursively.
  function unflattenLang(obj) {
    if (Array.isArray(obj)) return obj.map(unflattenLang);
    if (obj && typeof obj === "object") {
      const out = {};
      const pairs = {};
      for (const key in obj) {
        const m = key.match(/^(.+)_(nl|en)$/);
        if (m) {
          const base = m[1], lang = m[2];
          pairs[base] = pairs[base] || {};
          pairs[base][lang] = obj[key];
        } else {
          out[key] = unflattenLang(obj[key]);
        }
      }
      for (const base in pairs) out[base] = pairs[base];
      return out;
    }
    return obj;
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((acc, k) => {
      if (acc == null) return acc;
      const idx = parseInt(k, 10);
      return Number.isInteger(idx) ? acc[idx] : acc[k];
    }, obj);
  }

  function resolveContent(path, lang) {
    if (!content) return null;
    let val = getByPath(content, path);
    if (val && typeof val === "object" && (val.nl !== undefined || val.en !== undefined)) {
      val = val[lang] !== undefined ? val[lang] : val.nl;
    }
    return val;
  }

  function bindContent() {
    const lang = getLang();
    document.querySelectorAll("[data-c]").forEach(el => {
      const path = el.getAttribute("data-c");
      const val = resolveContent(path, lang);
      if (val !== null && val !== undefined && typeof val !== "object") {
        el.innerHTML = val;
      }
    });
  }

  /* ---------- Markdown rendering ---------- */

  function markdownToHTML(md) {
    if (typeof marked !== "undefined") return marked.parse(md);
    // Tiny fallback: split paragraphs.
    return md.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  }

  /* ---------- Date formatting ---------- */

  function formatDate(iso, lang) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const months = lang === "nl"
      ? ["jan.", "feb.", "mrt.", "apr.", "mei", "jun.", "jul.", "aug.", "sep.", "okt.", "nov.", "dec."]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /* ---------- Article helpers ---------- */

  function sortedArticles() {
    return [...articles].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }

  function featuredArticles() {
    return sortedArticles().filter(a => a.featured);
  }

  function essayRowHTML(article, lang) {
    const readLabel = resolveContent("labels.readMore", lang) || (lang === "nl" ? "Lees →" : "Read →");
    return `
      <a href="/essays/${encodeURIComponent(article.slug)}" class="essay-row" data-slug="${article.slug}">
        <div class="essay-row__meta">
          ${formatDate(article.date, lang)}
          <span class="cat">${article.category[lang]}</span>
        </div>
        <div>
          <div class="essay-row__title">${article.title[lang]}</div>
          <p style="margin-top: 0.6em; color: var(--ink-soft); font-size: 1rem; max-width: 56ch;">
            ${article.excerpt[lang]}
          </p>
        </div>
        <div class="essay-row__read">${readLabel}</div>
      </a>
    `;
  }

  /* ---------- Renderers per page area ---------- */

  function renderFeatured() {
    const root = document.getElementById("featured-list");
    if (!root) return;
    const lang = getLang();
    root.innerHTML = featuredArticles().map(a => essayRowHTML(a, lang)).join("");
  }

  function renderHomeIntro() {
    const root = document.getElementById("home-intro");
    if (!root || !content || !content.home) return;
    const lang = getLang();
    const text = content.home.introBody[lang];
    root.innerHTML = text.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join("");
  }

  function renderHomeBlocks() {
    const root = document.getElementById("what-i-do-blocks");
    if (!root || !content || !content.home) return;
    const lang = getLang();
    const blocks = [1,2,3,4].map(i => ({
      title: content.home["block" + i + "_title"] || content.home[`block${i}`] && content.home[`block${i}`].title,
      body:  content.home["block" + i + "_body"]  || content.home[`block${i}`] && content.home[`block${i}`].body
    })).filter(b => b.title);
    root.innerHTML = blocks.map(b => `
      <div class="work-block">
        <h3>${b.title[lang]}</h3>
        <p>${b.body[lang]}</p>
      </div>
    `).join("");
  }

  function renderWorkCases() {
    const root = document.getElementById("work-cases");
    if (!root || !content || !content.work) return;
    const lang = getLang();
    root.innerHTML = content.work.cases.map(c => {
      const linkHTML = c.linkUrl
        ? `<p style="margin-top: 1em;"><a href="${c.linkUrl}" class="link">${(c.linkText && c.linkText[lang]) || ""}</a></p>`
        : "";
      return `
        <div class="case">
          <div class="case__years">${c.years[lang]}</div>
          <div>
            <h3>${c.title[lang]}</h3>
            <div class="role">${c.role[lang]}</div>
            <p>${c.body[lang]}</p>
            ${linkHTML}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderAboutBodies() {
    const lang = getLang();
    if (!content || !content.about) return;

    const portraitImg = document.getElementById("portrait-img");
    if (portraitImg && content.about.portraitImage) {
      portraitImg.setAttribute("src", content.about.portraitImage);
    }

    const map = [
      ["about-who",  content.about.whoIAm],
      ["about-do",   content.about.whatIDoBody],
      ["about-done", content.about.whatIDoneBody]
    ];
    map.forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val) {
        const text = val[lang] || "";
        el.innerHTML = markdownToHTML(text);
      }
    });
  }

  function renderContactItems() {
    const root = document.getElementById("contact-items");
    if (!root || !content || !content.contact) return;
    const lang = getLang();
    root.innerHTML = content.contact.items.map(i => `
      <dt>${i.label[lang]}</dt>
      <dd><a href="${i.href}" ${i.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${i.value}</a></dd>
    `).join("");
  }

  /* ---------- Writing archive ---------- */

  let currentFilter = "all";

  function renderArchive() {
    const root = document.getElementById("all-articles");
    const filtersRoot = document.getElementById("filters");
    if (!root) return;
    const lang = getLang();
    const all = sortedArticles();
    const allLabel = resolveContent("writing.filterAll", lang) || (lang === "nl" ? "Alle" : "All");

    if (filtersRoot) {
      const cats = ["all", ...new Set(all.map(a => a.category[lang]))];
      filtersRoot.innerHTML = cats.map(c =>
        `<button class="filter ${currentFilter === c ? "is-active" : ""}" data-cat="${c}">
          ${c === "all" ? allLabel : c}
        </button>`
      ).join("");
      filtersRoot.querySelectorAll(".filter").forEach(btn => {
        btn.addEventListener("click", () => {
          currentFilter = btn.dataset.cat;
          renderArchive();
        });
      });
    }

    const filtered = currentFilter === "all"
      ? all
      : all.filter(a => a.category[lang] === currentFilter);

    root.innerHTML = filtered.length
      ? filtered.map(a => essayRowHTML(a, lang)).join("")
      : `<p style="padding: 3rem 0; color: var(--muted); font-style: italic; text-align: center;">${lang === "nl" ? "Nog geen essays in deze categorie." : "No essays in this category yet."}</p>`;
  }

  /* ---------- Article page ---------- */

  function getSlugFromUrl() {
    // Probeer eerst query-string (?slug=...), dan pad (/essays/slug)
    const qs = new URLSearchParams(window.location.search).get("slug");
    if (qs) return qs;
    const m = window.location.pathname.match(/\/essays\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setMeta(name, content, attr) {
    if (!content) return;
    attr = attr || "name";
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function setCanonical(href) {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    el.setAttribute("href", href);
  }

  function injectArticleSchema(article, lang) {
    const old = document.getElementById("article-schema");
    if (old) old.remove();
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title[lang],
      "description": article.excerpt[lang],
      "datePublished": article.date,
      "dateModified": article.date,
      "inLanguage": lang === "nl" ? "nl-NL" : "en-GB",
      "author": { "@type": "Person", "name": "Dania Awin", "url": "https://daniaawin.com" },
      "publisher": { "@type": "Person", "name": "Dania Awin", "url": "https://daniaawin.com" },
      "mainEntityOfPage": `https://daniaawin.com/essays/${article.slug}`,
      "image": "https://daniaawin.com/dania-hero.jpg",
      "articleSection": article.category[lang],
      "keywords": [article.category.en, article.category.nl].join(", ")
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = "article-schema";
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
  }

  function renderArticle() {
    const root = document.getElementById("article-root");
    if (!root) return;
    const slug = getSlugFromUrl();
    const lang = getLang();
    const article = slug ? articles.find(a => a.slug === slug) : null;

    if (!article) {
      const notFound = resolveContent("labels.essayNotFound", lang) || "Essay not found";
      const back = resolveContent("labels.backToArchive", lang) || "Back to the archive";
      root.innerHTML = `
        <section class="article-head" style="text-align: center;">
          <h1 style="font-family: var(--serif-display); font-size: 2.5rem; color: var(--ink); margin: 4rem 0 1rem;">
            ${notFound}
          </h1>
          <p style="color: var(--ink-soft);">
            <a href="/writing.html" class="link">${back}</a>
          </p>
        </section>
      `;
      return;
    }

    // SEO: dynamische meta voor dit essay
    const pageTitle = `${article.title[lang]} · Dania Awin`;
    const pageDesc = article.excerpt[lang];
    const pageUrl = `https://daniaawin.com/essays/${article.slug}`;
    document.title = pageTitle;
    setMeta("description", pageDesc);
    setCanonical(pageUrl);
    setMeta("og:title", pageTitle, "property");
    setMeta("og:description", pageDesc, "property");
    setMeta("og:url", pageUrl, "property");
    setMeta("og:type", "article", "property");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDesc);
    injectArticleSchema(article, lang);

    const topMeta = document.getElementById("article-meta-top");
    if (topMeta) {
      topMeta.innerHTML = `${formatDate(article.date, lang)} · ${article.category[lang]}`;
    }

    const bodyHTML = markdownToHTML(article.body[lang]);

    root.innerHTML = `
      <section class="article-head">
        <div class="eyebrow">${article.category[lang]}</div>
        <h1>${article.title[lang]}</h1>
        <div class="article-meta">${formatDate(article.date, lang)}</div>
      </section>
      <article class="article-body">
        ${bodyHTML}
      </article>
    `;
  }

  /* ---------- Master render ---------- */

  function renderAll() {
    bindContent();
    renderHomeIntro();
    renderHomeBlocks();
    renderFeatured();
    renderArchive();
    renderWorkCases();
    renderAboutBodies();
    renderContactItems();
    renderArticle();
  }

  /* ---------- Data loading ---------- */

  async function loadData() {
    try {
      const [siteRes, articlesRes] = await Promise.all([
        fetch("/content/site.json"),
        fetch("/content/articles.json")
      ]);
      const siteJson = await siteRes.json();
      const articlesJson = await articlesRes.json();
      content = unflattenLang(siteJson);
      articles = unflattenLang(articlesJson.articles || []);
    } catch (e) {
      console.error("Kon content niet laden:", e);
      const main = document.querySelector("main");
      if (main) {
        main.innerHTML = `
          <div style="padding: 4rem 2rem; text-align: center; max-width: 32rem; margin: 0 auto;">
            <h1 style="font-family: var(--serif-display); font-weight: 400;">Content kon niet geladen worden</h1>
            <p style="color: var(--ink-soft); margin-top: 1.5rem;">
              Dit gebeurt als je de site lokaal opent zonder server. Open de site via je live URL,
              of start een lokale server (zie README).
            </p>
          </div>
        `;
      }
    }
  }

  /* ---------- Boot ---------- */

  document.addEventListener("DOMContentLoaded", async function () {
    initLangToggle();
    await loadData();
    renderAll();
  });

})();
