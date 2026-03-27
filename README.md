# IQuiz — Real-Time Multiplayer Trivia Game

A production-ready multiplayer trivia game with real-time synchronization, Discord OAuth, and global leaderboards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | Discord OAuth2, JWT, Guest tokens |
| State | Zustand + persisted storage |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

---

## Project Structure

```
IQuiz/
├── backend/
│   ├── src/
│   │   ├── config/        # DB + Passport config
│   │   ├── data/          # Questions seed + seed script
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # REST API routes
│   │   └── socket/        # Socket.IO + GameManager
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/           # Next.js App Router pages
    │   ├── components/    # React components
    │   ├── hooks/         # useSocket, custom hooks
    │   ├── lib/           # API client, socket factory
    │   ├── store/         # Zustand global store
    │   └── types/         # TypeScript interfaces
    ├── .env.local.example
    └── package.json
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com) free tier)
- A Discord application (for OAuth — optional for guest-only testing)

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/iquiz
SESSION_SECRET=change-this-to-random-string
JWT_SECRET=change-this-too
JWT_EXPIRE=7d
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_CALLBACK_URL=http://localhost:5000/api/auth/discord/callback
FRONTEND_URL=http://localhost:3000
ADMIN_SECRET=admin-panel-secret
```

### 3. Frontend environment

```bash
cd frontend
cp .env.local.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 4. Seed the database

```bash
cd backend
npm run seed
```

This inserts 80+ questions across 8 categories.

### 5. Start development servers

Terminal 1 (backend):
```bash
cd backend
npm run dev
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Discord OAuth2 Setup

### Creating a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → name it "IQuiz"
3. Go to **OAuth2** → **General**
4. Copy your **Client ID** and **Client Secret** into `.env`
5. Under **Redirects**, add:
   - Development: `http://localhost:5000/api/auth/discord/callback`
   - Production: `https://your-backend-domain.com/api/auth/discord/callback`
6. Save changes

### Setting up OAuth Scopes

Discord OAuth in this app uses the `identify` and `email` scopes (configured in `passport.js`). No server/guild permissions are required.

---

## Game Features

### Authentication
- **Guest mode**: choose a username, get a JWT, play immediately
- **Discord OAuth**: persistent stats, leaderboard ranking, avatar from Discord

### Room Settings
| Setting | Options |
|---------|---------|
| Max Players | 2, 5, 10, 15, 20 |
| Game Type | Free For All, Versus |
| Questions | 5, 10, 15, 20, 25, 30 |
| Timer | 1–15 seconds (slider) |
| Difficulty | Easy, Medium, Hard, Mixed |
| Categories | Any combination of 8 categories |
| Visibility | Public (listed) or Private (invite only) |

### Scoring System
- Base score: **500 points** per correct answer
- Time bonus: up to **+500 points** based on speed
- Formula: `score += 500 + (timeRemaining / totalTime) * 500`
- Wrong answers: no score, no penalty

### Question Categories
- General Knowledge
- Science
- History
- Geography
- Sports
- Entertainment
- Technology
- Math

### Anti-Cheat
- One answer per question per player (server-enforced)
- JWT authentication required to connect to socket
- Banned users cannot authenticate
- Room code validation server-side

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/discord` | Start Discord OAuth |
| GET | `/api/auth/discord/callback` | OAuth callback |
| POST | `/api/auth/guest` | Guest login (body: `{username}`) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Game
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game/rooms` | List public rooms |
| GET | `/api/game/room/:code` | Get room by code |
| GET | `/api/game/stats` | Get live stats |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Global leaderboard |
| GET | `/api/leaderboard/recent` | Recent games |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/me` | Own profile + history |
| PUT | `/api/profile/username` | Update username (guests) |
| GET | `/api/profile/:userId` | Public profile |

### Admin (requires `isAdmin: true`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/questions` | List questions |
| POST | `/api/admin/questions` | Add question |
| PUT | `/api/admin/questions/:id` | Update question |
| DELETE | `/api/admin/questions/:id` | Deactivate question |
| GET | `/api/admin/users` | List users |
| PUT | `/api/admin/users/:id/ban` | Ban/unban user |

### Socket.IO Events

**Client → Server:**
```
join_lobby               – subscribe to lobby updates
create_room(settings)    – create a new game room
join_room({code})        – join room by code
leave_room               – leave current room
start_game               – host starts the game
submit_answer({answerIndex}) – player answers question
kick_player({targetUserId})  – host kicks a player
update_settings(settings)    – host updates room settings
```

**Server → Client:**
```
global_stats             – {online, playing, waiting}
lobby_rooms              – array of public rooms
room_update              – full room state
player_joined            – {username, avatar, userId}
player_left              – {username, userId}
game_starting            – {countdown, playerCount}
question                 – {question, options, category, difficulty, endsAt, index, total}
answer_feedback          – {isCorrect, yourAnswer, score}
answer_count             – {answered, total}
round_result             – {correctIndex, correctAnswer, leaderboard, isLastQuestion}
game_end                 – {winner, results, duration}
kicked                   – {reason}
```

---

## Deployment

### Frontend → Vercel

1. Push code to GitHub
2. Import repository in [Vercel Dashboard](https://vercel.com)
3. Set root directory to `frontend`
4. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```
5. Deploy

### Backend → Railway

1. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, set root directory to `backend`
3. Add environment variables (all from `.env`)
4. Railway auto-detects Node.js and runs `npm start`
5. Add a MongoDB database: Railway Dashboard → New → Database → MongoDB

### Backend → Render (alternative)

1. Create new Web Service on [Render](https://render.com)
2. Connect GitHub repo, set root to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables
6. Use [MongoDB Atlas](https://cloud.mongodb.com) for free hosted MongoDB

### Post-Deployment Checklist

- [ ] Update `DISCORD_CALLBACK_URL` to production backend URL
- [ ] Update Discord OAuth redirect in Developer Portal
- [ ] Update `FRONTEND_URL` in backend env to production frontend URL
- [ ] Run `npm run seed` against production MongoDB
- [ ] Set `NODE_ENV=production` in backend
- [ ] Ensure `SESSION_SECRET` and `JWT_SECRET` are strong random strings

### Making a User Admin

After deployment, connect to your MongoDB and run:
```javascript
db.users.updateOne(
  { username: "your_username" },
  { $set: { isAdmin: true } }
)
```

Or via MongoDB Atlas UI, find the user and set `isAdmin: true`.

---

## Making Questions

Add questions via the Admin Panel at `/admin` (requires admin account), or edit `backend/src/data/questions.js` and re-run `npm run seed`.

Question format:
```javascript
{
  question: "What is 2 + 2?",
  options: ["3", "4", "5", "6"],  // exactly 4 options
  correctIndex: 1,                  // 0-indexed (1 = "4")
  category: "Math",                 // see CATEGORIES list
  difficulty: "easy"                // easy | medium | hard
}
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `SESSION_SECRET` | Yes | Express session secret (min 32 chars) |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_EXPIRE` | No | JWT expiry (default: 7d) |
| `DISCORD_CLIENT_ID` | For Discord auth | From Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | For Discord auth | From Discord Developer Portal |
| `DISCORD_CALLBACK_URL` | For Discord auth | Must match Discord portal redirect |
| `FRONTEND_URL` | Yes | Frontend URL for CORS and redirects |
| `NODE_ENV` | No | development or production |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Backend Socket.IO URL |

---

## License

MIT — built for learning and fun. Feel free to fork and extend!
