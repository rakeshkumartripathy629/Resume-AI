FROM node:20-slim

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY gateway/package.json gateway/
COPY services/auth-service/package.json services/auth-service/
COPY services/agent-service/package.json services/agent-service/
COPY services/interview-service/package.json services/interview-service/
COPY services/roadmap-service/package.json services/roadmap-service/
COPY services/billing-service/package.json services/billing-service/

# Install all dependencies
RUN cd gateway && npm install --omit=dev && cd .. \
 && cd services/auth-service && npm install --omit=dev && cd ../.. \
 && cd services/agent-service && npm install --omit=dev && cd ../.. \
 && cd services/interview-service && npm install --omit=dev && cd ../.. \
 && cd services/roadmap-service && npm install --omit=dev && cd ../.. \
 && cd services/billing-service && npm install --omit=dev && cd ../..

# Install tsx globally for runtime TS execution
RUN npm install -g tsx

# Copy all source code
COPY gateway/ gateway/
COPY services/ services/
COPY scripts/ scripts/

# Copy .env if present
COPY .env* ./

EXPOSE 4000

CMD ["node", "scripts/prod-start.js"]
