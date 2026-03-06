FROM python:3.11-slim

WORKDIR /app

# Force rebuild v4
RUN echo "Build version 4"

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

# Script de inicio con migraciones
RUN echo '#!/bin/bash\n\
echo "=== STARTING BACKEND ==="\n\
echo "PORT: $PORT"\n\
echo ""\n\
echo "Running database migrations..."\n\
alembic upgrade head || echo "Migrations failed or already applied"\n\
echo ""\n\
echo "Starting uvicorn on port $PORT..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
