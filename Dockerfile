ARG NODE_BASE_IMAGE=node:22-alpine

FROM ${NODE_BASE_IMAGE} AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

FROM ${NODE_BASE_IMAGE} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

ARG NEXT_PUBLIC_MARKETER_API_URL
ARG NEXT_PUBLIC_MARKETER_BOT_USERNAME
ARG NEXT_PUBLIC_MARKETER_SUPPORT_URL

ENV NEXT_PUBLIC_MARKETER_API_URL=$NEXT_PUBLIC_MARKETER_API_URL
ENV NEXT_PUBLIC_MARKETER_BOT_USERNAME=$NEXT_PUBLIC_MARKETER_BOT_USERNAME
ENV NEXT_PUBLIC_MARKETER_SUPPORT_URL=$NEXT_PUBLIC_MARKETER_SUPPORT_URL

RUN npm run build

FROM ${NODE_BASE_IMAGE} AS runner
WORKDIR /app

RUN apk add --no-cache wget \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3004
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3004

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=30s \
  CMD wget -qO- http://localhost:3004/api/health || exit 1

CMD ["node", "server.js"]
