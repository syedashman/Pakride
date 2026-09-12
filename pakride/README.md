# 🚗 PakRide — Smart Carpool App

AI-powered carpool matching app for Pakistan. Built with Node.js, Python (AI), React Native, and Supabase.

---

## 📁 Project Structure

```
pakride/
├── backend/
│   ├── server.js          ← Main API server
│   ├── routes/            ← Auth, Rides, Users, Match APIs
│   ├── middleware/        ← JWT auth
│   ├── ai/
│   │   ├── ai_engine.py   ← Python AI matching engine
│   │   └── requirements.txt
│   ├── .env.example       ← Copy this to .env
│   └── package.json
├── frontend/
│   ├── App.js             ← Main app + navigation
│   ├── api.js             ← Axios config
│   ├── screens/           ← All screens
│   └── package.json
└── database/
    └── schema.sql         ← Run this in Supabase
```

---

## ⚙️ SETUP — Step by Step

### STEP 1: Supabase Database (Free)

1. Go to https://supabase.com → Sign up free
2. Click "New Project" → Give it name "pakride"
3. Left sidebar → "SQL Editor"
4. Copy paste everything from `database/schema.sql`
5. Click "Run"
6. Go to Settings → API → Copy:
   - **Project URL** (looks like https://xxxx.supabase.co)
   - **anon public key**

---

### STEP 2: Backend Setup

```bash
cd backend

# Copy .env file
cp .env.example .env
```

Open `.env` and fill in:
```
PORT=5000
JWT_SECRET=replace-with-secure-jwt-secret
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Then install and run:
```bash
npm install
npm run dev
```

✅ You should see: `PakRide server running on http://localhost:5000`

---

### STEP 3: AI Engine Setup (Python)

Open a NEW terminal:

```bash
cd backend/ai

pip install -r requirements.txt

python ai_engine.py
```

✅ You should see: `PakRide AI Engine is running!` on http://localhost:8000

---

### STEP 4: Frontend Setup

Open another NEW terminal:

```bash
cd frontend

npm install

npx expo start
```

Then:
- **On your phone**: Download "Expo Go" from Play Store → Scan the QR code
- **On browser**: Press `w` in terminal to open web version

---

## 🧪 Testing the App

1. Register a new account
2. Login
3. Offer a ride (choose pickup/drop from list)
4. Go to Find Ride → Select locations → Click "AI se dhundho"
5. See AI match scores on results!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/users/profile | Get profile |
| GET | /api/users/stats | Get savings stats |
| POST | /api/rides/offer | Post a ride |
| GET | /api/rides/available | Get all open rides |
| POST | /api/rides/:id/book | Book a ride |
| GET | /api/rides/my-rides | My offered + booked rides |
| PUT | /api/rides/:id/complete | Mark ride complete |
| POST | /api/rides/:id/rate | Rate a user |
| POST | /api/match/find | **AI route matching** |
| POST | /ai/estimate-cost | Estimate trip cost |

---

## 🤖 How the AI Works

1. Rider submits pickup + drop coordinates
2. All open rides are fetched from database
3. Python calculates **route overlap score** for each ride:
   - Pickup distance + Drop distance = total detour
   - Less detour = higher match score
4. **K-means clustering** groups similar routes together
5. Rider's cluster gets priority in results
6. Top 5 matches returned with % score

---

## 🆓 Everything is FREE

| Tool | Free Limit |
|------|-----------|
| Supabase | 500MB database |
| Render/Railway | Free hosting |
| Expo Go | Free mobile testing |
| Google Maps | $200/month credit |
| Python/scikit-learn | 100% free |

---

## 👨‍💻 Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **AI Engine**: Python + scikit-learn (K-means)
- **Real-time**: Socket.io
- **Auth**: JWT tokens

---

Made for semester project 🎓 | PakRide 2024
