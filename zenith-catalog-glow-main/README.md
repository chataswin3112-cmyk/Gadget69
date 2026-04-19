# Gadget69 Catalog

Vite + React storefront and admin panel for Gadget69.

## Frontend

```bash
npm install
npm run dev
```

The frontend uses `/api` by default. During local development, Vite proxies `/api` and `/uploads` to the backend on `http://localhost:8081`.

## Backend

The Spring Boot backend lives in [backend](./backend).

Main features:

- H2 file database for local persistence, plus MySQL/Postgres deployment support
- Admin authentication
- CRUD APIs for categories, products, banners, settings, and community media
- Image/video/document uploads served from `/uploads/**`
- Curated 20-product live catalog sync with no demo fallbacks
- Razorpay Standard Checkout order creation, checkout verification, and webhook reconciliation
- Order creation and admin order listing

Default admin login:

- Email: `admin@gadget69.com`
- Password: `Admin@123`

Catalog maintenance:

- Fresh databases seed the curated 10-category, 20-product catalog from `backend/src/main/resources/catalog/live-catalog.json`.
- Existing demo databases can be replaced by calling admin-only `POST /api/admin/catalog/replace-demo-data`.
- The storefront intentionally shows API loading, empty, or error states instead of mock products, reviews, or community media.

Database env contract:

- Render production: use the managed Postgres connection injected as `DATABASE_URL`
- Manual/local MySQL or Postgres: use `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`
- MySQL shortcut envs are also supported: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- Local fallback without MySQL/Postgres: leave those unset and the backend falls back to embedded H2 unless `APP_REQUIRE_POSTGRES=true`
- Unsupported datasource env aliases: `DB_URL`, `DB_USER`, `DB_PASSWORD`

Razorpay env contract:

- `APP_RAZORPAY_ENABLED`: set `true` only when the key id, key secret, and webhook secret are configured.
- `APP_RAZORPAY_KEY_ID`: publishable key returned to the checkout UI. Use test keys locally and live keys only in production.
- `APP_RAZORPAY_KEY_SECRET`: server-only secret used to create Razorpay orders and verify checkout signatures.
- `APP_RAZORPAY_WEBHOOK_SECRET`: server-only webhook signing secret from the Razorpay dashboard.
- `APP_RAZORPAY_ORDERS_API_URL`: optional override, defaults to `https://api.razorpay.com/v1/orders`.
- Alias env names also work: `RAZORPAY_ENABLED`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `RAZORPAY_ORDERS_API_URL`.

Local env loading:

- For local runs, the backend auto-loads `.env`, `.env.local`, `backend/.env`, and `backend/.env.local` if present.
- Process environment variables still win over values from env files.
- Keep real Razorpay secrets in ignored env files only. Do not commit them.

Live mode notes:

- When you switch to live mode, both `APP_RAZORPAY_KEY_ID` and `APP_RAZORPAY_KEY_SECRET` must be the matching live pair from the same Razorpay account.
- If your Render service already stores the keys as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, the backend now reads those too.
- The frontend does not need a separate Razorpay env; it receives the publishable key id from the backend order response.
- Webhook updates such as capture and refund reconciliation require a public HTTPS URL that Razorpay can reach.

Do not commit Razorpay secrets. Keep local values in your shell or ignored environment files, and configure production values in Render.

## Render Deployment

This repo now includes a Render Blueprint at [render.yaml](../render.yaml), a repo-root Dockerfile for direct Docker-based deploys, and the app's multi-stage Docker build at [Dockerfile](../Dockerfile).

What it deploys:

- one Docker web service for the Spring Boot API and the built React frontend
- one Render Postgres database
- one persistent disk mounted at `/var/data` for uploaded files

Core Render settings already handled in code:

- Spring Boot binds to Render's `PORT`
- the frontend is served by Spring Boot from the same origin
- Render's `DATABASE_URL` is the primary production datasource input and is converted into a JDBC URL automatically at startup
- MySQL deployments can use `SPRING_DATASOURCE_*` directly or the `MYSQL_*` shortcut envs
- Render deploys now fail fast if no Postgres env is present, instead of silently falling back to H2
- uploaded files are stored at `APP_UPLOAD_DIR`, which the blueprint points to `/var/data/uploads`
- outside Render, or when `APP_REQUIRE_POSTGRES` is not enabled, the backend can still fall back to an embedded H2 file database

Supported datasource env names:

- `DATABASE_URL`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- existing `PG*/POSTGRES_*` compatibility envs

Unsupported datasource env names:

- `DB_URL`
- `DB_USER`
- `DB_PASSWORD`

Required environment variables:

- `APP_ADMIN_SECRET`: set this in Render before the first production deploy

Optional environment variables:

- `APP_RAZORPAY_ENABLED`
- `APP_RAZORPAY_KEY_ID`
- `APP_RAZORPAY_KEY_SECRET`
- `APP_RAZORPAY_WEBHOOK_SECRET`
- `APP_CLOUDINARY_CLOUD_NAME`
- `APP_CLOUDINARY_API_KEY`
- `APP_CLOUDINARY_API_SECRET`
- `APP_CLOUDINARY_COMMUNITY_VIDEO_FOLDER`
- `APP_TWILIO_ACCOUNT_SID`
- `APP_TWILIO_AUTH_TOKEN`
- `APP_TWILIO_WHATSAPP_FROM`
- `APP_ALLOWED_ORIGINS` if you later serve the frontend from a different domain

Deploy flow:

1. Push this repo to GitHub.
2. In Render, either create a new Blueprint instance from the repo or point a Docker web service at the repo root.
3. Confirm the web service and Postgres database from [render.yaml](../render.yaml).
4. Set `APP_ADMIN_SECRET` when Render prompts for it.
5. Deploy.

Notes:

- The web service uses the `starter` plan because Render persistent disks are not available on the free web tier.
- The database uses `basic-256mb` by default. Change plans in `render.yaml` if you want a different cost/performance setup.
- Community video uploads require Cloudinary credentials. Without them, the rest of the app still works.
- OTP-based password reset requires Twilio credentials. Regular admin login still works without Twilio.

## Notes

- Uploaded files are stored under `backend/uploads`
- Database files are stored under `backend/data`
