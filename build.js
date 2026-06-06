// Genereert sitemap.xml en rss.xml op basis van content/articles.json
// Loopt bij elke Netlify-build automatisch.
const fs = require("fs");

const SITE = "https://daniaawin.com";
const articles = JSON.parse(fs.readFileSync("content/articles.json", "utf8")).articles;
const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));

// --- sitemap.xml ---
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

// --- rss.xml ---
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

console.log(`✓ sitemap.xml + rss.xml gegenereerd voor ${sorted.length} essays`);
