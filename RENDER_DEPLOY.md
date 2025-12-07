# Deploying the frontend to Render

This file documents steps to deploy the frontend React/Vite site to Render as a Static Site.

1) Create a Static Site service on Render
- Connect to `SER515-Group1-Frontend-Repo` on GitHub.
- Set Branch: `main` (or `feature/frontend-validation-improvements`).
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment: `static` (automatic for `static_site` services)

2) Add Environment Variables
- `VITE_BASE_URL`: the URL of your backend service (e.g., `https://re-backend.onrender.com`).
  Set this in the Render UI under the Static Site service's environment variables.

3) Deploy
- Render will build and publish. If there are errors, review Build Logs in the Render dashboard.

4) Confirm & Test
- After a successful deployment, open the static site's URL, login, and exercise the UI. Verify API calls reach the backend (configured `VITE_BASE_URL`).

5) Optional — Custom Domain
- You can add a custom domain in the Render service affter build.

6) Rollback
- If something goes wrong, use the Render Dashboard to rollback to a prior successful deployment.
