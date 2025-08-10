#!/bin/bash
# 启动开发环境

echo "🚀 启动 yourPXO 开发环境..."

# 启动 Core 服务
echo "启动 Core 服务..."
cd Core
npm run dev &
CORE_PID=$!

# 返回根目录
cd ..

echo "✅ 开发环境已启动"
echo "Core API: http://localhost:3001"
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap "echo '🛑 停止所有服务...'; kill $CORE_PID; exit" INT
wait
