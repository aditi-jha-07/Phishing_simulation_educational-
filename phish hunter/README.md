# 🎣 Phishing Hunter

**Cybersecurity Training Platform** — A phishing email simulation platform where students practice identifying phishing emails in real time.

---

## Project Architecture

```
phishing-hunter/
├── backend/                    ← Node.js + Express API
│   ├── config/
│   │   ├── db.js               ← MySQL connection pool
│   │   └── init.js             ← Auto table creation + seeding
│   ├── middleware/
│   │   └── auth.js             ← JWT + role-based access control
│   ├── routes/
│   │   ├── auth.js             ← Register, login, /me
│   │   ├── simulations.js      ← Start, answer (real-time), complete
│   │   └── admin.js            ← Dashboard, students, CRUD scenarios
│   ├── server.js               ← Express entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                   ← React + TailwindCSS SPA
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx ← Global auth state
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── Simulation.jsx        ← Core experience
│   │   │   ├── SimulationResults.jsx
│   │   │   ├── AdminDashboard.jsx    ← Real-time admin view
│   │   │   └── AdminScenarios.jsx    ← Scenario CRUD
│   │   ├── services/
│   │   │   └── api.js          ← All API calls via axios
│   │   ├── App.jsx             ← Router + auth guards
│   │   ├── index.js
│   │   └── index.css           ← TailwindCSS + custom design system
│   ├── tailwind.config.js
│   └── package.json
│
└── DEPLOYMENT.md               ← Full GoDaddy deployment guide
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TailwindCSS, React Router 6, Axios |
| Backend | Node.js 18, Express.js |
| Database | MySQL (auto-initialized, 10 scenarios seeded) |
| Auth | JWT + bcryptjs (cost 12) + role-based access |
| Security | express-rate-limit, express-validator, parameterized queries |
| Hosting | GoDaddy VPS + Apache reverse proxy + PM2 |

---

## User Roles

| Role | Email Format | Access |
|------|-------------|--------|
| Student | `*@*.edu` | Simulations, own results, history |
| Admin | `*@*.admin.edu` | Full dashboard, all students, scenario CRUD |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Students and admins |
| `scenarios` | Phishing email scenarios (10 seeded) |
| `simulations` | Each student simulation run |
| `simulation_answers` | Every answer recorded in **real time** |

---

## Key Features

- ✅ **Real-time answer recording** — each answer saved to DB immediately as student clicks
- ✅ **Auto table creation** — backend creates all tables on first run
- ✅ **10 seeded scenarios** — ready to use out of the box
- ✅ **Role detection** — email suffix determines role automatically
- ✅ **Admin live dashboard** — polls for updates every 15 seconds
- ✅ **Explanation feedback** — each scenario has a detailed explanation
- ✅ **Responsive design** — works on mobile and desktop
- ✅ **Security hardened** — rate limiting, SQL injection protection, bcrypt

---

## Quick Start (Local Development)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
node server.js
# → Database initialized, server running on :3001
```

### Frontend
```bash
cd frontend
npm install
# .env.example uses proxy (package.json already set to localhost:3001)
npm start
# → App running on http://localhost:3000
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register student or admin
- `POST /api/auth/login` — Login, get JWT
- `GET /api/auth/me` — Verify token, get user info

### Simulations (Student)
- `GET /api/simulations/scenarios` — 10 random scenarios
- `POST /api/simulations/start` — Create new simulation
- `POST /api/simulations/:id/answer` — **Record answer in real-time**
- `POST /api/simulations/:id/complete` — Finalize and get results
- `GET /api/simulations/my-history` — Student's past simulations

### Admin
- `GET /api/admin/dashboard` — Stats + most missed scenarios
- `GET /api/admin/students` — All students with scores
- `GET /api/admin/simulations` — All completed simulations
- `GET /api/admin/simulations/:id/details` — Per-answer breakdown
- `GET /api/admin/scenarios` — All scenarios
- `POST /api/admin/scenarios` — Create scenario
- `PUT /api/admin/scenarios/:id` — Update scenario
- `DELETE /api/admin/scenarios/:id` — Delete scenario
- `GET /api/admin/analytics` — Score distribution + accuracy stats

---

## Deployment

See **DEPLOYMENT.md** for the full step-by-step GoDaddy VPS deployment guide including:
- Node.js and Apache setup
- MySQL database configuration
- PM2 process management
- Apache reverse proxy configuration
- Free SSL with Let's Encrypt
- Firewall setup
- Security checklist
