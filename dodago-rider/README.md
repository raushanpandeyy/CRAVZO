# Dodago Rider

Standalone Expo/React Native rider app for Dodago delivery partners. It uses the same production backend and database as the web app.

## Setup

1. Copy `.env.example` to `.env` if you want to override the API URL.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm start
```

## Current Features

- Rider-only login guard
- Online/offline status
- Foreground location sync while online
- New/active rider orders from the existing backend
- Accept/reject delivery requests
- Mark pickup with `OUT_FOR_DELIVERY`
- Complete delivery using customer OTP
- Delivery km and earnings display
- Order/customer chat screen
- Orders and earnings summary
- Profile and logout

No backend or database schema changes are required for this app.
