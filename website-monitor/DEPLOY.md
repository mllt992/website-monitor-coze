# 网站监控系统 Docker 部署指南

## 快速开始

### 方式一：使用 Docker Compose（推荐）

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd website-monitor
   ```

2. **配置环境变量**

   创建 `.env` 文件：
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，配置数据库连接信息：
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_HOST=host.docker.internal  # 本地 MySQL 使用此地址
   DATABASE_PORT=3306
   DATABASE_NAME=t_monitor
   DATABASE_USER=t_monitor
   DATABASE_PASSWORD=批量替换_请输入数据库密码
   JWT_SECRET=your-secret-key-change-this-in-production
   ```

3. **构建并启动**
   ```bash
   docker-compose up -d --build
   ```

4. **访问应用**
   - 应用地址：http://localhost:5000
   - 默认管理员：xrilang@mllt.cc
   - 默认密码：123456

### 方式二：使用 Docker 命令

1. **构建镜像**
   ```bash
   docker build -t website-monitor .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     --name website-monitor \
     -p 5000:5000 \
     -e DATABASE_HOST=host.docker.internal \
     -e DATABASE_PORT=3306 \
     -e DATABASE_NAME=t_monitor \
     -e DATABASE_USER=t_monitor \
     -e DATABASE_PASSWORD=批量替换_请输入数据库密码 \
     -e JWT_SECRET=your-secret-key \
     website-monitor
   ```

## 生产环境部署

### 配置远程 MySQL

如果 MySQL 在远程服务器上，修改环境变量：

```yaml
# docker-compose.yml
environment:
  - DATABASE_HOST=批量替换_请输入数据IP地址
  - DATABASE_PORT=3306
  - DATABASE_NAME=t_monitor
  - DATABASE_USER=t_monitor
  - DATABASE_PASSWORD=批量替换_请输入数据库密码
```

### 使用外部网络

如果需要访问宿主机以外的 MySQL，创建自定义网络：

```bash
docker network create monitor-network
docker run -d \
  --name website-monitor \
  --network monitor-network \
  -p 5000:5000 \
  -e DATABASE_HOST=mysql-server \
  ...
```

## 常用命令

### 查看日志
```bash
docker-compose logs -f
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 进入容器
```bash
docker exec -it website-monitor sh
```

### 更新部署
```bash
git pull
docker-compose up -d --build
```

## 健康检查

容器内置健康检查，每 30 秒检查一次服务状态：

```bash
# 查看容器健康状态
docker ps

# 手动执行健康检查
docker exec website-monitor wget --spider -q http://localhost:5000 && echo "Healthy"
```

## 故障排查

### 数据库连接失败
- 检查 DATABASE_HOST 配置是否正确
- 本地 MySQL 使用 `host.docker.internal`
- 远程 MySQL 使用实际 IP 地址
- 确保 MySQL 允许容器访问

### 端口被占用
```bash
# 查看端口占用
lsof -i :5000

# 修改端口
# docker-compose.yml: ports: - "8000:5000"
```

### 权限问题
确保 .next 目录权限正确：
```bash
docker exec website-monitor chown -R nextjs:nodejs /app/.next
```

## 性能优化

### 构建优化
- 使用多阶段构建减小镜像体积
- 利用 Docker 缓存层加速构建
- .dockerignore 排除不必要文件

### 运行优化
- 使用 Alpine Linux 基础镜像
- 非 root 用户运行
- 健康检查自动恢复
- 资源限制（可选）

```yaml
# docker-compose.yml 添加资源限制
services:
  website-monitor:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## 安全建议

1. **修改默认密码**：首次登录后立即修改管理员密码
2. **JWT_SECRET**：生产环境使用强密钥
3. **HTTPS**：生产环境使用反向代理（Nginx）配置 SSL
4. **网络隔离**：使用自定义网络限制容器访问
5. **定期更新**：及时更新依赖和镜像

## Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 技术栈

- Node.js 18 Alpine
- Next.js 15.1.6
- MySQL
- Docker & Docker Compose
