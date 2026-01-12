<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/176uk2QaByQHlXsEy-nGIH49RkaXB7mPF

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy (automatic) — GitHub Pages via GitHub Actions

This repository includes a GitHub Actions workflow that will build the app and publish the `dist` folder to the `gh-pages` branch automatically whenever you push to the `main` branch.

Steps to enable automatic deploy:

1. Create a new repository on GitHub and push this project to it (example commands below). Replace `USERNAME` and `REPO`.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:USERNAME/REPO.git
git push -u origin main
```

2. After pushing, go to the repository on GitHub → Actions and confirm the `Deploy to GitHub Pages` workflow runs. It will build the project and publish to `gh-pages`.

3. In the repository settings → Pages, set the source to the `gh-pages` branch (root) if it isn't set automatically. The site URL will be shown there.

Notes:
- If you plan to serve the site under `https://USERNAME.github.io/REPO/` (a subpath), you may need to set the `base` option in `vite.config.ts` to `/REPO/` so asset paths work correctly.
- If your app requires the `GEMINI_API_KEY`, set that secret on the host/service you use for server-side calls. For GitHub Pages static hosting, environment variables are not available at runtime — only at build time via Actions. To provide the key at build time, add it as a repository secret `GEMINI_API_KEY` and modify the workflow to inject it during build (I can do that for you if needed).

### Providing `GEMINI_API_KEY` to the GitHub Actions build

The included GitHub Actions workflow will attempt to create a `.env.production` file from the repository secret named `GEMINI_API_KEY` before running `npm run build` so that Vite's `loadEnv` picks up the value during the build.

To add the secret in GitHub:

1. Go to your repository on GitHub → Settings → Secrets and variables → Actions → New repository secret.
2. Name it `GEMINI_API_KEY` and paste your API key as the value.

When the workflow runs, it will write `.env.production` with that key and the build will embed whatever is needed into the static output.

