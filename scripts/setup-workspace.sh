#!/bin/bash

# yourPXO 工作空间设置脚本
# Setup script for yourPXO workspace with byenatOS integration

set -e

echo "🚀 设置 yourPXO 工作空间..."
echo "Setting up yourPXO workspace..."

# 检查 Node.js 版本
echo "📋 检查开发环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js 版本过低，需要 >= 18.0.0，当前版本: $NODE_VERSION"
    exit 1
fi

# 检查 Python 版本
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python >= 3.9.0"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_PYTHON="3.9"
if [ "$(printf '%s\n' "$REQUIRED_PYTHON" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_PYTHON" ]; then
    echo "❌ Python 版本过低，需要 >= 3.9.0，当前版本: $PYTHON_VERSION"
    exit 1
fi

echo "✅ 开发环境检查通过"
echo "   Node.js: $NODE_VERSION"
echo "   Python: $PYTHON_VERSION"

# 初始化和更新子模块
echo "📦 初始化 byenatOS 子模块..."
git submodule init
git submodule update --recursive

echo "🔄 更新 byenatOS 子模块到最新版本..."
git submodule update --remote --merge

# 安装 yourPXO Core 依赖
echo "📦 安装 yourPXO Core 依赖..."
cd Core
if [ ! -f "package.json" ]; then
    echo "❌ Core/package.json 不存在"
    exit 1
fi

npm install
cd ..

# 检查 byenatOS 依赖
echo "📦 检查 byenatOS 依赖..."
cd AI/byenatOS-core

# 创建 Python 虚拟环境（如果不存在）
if [ ! -d ".venv" ]; then
    echo "🐍 创建 Python 虚拟环境..."
    python3 -m venv .venv
fi

echo "🔌 激活虚拟环境并安装依赖..."
source .venv/bin/activate

# 安装基础依赖
pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "⚠️  byenatOS requirements.txt 不存在，安装基础依赖..."
    pip install asyncio asyncpg aioredis sentence-transformers spacy
    python -m spacy download en_core_web_sm
fi

cd ../..

# 创建开发配置文件
echo "⚙️  创建开发配置..."

# 创建 .env.example 如果不存在
if [ ! -f ".env.example" ]; then
    cat > .env.example << 'EOF'
# yourPXO 开发环境配置
NODE_ENV=development
PORT=3001

# 数据库配置
DATABASE_URL=postgresql://localhost:5432/yourpxo_dev
REDIS_URL=redis://localhost:6379

# byenatOS 配置
BYENATOS_API_KEY=your_api_key_here
BYENATOS_LOCAL_MODE=true
BYENATOS_PRIVACY_LEVEL=high

# AI 模型配置
OPENAI_API_KEY=your_openai_key_here
AI_PROVIDER=byenatOS
AI_MODEL=gpt-3.5-turbo

# 安全配置
ENCRYPTION_ENABLED=true
SESSION_TIMEOUT=3600000
MAX_LOGIN_ATTEMPTS=5
EOF
fi

# 复制环境配置文件
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 已创建 .env 文件，请根据需要修改配置"
fi

# 创建 VSCode 工作空间配置
echo "🔧 创建 VSCode 工作空间配置..."
cat > yourPXO.code-workspace << 'EOF'
{
    "folders": [
        {
            "name": "yourPXO",
            "path": "."
        },
        {
            "name": "byenatOS Core",
            "path": "./AI/byenatOS-core"
        }
    ],
    "settings": {
        "typescript.preferences.importModuleSpecifier": "relative",
        "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true
        },
        "python.defaultInterpreterPath": "./AI/byenatOS-core/.venv/bin/python",
        "python.linting.enabled": true,
        "python.linting.pylintEnabled": true,
        "files.associations": {
            "*.hinata": "json"
        }
    },
    "extensions": {
        "recommendations": [
            "ms-vscode.vscode-typescript-next",
            "ms-python.python",
            "ms-python.pylint",
            "bradlc.vscode-tailwindcss",
            "esbenp.prettier-vscode",
            "ms-vscode.vscode-json"
        ]
    },
    "launch": {
        "version": "0.2.0",
        "configurations": [
            {
                "name": "Launch yourPXO Core",
                "type": "node",
                "request": "launch",
                "program": "${workspaceFolder}/Core/src/index.ts",
                "outFiles": ["${workspaceFolder}/Core/dist/**/*.js"],
                "env": {
                    "NODE_ENV": "development"
                }
            },
            {
                "name": "Debug HiNATA Processor",
                "type": "python",
                "request": "launch",
                "program": "${workspaceFolder}/AI/byenatOS-core/Kernel/Core/HiNATAProcessor.py",
                "console": "integratedTerminal",
                "cwd": "${workspaceFolder}/AI/byenatOS-core"
            }
        ]
    }
}
EOF

