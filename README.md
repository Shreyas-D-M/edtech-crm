# EdTech CRM & Inquiry Management System

A full-stack student-built CRM and Inquiry Management portal developed for educational institutions and edtech platforms. It allows prospective students, parents, and schools to submit detailed inquiries while providing authorized administrators with a dashboard to track, filter, search, and manage inquiry resolutions.

Built with **React (Vite)** on the frontend and **Node.js + Express + PostgreSQL (Supabase)** on the backend.

---

## Architecture & Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | Fast hot module replacement, light bundle footprint, standard ES modules. |
| **Routing** | React Router v7 | Declarative SPA navigation and protected route management. |
| **Styling** | Vanilla CSS Design System | Maintainable custom stylesheet adhering to a muted navy / slate palette with accessible contrast. |
| **Backend Runtime** | Node.js & Express 4 | Lightweight RESTful micro-framework with predictable middleware architecture. |
| **Database** | PostgreSQL via Supabase | Relational data persistence with strict CHECK constraints, indexes, and triggers via `pg.Pool`. |
| **Authentication** | Custom JWT + HTTP-only Cookies | Standard JWT signed on backend, persisted in secure `httpOnly` cookies to mitigate XSS attacks. |
| **Password Security** | `bcryptjs` (Salt rounds = 10) | Strong one-way password hashing; plaintext passwords never touch database or API responses. |
| **CSRF Defense** | Double-Submit Cookie Pattern | State-changing operations require matching `X-CSRF-Token` headers for cookie-authenticated sessions. |
| **API Client** | Native Fetch API | Browser-standard API client with credentials mode enabled for cookie propagation. |

---

## Directory Structure

```text
edtech-crm/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InquiryDetailModal.jsx    # Modal dialog for full inquiry inspection & status change
│   │   │   └── ProtectedRoute.jsx        # Auth guard redirecting unauthenticated users to /login
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global session provider with login/logout state
│   │   ├── pages/
│   │   │   ├── InquiryPage.jsx           # Public responsive inquiry submission form
│   │   │   ├── LoginPage.jsx             # Admin authentication portal
│   │   │   └── DashboardPage.jsx         # Admin management dashboard with metrics, search, and filters
│   │   ├── services/
│   │   │   └── api.js                    # Standardized fetch service with CSRF & credentials handling
│   │   ├── styles/
│   │   │   ├── index.css                 # Global design system, typography, colors, and badges
│   │   │   ├── inquiry.css               # Public portal and confirmation layout styles
│   │   │   ├── login.css                 # Centered login card styles
│   │   │   └── dashboard.css             # Stats grid, data table, and filter controls
│   │   ├── App.jsx                       # Main application router
│   │   └── main.jsx                      # React DOM root entry
│   ├── .env.example                      # Public frontend environment template
│   ├── vite.config.js                    # Vite configuration with local proxy to backend
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                     # PostgreSQL connection pool with Supabase SSL handling
│   │   ├── controllers/
│   │   │   ├── authController.js         # Login, logout, session check, CSRF tokens
│   │   │   ├── inquiryController.js      # Public creation, filtered listing, viewing, status patch
│   │   │   └── dashboardController.js    # Database-computed aggregate statistics
│   │   ├── middleware/
│   │   │   ├── auth.js                   # JWT verification via HTTP-only cookie or Bearer header
│   │   │   ├── csrf.js                   # CSRF defense middleware
│   │   │   ├── validate.js               # Strict server-side validation and sanitization
│   │   │   └── errorHandler.js           # Centralized error handler with PostgreSQL code mapping
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # /api/auth routes
│   │   │   ├── inquiryRoutes.js          # /api/inquiries routes
│   │   │   └── dashboardRoutes.js        # /api/dashboard routes
│   │   ├── services/
│   │   │   ├── authService.js            # Admin authentication business logic
│   │   │   ├── inquiryService.js         # Parameterized SQL queries for search/filters/pagination
│   │   │   └── dashboardService.js       # Live database KPI aggregation
│   │   ├── utils/
│   │   │   └── logger.js                 # Structured logger
│   │   ├── app.js                        # Express setup with Helmet, CORS, and Rate Limiting
│   │   └── server.js                     # HTTP server startup with graceful shutdown
│   ├── database/
│   │   └── schema.sql                    # PostgreSQL schema executable in Supabase SQL editor
│   ├── scripts/
│   │   └── create-admin.js               # Safe CLI command to provision system administrators
│   ├── tests/
│   │   ├── api.test.js                   # Endpoint, health check, and route security tests
│   │   ├── auth.test.js                  # JWT and bcrypt verification unit tests
│   │   ├── inquiry.service.test.js       # Parameterized SQL and aggregation tests
│   │   └── validation.test.js            # Input validation, sanitization, and constraint tests
│   ├── .env.example                      # Backend environment template
│   └── package.json
├── .gitignore
├── package.json                          # Monorepo convenience scripts
└── README.md
```

