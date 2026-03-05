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

# Servir archivos estáticos - serve usa -p para puerto
CMD ["sh", "-c", "serve dist -s -p ${PORT:-3000}"]
