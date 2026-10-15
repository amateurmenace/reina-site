# REINA website

**Resources of Empowerment through Innovation and New Artistry (REINA)** — a youth-led organization in Zimbabwe. *Unleash Potential, Inspire Change!*

This repository is the whole website: a fast static site built with [Eleventy](https://www.11ty.dev/), edited through a friendly browser-based CMS ([Decap](https://decapcms.org/)) at `/admin/`, and hosted free on GitHub Pages. Every save in the CMS becomes a commit, and the site rebuilds and republishes itself in about a minute.

## Quick start

```bash
npm install
npm run dev        # http://localhost:8089 — live-reloading preview
npm run cms        # in a second terminal: local CMS at http://localhost:8089/admin/ with no login
npm run build      # writes the finished site to _site/
npm run icons      # regenerates favicon / app icons / social preview PNGs from the SVGs in src/assets/brand/
```

## Editing the site (for the REINA team)

Open **`/admin/`** on the live site and sign in with GitHub. Everything editors need is there:

| Section in the CMS | What it controls |
| --- | --- |
| **News and stories** | Blog posts: news, stories, events, open calls. Three newest appear on the home page. Each post gets share buttons, a social preview card, and shows up in search and the RSS feed. |
| **Programs** | Current, upcoming, and completed programs with timeline, partners, funders, milestones, and lead contact. |
| **Team and board** | Board of directors, leadership, and team profiles. Tick "contactable" to list someone on the Contact page. |
| **Reports and documents** | Annual reports, audited statements, policies (PDF uploads). Shown on Transparency and Impact. |
| **Mentions and press** | Coverage and features, listed at `/mentions/`. |
| **Short links (go/)** | Trackable links like `/go/instagram/` for bios and posters. Each redirects with campaign tags attached. |
| **Site settings** | Contact details, social links, registration details, analytics IDs, form endpoints, donation gateways, counters, community feed, newsletter text. |
| **Home page / About / Impact / Testimonials / Partners / FAQ / Navigation** | All the structured text and numbers on those pages. |

Saves publish straight to the live site (`publish_mode: simple`). To get a Draft → Review → Publish flow instead, change `publish_mode` to `editorial_workflow` in `src/admin/config.yml`.

### Sample content

The site ships with **sample** programs, posts, team profiles, testimonials, partners, impact figures, and documents so that every page looks finished. Anything marked `sample: true` shows a small "Sample" badge or note on the live site until you untick it. Replace these with real content before launch:

- [ ] Contact details, phone, WhatsApp, address, map (Site settings → Contact)
- [ ] Social media URLs (Site settings → Social media)
- [ ] Registration number, tax status, year founded (Site settings → Registration)
- [ ] Impact figures (Impact metrics) and counters (Site settings → Counters), then untick "sample"
- [ ] Team and board profiles, with photos
- [ ] Testimonials and partners (with logos)
- [ ] Real annual report / financial statement PDFs (Reports and documents)
- [ ] Program descriptions, images, and lead contacts
- [ ] Donation gateway links (see below)

## How the spec's features are implemented

| Feature | Where |
| --- | --- |
| Clear information architecture, ≤3 clicks | Six-item main menu, footer columns, in-page anchors. Every page is reachable in two clicks. |
| Responsive design | Fluid type and grids, mobile menu, tested at phone width. |
| Fast loading | Static HTML, one CSS file, ~15 KB of JS, SVG artwork, lazy images, no frameworks. |
| Prominent CTAs | Donate button in the header, hero buttons, CTA bands on every page. |
| Search with auto-suggestions | Press `/` or `⌘K` anywhere. Ranked suggestions from a build-time index (`/search.json`). Full results page at `/search/`. |
| Clean modern aesthetics, visual hierarchy | Design tokens in `src/assets/css/main.css`; Bricolage Grotesque + Inter. |
| High-quality media | Generative SVG artwork as placeholders; replace through the CMS image fields. |
| Favicon | SVG favicon plus PNG sizes, app icons, and a web manifest (`npm run icons`). |
| Value proposition above the fold | Hero headline, sub-headline, and three CTAs. |
| Accessible content | Skip link, landmarks, alt text fields, keyboard-operable menu/search/stepper/carousel, visible focus, AA contrast, reduced-motion support. |
| Social proof | Testimonial carousel, partner strip, mentions page, Instagram embeds or gallery. |
| Trust badges and security | HTTPS via GitHub Pages; trust row in the footer and on Donate; PCI handled by the gateway. |
| Transparent contact information | Address, phone, WhatsApp, email, hours, map, and named program leads on `/contact/` and in the footer. |
| Policies | `/privacy/`, `/terms/`, `/refunds/`, linked in the footer and on Transparency. |
| SEO | Clean URLs, per-page titles and descriptions, canonical links, proper headings, `sitemap.xml`, `robots.txt`, JSON-LD organization data. |
| Reliable uptime | GitHub Pages (static, CDN-served). |
| Analytics | GA4, Plausible, or GoatCounter: paste the ID in Site settings → Analytics. |
| Social media icons and links | Header menu (mobile), footer, Contact, Mentions. |
| Social share buttons | WhatsApp, X, Facebook, LinkedIn, email, copy link, and the native share sheet on posts and programs. Every share link carries `utm_source` / `utm_medium` / `utm_campaign`. |
| Social proof feeds | Site settings → Community feed: paste Instagram post URLs to embed them live, or curate a gallery. |
| Open Graph tags | Every page: title, description, image (post cover or the default card), locale, article metadata. |
| Auto-redirect and brand mention routing | `/go/<name>/` short links (CMS → Short links) redirect to the site with campaign tags, for bios, posts, posters, and partner sites. `/mentions/` collects coverage. Tag `@reina_zw` / `#REINAzw`. |
| Smart UTM tracking | `/tools/link-builder/` builds tagged links with presets and a QR code. Share buttons tag automatically. Forms record the referral source in a hidden field. |
| Mission, vision, impact metrics | `/about/` (mission, vision, values, aims, objectives, interactive theory of change) and `/impact/` (animated metrics, outcome bars, reach chart, stories). |
| Financial transparency | `/transparency/`: reports and statements (PDF), registration, policies, controls. Allocation donut on Donate. |
| Governance and leadership | `/team/`: board, leadership, team, accountability structure. |
| Compliance and legal status | Registration block on About and Transparency (Site settings → Registration). |
| Projects and programs portfolio | `/programs/` with status and theme filters; each program has timeline, partners, funding, milestones. |
| Donation portal | `/donate/`: one-time / monthly, amount chips, custom amount, impact copy, allocation donut, and hand-off to Stripe Payment Links, PayPal.me, or Paynow (Zimbabwe). Bank and mobile-money details as a fallback. |
| Field-level contacts | Program lead name and email on each program; "contactable" team members listed on Contact. |
| Public visitor counter | Footer and Impact. Uses GoatCounter's public counter when configured, otherwise a CMS baseline plus a per-browser daily increment. |
| Referral tracking analytics | Impact → "Where visitors come from" (CMS-maintained from your analytics), `?ref=` capture, forms record source. |
| Engagement metrics | Impact → live engagement: shares, downloads, sign-ups, comments (CMS baselines + on-site activity + analytics events). |

## Connecting services (one-time, no code)

All of these are fields in **Site settings** in the CMS.

- **Analytics.** Easiest and free: create a site at [goatcounter.com](https://www.goatcounter.com), enable "Allow public access to statistics" in its settings, and paste the code (the part before `.goatcounter.com`). This also powers the public visitor counter. Plausible and GA4 work too.
- **Forms.** Create a free form at [Formspree](https://formspree.io) (or Basin, Getform) and paste its endpoint URL into Contact / Newsletter / Get involved endpoints. Until then, forms open the visitor's email app with the message filled in, so nothing is lost.
- **Donations.** Any of: a [Stripe Payment Link](https://stripe.com/payments/payment-links) for one-time and another for monthly; a PayPal.me name; a [Paynow](https://www.paynow.co.zw) payment page for EcoCash/OneMoney/cards. Add bank and mobile-money details for offline gifts. The page adapts to whatever is filled in.
- **Instagram feed.** Paste public post URLs into Community feed → Instagram post URLs.

## CMS logins

Decap CMS at `/admin/` uses the GitHub backend, so editors log in with GitHub accounts that have write access to this repo. GitHub OAuth goes through Netlify's free relay, the same setup used for hopegroup.ai.

One-time setup:
1. Create a free Netlify account and a project called **reina-cms** (it only needs to exist; it can forward to the live site). `src/admin/config.yml` points at it with `site_domain: reina-cms.netlify.app`.
2. In GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App.** Name `REINA CMS`, homepage = the live site URL, callback URL `https://api.netlify.com/auth/done`. Copy the Client ID, generate a client secret.
3. In Netlify: **reina-cms → Project configuration → Access & security → OAuth → Install provider → GitHub**, paste the ID and secret.
4. Invite each editor to this GitHub repo as a collaborator. They log in at `/admin/` with GitHub.

Until that is done, anyone with the repo can edit locally: `npm run dev` plus `npm run cms`, then open `http://localhost:8089/admin/`.

## Hosting and domain

Pushes to `main` build and deploy through `.github/workflows/pages.yml`. In the repo's **Settings → Pages**, set the source to **GitHub Actions** once.

The site is served at `https://amateurmenace.github.io/reina-site/` until a custom domain is added. To use a domain, add a `CNAME` file in the repo root containing it (e.g. `reina.org.zw`), point the domain's DNS at GitHub Pages, and update `site_url`, `display_url`, and `logo_url` in `src/admin/config.yml`. The build detects the `CNAME` and switches to root URLs automatically.

## Project layout

```
src/
  _data/        site.json (settings), navigation, home, about, impact, testimonials, partners, faq
  _includes/    layouts (base, page, post, program, redirect) and partials (header, footer, search, share, cards…)
  admin/        Decap CMS (index.html + config.yml)
  assets/       css/main.css · js/{main,search,hero,donate,link-builder}.js · brand/ · img/art/ · docs/
  news/ programs/ team/ reports/ mentions/ links/   content collections (Markdown with front matter)
  *.njk / *.md  pages
scripts/        make-icons.js (PNG icons + OG image), make-art.py (placeholder artwork)
```
