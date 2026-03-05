FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero para cache
COPY package*.json ./
RUN npm install

# Instalar serve globalmente
RUN npm install -g serve

# Copiar el código
COPY . .

# Build de producción
RUN npm run build

# Puerto dinámico de Railway
ENV PORT=3000
EXPOSE 3000

# Servir archivos estáticos con puerto dinámico
CMD sh -c "serve dist -s -l \$PORT"
