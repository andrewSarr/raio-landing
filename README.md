# raio landing page

The marketing/landing site for [raio](https://github.com/andrewSarr/raio), an
open-source, Pix-inspired instant-payment foundation in Rust. Deployed to
GitHub Pages from this repo.

Deliberately dependency-free: plain HTML, CSS, and vanilla JS — no framework,
no build step, no `node_modules` to rot. Open `index.html` in a browser, or
serve the directory with anything static:

```bash
python3 -m http.server 8000
# or
npx serve .
```

## Structure

```text
index.html            home — hero (phone demo video), quickstart, "is/isn't"
crates.html           the crate map (eight crates, one root of trust)
architecture.html     the one rule + the trait seams
roadmap.html          milestones (M1–M3 shipped, M4–M7 open)
assets/css/style.css  design tokens + layout (shares the palette/typography
                       of raio's demo video: cream/blueprint canvas, Fraunces
                       serif, IBM Plex Mono/Sans, rust-orange accent)
assets/js/main.js     off-canvas mobile nav, copy-to-clipboard, reveal-on-scroll
assets/img/           phone demo video/poster, overview video, OG card, favicon
```

The nav, footer, and `<head>` are duplicated on each page (no build step, no
includes) — keep them in sync when editing.

## Updating content

The crate map, roadmap milestones, and the "is/isn't" table are hand-synced
with [`raio/README.md`](https://github.com/andrewSarr/raio/blob/main/README.md)
— there's no shared data source, so if those change upstream, update the
relevant page (`crates.html`, `roadmap.html`, `index.html`) to match.

The hero phone demo (`assets/img/phone-hero.mp4` + `.jpg` poster), the full
overview video (`assets/img/raio-promo.mp4`), and the OG card image
(`assets/img/og-image.jpg`) are rendered from the Remotion project that lives
locally at `raio/promo/` (gitignored in the main repo, not published
anywhere) — see its `PhoneHero`, `RaioPromo`, and `OgCard` compositions.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds nothing (there's
nothing to build) and publishes the directory as-is via GitHub Pages.

## License

MIT — see [`LICENSE`](LICENSE). raio itself (the Rust workspace) is
dual-licensed MIT OR Apache-2.0.
