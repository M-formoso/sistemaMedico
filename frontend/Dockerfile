FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero para cache
COPY package*.json ./
RUN npm install

# Instalar http-server globalmente (más simple que serve)
RUN npm install -g http-server

# Copiar el código
COPY . .

# Build de producción
RUN npm run build

# Servir archivos estáticos con http-server
CMD ["sh", "-c", "http-server dist -p ${PORT:-3000} --proxy http://localhost:${PORT:-3000}?"]
