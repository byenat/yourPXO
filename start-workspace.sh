#!/bin/bash

echo "🚀 启动yourPXO工作空间..."

# 检查Node.js版本
NODE_VERSION=$(node -v)
echo "📦 Node.js版本: $NODE_VERSION"

# 安装依赖
echo "📥 安装依赖..."
npm install

# 创建必要的目录
echo "📁 创建目录..."
mkdir -p Core/logs
mkdir -p Core/dist

# 复制环境变量文件
if [ ! -f "Core/.env" ]; then
    echo "📋 创建环境变量文件..."
    cp Core/env.example Core/.env
    echo "⚠️  请编辑 Core/.env 文件，设置正确的配置"
fi

# 构建Core模块
echo "🔨 构建Core模块..."
cd Core
npm install
npm run build
cd ..

# 启动Core服务
echo "🟢 启动Core服务..."
cd Core
npm run dev &
CORE_PID=$!
cd ..

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务是否启动
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Core服务启动成功！"
    echo "🌐 API地址: http://localhost:3001"
    echo "📊 健康检查: http://localhost:3001/health"
    
    # 运行测试
    echo "🧪 运行集成测试..."
    cd Core
    node test-client.js
    cd ..
    
    echo ""
    echo "🎉 yourPXO工作空间启动完成！"
    echo ""
    echo "📋 可用的API端点:"
    echo "  POST /api/user/register     - 用户注册"
    echo "  POST /api/user/login        - 用户登录"
    echo "  GET  /api/user/profile      - 获取用户信息"
    echo "  POST /api/ai/personalized-prompt - 获取个性化提示词"
    echo "  POST /api/ai/update-activity    - 更新用户活动"
    echo "  POST /api/ai/analyze-content    - 内容分析"
    echo "  POST /api/ai/focus-analysis     - 专注度分析"
    echo ""
    echo "🔧 开发命令:"
    echo "  npm run dev:core    - 启动Core服务"
    echo "  npm run dev:sync    - 启动Sync服务"
    echo "  npm run build       - 构建所有模块"
    echo "  npm test           - 运行测试"
    echo ""
    echo "按 Ctrl+C 停止服务"
    
    # 等待用户中断
    wait $CORE_PID
else
    echo "❌ Core服务启动失败"
    kill $CORE_PID 2>/dev/null
    exit 1
fi
