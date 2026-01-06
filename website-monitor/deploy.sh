#!/bin/bash

# 网站监控系统 Docker 部署脚本

set -e

echo "==================================="
echo "网站监控系统 Docker 部署脚本"
echo "==================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}警告: .env 文件不存在，从 .env.example 创建...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 已创建 .env 文件${NC}"
        echo -e "${YELLOW}请编辑 .env 文件配置数据库连接信息${NC}"
        echo ""
        read -p "是否现在编辑 .env 文件? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        echo -e "${RED}错误: .env.example 文件不存在${NC}"
        exit 1
    fi
fi

# 构建选项
echo ""
echo "请选择部署模式:"
echo "1) 首次部署（构建 + 启动）"
echo "2) 仅重新构建"
echo "3) 仅启动容器"
echo "4) 停止服务"
echo "5) 重启服务"
echo "6) 查看日志"
echo "7) 清理并重新部署"
read -p "请输入选项 (1-7): " choice

case $choice in
    1)
        echo -e "${GREEN}开始构建和部署...${NC}"
        docker-compose up -d --build
        ;;
    2)
        echo -e "${GREEN}开始重新构建...${NC}"
        docker-compose build
        ;;
    3)
        echo -e "${GREEN}启动容器...${NC}"
        docker-compose up -d
        ;;
    4)
        echo -e "${YELLOW}停止服务...${NC}"
        docker-compose down
        ;;
    5)
        echo -e "${GREEN}重启服务...${NC}"
        docker-compose restart
        ;;
    6)
        echo -e "${GREEN}查看日志 (Ctrl+C 退出)...${NC}"
        docker-compose logs -f
        exit 0
        ;;
    7)
        echo -e "${YELLOW}清理旧容器和镜像...${NC}"
        docker-compose down
        docker system prune -f
        echo -e "${GREEN}开始重新部署...${NC}"
        docker-compose up -d --build
        ;;
    *)
        echo -e "${RED}无效的选项${NC}"
        exit 1
        ;;
esac

# 检查容器状态
if [[ $choice =~ ^[12357]$ ]]; then
    echo ""
    echo -e "${GREEN}===================================${NC}"
    echo -e "${GREEN}部署完成！${NC}"
    echo -e "${GREEN}===================================${NC}"
    echo ""
    echo "容器状态:"
    docker-compose ps
    echo ""
    echo "应用信息:"
    echo "  - 访问地址: http://localhost:5000"
    echo "  - 管理员账号: xrilang@mllt.cc"
    echo "  - 管理员密码: 123456"
    echo ""
    echo "常用命令:"
    echo "  - 查看日志: docker-compose logs -f"
    echo "  - 停止服务: docker-compose down"
    echo "  - 重启服务: docker-compose restart"
    echo ""
    echo -e "${YELLOW}提示: 首次登录后请立即修改默认密码${NC}"
fi
