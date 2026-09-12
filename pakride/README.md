# PakRide
## AI Smart Carpool Matching Platform

Smarter Routes. Better Matches. Shared Journeys.

PakRide is an AI-powered smart carpooling platform that connects riders and drivers using intelligent route compatibility and ride matching.

## Project Overview

PakRide is a full-stack carpooling application for Pakistan. The platform allows riders and drivers to create profile records, register a ride offer, discover compatible rides, and book or complete trips through a real-time messaging and booking flow.

## Key Features

- User registration and login with Supabase-backed persistence and JWT authentication.
- Ride posting, ride browsing, ride booking, ride completion, and ride rating flows.
- AI route matching using a Python Flask service and scikit-learn clustering.
- Real-time socket notifications and in-ride messaging between users.
- React Native and Expo frontend for mobile and web UI.

## Tech Stack

- Frontend: React Native, Expo, React Native Maps, Leaflet, Socket.io client.
- Backend: Node.js, Express, JWT, Socket.io, Supabase client.
- Database: PostgreSQL-compatible Supabase schema.
- AI service: Python, Flask, NumPy, scikit-learn.

## Architecture

The repository is organized into a Node/Express API backend, a React Native/Expo frontend, a Flask AI engine, and a Supabase SQL schema. The backend reads environment variables for the Supabase URL and anon key and uses a JWT secret server-side. The frontend is a client that stores and submits user session information through the backend API.

## Ride Matching Explanation

The AI service calculates route overlap and separation metrics between a rider request and available rides, then uses a K-means clustering pass to prioritize similar route groups. The route overlap score is returned to the backend and exposed through the matching API.

## Backend / API Overview

The Express server exposes routes for authentication, ride management, user profile data, and AI ride matching. It constructs a Supabase client from environment variables and validates user sessions with an authorization middleware.

## AI Matching Service

The Python service under `backend/ai/ai_engine.py` contains the Flask HTTP API and deterministic route overlap calculation logic used by the matching endpoints. It depends on Flask, Flask CORS, NumPy, and scikit-learn.

## Installation

```bash
cd pakride/backend
npm install
cp .env.example .env
npm run dev
```

The frontend can be run from the Expo app directory:

```bash
cd pakride/frontend
npm install
npx expo start
```

The AI service can run from the backend AI directory:

```bash
cd pakride/backend/ai
pip install -r requirements.txt
python ai_engine.py
```

## Environment Setup

The committed example file must be copied to a local `.env` file and filled in with safe placeholders and project-specific values. Do not commit live credentials or service-role keys. Keep server-only values in the backend environment and never expose them inside the frontend.

## Run Instructions

1. Start the backend API with `npm run dev`.
2. Start the Flask AI service.
3. Start the Expo frontend with `npx expo start`.
4. Use the Supabase schema in the SQL file to create the database tables.

## Project Structure

```text
pakride/
├── backend/
│   ├── ai/
│   ├── middleware/
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── components/
│   ├── screens/
│   ├── package.json
│   └── App.js
└── database/
    └── schema.sql
```

## Screenshots

Screenshots are not part of the repository. The current app is organized around screens such as Home, Login, Register, Profile, Offer Ride, Find Ride, My Rides, Messages, and Ride Detail.

## Security and Configuration Note

Use `.env` files only locally. The project is configured to ignore `.env` files and credential artifacts. Public-facing code should contain only safe public configuration. Server-only credentials such as JWT secrets, Supabase URL and anon keys, and database access values must remain in the backend environment.

## Future Improvements

Future work could add production deployment configuration, stronger secret rotation, automated CI secret scanning, and safer route/ride privacy separation.

## Author / Contact

PakRide is a student project and currently maintained as a local project repository. Public GitHub contact should be handled through the repository owner profile referenced by the origin remote.
