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
