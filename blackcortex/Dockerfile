FROM python:3.12-slim AS builder

WORKDIR /build
COPY pyproject.toml .
COPY app/ app/

RUN pip install --no-cache-dir --prefix=/install .

FROM python:3.12-slim

RUN groupadd -r rgk && useradd -r -g rgk -s /sbin/nologin rgk

COPY --from=builder /install /usr/local
COPY app/ /app/app/

WORKDIR /app

USER rgk

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
