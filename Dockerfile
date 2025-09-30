# Multi-stage: build frontend + run backend serving SPA
# build bump: 2025-09-30

# ---------- Frontend build ----------
FROM node:20-alpine AS frontend
WORKDIR /repo
COPY frontend/package*.json frontend/
WORKDIR /repo/frontend
RUN npm ci
COPY frontend/ /repo/frontend/
RUN npm run build

# ---------- Backend runtime ----------
FROM python:3.11-slim AS backend
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

# System deps (optional, pandas/openpyxl need some libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# App code
COPY backend/ /app/backend/

# Frontend build output
COPY --from=frontend /repo/frontend/build /app/frontend_build

# Data dir
ENV DATA_DIR=/var/data \
    FRONTEND_DIST_DIR=/app/frontend_build
RUN mkdir -p /var/data

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