---

## Database Setup (Supabase PostgreSQL)

The backend uses a standard PostgreSQL connection pool (`pg.Pool`) connecting to your Supabase project.

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> Database -> Connection string**:
   - Select **URI**.
   - Choose either **Session mode** (Port 5432) or **Transaction pooler** (Port 6543).
   - Copy the connection URI:
     ```text
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

### 2. Execute the Database Schema
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Click **New Query**, copy the contents of `backend/database/schema.sql`, and click **Run**.
3. This creates:
   - `admins` table with unique lowercase email and bcrypt password hash.
   - `inquiries` table with constraints for `user_type`, `category`, and `status`.
   - Indexing on `status`, `category`, `user_type`, `created_at`, `name`, and `phone`.
   - Automatic trigger `set_inquiries_updated_at` to refresh `updated_at` on updates.

---

## Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5001` |
| `NODE_ENV` | Application environment | `development` or `production` |
| `DATABASE_URL` | Supabase PostgreSQL Connection URI | `postgresql://postgres:pass@db.ref.supabase.co:5432/postgres` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `min_32_characters_random_secure_key` |
| `JWT_EXPIRES_IN` | Token lifespan | `24h` |
| `FRONTEND_URL` | Allowed origin for CORS and cookies | `http://localhost:5173` |
| `ADMIN_NAME` | Default initial admin name (for setup script) | `System Administrator` |
| `ADMIN_EMAIL` | Default initial admin email | `admin@edtech.com` |
| `ADMIN_PASSWORD` | Default initial admin password (min 8 chars) | `AdminSecurePassword123!` |

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for Express API (leave blank for local proxy) | `http://localhost:5001` (or empty for proxy `/api`) |

---

## Local Development & Execution

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
*(Or install individually: `cd backend && npm install`, `cd frontend && npm install`)*

### 2. Provision the Initial Administrator
Run the secure CLI script:
```bash
# Option A: Uses ADMIN_EMAIL and ADMIN_PASSWORD from backend/.env
npm run create-admin

# Option B: Pass custom administrator credentials via CLI arguments
cd backend && node scripts/create-admin.js "Super Admin" "admin@edtech.com" "MyStrongPassword123!"
```
*Note: Passwords are automatically hashed with bcrypt before insertion. No public registration endpoints exist.*

### 3. Run the Backend Server
```bash
npm run backend:dev
# Backend runs on http://localhost:5001
```

### 4. Run the Frontend Development Server
In a separate terminal:
```bash
npm run frontend:dev
# Frontend runs on http://localhost:5173
```
- Open `http://localhost:5173` for the **Public Inquiry Portal**.
- Open `http://localhost:5173/login` for the **Admin Portal**.

---

## Testing & Verification

Run the comprehensive automated test suite (31 tests across 4 test suites):

```bash
npm test
```

### Test Coverage Summary:
- **`tests/validation.test.js`**: Validates required fields, email format, phone numbers (7–15 digits), allowed user types (`Parent`, `Student`, `School`), allowed categories (`Scholarship`, `Concert`, `Admission`, `General Query`), string length boundaries, and trimming/sanitization.
- **`tests/auth.test.js`**: Verifies bcrypt hashing, password matching, rejection of wrong passwords, JWT signing, HTTP-only cookie extraction, Bearer header fallback, and rejection of expired/corrupted tokens.
- **`tests/api.test.js`**: Verifies health check (`GET /api/health`), unauthorized request rejection (401) on protected routes, CSRF token issuance, and 404 responses for undefined routes.
- **`tests/inquiry.service.test.js`**: Verifies parameterized SQL query generation (`$1, $2, ...`) ensuring SQL injection safety, multi-field filtering, partial search, pagination offsets, status modification, and aggregate stats computation.

---

## API Documentation

All API responses return consistent JSON structures:
- Success: `{ "success": true, "data": ..., "message": "..." }`
- Error: `{ "success": false, "error": "...", "details": { ... } }`

