/* REINA — donation widget. Amounts, frequency, impact copy, and hand-off to whichever gateway is configured. */
(function () {
  "use strict";
  const root = document.querySelector("[data-donate]");
  if (!root) return;
  const cfg = JSON.parse(root.dataset.config || "{}");
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => Array.from(el.querySelectorAll(s));
  const amountsEl = $("[data-amounts]"), custom = $("[data-custom]"), impact = $("[data-impact]"), gateways = $("[data-gateways]"), summary = $("[data-summary]");
  let freq = "once", amount = (cfg.one_time_amounts || [25])[1] || 25;
  const sym = { USD: "$", ZWG: "ZiG ", EUR: "€", GBP: "£", ZAR: "R" }[cfg.currency] || (cfg.currency + " ");
  const money = (n) => sym + Number(n).toLocaleString("en-US");

  function renderAmounts() {
    const list = freq === "monthly" ? cfg.monthly_amounts : cfg.one_time_amounts;
    amountsEl.innerHTML = list.map((a) => `<button type="button" data-amount="${a}" aria-pressed="${a === amount}">${money(a)}</button>`).join("");
    $$("[data-amount]").forEach((b) => b.addEventListener("click", () => { amount = Number(b.dataset.amount); custom.value = ""; update(); }));
  }
  function impactFor(a) {
    const lines = (cfg.impact_lines || []).slice().sort((x, y) => x.amount - y.amount);
    let best = lines[0];
    for (const l of lines) if (a >= l.amount) best = l;
    if (!best) return "";
    const mult = Math.floor(a / best.amount);
    return `${money(a)} ${freq === "monthly" ? "a month " : ""}${best.text}${mult > 1 && best === lines[lines.length - 1] ? ` (${mult}× over)` : ""}`;
  }
  function update() {
    $$("[data-amount]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.amount) === amount && !custom.value)));
    impact.innerHTML = `<svg width="20" height="20"><use href="#i-sparkle"/></svg><span>${impactFor(amount)}</span>`;
    summary.textContent = `${money(amount)} ${freq === "monthly" ? "every month" : "one-time gift"}`;
    renderGateways();
  }
  function renderGateways() {
    const btns = [];
    const stripe = freq === "monthly" ? cfg.stripe_monthly_url : cfg.stripe_onetime_url;
    if (stripe) btns.push({ label: `Give ${money(amount)} by card`, href: stripe + (stripe.includes("?") ? "&" : "?") + "client_reference_id=web", net: "stripe" });
    if (cfg.paypal_me) btns.push({ label: `Give ${money(amount)} with PayPal`, href: `https://paypal.me/${cfg.paypal_me.replace(/^.*paypal\.me\//, "")}/${amount}${cfg.currency}`, net: "paypal" });
    if (cfg.paynow_url) btns.push({ label: `Pay with Paynow (EcoCash, OneMoney, cards)`, href: cfg.paynow_url, net: "paynow" });
    if (!btns.length) {
      gateways.innerHTML = `<div class="form-status is-ok" style="display:block">Our online gateway is being connected. Until then, please give by bank transfer or mobile money using the details below, or <a href="${(window.REINA || {}).prefix || "/"}contact/">contact us</a>. Thank you.</div>`;
      return;
    }
    gateways.innerHTML = btns.map((b, k) => `<a class="btn ${k === 0 ? "btn-primary" : "btn-secondary"} btn-lg" href="${b.href}" target="_blank" rel="noopener" data-gw="${b.net}">${b.label}<svg><use href="#i-arrow"/></svg></a>`).join("");
    $$("[data-gw]").forEach((a) => a.addEventListener("click", () => window.reinaTrack && window.reinaTrack("donate_click", { label: `${a.dataset.gw}:${freq}:${amount}` })));
  }
  $$("[data-freq]").forEach((b) => b.addEventListener("click", () => {
    freq = b.dataset.freq; $$("[data-freq]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const list = freq === "monthly" ? cfg.monthly_amounts : cfg.one_time_amounts;
    if (!custom.value) amount = list[1] || list[0];
    renderAmounts(); update();
  }));
  custom.addEventListener("input", () => { const v = Number(custom.value); if (v > 0) { amount = v; update(); } });
  try { const p = new URLSearchParams(location.search); if (p.get("amount")) { custom.value = p.get("amount"); amount = Number(p.get("amount")); } if (p.get("freq") === "monthly") { freq = "monthly"; $$("[data-freq]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.freq === "monthly"))); } } catch (e) {}
  renderAmounts(); update();
})();
