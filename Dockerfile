# MedScribe - Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Push schema (or run prisma migrate deploy if you use migrations)
CMD npx prisma db push --accept-data-loss 2>/dev/null || true && npm run start
