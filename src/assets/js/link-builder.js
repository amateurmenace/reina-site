/* REINA — campaign link builder (UTM) for the team. */
(function () {
  "use strict";
  const root = document.querySelector("[data-link-builder]");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const out = $("[data-lb-out]"), qr = $("[data-lb-qr]"), f = $("form");
  const siteUrl = (window.REINA || {}).siteUrl || location.origin;
  const prefix = (window.REINA || {}).prefix || "/";
  function build() {
    const d = Object.fromEntries(new FormData(f).entries());
    let base = (d.page || "/").trim();
    if (!/^https?:/.test(base)) base = siteUrl + prefix.replace(/\/$/, "") + (base.startsWith("/") ? base : "/" + base);
    let u; try { u = new URL(base); } catch (e) { out.textContent = "Enter a valid page."; return; }
    const set = (k, v) => { if (v && v.trim()) u.searchParams.set(k, v.trim().toLowerCase().replace(/\s+/g, "_")); };
    set("utm_source", d.source); set("utm_medium", d.medium); set("utm_campaign", d.campaign); set("utm_content", d.content);
    const href = u.href;
    out.innerHTML = href.replace(/([?&])(utm_[a-z]+)=/g, '$1<span class="p">$2</span>=');
    out.dataset.value = href;
    if (qr) qr.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(href)}" width="220" height="220" alt="QR code for the campaign link" loading="lazy" />`;
  }
  f.addEventListener("input", build);
  f.addEventListener("submit", (e) => e.preventDefault());
  $("[data-lb-copy]").addEventListener("click", async () => { try { await navigator.clipboard.writeText(out.dataset.value || ""); window.reinaToast("Campaign link copied"); } catch (e) {} });
  root.querySelectorAll("[data-lb-preset]").forEach((b) => b.addEventListener("click", () => {
    const [source, medium] = b.dataset.lbPreset.split(":");
    f.source.value = source; f.medium.value = medium; build();
  }));
  build();
})();
