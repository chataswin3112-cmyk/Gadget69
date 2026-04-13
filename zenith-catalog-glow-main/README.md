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

- H2 file database for local persistence
- Admin authentication
- CRUD APIs for categories, products, banners, settings, and community media
- Image/video/document uploads served from `/uploads/**`
- Order creation and admin order listing

Default admin login:

- Email: `admin@gadget69.com`
- Password: `admin123`

## Render Deployment

This repo now includes a Render Blueprint at [render.yaml](../render.yaml), a repo-root Dockerfile for direct Docker-based deploys, and the app's multi-stage Docker build at [Dockerfile](./Dockerfile).

What it deploys:

- one Docker web service for the Spring Boot API and the built React frontend
- one Render Postgres database
- one persistent disk mounted at `/var/data` for uploaded files

Core Render settings already handled in code:

- Spring Boot binds to Render's `PORT`
- the frontend is served by Spring Boot from the same origin
- Render's `DATABASE_URL` is converted into a JDBC URL automatically at startup
- uploaded files are stored at `APP_UPLOAD_DIR`, which the blueprint points to `/var/data/uploads`

Required environment variables:

- `APP_ADMIN_SECRET`: set this in Render before the first production deploy

Optional environment variables:

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
