#!/bin/bash
# Double-click file này để khởi động lại server Material AI
cd "$(dirname "$0")/server" || exit 1

echo "==> Đang tắt server cũ trên cổng 5500 (nếu có)..."
PIDS=$(lsof -ti :5500)
if [ -n "$PIDS" ]; then
  echo "    Tắt process: $PIDS"
  kill -9 $PIDS
  sleep 1
else
  echo "    Không có server nào đang chạy."
fi

echo "==> Khởi động server mới..."
npm start
