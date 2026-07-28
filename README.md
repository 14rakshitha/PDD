# LawVoice (சட்டக்குரல்)

Tamil legal assistance web app with People and Lawyer accounts, PDF-backed AI answers, and lawyer recommendations.

## Features

- **மக்கள் (People):** voice/text legal help, emergency numbers, lawyer directory, history
- **வழக்கறிஞர் (Lawyer):** profile dashboard, client requests, Tamil UI
- **Auth:** register + login for both roles (backend API)
- **AI:** Sarvam AI when configured; PDF knowledge base via `LAWVOICE_PDF_PATH`

## Local development

### 1. Backend (port 8081)

Requires **Java 17** (JDK). Maven is **not** required — use the included script.

```powershell
cd backend
$env:LAWVOICE_PDF_PATH="C:\Users\praji\Downloads\20240716890312078.pdf"
$env:SARVAM_API_KEY="your_sarvam_api_key"
.\run.ps1
```

Or double-click `backend\run.bat`.

> If `mvn` is not recognized, use `.\run.ps1` instead of `mvn spring-boot:run`.  
> The script downloads Maven once into `backend\.tools\` automatically.

**Note:** You do **not** need `winget install Maven` — `.\run.ps1` downloads Maven automatically into `backend\.tools\`.

### 2. Frontend (port 5190)

Uses Vite proxy to `/api` → backend (avoids CORS during dev).

```powershell
cd frontend
.\run.ps1
```

Or: `npm.cmd install --strict-ssl=false` then `npm.cmd run dev`

Open **http://localhost:5190**

If port 5190 is busy, Vite may use **5191** — CORS is configured for all `localhost` ports.

### Demo accounts (pre-seeded)

| Role | Email | Password |
|------|-------|----------|
| மக்கள் | people@lawvoice.com | people123 |
| வழக்கறிஞர் | lawyer@lawvoice.com | lawyer123 |

## Login page

1. Choose **மக்கள்** or **வழக்கறிஞர்**
2. Choose **பழைய பயனர்** (login) or **புதிய பயனர்** (register)
3. Submit — connects to `POST /api/auth/login` or `POST /api/auth/register`

## Deploy with Docker

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) **running**.

```powershell
cd c:\Users\praji\OneDrive\Desktop\COURSES\Rak\Lawvoice\LawVoice
copy .env.example .env
# Edit .env with SARVAM_API_KEY and LAWVOICE_PDF_PATH if needed
docker compose up --build
```

If you see `dockerDesktopLinuxEngine` pipe error, start **Docker Desktop** first, then retry.

- Website: **http://localhost:8080**
- API (direct): **http://localhost:8081/api**

The frontend container proxies `/api` to the backend.

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | New user (people/lawyer) |
| `/api/auth/login` | POST | Login |
| `/api/auth/me` | GET | Current user (Bearer token) |
| `/api/legal/ask` | POST | AI legal answer |
| `/api/lawyers` | GET | Lawyer list |
| `/api/health` | GET | Health check |

## Folders

- `frontend` — React + Vite
- `backend` — Spring Boot API
- `docker-compose.yml` — production-style stack