### Public Endpoints

#### 1. Submit Inquiry
- **Endpoint**: `POST /api/inquiries`
- **Request Body**:
  ```json
  {
    "name": "Alex Smith",
    "email": "alex.smith@example.com",
    "phone": "+1 (555) 234-5678",
    "user_type": "Student",
    "category": "Scholarship",
    "message": "I would like to apply for the STEM scholarship program."
  }
  ```
- **Response**: `201 Created` with inquiry record, default status `"New"`, and unique UUID.

#### 2. Admin Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "admin@edtech.com",
    "password": "AdminSecurePassword123!"
  }
  ```
- **Response**: `200 OK` + Sets `token` in an HTTP-only cookie and sets `csrf_token` cookie.

#### 3. CSRF Token
- **Endpoint**: `GET /api/auth/csrf-token`
- **Response**: `200 OK` with 64-character hex CSRF token.

### Protected Admin Endpoints (Requires Valid Admin Cookie or Bearer Token)

#### 4. Current Admin Profile
- **Endpoint**: `GET /api/auth/me`
- **Response**: `200 OK` with authenticated admin details (`id`, `name`, `email`).

#### 5. Admin Logout
- **Endpoint**: `POST /api/auth/logout`
- **Response**: `200 OK` + Clears `token` and `csrf_token` cookies.

#### 6. List Inquiries
- **Endpoint**: `GET /api/inquiries`
- **Query Parameters**:
  - `category`: `Scholarship | Concert | Admission | General Query | All`
  - `user_type`: `Parent | Student | School | All`
  - `status`: `New | In Progress | Resolved | All`
  - `search`: Partial match for name (case-insensitive) or phone number
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`, max: `100`)
- **Response**: `200 OK` with paginated inquiry array and total records.

#### 7. View Inquiry Details
- **Endpoint**: `GET /api/inquiries/:id`
- **Response**: `200 OK` with complete submission data.

#### 8. Update Inquiry Status
- **Endpoint**: `PATCH /api/inquiries/:id/status`
- **Headers**: `X-CSRF-Token: <csrf_token>` (for cookie sessions)
- **Request Body**:
  ```json
  {
    "status": "In Progress"
  }
  ```
- **Response**: `200 OK` with updated inquiry record and refreshed `updated_at`.

#### 9. Dashboard Statistics
- **Endpoint**: `GET /api/dashboard/stats`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "total": 45,
      "new": 12,
      "inProgress": 18,
      "resolved": 15
    }
  }
  ```

---

## Deployment Instructions

### Frontend Deployment (Vercel / Netlify)
1. Push this repository to GitHub/GitLab.
2. Create a new site pointing to the `frontend/` directory:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_API_URL`: URL of your deployed backend (e.g. `https://edtech-crm-api.onrender.com`).
4. In SPA hosting like Netlify/Vercel, add rewrite rule for client routing (`/* -> /index.html 200`).

### Backend Deployment (Render / Railway / Fly.io)
1. Create a Web Service pointing to `backend/`:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
2. Environment Variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: A secure 64+ char random string.
   - `FRONTEND_URL`: URL of your deployed frontend (e.g. `https://edtech-crm.vercel.app`).
3. Run the initial admin script in the Render/Railway shell:
   ```bash
   node scripts/create-admin.js "Super Admin" "admin@edtech.com" "YourProductionPassword123!"
   ```

---

## Security Best Practices Implemented
1. **No Plaintext Passwords**: Uses `bcryptjs` with 10 salt rounds.
2. **No Public Admin Registration**: Admin accounts can only be created via the secure server-side CLI utility.
3. **HTTP-Only Cookies**: JWT tokens are transmitted via `httpOnly`, `sameSite`, and `secure` cookies, preventing JavaScript access and XSS theft.
4. **CSRF Protection**: Double-submit cookie pattern verifies `X-CSRF-Token` headers for mutating requests.
5. **SQL Injection Immune**: All database queries use parameterized placeholders (`$1, $2, ...`); no raw user input is ever concatenated into SQL strings.
6. **Rate Limiting**: `express-rate-limit` enforces limits on global requests, login attempts (20 / 15m), and public inquiries (50 / 1h per IP).
7. **Security Headers**: `helmet` is enabled for HTTP header hardening.
8. **Environment Segregation**: Secrets and `.env` files are excluded from Git via `.gitignore`.
