# marcell-lovassy.github.io

My CV and portfolio page: <https://marcell-lovassy.github.io>

A static site with no build step. GitHub Pages serves the `master` branch from the repository root.

## Layout

| Path | What |
| --- | --- |
| `index.html` | The whole page: hero, about, experience, Springdale, projects, skills, contact. |
| `assets/css/style.css` | All styles, including the print layout used by "Save as PDF". |
| `assets/js/main.js` | Navigation, the time-of-day viewer and the screenshot lightbox. |
| `assets/img/springdale/` | In-engine captures from Springdale, as WebP. |
| `404.html` | Not-found page. |

## Preview locally

```sh
python -m http.server 4173
```

Then open <http://localhost:4173>.

## Updating the screenshots

- **Gallery:** each image needs a full-size file (`name.webp`, up to 1920 px wide) and a thumbnail
  (`name-thumb.webp`, 800×450). Add or replace the matching `<li>` in one of the `gallery` lists in
  `index.html` (Episode One, the New York prologue, editor tooling). Keep the page at 20 images or fewer.
- **Hero background:** `hero-roadblock.webp`, 1920×1080.
- **Time-of-day viewer:** the files are `tod-<scene>-<hour>.webp` at 1600×900. Scenes and hours are
  listed at the top of the viewer code in `assets/js/main.js`.
