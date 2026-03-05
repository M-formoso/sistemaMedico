FROM node:20-alpine

WORKDIR /app

# Copiar package.json primero para cache
COPY package*.json ./
RUN npm install

# Copiar el código
COPY . .

# Puerto
EXPOSE 5173

# Comando por defecto
CMD ["npm", "run", "dev", "--", "--host"]
