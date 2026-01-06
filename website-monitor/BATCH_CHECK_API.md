# 批量检测接口文档

## 接口概述

批量检测接口允许通过定时任务（如 cron）定期调用，自动检测所有网站状态并根据通知规则发送邮件告警。

## 接口地址

```
GET /api/monitor/batch-check?key=<API密钥>
```

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| key | string | 是 | 授权密钥，在后台"授权密钥"页面创建 |

## 响应格式

### 成功响应（200 OK）

```json
{
  "success": true,
  "message": "检测完成，共检测 10 个网站，发送 2 条告警",
  "data": {
    "checkedCount": 10,
    "sentCount": 2,
    "alerts": [
      {
        "url": "https://example.com",
        "status": "error",
        "message": "HTTP 500"
      },
      {
        "url": "https://test.com",
        "status": "warning",
        "message": "响应时间过长 (2500ms)"
      }
    ]
  }
}
```

### 错误响应

#### 缺少密钥（401 Unauthorized）

```json
{
  "error": "缺少 API 密钥"
}
```

#### 无效密钥（401 Unauthorized）

```json
{
  "error": "无效的 API 密钥或密钥已禁用"
}
```

#### 服务器错误（500 Internal Server Error）

```json
{
  "error": "批量检测失败",
  "details": "错误详细信息"
}
```

## 使用示例

### cURL 命令

```bash
curl "http://localhost:5000/api/monitor/batch-check?key=your_api_key_here"
```

### JavaScript (fetch)

```javascript
fetch('http://localhost:5000/api/monitor/batch-check?key=your_api_key_here')
  .then(response => response.json())
  .then(data => {
    console.log('检测结果:', data);
  });
```

### Python (requests)

```python
import requests

response = requests.get(
    'http://localhost:5000/api/monitor/batch-check',
    params={'key': 'your_api_key_here'}
)

if response.status_code == 200:
    data = response.json()
    print('检测完成:', data['message'])
    print('检测数量:', data['data']['checkedCount'])
    print('发送告警:', data['data']['sentCount'])
else:
    print('错误:', response.json())
```

### Node.js (axios)

```javascript
const axios = require('axios');

axios.get('http://localhost:5000/api/monitor/batch-check', {
  params: {
    key: 'your_api_key_here'
  }
})
.then(response => {
  console.log('检测完成:', response.data.message);
  console.log('检测数量:', response.data.data.checkedCount);
  console.log('发送告警:', response.data.data.sentCount);
})
.catch(error => {
  console.error('错误:', error.response?.data || error.message);
});
```

## 定时任务配置

### Linux crontab

#### 每5分钟检测一次

```bash
*/5 * * * * curl -s 'http://localhost:5000/api/monitor/batch-check?key=YOUR_API_KEY' >> /var/log/monitor-check.log 2>&1
```

#### 每10分钟检测一次

```bash
*/10 * * * * curl -s 'http://localhost:5000/api/monitor/batch-check?key=YOUR_API_KEY' >> /var/log/monitor-check.log 2>&1
```

#### 每30分钟检测一次

```bash
*/30 * * * * curl -s 'http://localhost:5000/api/monitor/batch-check?key=YOUR_API_KEY' >> /var/log/monitor-check.log 2>&1
```

#### 每小时检测一次

```bash
0 * * * * curl -s 'http://localhost:5000/api/monitor/batch-check?key=YOUR_API_KEY' >> /var/log/monitor-check.log 2>&1
```

#### 工作日每15分钟检测一次（9:00-18:00）

```bash
*/15 9-18 * * 1-5 curl -s 'http://localhost:5000/api/monitor/batch-check?key=YOUR_API_KEY' >> /var/log/monitor-check.log 2>&1
```

### Docker 容器中运行定时任务

如果应用运行在 Docker 容器中，可以使用宿主机的 crontab 调用接口：

```bash
# 添加到 crontab
*/5 * * * * curl -s 'http://your-domain.com/api/monitor/batch-check?key=YOUR_API_KEY' >> /var/log/monitor-check.log 2>&1
```

或者创建一个单独的定时任务容器：

```dockerfile
FROM alpine:latest

# 安装 curl
RUN apk add --no-cache curl

# 创建定时任务
RUN echo "*/5 * * * * curl -s 'http://website-monitor:5000/api/monitor/batch-check?key=YOUR_API_KEY' >> /var/log/monitor.log 2>&1" > /etc/crontabs/root

# 启动 cron
CMD crond -f -l 2
```

