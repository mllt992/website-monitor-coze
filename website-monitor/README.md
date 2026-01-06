# 网站监控系统

一个现代化的网站监控系统，支持实时监控、健康检查、HTTP 状态码检测和邮件告警功能。

## 功能特性

- ✅ 实时网站监控
- ✅ HTTP 状态码检测
- ✅ 响应时间监控（健康<1000ms，亚健康>1000ms）
- ✅ 邮件告警通知
- ✅ 分类管理（支持拖拽排序）
- ✅ 网站权重排序（支持拖拽排序）
- ✅ 验证码登录
- ✅ 密码找回功能
- ✅ 后台管理系统
- ✅ 响应式设计

## 技术栈

- **前端**: Next.js 15.1.6, React 19, TypeScript
- **样式**: Tailwind CSS 4
- **后端**: Node.js, Next.js API Routes
- **数据库**: MySQL
- **认证**: JWT
- **邮件**: Nodemailer
- **拖拽**: @dnd-kit

## 快速开始

### 方式一：Docker 部署（推荐）

#### 使用部署脚本（最简单）

```bash
# 1. 给脚本添加执行权限
chmod +x deploy.sh

# 2. 运行部署脚本
./deploy.sh

# 按照提示选择部署模式即可
```

#### 使用 Docker Compose

```bash
# 1. 创建环境变量文件
cp .env.example .env

# 2. 编辑 .env 文件，配置数据库连接
nano .env

# 3. 构建并启动
docker-compose up -d --build

# 4. 查看日志
docker-compose logs -f
```

访问 http://localhost:5000

默认管理员账号：xrilang@mllt.cc / 123456

详细部署指南请参考 [DEPLOY.md](./DEPLOY.md)

### 方式二：本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local

# 3. 编辑 .env.local 配置数据库连接

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:3000
```

### 数据库配置

确保 MySQL 数据库已创建，然后执行初始化脚本：

```bash
# 方式一：使用脚本初始化
node scripts/init-database.js

# 方式二：手动执行 SQL
mysql -u root -p t_monitor < database/schema.sql
```

数据库配置：
- Host: 批量替换_请输入数据IP地址
- Port: 3306
- Database: t_monitor
- User: t_monitor
- Password: 批量替换_请输入数据库密码

## 环境变量

创建 `.env` 文件并配置以下变量：

```env
NODE_ENV=production
PORT=5000

# 数据库配置
DATABASE_HOST=批量替换_请输入数据IP地址
DATABASE_PORT=3306
DATABASE_NAME=t_monitor
DATABASE_USER=t_monitor
DATABASE_PASSWORD=批量替换_请输入数据库密码

# JWT 密钥（生产环境请修改）
JWT_SECRET=your-secret-key-change-this-in-production
```

## 项目结构

```
website-monitor/
├── src/
│   ├── app/              # Next.js App Router 页面
│   │   ├── admin/        # 后台管理页面
│   │   ├── api/          # API 路由
│   │   └── page.tsx      # 首页
│   ├── components/       # React 组件
│   ├── lib/              # 工具函数
│   └── contexts/         # React Context
├── public/               # 静态资源
├── scripts/              # 数据库脚本
├── database/             # 数据库 SQL
├── Dockerfile            # Docker 镜像构建文件
├── docker-compose.yml    # Docker Compose 配置
├── deploy.sh            # 一键部署脚本
└── package.json
```

## 核心功能说明

### 监控策略

1. **渐进式监控**: 优先 HEAD 请求，失败时自动回退到 GET 请求
2. **状态判断**:
   - 0ms: 异常
   - < 1000ms: 健康
   - > 1000ms: 亚健康
3. **HTTP 状态码**:
   - 2xx: 根据响应时间判断
   - 401/403: 健康
   - 4xx: 警告
   - 5xx: 错误

### 权限管理

- 系统分类（user_id=null）: 可编辑不可删除
- 用户分类: 完全可控（增删改查）

### 排序功能

- 分类排序: 添加 sort_order 字段，支持拖拽
- 网站排序: 添加 sort_order 字段，支持拖拽

### 邮件配置

- 支持 SMTP 配置
- 支持邮件告警
- 支持测试邮件发送

## 常用命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm start

# 类型检查
npx tsc --noEmit

# Docker 构建
docker build -t website-monitor .

# Docker 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## API 文档

详细的 API 文档请参考 [API接口文档.md](./API接口文档.md)

## 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查数据库配置是否正确
   - 确保 MySQL 服务正在运行
   - 检查防火墙设置

2. **端口被占用**
   - 修改 .env 中的 PORT 配置
   - 或停止占用 5000 端口的服务

3. **Docker 容器无法访问数据库**
   - 本地开发使用 `host.docker.internal`
   - 生产环境使用实际数据库 IP 地址

4. **邮件发送失败**
   - 检查 SMTP 配置是否正确
   - 检查网络连接
   - 查看应用日志获取详细错误信息

## 安全建议

1. 首次登录后立即修改默认密码
2. 生产环境使用强 JWT_SECRET
3. 配置 HTTPS（使用 Nginx 反向代理）
4. 定期更新依赖
5. 限制数据库访问权限

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
