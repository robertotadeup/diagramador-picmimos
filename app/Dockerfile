FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copia o projeto inteiro antes da instalação para evitar cache antigo de package.json.
COPY . .

# Força instalação real das dependências do 3D, mesmo se o EasyPanel tentar reaproveitar cache.
RUN rm -rf node_modules pnpm-lock.yaml \
  && pnpm install --no-frozen-lockfile \
  && pnpm add three @react-three/fiber @react-three/drei \
  && pnpm exec vite build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
