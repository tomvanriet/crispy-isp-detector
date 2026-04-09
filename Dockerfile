FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping \
    mtr-tiny \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev 2>/dev/null || uv sync --no-dev

COPY . .

CMD ["uv", "run", "crispy-isp-detector"]
