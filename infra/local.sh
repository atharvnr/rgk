#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.local.yml"
BACKEND_DIR="$ROOT_DIR/blackcortex"
BACKEND_ENV="$BACKEND_DIR/.env"

# Ensure backend .env exists
if [ ! -f "$BACKEND_ENV" ]; then
  echo "Creating $BACKEND_ENV from .env.example..."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_ENV"
  echo "Review $BACKEND_ENV and update values as needed."
fi

case "${1:-up}" in
  up)
    echo "Starting MongoDB, Redis, and API..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    echo ""
    echo "Services running:"
    echo "  API:   http://localhost:8000"
    echo "  Mongo: localhost:27017"
    echo "  Redis: localhost:6379"
    echo ""
    echo "Logs: $0 logs"
    echo "Stop: $0 down"
    ;;
  down)
    echo "Stopping all services..."
    docker compose -f "$COMPOSE_FILE" down
    ;;
  logs)
    if [ "${2:-}" = "all" ]; then
      docker compose -f "$COMPOSE_FILE" logs -f
    else
      docker compose -f "$COMPOSE_FILE" logs -f api
    fi
    ;;
  restart)
    docker compose -f "$COMPOSE_FILE" restart "${2:-}"
    ;;
  *)
    echo "Usage: $0 {up|down|logs|restart} [service]"
    exit 1
    ;;
esac
