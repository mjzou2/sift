# Sift

> **Work in Progress** — Core features under active development

Lofi music discovery web app. Describe a vibe or pick a seed track, and Sift finds similar songs from a catalog of 4,500+ Lofi Records tracks using audio embeddings and cosine similarity.

![Sift landing page](docs/landing_page.png)

## How It Works

The search backend is pre-computed CLAP audio embeddings (512-dimensional vectors) stored as static files. When you search:

1. Claude Haiku extracts mood/vibe tags from your query (e.g. "rainy day sadness" → `["sad", "rain", "piano"]`)
2. Those tags find the best matching pre-embedded phrase from 116 candidates
3. That phrase's embedding is compared against all 4,594 track embeddings via cosine similarity
4. Top 20 results come back in ~80ms

If the Claude API is unavailable, search falls back to fuzzy string matching — it always works.

You can also pick a seed track from the catalog, or combine both for a blended search (70% seed + 30% text).

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Search:** Pre-computed CLAP embeddings, cosine similarity in TypeScript
- **NLP:** Claude Haiku for tag extraction from freeform queries (Anthropic SDK)
- **Audio:** Spotify Web API for previews and playlist saving (OAuth)
- **Data:** Static files (no database) — numpy embeddings converted to Float32 binary for Node.js
- **Deploy:** Vercel

## Local Development

```bash
# Install dependencies
npm install

# Convert data files (requires Python 3 with numpy and pandas)
pip install numpy pandas
npm run convert-data

# Set up environment variables
cat > .env.local << 'EOF'
# Claude API (optional — search works without it via fuzzy fallback)
ANTHROPIC_API_KEY=sk-ant-...

# Spotify API (required for previews and playlist saving)
SPOTIFY_CLIENT_ID=your_client_id
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
EOF

# Start dev server
npm run dev
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001) (use `127.0.0.1`, not `localhost` — required for Spotify OAuth redirect).

### Spotify Setup

1. Create an app at [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Add redirect URIs: `http://127.0.0.1:3001/callback` (dev) and `https://sift.love/callback` (prod)
3. Copy the Client ID and Client Secret to `.env.local`

## License

All track data sourced from Spotify's public API. Audio embeddings generated with [LAION-CLAP](https://github.com/LAION-AI/CLAP).