### Windows 计划任务

创建批处理文件 `monitor-check.bat`:

```batch
@echo off
curl -s "http://localhost:5000/api/monitor/batch-check?key=YOUR_API_KEY" >> C:\monitor-check.log
```

然后在计划任务中配置触发器（如每5分钟执行一次）。

### Node.js 定时任务

使用 `node-cron` 包：

```javascript
const cron = require('node-cron');
const axios = require('axios');

// 每5分钟执行一次
cron.schedule('*/5 * * * *', async () => {
  try {
    const response = await axios.get(
      'http://localhost:5000/api/monitor/batch-check',
      { params: { key: 'YOUR_API_KEY' } }
    );

    console.log('检测完成:', response.data.message);
    console.log('检测数量:', response.data.data.checkedCount);
    console.log('发送告警:', response.data.data.sentCount);
  } catch (error) {
    console.error('检测失败:', error.message);
  }
});

console.log('定时任务已启动...');
```

## 检测逻辑说明

### 网站状态判断

1. **健康 (healthy)**:
   - HTTP 状态码：200-299 且响应时间 < 1000ms
   - HTTP 状态码：401, 403（认证相关，视为正常）

2. **警告 (warning)**:
   - HTTP 状态码：200-299 且响应时间 >= 1000ms
   - HTTP 状态码：400-499（除了 401, 403）

3. **错误 (error)**:
   - HTTP 状态码：500-599
   - 连接超时或网络错误
   - 响应时间为 0ms（连接失败）

### 检测流程

1. 验证 API 密钥有效性
2. 更新密钥使用记录（使用次数、最后使用时间）
3. 获取所有启用的网站
4. 依次检测每个网站（优先 HEAD 请求，失败则回退到 GET）
5. 记录检测结果到数据库
6. 根据通知规则判断是否发送邮件告警
7. 按用户分组发送告警邮件

### 邮件通知规则

只有满足以下条件的网站才会发送邮件告警：
1. 网站的 `notification_enabled` = 1（启用通知）
2. 检测结果状态为 `warning` 或 `error`

### 渐进式检测策略

- 优先使用 HEAD 请求（更快）
- HEAD 请求失败时自动回退到 GET 请求
- 请求超时时间：10 秒

## 日志记录

所有检测结果都会记录到 `monitor_logs` 表，包括：
- 网站ID
- 检测状态
- 响应时间
- HTTP 状态码
- 错误信息
- 检测时间

## 安全建议

1. **定期更换密钥**: 建议每3-6个月更换一次 API 密钥
2. **使用 HTTPS**: 生产环境建议使用 HTTPS 协议
3. **限制 IP**: 如有条件，可以在反向代理层限制调用 IP
4. **监控使用记录**: 定期检查密钥的使用记录，发现异常及时禁用
5. **最小权限原则**: 为不同的定时任务创建不同的密钥，便于管理

## 故障排查

### 接口返回 401 错误

- 检查 API 密钥是否正确
- 检查密钥是否已被禁用
- 检查密钥是否已删除

### 邮件未发送

- 检查邮箱配置是否正确
- 检查网站是否启用通知
- 检查检测结果是否为 warning 或 error
- 查看应用日志获取详细错误信息

### 检测超时

- 检查网站是否可以访问
- 检查网络连接是否正常
- 检查防火墙设置

### 定时任务未执行

- 检查 crontab 配置是否正确
- 检查 cron 服务是否运行
- 查看系统日志：`tail -f /var/log/syslog` 或 `tail -f /var/log/cron`

## 监控告警模板

邮件告警模板示例：

```
主题: [网站监控] 检测到 2 个网站异常

网站监控告警
以下网站检测结果异常：

• https://example.com
  状态：HTTP 500

• https://test.com
  状态：响应时间过长 (2500ms)

此邮件由网站监控系统自动发送，请勿回复。
```

## 相关接口

- 创建授权密钥: `POST /api/auth-keys`
- 获取密钥列表: `GET /api/auth-keys`
- 删除授权密钥: `DELETE /api/auth-keys/:id`
- 启用/禁用密钥: `PATCH /api/auth-keys/:id`

## 支持

如有问题，请查看后台日志或联系系统管理员。