# 创建开发脚本
echo "📜 创建开发脚本..."
mkdir -p scripts

cat > scripts/dev.sh << 'EOF'
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
EOF

cat > scripts/test-integration.sh << 'EOF'
#!/bin/bash
# HiNATA 集成测试

echo "🧪 运行 HiNATA 集成测试..."

# 测试 byenatOS HiNATA 处理器
echo "测试 byenatOS HiNATA 处理器..."
cd AI/byenatOS-core
source .venv/bin/activate
python -c "
import sys
sys.path.append('.')
from Kernel.Core.HiNATAProcessor import HiNATAValidator
validator = HiNATAValidator()
test_data = {
    'id': 'test_001',
    'timestamp': '2024-12-01T10:30:00Z',
    'source': 'test',
    'highlight': 'Test highlight',
    'note': 'Test note',
    'address': 'test://address',
    'tag': ['test'],
    'access': 'private'
}
valid, errors = validator.validate(test_data)
print(f'HiNATA 验证结果: {valid}')
if not valid:
    print(f'错误: {errors}')
else:
    print('✅ HiNATA 格式验证通过')
"

cd ../..

# 测试 yourPXO Core API
echo "测试 yourPXO Core API..."
if command -v curl &> /dev/null; then
    curl -s http://localhost:3001/health || echo "⚠️  Core API 未运行，请先启动开发服务"
else
    echo "⚠️  curl 未安装，跳过 API 测试"
fi

echo "✅ 集成测试完成"
EOF

# 使脚本可执行
chmod +x scripts/dev.sh
chmod +x scripts/test-integration.sh
chmod +x scripts/setup-workspace.sh

# 更新 .gitignore
echo "📝 更新 .gitignore..."
if ! grep -q "# byenatOS integration" .gitignore 2>/dev/null; then
    cat >> .gitignore << 'EOF'

# byenatOS integration
AI/byenatOS-core/.venv/
AI/byenatOS-core/__pycache__/
AI/byenatOS-core/*.pyc
AI/byenatOS-core/.pytest_cache/

# Development
.env
.env.local
*.log
EOF
fi

echo ""
echo "🎉 工作空间设置完成！"
echo ""
echo "📁 工作空间结构:"
echo "   yourPXO/                 # 主项目"
echo "   ├── AI/byenatOS-core/    # byenatOS 源码 (子模块)"
echo "   └── scripts/             # 开发脚本"
echo ""
echo "🚀 快速开始:"
echo "   1. 修改 .env 文件中的配置"
echo "   2. 运行 ./scripts/dev.sh 启动开发环境"
echo "   3. 在 VSCode 中打开 yourPXO.code-workspace"
echo ""
echo "📚 重要文件:"
echo "   - HiNATA 定义: AI/byenatOS-core/Documentation/zh/APIs/HiNATADefinition.md"
echo "   - HiNATA 格式: AI/byenatOS-core/Documentation/zh/APIs/HiNATAFormat.md"
echo "   - HiNATA 处理器: AI/byenatOS-core/Kernel/Core/HiNATAProcessor.py"
echo ""
echo "✨ 现在您可以直接访问 byenatOS 的完整 HiNATA 定义和实现了！"
