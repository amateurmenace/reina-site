const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const { feedPlugin } = require("@11ty/eleventy-plugin-rss");

// PATHPREFIX="/reina-site/" when hosted under a sub-path (GitHub Pages project site); "/" for a custom domain.
const PREFIX = (process.env.PATHPREFIX || "/").replace(/\/?$/, "/");
// SITE_URL is the origin the site is served from (no trailing slash).
const SITE_URL = (process.env.SITE_URL || "http://localhost:8089").replace(/\/$/, "");

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("pathPrefix", PREFIX);
  eleventyConfig.addGlobalData("siteUrl", SITE_URL);
  eleventyConfig.addGlobalData("buildTime", () => new Date());

  // Rewrite root-relative URLs when the site lives under a sub-path.
  if (PREFIX !== "/") {
    eleventyConfig.addTransform("pathprefix", (content, outputPath) =>
      outputPath && /\.(html|xml)$/.test(outputPath)
        ? content.replace(/\b(href|src|action|content|poster)="\/(?!\/)/g, `$1="${PREFIX}`)
        : content);
  }

  // Static files
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addWatchTarget("src/assets");

  // Markdown
  const md = markdownIt({ html: true, linkify: true, typographer: true }).use(markdownItAnchor, { level: [2, 3] });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("md", (s) => (s ? md.render(String(s)) : ""));
  eleventyConfig.addFilter("mdInline", (s) => (s ? md.renderInline(String(s)) : ""));

  // URLs
  eleventyConfig.addFilter("absolute", (u) => {
    const s = String(u || "/");
    if (/^https?:\/\//.test(s)) return s;
    return SITE_URL + PREFIX.replace(/\/$/, "") + (s.startsWith("/") ? s : "/" + s);
  });
  eleventyConfig.addFilter("isExternal", (url) => /^https?:\/\//.test(String(url || "")));
  const norm = (u) => String(u || "").replace(/index\.html$/, "").replace(/\/+$/, "/") || "/";
  eleventyConfig.addFilter("isCurrent", (pageUrl, itemUrl) => {
    const a = norm(pageUrl), b = norm(itemUrl);
    if (b === "/") return a === "/";
    return a === b || a.startsWith(b);
  });

  // Dates
  const toDT = (d) => (d instanceof Date ? DateTime.fromJSDate(d, { zone: "utc" }) : DateTime.fromISO(String(d), { zone: "utc" }));
  eleventyConfig.addFilter("readableDate", (d, fmt = "d LLLL yyyy") => toDT(d).toFormat(fmt));
  eleventyConfig.addFilter("isoDate", (d) => toDT(d).toISODate());
  eleventyConfig.addFilter("year", (d) => toDT(d).toFormat("yyyy"));

  // Collection helpers
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("featured", (arr) => (arr || []).filter((i) => i.data && i.data.featured));
  eleventyConfig.addFilter("where", (arr, key, val) => (arr || []).filter((i) => (i.data ? i.data[key] : i[key]) === val));
  eleventyConfig.addFilter("whereNot", (arr, key, val) => (arr || []).filter((i) => (i.data ? i.data[key] : i[key]) !== val));
  eleventyConfig.addFilter("find", (arr, key, val) => (arr || []).find((i) => (i.data ? i.data[key] : i[key]) === val));
  eleventyConfig.addFilter("excerpt", (html, n = 160) => {
    const t = String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t;
  });
  eleventyConfig.addFilter("plain", (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  eleventyConfig.addFilter("readingTime", (html) => {
    const words = String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });
  eleventyConfig.addFilter("allValues", (coll, key) => {
    const s = new Set();
    (coll || []).forEach((i) => {
      const v = i.data[key];
      if (Array.isArray(v)) v.forEach((t) => s.add(t));
      else if (v) s.add(v);
    });
    return [...s].sort();
  });
  eleventyConfig.addFilter("related", (coll, url, topics, n = 3) => {
    const tags = new Set(topics || []);
    return (coll || [])
      .filter((p) => p.url !== url)
      .map((p) => ({ p, score: (p.data.topics || []).filter((t) => tags.has(t)).length }))
      .sort((a, b) => b.score - a.score || b.p.date - a.p.date)
      .slice(0, n)
      .map((x) => x.p);
  });
  eleventyConfig.addFilter("slug2", (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  eleventyConfig.addFilter("jsonify", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("initials", (name) => String(name || "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase());
  eleventyConfig.addFilter("number", (n) => Number(n || 0).toLocaleString("en-US"));
  eleventyConfig.addFilter("pct", (n, total) => (total ? Math.round((n / total) * 100) : 0));
  eleventyConfig.addFilter("sum", (arr, key) => (arr || []).reduce((a, i) => a + Number(key ? i[key] : i) || 0, 0));
  eleventyConfig.addFilter("hue", (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; });

  const byDate = (a, b) => b.date - a.date;
  const byOrder = (a, b) => (a.data.order ?? 999) - (b.data.order ?? 999);
  const notDraft = (p) => !p.data.draft;
  eleventyConfig.addCollection("news", (api) => api.getFilteredByTag("news").filter(notDraft).sort(byDate));
  eleventyConfig.addCollection("programs", (api) => api.getFilteredByTag("program").filter(notDraft).sort(byOrder));
  eleventyConfig.addCollection("team", (api) => api.getFilteredByTag("team").filter(notDraft).sort(byOrder));
  eleventyConfig.addCollection("reports", (api) => api.getFilteredByTag("report").filter(notDraft).sort(byDate));
  eleventyConfig.addCollection("mentions", (api) => api.getFilteredByTag("mention").filter(notDraft).sort(byDate));
  eleventyConfig.addCollection("links", (api) => api.getFilteredByTag("link"));
  eleventyConfig.addCollection("sitemap", (api) =>
    api.getAll().filter((p) => p.url && p.url.endsWith("/") && !p.data.noindex && !p.data.eleventyExcludeFromCollections));
  eleventyConfig.addCollection("searchable", (api) =>
    api.getAll().filter((p) => p.url && p.url.endsWith("/") && !p.data.noindex && !p.data.nosearch && !p.data.draft && !p.data.eleventyExcludeFromCollections));

  // Atom feed for News
  const site = JSON.parse(fs.readFileSync(path.join(__dirname, "src/_data/site.json"), "utf8"));
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "news", limit: 20 },
    metadata: {
      language: "en",
      title: `${site.name} · News`,
      subtitle: site.description,
      base: SITE_URL + PREFIX,
      author: { name: site.name, email: site.contact.email },
    },
  });

  eleventyConfig.addShortcode("thisYear", () => String(new Date().getFullYear()));
  eleventyConfig.setServerOptions({ showAllHosts: false, port: 8089 });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html", "11ty.js"],
  };
};
