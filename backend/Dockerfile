FROM python:3.11-slim

WORKDIR /app

# Force rebuild v2
RUN echo "Build version 2"

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Comando directo
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
