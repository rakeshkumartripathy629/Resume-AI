FROM node:20-slim

WORKDIR /app

# Root-level dependencies (for combined-server.ts)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts

# Service dependencies
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

RUN npm install -g tsx

COPY combined-server.ts ./
COPY gateway/ gateway/
COPY services/ services/

EXPOSE 10000

CMD ["tsx", "combined-server.ts"]
