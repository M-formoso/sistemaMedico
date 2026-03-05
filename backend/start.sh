#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head || echo "Migrations may have already been applied"

echo "Initializing database..."
python -m app.db.init_db || echo "Database may already be initialized"

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
