set -Eeuo pipefail

WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$WORK_DIR/website-monitor"

echo "Starting build process..."

# 安装依赖
echo "Installing dependencies..."
npm install

# 构建项目
echo "Building Next.js application..."
npm run build

echo "Build process completed successfully!"