#!/bin/zsh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_PORT="${YANJING_PORT:-3100}"
MAX_PORT="${YANJING_MAX_PORT:-3199}"
HOST="127.0.0.1"

cd "$PROJECT_DIR"

echo "Starting Yanjing Biji..."
echo "Project: $PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found. Please install Node.js first."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Please install Node.js/npm first."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f ".env" ]; then
  echo ".env is missing. Copying .env.example to .env..."
  cp .env.example .env
fi

if command -v pg_isready >/dev/null 2>&1; then
  if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "PostgreSQL does not appear to be running on localhost:5432."
    if command -v brew >/dev/null 2>&1; then
      echo "Trying to start postgresql@16 with Homebrew..."
      brew services start postgresql@16 >/dev/null 2>&1 || true
      sleep 2
    fi
  fi
fi

echo "Checking database migrations..."
npx prisma migrate deploy

find_free_port() {
  local port="$BASE_PORT"
  while [ "$port" -le "$MAX_PORT" ]; do
    if ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done

  return 1
}

PORT="$(find_free_port)"

if [ -z "$PORT" ]; then
  echo "No free port found between $BASE_PORT and $MAX_PORT."
  exit 1
fi

URL="http://localhost:$PORT"
echo "Using port: $PORT"
echo "Opening: $URL"

npm run dev -- --hostname "$HOST" --port "$PORT" &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

for _ in {1..60}; do
  if curl -fsS "$URL/login" >/dev/null 2>&1; then
    open "$URL"
    echo "Yanjing Biji is running at $URL"
    echo "Keep this window open while using the app. Press Ctrl+C to stop."
    wait "$SERVER_PID"
    exit $?
  fi
  sleep 1
done

echo "The app did not become ready in time. Check the log above for details."
exit 1
