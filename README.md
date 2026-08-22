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
index.html            the whole page
assets/css/style.css  design tokens + layout (shares the palette/typography
                       of raio's demo video: cream/blueprint canvas, Fraunces
                       serif, IBM Plex Mono/Sans, rust-orange accent)
assets/js/main.js     mobile nav, copy-to-clipboard, reveal-on-scroll
assets/img/           demo GIF/video, OG card, favicon
```

## Updating content

Crate map, roadmap milestones, and the "is/isn't" table are hand-synced with
[`raio/README.md`](https://github.com/andrewSarr/raio/blob/main/README.md) —
there's no shared data source, so if those change upstream, update
`index.html` to match.

The demo GIF/video and the OG card image (`assets/img/og-image.jpg`) are
rendered from the Remotion project that lives locally at `raio/promo/`
(gitignored in the main repo, not published anywhere) — see its `OgCard`
and `RaioPromo` compositions.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds nothing (there's
nothing to build) and publishes the directory as-is via GitHub Pages.

## License

MIT — see [`LICENSE`](LICENSE). raio itself (the Rust workspace) is
dual-licensed MIT OR Apache-2.0.
