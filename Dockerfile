# Estágio de build
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar apenas os arquivos de dependências
COPY package.json pnpm-lock.yaml* ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar o resto do código
COPY . .

# Construir o aplicativo
RUN pnpm run build

# Estágio de produção
FROM node:18-alpine AS runner

WORKDIR /app

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5835

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos necessários
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Instalar apenas dependências de produção
RUN pnpm install --prod --frozen-lockfile

# Criar diretório para armazenamento persistente
RUN mkdir -p /data && \
    chown -R nextjs:nodejs /data

# Definir volume para persistência
VOLUME /data

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 5835

# Iniciar o Next.js
CMD ["pnpm", "next", "start", "-p", "5835"]
