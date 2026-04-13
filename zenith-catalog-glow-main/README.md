# Gadget69 Catalog

Vite + React storefront and admin panel for Gadget69.

## Frontend

```bash
npm install
npm run dev
```

The frontend expects the backend API at `http://localhost:8081/api`.

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

## Notes

- Uploaded files are stored under `backend/uploads`
- Database files are stored under `backend/data`
