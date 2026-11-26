# Stage 1: Build React client
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Node.js + Express server
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000
CMD ["node", "server/src/server.js"]
