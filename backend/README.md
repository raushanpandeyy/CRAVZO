# CRAVZO Backend

Express + Prisma + PostgreSQL backend scaffold for the CRAVZO app.

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Make sure PostgreSQL is installed and a database named `cravzo` exists
4. Generate Prisma client with `npm run prisma:generate`
5. Check DB connectivity with `npm run db:check`
6. Run migrations with `npm run prisma:migrate`
7. Seed the first admin with `npm run prisma:seed`
8. Start the server with `npm run dev`

## Initial Modules

- Auth
- Users
- Restaurants
- Menu items
- Orders
- Admin

## Suggested Next Steps

1. Implement signup/login with Prisma persistence
2. Wire frontend localStorage flows to API calls
3. Add cart/address/order creation endpoints
4. Add vendor order actions and rider assignment flow
