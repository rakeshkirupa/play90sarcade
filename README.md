# 90s Arcade — Retro Gaming Site

A nostalgic site for 90s kids: homepage + playable Classic Nokia Snake.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve -p 8080
```

Then visit **http://localhost:8080**

## Structure

- **index.html** — Homepage (hero, featured game, games grid, 90s memories, ad placeholders)
- **snake.html** — Classic Nokia Snake (LCD style, keyboard + on-screen pad, sounds, best score)
- **css/style.css** — Retro palette, animations, responsive layout
- **js/animations.js** — Homepage floating pixel blocks
- **js/sounds.js** — Web Audio beeps (button, eat, game over)
- **js/snake.js** — Full snake game logic
- **assets/** — Icons and images (add your own)

## Snake controls

- **Arrow keys** or **on-screen pad** to move
- **Space** or **Play Again** to restart after game over
- Best score is saved in local storage (persists across sessions, secured via `js/security.js`).

## Security

- **js/security.js** — Rate limiting, secure session storage for scores, safe cookie helper.
- **CSP and security meta tags** on all pages.
- **Hosting headers** — Use `_headers` (Netlify), `vercel.json` (Vercel), or `.htaccess` (Apache) when you deploy.

See **SECURITY.md** for details and DDoS/hosting guidance.

## Google Ads / SEO

- **Navigation:** Header and footer links on all pages (Home, About, Privacy Policy, Contact, Terms).
- **Pages:** Homepage, About, Privacy Policy, Contact, Terms, plus game pages (Snake, Tetris, Brick Breaker, Hangman, Memory).
- **SEO:** Each page has `<meta name="description">`, `<meta name="keywords">`, canonical URL, and Open Graph tags.
- **Favicon:** `favicon.png` in the project root (neon “A” on dark background). Linked on every page.

**Domain:** The site is configured for `https://rakeshkirupa.github.io/play90sarcade/` (canonical, `og:url`, `og:image`, sitemap, robots.txt) for Google Ads submission.

Made for 90s kids.
