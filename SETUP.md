# 🚀 Quick Start Guide

## 30-Second Setup

### Option 1: Docker (Recommended)
```bash
# Copy env files
cp backend/.env.example backend/.env
cp .env.example .env

# Start everything
docker-compose up
```
Visit: `http://localhost:5173`

---

### Option 2: Local Development

#### Step 1: Start Database
```bash
docker run -d --name cravzo-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cravzo \
  -p 5433:5432 \
  postgres:16
```

#### Step 2: Configure Environment
```bash
cp backend/.env.example backend/.env
cp .env.example .env
```

#### Step 3: Setup Database
```bash
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed
cd ..
```

#### Step 4: Install Frontend
```bash
npm install
```

#### Step 5: Start Services (2 terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## 📊 Database Schema

Access Prisma Studio to view/manage database:
```bash
cd backend
npm run prisma:studio
```

---

## 🔑 Test Credentials (After Seeding)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@cravzo.com | Admin@12345 | Full access |
| Vendor | seedvendor@cravzo.com | Vendor@123 | Manage restaurants |

---

## 🛑 Common Issues

| Issue | Fix |
|-------|-----|
| Port 5433/5000/5173 already in use | Change port in `.env` or kill process |
| Database connection error | Ensure PostgreSQL container is running |
| `ERR_MODULE_NOT_FOUND` | Run `npm install` in backend folder |
| CORS errors | Verify `CLIENT_URL` and `VITE_API_BASE_URL` match |

---

## 📦 Available Commands

### Backend
```bash
npm run dev              # Development server with auto-reload
npm start                # Production server
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run db:check         # Check database connection
```

### Frontend
```bash
npm run dev              # Development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

### Docker
```bash
docker-compose up        # Start all services
docker-compose down      # Stop all services
docker-compose logs      # View logs
docker-compose ps        # List running services
```

---

## ✅ Health Check URLs

- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost:5173`
- Database (Postgres): `localhost:5433`

---

For detailed documentation, see [README.md](README.md)
