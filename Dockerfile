FROM node:24-alpine AS build
WORKDIR /app
COPY . .
ARG NEXT_PUBLIC_API_URL=""
ARG STUDIO_API_URL=""
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_PUBLIC_SITE_URL="http://localhost:8088/"
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl python3 ca-certificates && npm ci --cache /tmp/npm-cache && node scripts/configure-studio.mjs && npx prisma generate --schema apps/api/prisma/schema.prisma && npm run build && node scripts/package-demo.mjs && rm -rf /tmp/npm-cache && chmod -R a+rX /app
FROM build AS api
WORKDIR /app/apps/api
USER node
EXPOSE 4000
CMD ["sh","-c","npx prisma db push --skip-generate && npm run db:seed && node dist/main.js"]
FROM nginx:1.28-alpine AS web
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
