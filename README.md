# Ecommerce Web

A full-stack ecommerce platform with a customer storefront, administration dashboard, secure authentication, catalog management, variants, inventory, cart, checkout, orders, payments, returns, reviews, support tickets, shipments, coupons, banners, notifications, reports, shipping rates, and store settings.

## Technology Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Django, Django REST Framework, Simple JWT
- Database: PostgreSQL
- API documentation: drf-spectacular

## Project Structure

```text
ecommerce-web/
├── backend/
│   ├── apps/
│   ├── config/
│   ├── docs/
│   ├── media/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── PROJECT_ROUTES.md
└── FIXES_AND_TESTS.md
```

## Windows Setup

### 1. PostgreSQL

Create a PostgreSQL database and update `backend/.env` with its name, user, and password.

```sql
CREATE DATABASE ecommerce_db;
```

### 2. Backend

```powershell
cd backend
py -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Do not run `copy .env.example .env` when a correctly configured `.env` already exists.

Backend URL: `http://127.0.0.1:8000`

### 3. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Do not run `copy .env.example .env` when a correctly configured `.env` already exists.

Frontend URL: `http://localhost:5173`

## Required Environment Variables

Backend variables are documented in `backend/.env.example`.

Frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Product Image Workflow

Product images are now managed through product-bound endpoints. The product is resolved from its slug on the server, so an uploaded image cannot accidentally create or attach to another product.

```text
POST   /api/catalog/products/{product_slug}/images/
PATCH  /api/catalog/products/{product_slug}/images/{image_id}/primary/
DELETE /api/catalog/products/{product_slug}/images/{image_id}/
```

Rules:

- The first uploaded image automatically becomes primary.
- Setting another image as primary demotes the previous primary image.
- Deleting the primary image automatically promotes the next image.
- Existing images cannot be moved to a different product.
- Product images must be 5 MB or smaller.

## Authentication and Cart Hotfix

- Public catalog pages use an anonymous API client and do not attach saved JWT tokens.
- Protected API requests refresh an expired access token before sending the request.
- Cart quantity updates use PostgreSQL-safe row locking and support products with or without variants.
- No new database migration is required for this hotfix.

## Quality Checks

Backend checks using PostgreSQL configuration:

```powershell
cd backend
venv\Scripts\activate
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

Backend tests using the included SQLite test settings:

```powershell
python manage.py test --settings=config.test_settings
```

Frontend checks:

```powershell
cd frontend
npm install
npm run lint
npm run build
```

## Important Packaging Rule

Do not upload or commit these generated folders:

```text
backend/venv/
frontend/node_modules/
frontend/dist/
```

Install dependencies locally from `requirements.txt` and `package.json` instead.

See `PROJECT_ROUTES.md` for API endpoint routes and frontend page routes.
