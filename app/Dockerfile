FROM node:20-alpine AS builder
# cache-bust: threejs-preview-3d

WORKDIR /app

RUN corepack enable

COPY package*.json ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm exec vite build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
