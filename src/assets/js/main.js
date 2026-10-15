/* REINA — shared behaviours */
(function () {
  "use strict";
  const R = window.REINA || { prefix: "/", analytics: {}, counters: {}, forms: {} };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Toast ---------- */
  const toastEl = $("[data-toast]");
  let toastTimer;
  window.reinaToast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  };

  /* ---------- Analytics event bridge (GA4 / Plausible / GoatCounter) ---------- */
  window.reinaTrack = function (name, props = {}) {
    try {
      if (window.gtag) window.gtag("event", name, props);
      if (window.plausible) window.plausible(name, { props });
      if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "event/" + name + (props.label ? "/" + props.label : ""), title: name, event: true });
    } catch (e) { /* analytics must never break the page */ }
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-track]");
    if (t) { const [name, label] = String(t.dataset.track).split(":"); window.reinaTrack(name, { label }); }
  });

  /* ---------- Referral capture (?ref=, ?src=, ?utm_source=) ---------- */
  try {
    const p = new URLSearchParams(location.search);
    const ref = p.get("ref") || p.get("src") || p.get("source") || p.get("utm_source");
    if (ref) sessionStorage.setItem("reina_ref", ref.slice(0, 80));
    const camp = p.get("utm_campaign");
    if (camp) sessionStorage.setItem("reina_campaign", camp.slice(0, 80));
    if (!sessionStorage.getItem("reina_ref") && document.referrer) {
      const h = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (h && h !== location.hostname) sessionStorage.setItem("reina_ref", h);
    }
  } catch (e) {}
  const getRef = () => { try { return sessionStorage.getItem("reina_ref") || "direct"; } catch (e) { return "direct"; } };
  $$("input[name='source']").forEach((i) => { i.value = getRef(); });
  $$("input[name='campaign']").forEach((i) => { try { i.value = sessionStorage.getItem("reina_campaign") || ""; } catch (e) {} });

  /* ---------- Header ---------- */
  const header = $("[data-header]");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  const navToggle = $("[data-nav-toggle]");
  const mobileNav = $("#mobile-nav");
  if (navToggle && mobileNav) {
    const setNav = (open) => {
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileNav.hidden = !open;
      document.body.classList.toggle("nav-open", open);
    };
    navToggle.addEventListener("click", () => setNav(mobileNav.hidden));
    mobileNav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 980) setNav(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !mobileNav.hidden) setNav(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal, .reveal-stagger, [data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    const pending = new Set(revealEls);
    const show = (el) => { el.classList.add("is-visible"); pending.delete(el); io.unobserve(el); };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting || en.boundingClientRect.top < 0) show(en.target); });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
    // Fallback for anchor jumps and fast scrolls that skip an element entirely.
    let ticking = false;
    const sweep = () => { ticking = false; pending.forEach((el) => { if (el.getBoundingClientRect().top < window.innerHeight * 0.92) show(el); }); };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } }, { passive: true });
    window.addEventListener("hashchange", () => setTimeout(sweep, 50));
  } else revealEls.forEach((el) => el.classList.add("is-visible"));

  /* ---------- Animated counters ---------- */
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  function countUp(el) {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || "";
    const dur = reduced ? 0 : 1600;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / (dur || 1));
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counters = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach((el) => cio.observe(el));
  } else counters.forEach(countUp);

  /* ---------- Visitor counter ---------- */
  (function visitors() {
    const el = $("[data-visitor-count]");
    if (!el) return;
    const baseline = Number((R.counters && R.counters.visitors_baseline) || 0);
    const code = R.analytics && R.analytics.goatcounter_code;
    const show = (n) => { el.dataset.count = n; el.textContent = fmt(n); countUp(el); };
    let local = 0;
    try { // every browser counts itself once per day, so the number moves even before analytics is connected
      const key = "reina_visit_" + new Date().toISOString().slice(0, 10);
      const seen = localStorage.getItem("reina_visits") || "0";
      if (!localStorage.getItem(key)) { localStorage.setItem(key, "1"); localStorage.setItem("reina_visits", String(Number(seen) + 1)); }
      local = Number(localStorage.getItem("reina_visits") || 0);
    } catch (e) {}
    if (code) {
      fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`, { mode: "cors" })
        .then((r) => r.json())
        .then((d) => { const n = Number(String(d.count || "").replace(/\D/g, "")); show(n > 0 ? n : baseline + local); })
        .catch(() => show(baseline + local));
    } else show(baseline + local);
  })();

  /* ---------- Values (expand on click) ---------- */
  $$("[data-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      $$("[data-value]").forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---------- Stepper (theory of change) ---------- */
  $$("[data-stepper]").forEach((root) => {
    const tabs = $$("[role='tab']", root);
    const panels = $$("[role='tabpanel']", root);
    let i = 0, timer;
    const select = (n, user) => {
      i = (n + tabs.length) % tabs.length;
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => { p.hidden = k !== i; });
      if (user) { clearInterval(timer); window.reinaTrack("theory_of_change_step", { label: tabs[i].dataset.stage }); }
    };
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => select(k, true));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { select(i + 1, true); tabs[i].focus(); }
        if (e.key === "ArrowLeft") { select(i - 1, true); tabs[i].focus(); }
      });
    });
    $$("[data-step-prev]", root).forEach((b) => b.addEventListener("click", () => select(i - 1, true)));
    $$("[data-step-next]", root).forEach((b) => b.addEventListener("click", () => select(i + 1, true)));
    select(0);
    if (!reduced) {
      const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { clearInterval(timer); timer = setInterval(() => select(i + 1), 4500); } else clearInterval(timer); });
      io.observe(root);
      root.addEventListener("pointerenter", () => clearInterval(timer));
    }
  });

  /* ---------- Carousel ---------- */
  $$("[data-carousel]").forEach((root) => {
    const track = $(".carousel-track", root);
    const items = $$(".carousel-track > *", root);
    const dots = $(".carousel-dots", root);
    if (!track || !items.length) return;
    if (dots) items.forEach((_, k) => { const d = document.createElement("span"); if (k === 0) d.classList.add("is-active"); dots.appendChild(d); });
    const setActive = () => {
      const x = track.scrollLeft, w = items[0].offsetWidth + 20;
      const idx = Math.round(x / w);
      if (dots) $$("span", dots).forEach((d, k) => d.classList.toggle("is-active", k === idx));
    };
    track.addEventListener("scroll", () => requestAnimationFrame(setActive), { passive: true });
    const go = (dir) => { const w = items[0].offsetWidth + 20; track.scrollBy({ left: dir * w, behavior: reduced ? "auto" : "smooth" }); };
    $$(".prev", root).forEach((b) => b.addEventListener("click", () => go(-1)));
    $$(".next", root).forEach((b) => b.addEventListener("click", () => go(1)));
    if (!reduced) {
      let auto = setInterval(() => { const max = track.scrollWidth - track.clientWidth; if (track.scrollLeft >= max - 4) track.scrollTo({ left: 0, behavior: "smooth" }); else go(1); }, 6000);
      root.addEventListener("pointerenter", () => clearInterval(auto));
      root.addEventListener("focusin", () => clearInterval(auto));
    }
  });

  /* ---------- Filters (programs, news) ---------- */
  $$("[data-filter-root]").forEach((root) => {
    const items = $$("[data-filter-item]", root);
    const chips = $$("[data-filter]", root);
    const search = $("[data-filter-search]", root);
    const empty = $("[data-filter-empty]", root);
    const state = {};
    const apply = () => {
      const q = (search && search.value.trim().toLowerCase()) || "";
      let shown = 0;
      items.forEach((it) => {
        let ok = true;
        for (const k in state) { if (state[k] && state[k] !== "all" && !(it.dataset[k] || "").split(" ").includes(state[k])) ok = false; }
        if (ok && q && !it.textContent.toLowerCase().includes(q)) ok = false;
        it.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    };
    chips.forEach((c) => c.addEventListener("click", () => {
      const key = c.dataset.filter, val = c.dataset.value;
      state[key] = val;
      chips.filter((x) => x.dataset.filter === key).forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      apply();
      window.reinaTrack("filter", { label: key + ":" + val });
    }));
    if (search) search.addEventListener("input", apply);
    // Pre-select from URL (?topic=, ?status=)
    try {
      const p = new URLSearchParams(location.search);
      chips.forEach((c) => { if (p.get(c.dataset.filter) === c.dataset.value) c.click(); });
      if (search && p.get("q")) { search.value = p.get("q"); apply(); }
    } catch (e) {}
  });

  /* ---------- Share buttons (UTM-tagged) ---------- */
  $$("[data-share]").forEach((root) => {
    const base = root.dataset.url || location.href.split("#")[0];
    const title = root.dataset.title || document.title;
    const text = root.dataset.text || "";
    const tagged = (net) => { const u = new URL(base); u.searchParams.set("utm_source", net); u.searchParams.set("utm_medium", "social"); u.searchParams.set("utm_campaign", "share"); return u.href; };
    const targets = {
      whatsapp: (u) => "https://wa.me/?text=" + encodeURIComponent(title + " — " + u),
      x: (u) => "https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(u),
      facebook: (u) => "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(u),
      linkedin: (u) => "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(u),
      email: (u) => "mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent((text ? text + "\n\n" : "") + u),
    };
    $$("[data-share-net]", root).forEach((btn) => {
      const net = btn.dataset.shareNet;
      if (targets[net]) btn.href = targets[net](tagged(net));
      btn.addEventListener("click", async (e) => {
        if (net === "copy") {
          e.preventDefault();
          try { await navigator.clipboard.writeText(tagged("copy")); window.reinaToast("Link copied"); } catch (err) { window.reinaToast("Could not copy"); }
        }
        if (net === "native") {
          e.preventDefault();
          try { await navigator.share({ title, text, url: tagged("native") }); } catch (err) {}
        }
        window.reinaTrack("share", { label: net });
        bumpLocal("shares");
      });
      if (net === "native" && navigator.share) btn.hidden = false;
    });
  });

  /* ---------- Engagement counters (local nudges on top of CMS baselines) ---------- */
  function bumpLocal(key) { try { localStorage.setItem("reina_" + key, String(Number(localStorage.getItem("reina_" + key) || 0) + 1)); } catch (e) {} }
  $$("[data-engage]").forEach((el) => {
    const key = el.dataset.engage;
    let extra = 0; try { extra = Number(localStorage.getItem("reina_" + key) || 0); } catch (e) {}
    el.dataset.count = Number(el.dataset.count || 0) + extra;
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-download]")) { bumpLocal("downloads"); window.reinaTrack("download", { label: e.target.closest("[data-download]").dataset.download }); } });

  /* ---------- Forms (endpoint or mailto fallback) ---------- */
  $$("form[data-form]").forEach((form) => {
    const kind = form.dataset.form;
    const status = $("[data-form-status]", form) || form.appendChild(Object.assign(document.createElement("p"), { className: "form-status" }));
    const endpoint = (R.forms && R.forms[kind + "_endpoint"]) || form.getAttribute("action") || "";
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if ($("input[name='website']", form) && $("input[name='website']", form).value) return; // honeypot
      const btn = $("button[type='submit']", form);
      const data = Object.fromEntries(new FormData(form).entries());
      status.className = "form-status";
      if (endpoint && /^https?:/.test(endpoint)) {
        btn && btn.setAttribute("aria-busy", "true");
        try {
          const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
          if (!r.ok) throw new Error("bad status");
          status.textContent = form.dataset.success || "Thank you. We will be in touch soon.";
          status.classList.add("is-ok"); form.reset(); bumpLocal("signups");
          window.reinaTrack("form_submit", { label: kind });
        } catch (err) {
          status.textContent = "Something went wrong. Please email us at " + (form.dataset.email || "") + ".";
          status.classList.add("is-err");
        } finally { btn && btn.removeAttribute("aria-busy"); }
      } else {
        // No endpoint configured yet: open the visitor's mail app with the message pre-filled.
        const to = form.dataset.email || "";
        const subject = form.dataset.subject || (R.name + " website: " + kind);
        const body = Object.entries(data).filter(([k]) => k !== "website").map(([k, v]) => k + ": " + v).join("\n");
        location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        status.textContent = "Your mail app should open with the message ready to send.";
        status.classList.add("is-ok");
        window.reinaTrack("form_submit", { label: kind + "_mailto" });
      }
    });
  });

  /* ---------- Copy buttons ---------- */
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    const t = b.dataset.copy || ($(b.dataset.copyFrom) || {}).textContent || "";
    try { await navigator.clipboard.writeText(t.trim()); window.reinaToast("Copied"); } catch (e) { window.reinaToast("Could not copy"); }
  }));

  /* ---------- Tilt (pointer-driven) ---------- */
  if (!reduced && window.matchMedia("(hover: hover)").matches) {
    $$(".tilt").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Instagram embeds ---------- */
  if ($(".instagram-media")) { const s = document.createElement("script"); s.async = true; s.src = "https://www.instagram.com/embed.js"; document.body.appendChild(s); }

  /* ---------- Smooth anchor offset for sticky header ---------- */
  $$("a[href^='#']").forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    const t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    const y = t.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    history.pushState(null, "", "#" + id);
  }));
})();
