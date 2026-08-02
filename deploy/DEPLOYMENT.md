# Deployment Instructions (Render)

This folder contains all configuration files required for deploying **AI Crop Recommendation (green-harvest-buddy)** on Render.

## Folder Structure

```
deploy/
├── render.yaml          # Main Render Blueprint configuration
├── .renderignore        # Build exclusion rules to optimize build time
├── .env.example         # Template of required environment variables
└── DEPLOYMENT.md        # Deployment documentation
```

## How to Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect repository `amruroopa89-glitch/app`.
4. If prompted for **Blueprint Path**, enter: `deploy/render.yaml` (or leave default root `render.yaml`).
5. Provide your environment variable values (`VITE_SUPABASE_URL`, `SUPABASE_URL`, `OPENROUTER_API_KEY`, etc.).
6. Click **Deploy Blueprint**.
