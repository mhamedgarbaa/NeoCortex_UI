# ============================
# 1) Builder stage
# ============================
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir --prefix=/install -r requirements.txt


# ============================
# 2) Runtime stage
# ============================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -m appuser \
 && mkdir -p data/output_markdowns data/ontology_output

COPY --from=builder /install /usr/local
COPY . .

RUN chown -R appuser:appuser /app
USER appuser

# ontology_output is the only directory whose contents need to survive/be
# accessible outside the container — mount it as a volume.
VOLUME ["/app/data/ontology_output"]

EXPOSE 7777

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7777"]
