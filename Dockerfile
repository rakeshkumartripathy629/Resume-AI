FROM node:20-slim

WORKDIR /app

# Root deps (express, cors, helmet, mongoose, redis)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts

# Service deps
COPY gateway/package.json gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/agent-service/package.json services/agent-service/
COPY services/interview-service/package.json services/interview-service/
COPY services/roadmap-service/package.json services/roadmap-service/
COPY services/billing-service/package.json services/billing-service/

RUN cd gateway && npm install --omit=dev && cd .. \
 && cd services/auth-service && npm install --omit=dev && cd ../.. \
 && cd services/agent-service && npm install --omit=dev && cd ../.. \
 && cd services/interview-service && npm install --omit=dev && cd ../.. \
 && cd services/roadmap-service && npm install --omit=dev && cd ../.. \
 && cd services/billing-service && npm install --omit=dev && cd ../..

# Client deps (needed for build only — but we keep them for simplicity)
COPY client/package.json client/
RUN cd client && npm install && cd ..

RUN npm install -g tsx

# Copy source
COPY combined-server.ts ./
COPY gateway/ gateway/
COPY services/ services/
COPY client/ client/

# Build client at build time (VITE_API_BASE_URL=/api/v1 since same origin)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_FIREBASE_API_KEY=AIzaSyA4wnhjWSONMFVf-Lb0JaNIlkxu8_gYTX8
ARG VITE_FIREBASE_AUTH_DOMAIN=swiggy-37641.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=swiggy-37641
ARG VITE_FIREBASE_STORAGE_BUCKET=swiggy-37641.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=572519364833
ARG VITE_FIREBASE_APP_ID=1:572519364833:web:3f1e319f0c9d518f101fa0

RUN cd client && npx vite build && cd ..

EXPOSE 10000

CMD ["tsx", "combined-server.ts"]
