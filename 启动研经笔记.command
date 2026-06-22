#!/bin/zsh

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_PORT="${YANJING_PORT:-3100}"
MAX_PORT="${YANJING_MAX_PORT:-3199}"
HOST="127.0.0.1"
SERVER_PID=""

cd "$PROJECT_DIR"

print_header() {
  printf "\n== %s ==\n" "$1"
}

info() {
  printf "  %s\n" "$1"
}

fail() {
  printf "\n启动没有完成：%s\n" "$1"
  printf "\n可以先检查上面的提示；这个窗口会保持打开，方便复制错误信息。\n"
  printf "按 Enter 关闭窗口。"
  read -r _
  exit 1
}

cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

run_or_fail() {
  local message="$1"
  shift
  "$@"
  local exit_code=$?
  if [ "$exit_code" -ne 0 ]; then
    fail "$message"
  fi
}

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

open_existing_server_if_ready() {
  local lock_file=".next/dev/lock"
  if [ ! -f "$lock_file" ]; then
    return 1
  fi

  local existing_pid existing_url
  existing_pid="$(node -e "const fs=require('fs'); try { const lock=JSON.parse(fs.readFileSync('$lock_file','utf8')); if (lock.pid) console.log(lock.pid); } catch {}" 2>/dev/null)"
  existing_url="$(node -e "const fs=require('fs'); try { const lock=JSON.parse(fs.readFileSync('$lock_file','utf8')); if (lock.appUrl) console.log(lock.appUrl); } catch {}" 2>/dev/null)"

  if [ -z "$existing_pid" ] || [ -z "$existing_url" ]; then
    return 1
  fi

  if ! kill -0 "$existing_pid" >/dev/null 2>&1; then
    info "发现旧的 Next.js 锁文件，但进程已经不在运行。"
    return 1
  fi

  if curl -fsS "$existing_url/login" >/dev/null 2>&1; then
    open "$existing_url"
    printf "\n研经笔记已经在运行：%s\n" "$existing_url"
    printf "登录入口：%s/login\n" "$existing_url"
    printf "Obsidian / 备份入口：%s/obsidian\n" "$existing_url"
    printf "\n提示：这是已有服务，本启动器没有新开第二个服务。\n"
    printf "如需停止，请回到原来的启动窗口按 Ctrl+C。\n"
    printf "按 Enter 关闭这个提示窗口。"
    read -r _
    exit 0
  fi

  info "发现已有 Next.js 进程，但应用暂时不可访问，将继续尝试启动。"
  return 1
}

print_header "研经笔记启动器"
info "项目位置：$PROJECT_DIR"
info "端口范围：$BASE_PORT-$MAX_PORT"

print_header "检查运行环境"
if ! command -v node >/dev/null 2>&1; then
  fail "没有找到 Node.js。请先安装 Node.js，然后重新双击启动。"
fi
info "Node.js：$(node --version)"

if ! command -v npm >/dev/null 2>&1; then
  fail "没有找到 npm。请确认 Node.js/npm 已正确安装。"
fi
info "npm：$(npm --version)"

if [ ! -d "node_modules" ]; then
  print_header "安装依赖"
  info "首次启动需要安装依赖，可能需要几分钟。"
  run_or_fail "依赖安装失败。请检查网络或 npm 输出。" npm install
else
  info "依赖已安装。"
fi

print_header "检查环境变量"
if [ ! -f ".env" ]; then
  if [ ! -f ".env.example" ]; then
    fail "缺少 .env 和 .env.example，无法生成数据库配置。"
  fi
  cp .env.example .env
  info "已从 .env.example 创建 .env。"
  info "如果数据库账号不同，请稍后编辑 .env。"
else
  info ".env 已存在。"
fi

print_header "检查是否已启动"
open_existing_server_if_ready
info "没有发现可直接复用的已启动服务。"

print_header "检查 PostgreSQL"
if command -v pg_isready >/dev/null 2>&1; then
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    info "PostgreSQL 已在 localhost:5432 响应。"
  else
    info "PostgreSQL 暂未响应，尝试自动启动。"
    if command -v brew >/dev/null 2>&1; then
      if brew services list 2>/dev/null | grep -q "postgresql@16"; then
        brew services start postgresql@16 >/dev/null 2>&1 || true
      else
        brew services start postgresql >/dev/null 2>&1 || true
      fi
      sleep 3
    fi

    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
      fail "PostgreSQL 仍未启动。请先启动 PostgreSQL，再重新打开启动器。"
    fi
    info "PostgreSQL 已启动。"
  fi
else
  info "没有找到 pg_isready，跳过数据库端口探测。"
  info "如果后面的迁移失败，请确认 PostgreSQL 已运行。"
fi

print_header "检查数据库迁移"
run_or_fail "数据库迁移失败。请检查 .env 里的 DATABASE_URL 和 PostgreSQL 状态。" \
  npx prisma migrate deploy
info "数据库迁移已就绪。"

print_header "选择应用端口"
PORT="$(find_free_port)"
if [ -z "$PORT" ]; then
  info "端口 $BASE_PORT-$MAX_PORT 都被占用。"
  info "可以这样换一个范围："
  info "YANJING_PORT=3200 YANJING_MAX_PORT=3299 ./启动研经笔记.command"
  fail "没有可用端口。"
fi
URL="http://localhost:$PORT"
LOGIN_URL="$URL/login"
OBSIDIAN_URL="$URL/obsidian"
info "使用端口：$PORT"

print_header "启动应用"
info "正在启动 Next.js，本窗口需要保持打开。"
npm run dev -- --hostname "$HOST" --port "$PORT" &
SERVER_PID=$!

for second in {1..60}; do
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    wait "$SERVER_PID"
    fail "应用进程提前退出。请查看上方 Next.js 输出。"
  fi

  if curl -fsS "$LOGIN_URL" >/dev/null 2>&1; then
    open "$URL"
    printf "\n研经笔记已启动：%s\n" "$URL"
    printf "登录入口：%s\n" "$LOGIN_URL"
    printf "Obsidian / 备份入口：%s\n" "$OBSIDIAN_URL"
    printf "\n提示：可以在 Chrome 或 Edge 地址栏安装 PWA。\n"
    printf "使用期间请保持这个窗口打开；停止应用请按 Ctrl+C。\n\n"
    wait "$SERVER_PID"
    exit $?
  fi

  if [ "$second" = "20" ]; then
    info "应用仍在准备中，请稍候。"
  fi
  sleep 1
done

fail "应用 60 秒内没有就绪。请查看上方日志，或确认端口和数据库状态。"
