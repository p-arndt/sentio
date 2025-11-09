# Stage 0: Base image
FROM node:22 AS base
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Stage 1: Build the application
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm run build

# Stage 2: Install the dependencies
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod


FROM gcr.io/distroless/nodejs22-debian12 AS production
WORKDIR /app

COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=builder /app/build /app/build
COPY --from=builder /app/drizzle /app/drizzle

ENV NODE_ENV=production
ENV BODY_SIZE_LIMIT=Infinity
# We need to set the trust proxy to true to make sure that the application works behind a reverse proxy
ENV AUTH_TRUST_HOST=true

EXPOSE 8080 
CMD ["build/index.js"]