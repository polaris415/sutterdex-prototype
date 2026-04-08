# SutterDex Prototype

Vendor resource directory for Sutter Health NorCal. React 19 + Vite + Tailwind CSS 4 + Zustand. Plain JavaScript — no TypeScript.

## Planning Mode

**YOU MUST NOT make any changes until you have 95% confidence in what needs to be built.** Ask follow-up questions until you reach that confidence. This applies to all changes, including small ones.

## Scripts

```bash
npm run dev            # local dev server
npm run build          # production build
npm run lint           # ESLint
npm run preview        # preview production build
npm run import-careport  # re-import Careport vendor data (scripts/importCareport.mjs)
```

## Git Workflow

- All development happens on the `dev` branch
- Never commit directly to `production`
- To deploy: promote `dev → production`, then push to the Vercel deploy repo

## Promoting to Production

```bash
# 1. Merge dev into production
git checkout production
git merge --no-ff origin/dev -m "chore: promote dev → production [$(date -u '+%Y-%m-%d %H:%M UTC')]"
git push origin production

# 2. Push to Vercel deploy repo
git push deploy production:main --force

# 3. Return to dev
git checkout dev
```

The `deploy` remote is `https://github.com/polaris415/sutterdex-prototype-deploy.git` — Vercel watches its `main` branch.

A GitHub Actions workflow (`.github/workflows/promote-to-production.yml`) automates this but requires a `GH_PAT` secret to be set in the repo settings.
