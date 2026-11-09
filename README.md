# Simson 2026 Debate Championship — Prep Lessons

Five-class walkthrough for coaching the 2026 Simson Debate Tournament team, with every printable handout and reference PDF. Runs as a Cloudflare Worker that serves the static page and PDFs behind one shared password.

## Layout

- `public/index.html` — the lesson walkthrough (Days 1–5, step timer, teacher notes, Materials tab)
- `public/materials/` — all handouts and teacher references (PDF)
- `src/index.js` — the password gate; serves `public/` once signed in
- `wrangler.jsonc` — Worker config (`simson2026debatechampionship`)

## Set the password

The site won't open until a password is set:

```
npx wrangler secret put SITE_PASSWORD
```

or Cloudflare dashboard → Workers & Pages → simson2026debatechampionship → Settings → Variables and Secrets → add a **Secret** named `SITE_PASSWORD`.

Signing in sets a cookie for 30 days. Visit `/logout` to sign out. Changing the password signs everyone out.

## Deploy

Connect this repo in Cloudflare (Workers & Pages → Create → Import a repository) so it builds from `main`, or run `npm install && npm run deploy`.

Local preview: put `SITE_PASSWORD=...` in `.dev.vars`, then `npm run dev`.
