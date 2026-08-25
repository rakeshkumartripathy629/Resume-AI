# Resume Builder — AI-Powered Career Platform

Microservices-based AI resume platform: resume scoring, resume builder, mock interviews with AI reports, career roadmaps, and a coin economy with Razorpay billing.

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + Redux Toolkit
- **Backend:** Node.js + Express + TypeScript (microservices)
- **Database:** MongoDB · **Cache/Sessions:** Redis
- **AI:** LangChain + LangGraph (OpenAI)
- **Auth:** Firebase Authentication
- **Payments:** Razorpay
- **Infra:** Docker Compose, AWS-ready

## Architecture

```
gateway (4000) ──▶ auth-service      (4001) users · sessions · coins
               ──▶ agent-service     (4002) resume scoring · builder data
               ──▶ interview-service (4003) AI mock interviews
               ──▶ roadmap-service   (4004) AI career roadmaps
               ──▶ billing-service   (4005) Razorpay payments
```

All client traffic goes through the gateway (`/api/v1/*`). Internal service-to-service endpoints (`/internal/*`) are never exposed externally.

## Project Structure

```
resume-builder/
├── gateway/                  # API gateway — routes to all services
├── services/
│   ├── auth-service/         # Firebase verify, Redis sessions, coins ledger
│   ├── agent-service/        # LangChain/LangGraph resume AI + resumes CRUD
│   ├── interview-service/    # Mock interview loop + reports
│   ├── roadmap-service/      # Gap analysis → phased career roadmap
│   └── billing-service/      # Razorpay orders, webhook, history
├── client/                   # React frontend
├── docker-compose.yml        # Full local stack
└── .env.example              # Root credentials for compose
```

## Getting Started

### Option A — Full Docker stack

```bash
# 1. Configure credentials (Firebase, OpenAI, Razorpay)
cp .env.example .env                 # fill in real values
cp client/.env.example client/.env  # fill in VITE_FIREBASE_*

# 2. Build and run everything (gateway, 5 services, client, mongo, redis)
docker compose up -d --build

# Client: http://localhost:5173 · Gateway: http://localhost:4000
```

### Option B — Local dev

```bash
# 1. Start infra only
docker compose up -d mongo redis
# …or run your own MongoDB/Redis on the default ports.

# 2. Run each service (separate terminals)
cd gateway                    && npm install && npm run dev
cd services/auth-service      && npm install && npm run dev
cd services/agent-service     && npm install && npm run dev
cd services/interview-service && npm install && npm run dev
cd services/roadmap-service   && npm install && npm run dev
cd services/billing-service   && npm install && npm run dev

# 3. Frontend
cd client && npm install && npm run dev
```

### Required credentials

| Where | What |
|---|---|
| `services/auth-service/.env` | Firebase service account (`FIREBASE_*`) |
| `services/{agent,interview,roadmap}-service/.env` | Same Firebase creds + `OPENAI_API_KEY` |
| `services/billing-service/.env` | Firebase creds + Razorpay test keys |
| `client/.env` | Firebase web config (`VITE_FIREBASE_*`) |

Every service degrades gracefully when keys are missing — health endpoints report exactly what's unconfigured.

## Coin Economy

New users start with **50 coins**. Every AI action is charged atomically via auth-service:

| Action | Cost |
|---|---|
| Resume score | 5 coins |
| Mock interview | 10 coins |
| Career roadmap | 8 coins |

Failed AI runs are auto-refunded. Coins are topped up via Razorpay coin packs (`starter` ₹99 = 150 coins, `pro` ₹299 = 500 coins). The verify endpoint and the webhook are both idempotent — coins are credited exactly once per order.

## Ports

| Service | Port |
|---|---|
| Gateway | 4000 |
| Auth | 4001 |
| Agent | 4002 |
| Interview | 4003 |
| Roadmap | 4004 |
| Billing | 4005 |
| Client (Vite/nginx) | 5173 |
| MongoDB | 27017 |
| Redis | 6379 |

## Environment Variables

Each service has its own `.env.example`. Copy to `.env` and fill in:

- `services/auth-service` — Firebase service account, Mongo URI, Redis URL
- `services/agent-service` — OpenAI API key, auth-service URL, Mongo URI
- `services/interview-service` — OpenAI API key, question count
- `services/roadmap-service` — OpenAI API key
- `services/billing-service` — Razorpay key id/secret/webhook secret
- `client` — Firebase web config, gateway URL
