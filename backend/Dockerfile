FROM python:3.11-slim

WORKDIR /app

# Force rebuild v3
RUN echo "Build version 3"

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

# Script de inicio con logs
RUN echo '#!/bin/bash\n\
echo "=== STARTING BACKEND ==="\n\
echo "PORT: $PORT"\n\
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."\n\
echo ""\n\
echo "Testing Python imports..."\n\
python -c "print(\"Python OK\")"\n\
python -c "import fastapi; print(\"FastAPI OK\")"\n\
python -c "import uvicorn; print(\"Uvicorn OK\")"\n\
python -c "import sqlalchemy; print(\"SQLAlchemy OK\")"\n\
echo ""\n\
echo "Testing app import..."\n\
python -c "from app.main import app; print(\"App import OK\")"\n\
echo ""\n\
echo "Starting uvicorn on port $PORT..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
