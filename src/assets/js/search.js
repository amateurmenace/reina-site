/* REINA — site search with auto-suggestions. Index: /search.json (built by Eleventy). */
(function () {
  "use strict";
  const R = window.REINA || { prefix: "/" };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const modal = $("[data-search-modal]");
  const input = $("[data-search-input]");
  const results = $("[data-search-results]");
  const hints = $("[data-search-hints]");
  const pageResults = $("[data-search-page-results]");
  const pageInput = $("[data-search-page-input]");
  let index = null, loading = null, active = -1, lastQ = "";

  const load = () => loading || (loading = fetch(R.prefix.replace(/\/$/, "") + "/search.json").then((r) => r.json()).then((d) => (index = d)).catch(() => (index = [])));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hl = (text, terms) => { let out = esc(text); terms.forEach((t) => { if (t.length < 2) return; out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); }); return out; };

  function score(item, terms, q) {
    const title = norm(item.title), sum = norm(item.summary), tags = norm((item.tags || []).join(" ")), body = norm(item.body), type = norm(item.type);
    let s = 0;
    if (title === q) s += 100;
    if (title.startsWith(q)) s += 40;
    if (title.includes(q)) s += 25;
    terms.forEach((t) => {
      if (title.includes(t)) s += 12;
      if (title.split(/\s+/).some((w) => w.startsWith(t))) s += 6;
      if (tags.includes(t)) s += 8;
      if (sum.includes(t)) s += 5;
      if (type.includes(t)) s += 4;
      if (body.includes(t)) s += 2;
    });
    if (terms.every((t) => (title + " " + sum + " " + tags + " " + body).includes(t))) s += 10;
    if (item.type === "Program") s += 2;
    return s;
  }
  function search(q, limit = 8) {
    q = norm(q).trim();
    if (!q || !index) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return index.map((it) => ({ it, s: score(it, terms, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.it);
  }
  const colors = { Program: "var(--flame-soft)", News: "var(--sun-soft)", Story: "var(--sun-soft)", Event: "var(--river-soft)", Opportunity: "var(--river-soft)", Page: "var(--jac-soft)", Person: "var(--jac-soft)", Report: "var(--paper-3)" };
  function render(list, q, container) {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!list.length) { container.innerHTML = q ? `<li class="search-empty">No results for “${esc(q)}”. Try a different word, or <a href="${R.prefix}contact/">ask us directly</a>.</li>` : ""; return; }
    container.innerHTML = list.map((it, k) => `<li class="search-result${k === active ? " is-active" : ""}" role="option" aria-selected="${k === active}"><a href="${R.prefix.replace(/\/$/, "")}${it.url}"><span class="avatar" style="background:${colors[it.type] || "var(--paper-3)"}">${esc(it.type.slice(0, 3)).toUpperCase()}</span><div><strong>${hl(it.title, terms)}</strong><span>${esc(it.summary || "")}</span></div></a></li>`).join("");
  }

  /* Modal */
  function open() { if (!modal) return; modal.hidden = false; document.body.classList.add("search-open"); load(); setTimeout(() => input && input.focus(), 30); window.reinaTrack && window.reinaTrack("search_open"); }
  function close() { if (!modal) return; modal.hidden = true; document.body.classList.remove("search-open"); }
  $$("[data-search-open]").forEach((b) => b.addEventListener("click", open));
  $$("[data-search-close]").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    const typing = /input|textarea|select/i.test(document.activeElement && document.activeElement.tagName);
    if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); open(); }
    if (e.key === "Escape" && modal && !modal.hidden) close();
  });
  if (input && results) {
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await load();
        const q = input.value; lastQ = q; active = -1;
        if (hints) hints.hidden = !!q.trim();
        render(search(q), q, results);
      }, 80);
    });
    input.addEventListener("keydown", (e) => {
      const items = $$(".search-result", results);
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(items.length - 1, active + 1); render(search(lastQ), lastQ, results); }
      if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(-1, active - 1); render(search(lastQ), lastQ, results); }
      if (e.key === "Enter" && active >= 0) { e.preventDefault(); const a = $$(".search-result a", results)[active]; if (a) { window.reinaTrack && window.reinaTrack("search_select", { label: lastQ }); location.href = a.href; } }
    });
    $$("[data-search-try]").forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.searchTry; input.dispatchEvent(new Event("input")); input.focus(); }));
    const form = $("[data-search-form]");
    if (form) form.addEventListener("submit", () => { window.reinaTrack && window.reinaTrack("search_submit", { label: input.value }); });
  }

  /* Full search page */
  if (pageResults && pageInput) {
    const run = async () => { await load(); const q = pageInput.value; render(search(q, 50), q, pageResults); const c = $("[data-search-count]"); if (c) c.textContent = q ? `${search(q, 50).length} result${search(q, 50).length === 1 ? "" : "s"} for “${q}”` : ""; };
    try { const q = new URLSearchParams(location.search).get("q"); if (q) pageInput.value = q; } catch (e) {}
    pageInput.addEventListener("input", run);
    run();
  }
})();
