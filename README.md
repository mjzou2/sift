# Sift 

> **Work in Progress** — Core features under active development

Lofi music discovery web app. Describe a vibe or pick a seed track, and Sift finds similar songs from a catalog of 4,500+ Lofi Records tracks using audio embeddings and cosine similarity.

![Sift landing page](docs/landing_page.png)

## How It Works

No AI runs at request time. The entire search backend is pre-computed CLAP audio embeddings (512-dimensional vectors) stored as static files. When you search:

1. Your text query gets matched to the closest pre-embedded phrase
2. That phrase's embedding is compared against all 4,594 track embeddings via cosine similarity
3. Top 20 results come back in ~80ms

You can also pick a seed track from the catalog, or combine both for a blended search (70% seed + 30% text).

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Search:** Pre-computed CLAP embeddings, cosine similarity in TypeScript
- **Data:** Static files (no database) — numpy embeddings converted to Float32 binary for Node.js
- **Deploy:** Vercel

## Local Development

```bash
# Install dependencies
npm install

# Convert data files (requires Python 3 with numpy and pandas)
pip install numpy pandas
npm run convert-data

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

All track data sourced from Spotify's public API. Audio embeddings generated with [LAION-CLAP](https://github.com/LAION-AI/CLAP).
