FROM node:20-slim

WORKDIR /app

# ── Copy all package.json files ──
COPY package.json package-lock.json* ./
COPY gateway/package.json gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/agent-service/package.json services/agent-service/
COPY services/interview-service/package.json services/interview-service/
COPY services/roadmap-service/package.json services/roadmap-service/
COPY services/billing-service/package.json services/billing-service/
COPY client/package.json client/

# ── Install ALL deps (including devDeps for tsc) ──
RUN npm install --ignore-scripts \
 && cd gateway && npm install && cd .. \
 && cd services/auth-service && npm install && cd ../.. \
 && cd services/agent-service && npm install && cd ../.. \
 && cd services/interview-service && npm install && cd ../.. \
 && cd services/roadmap-service && npm install && cd ../.. \
 && cd services/billing-service && npm install && cd ../.. \
 && cd client && npm install && cd ..

# ── Copy source ──
COPY gateway/ gateway/
COPY services/ services/
COPY client/ client/
COPY server.js ./

# ── Build TypeScript services ──
RUN cd gateway && npx tsc -p tsconfig.json && cd .. \
 && cd services/auth-service && npx tsc -p tsconfig.json && cd ../.. \
 && cd services/agent-service && npx tsc -p tsconfig.json && cd ../.. \
 && cd services/interview-service && npx tsc -p tsconfig.json && cd ../.. \
 && cd services/roadmap-service && npx tsc -p tsconfig.json && cd ../.. \
 && cd services/billing-service && npx tsc -p tsconfig.json && cd ../..

# ── Build client ──
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_FIREBASE_API_KEY=AIzaSyA4wnhjWSONMFVf-Lb0JaNIlkxu8_gYTX8
ARG VITE_FIREBASE_AUTH_DOMAIN=swiggy-37641.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=swiggy-37641
ARG VITE_FIREBASE_STORAGE_BUCKET=swiggy-37641.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=572519364833
ARG VITE_FIREBASE_APP_ID=1:572519364833:web:3f1e319f0c9d518f101fa0

RUN cd client && npx vite build && cd ..

# ── Remove devDeps to save space ──
RUN cd gateway && npm prune --omit=dev && cd .. \
 && cd services/auth-service && npm prune --omit=dev && cd ../.. \
 && cd services/agent-service && npm prune --omit=dev && cd ../.. \
 && cd services/interview-service && npm prune --omit=dev && cd ../.. \
 && cd services/roadmap-service && npm prune --omit=dev && cd ../.. \
 && cd services/billing-service && npm prune --omit=dev && cd ../.. \
 && npm prune --omit=dev

EXPOSE 10000

CMD ["node", "server.js"]
