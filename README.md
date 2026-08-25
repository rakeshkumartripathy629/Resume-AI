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
└── docker-compose.yml        # Local infra (MongoDB + Redis)
```

## Getting Started

```bash
# 1. Start infra
docker compose up -d

# 2. Run each service (separate terminals)
cd gateway            && npm install && npm run dev
cd services/auth-service     && npm install && npm run dev
cd services/agent-service    && npm install && npm run dev

# 3. Frontend
cd client && npm install && npm run dev
```

## Ports

| Service | Port |
|---|---|
| Gateway | 4000 |
| Auth | 4001 |
| Agent | 4002 |
| Interview | 4003 |
| Roadmap | 4004 |
| Billing | 4005 |
| Client (Vite) | 5173 |
| MongoDB | 27017 |
| Redis | 6379 |

## Environment Variables

Each service has an `.env.example`. Copy to `.env` and fill in:

- `services/auth-service` — Firebase service account, Mongo URI, Redis URL
- `services/agent-service` — OpenAI API key, Mongo URI
- `client` — Firebase web config, gateway URL
