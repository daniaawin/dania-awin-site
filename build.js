// Genereert sitemap.xml + rss.xml + per-essay HTML.
// Belangrijk: zet versie-hashes op style.css en script.js in alle HTML
// zodat browsers nooit een verouderde versie tonen.
// Loopt automatisch bij elke Cloudflare Pages-build.

const fs = require("fs");
const crypto = require("crypto");

const SITE = "https://daniaawin.com";

// ---------- Cache-busting hashes ----------
function shortHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
}
const CSS_VER = shortHash("style.css");
const JS_VER  = shortHash("script.js");

// Schrijf hash-versies naar de HTML-bestanden zelf, zodat ze altijd up-to-date
// zijn. Dit doen we voor elke HTML in de root.
const ROOT_HTML = [
  "index.html",
  "writing.html",
  "about.html",
  "work.html",
  "contact.html",
  "article.html",
  "404.html"
];
for (const name of ROOT_HTML) {
  if (!fs.existsSync(name)) continue;
  let html = fs.readFileSync(name, "utf8");
  // Verwijder bestaande versies en zet de nieuwe erop
  html = html
    .replace(/href="style\.css(\?v=[a-f0-9]+)?"/g, `href="style.css?v=${CSS_VER}"`)
    .replace(/href="\/style\.css(\?v=[a-f0-9]+)?"/g, `href="/style.css?v=${CSS_VER}"`)
    .replace(/src="script\.js(\?v=[a-f0-9]+)?"/g, `src="script.js?v=${JS_VER}"`)
    .replace(/src="\/script\.js(\?v=[a-f0-9]+)?"/g, `src="/script.js?v=${JS_VER}"`);
  fs.writeFileSync(name, html);
}

// ---------- sitemap.xml ----------
const articles = JSON.parse(fs.readFileSync("content/articles.json", "utf8")).articles;
const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));

const staticPages = [
  ["/", "1.0", "weekly"],
  ["/writing.html", "0.9", "weekly"],
  ["/about.html", "0.9", "monthly"],
  ["/work.html", "0.8", "monthly"],
  ["/contact.html", "0.6", "yearly"]
];
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (const [path, prio, freq] of staticPages) {
  sitemap += `  <url><loc>${SITE}${path}</loc><priority>${prio}</priority><changefreq>${freq}</changefreq></url>\n`;
}
for (const a of sorted) {
  sitemap += `  <url><loc>${SITE}/essays/${a.slug}</loc><priority>0.9</priority><changefreq>monthly</changefreq><lastmod>${a.date}</lastmod></url>\n`;
}
sitemap += '</urlset>\n';
fs.writeFileSync("sitemap.xml", sitemap);

// ---------- rss.xml ----------
const now = new Date().toUTCString();
function rfcDate(iso) {
  return new Date(iso + "T12:00:00Z").toUTCString();
}
const items = sorted.map(a => `    <item>
      <title><![CDATA[${a.title_en}]]></title>
      <link>${SITE}/essays/${a.slug}</link>
      <guid isPermaLink="true">${SITE}/essays/${a.slug}</guid>
      <pubDate>${rfcDate(a.date)}</pubDate>
      <description><![CDATA[${a.excerpt_en}]]></description>
      <category>${a.category_en}</category>
      <author>noreply@daniaawin.com (Dania Awin)</author>
    </item>`).join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Dania Awin — Essays &amp; Research</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Essays and public research on institutional power, technology and culture by Dania Awin.</description>
    <language>en-gb</language>
    <copyright>© Dania Awin</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <image>
      <url>${SITE}/apple-touch-icon.png</url>
      <title>Dania Awin</title>
      <link>${SITE}</link>
    </image>
${items}
  </channel>
</rss>
`;
fs.writeFileSync("rss.xml", rss);

// ---------- /essays/SLUG/index.html voor elke essay ----------
const articleTemplate = fs.readFileSync("article.html", "utf8");
if (!fs.existsSync("essays")) fs.mkdirSync("essays");
for (const a of sorted) {
  const dir = `essays/${a.slug}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const url = `${SITE}/essays/${a.slug}`;
  const html = articleTemplate
    .replace(/href="style\.css(\?v=[a-f0-9]+)?"/g, `href="/style.css?v=${CSS_VER}"`)
    .replace(/src="script\.js(\?v=[a-f0-9]+)?"/g, `src="/script.js?v=${JS_VER}"`)
    .replace(/href="index\.html"/g, 'href="/"')
    .replace(/href="writing\.html"/g, 'href="/writing.html"')
    .replace(/href="work\.html"/g, 'href="/work.html"')
    .replace(/href="about\.html"/g, 'href="/about.html"')
    .replace(/href="contact\.html"/g, 'href="/contact.html"')
    .replace(/<title>[^<]*<\/title>/, `<title>${a.title_en} · Dania Awin</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${a.excerpt_en.replace(/"/g, '&quot;')}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
    .replace(/property="og:url" content="[^"]*"/, `property="og:url" content="${url}"`)
    .replace(/property="og:type" content="website"/, 'property="og:type" content="article"');
  fs.writeFileSync(`${dir}/index.html`, html);
}

console.log(`✓ sitemap.xml + rss.xml + ${sorted.length} essay-pagina's gegenereerd`);
console.log(`✓ Cache-busting: style.css?v=${CSS_VER}  script.js?v=${JS_VER}`);
