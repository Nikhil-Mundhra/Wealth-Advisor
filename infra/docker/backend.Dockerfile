FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY rules/package.json rules/package.json
COPY contracts/package.json contracts/package.json
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --omit=dev --ignore-scripts

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY rules ./rules
COPY contracts ./contracts
COPY backend/package.json backend/tsconfig.json ./backend/
COPY backend/src ./backend/src

RUN chown -R node:node /app
USER node
WORKDIR /app/backend
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/node-server.ts"]
