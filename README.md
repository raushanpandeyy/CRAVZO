# 🍔 DODAGO - Food Delivery Platform

A full-stack food delivery application built with React, Node.js, Express, and PostgreSQL.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

---

## ✨ Features

- **User Management**: Customer, Vendor, Rider, and Admin roles
- **Restaurant Management**: Create and manage restaurants
- **Menu Management**: Add menu items with categories
- **Order Management**: Place, track, and manage orders
- **Reviews & Ratings**: Rate restaurants and food
- **Favorites**: Save favorite restaurants
- **Address Management**: Store multiple delivery addresses
- **Authentication**: JWT-based authentication with secure session

---

## 🛠 Tech Stack

### Frontend
- React 19
- Vite
- TailwindCSS
- Redux Toolkit
- React Router v7
- Framer Motion
- Recharts

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation
- Helmet for Security

### DevOps
- Docker & Docker Compose
- Nodemon (development)

---

## 📦 Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **PostgreSQL** >= 16 (or Docker)
- **Git**

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/dodago.git
cd dodago
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
cd ..
```

#### Frontend
```bash
npm install
```

---

## 🔐 Environment Setup

### Backend Configuration

Create `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and configure:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/dodago

# Frontend URL
CLIENT_URL=http://localhost:5173

# JWT (Use a long, random string in production)
JWT_SECRET=your-very-long-secret-key-here-at-least-16-chars
JWT_EXPIRES_IN=7d
```

### Frontend Configuration

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 💻 Running Locally

### 1. Start PostgreSQL

**Using Docker:**
```bash
docker run -d \
  --name dodago-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dodago \
  -p 5433:5432 \
  postgres:16
```

**Or using docker-compose (database only):**
```bash
# Start just the database service
docker-compose up postgres -d
```

### 2. Setup Database

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
cd ..
```

This will:
- Run pending migrations
- Seed sample data (admin, vendors, restaurants, menu items)

### 3. Start Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`

Health check: `http://localhost:5000/health`

### 4. Start Frontend (in a new terminal)

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🐳 Running with Docker

### Full Stack (Database + Backend + Frontend)

```bash
docker-compose up
```

This starts:
- **PostgreSQL**: `localhost:5433`
- **Backend**: `localhost:5000`
- **Frontend**: `localhost:5173`

### Stop Services
```bash
docker-compose down
```

### Rebuild Images
```bash
docker-compose up --build
```

---

## 🗄 Database

### Prisma Commands

```bash
cd backend

# View database in Prisma Studio
npm run prisma:studio

# Run pending migrations
npm run prisma:migrate

# Seed sample data
npm run prisma:seed

# Generate Prisma Client
npm run prisma:generate

# Check database connection
npm run db:check
```

### Sample Credentials (After Seeding)

**Admin:**
- Email: `admin@dodago.com`
- Password: `Admin@12345`

**Vendor:**
- Email: `seedvendor@dodago.com`
- Password: `Vendor@123`

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Main Routes

- `/auth` - Authentication (login, signup, logout)
- `/users` - User profile and addresses
- `/restaurants` - Restaurant management
- `/menu-items` - Menu management
- `/orders` - Order management
- `/admin` - Admin operations
- `/favorites` - Favorite restaurants
- `/reviews` - Reviews and ratings

### Authentication
All protected routes require JWT token in:
```
Authorization: Bearer <token>
```

Token is stored in `httpOnly` cookie automatically.

---

## 📁 Project Structure

```
dodago/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── server.js           # Server entry point
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Custom middleware
│   │   ├── routes/             # Route definitions
│   │   ├── validators/         # Input validation (Zod)
│   │   ├── utils/              # Utility functions
│   │   └── constants/          # Constants
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # Migration files
│   │   └── seed.js             # Seed script
│   ├── package.json
│   └── Dockerfile
├── src/
│   ├── components/             # React components
│   ├── pages/                  # Page components
│   ├── routes/                 # Route configuration
│   ├── services/               # API services
│   ├── stores/                 # Redux stores
│   ├── hooks/                  # Custom hooks
│   ├── constants/              # Constants
│   ├── utils/                  # Utility functions
│   ├── App.jsx
│   └── main.jsx
├── docker-compose.yml
├── Dockerfile
├── vite.config.js
├── package.json
└── .env.example
```

---

## 🧪 Development

### Run Linter
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## ⚠️ Important Notes

1. **Environment Variables**: Never commit `.env` files. Use `.env.example` as template.
2. **JWT Secret**: Use a long, random string in production. Never use default values.
3. **Database**: Ensure PostgreSQL is running before starting backend.
4. **Port Conflicts**: If ports 5000, 5173, or 5433 are in use, update configuration.
5. **CORS**: Frontend URL is configured in backend `.env` (CLIENT_URL).

---

## 🐛 Troubleshooting

### Database Connection Error
```
PrismaClientInitializationError: Can't reach database server
```
**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correct.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill process on that port or change `PORT` in `.env`.

### CORS Errors
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Check `CLIENT_URL` in backend `.env`.

### Module Not Found
```
Cannot find module 'dotenv'
```
**Solution**: Run `npm install` in both frontend and backend directories.

---

## 📝 License

This project is private and not licensed for public use.

---

## 👥 Contributors

- Your Name
- Development Team

---

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Made with ❤️ by DODAGO Team(Raushan Pandey)**
