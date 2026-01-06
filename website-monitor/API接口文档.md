# 网站监控系统 - API 接口文档

## 目录

- [认证相关](#认证相关)
  - [用户登录](#用户登录)
  - [发送登录验证码](#发送登录验证码)
  - [使用验证码登录](#使用验证码登录)
  - [忘记密码](#忘记密码)
  - [修改密码](#修改密码)
  - [验证Token](#验证token)
- [网站管理](#网站管理)
  - [获取网站列表](#获取网站列表)
  - [添加网站](#添加网站)
  - [更新网站](#更新网站)
  - [删除网站](#删除网站)
  - [检查网站](#检查网站)
  - [网站排序](#网站排序)
- [分类管理](#分类管理)
  - [获取分类列表](#获取分类列表)
  - [添加分类](#添加分类)
  - [更新分类](#更新分类)
  - [删除分类](#删除分类)
  - [分类排序](#分类排序)
- [监控相关](#监控相关)
  - [批量检查](#批量检查)
  - [检查所有网站](#检查所有网站)
  - [单个检查](#单个检查)
- [邮件配置](#邮件配置)
  - [获取邮件配置](#获取邮件配置)
  - [更新邮件配置](#更新邮件配置)
  - [测试邮件](#测试邮件)
  - [发送邮件](#发送邮件)
- [通知规则](#通知规则)
  - [获取通知规则列表](#获取通知规则列表)
  - [添加通知规则](#添加通知规则)
  - [更新通知规则](#更新通知规则)
  - [删除通知规则](#删除通知规则)
  - [切换通知规则状态](#切换通知规则状态)
- [系统管理](#系统管理)
  - [获取系统配置](#获取系统配置)
  - [更新系统配置](#更新系统配置)
  - [初始化数据库](#初始化数据库)
  - [数据迁移](#数据迁移)
- [公共接口](#公共接口)
  - [获取网站列表（前台）](#获取网站列表前台)

---

## 认证相关

### 用户登录

**接口地址：** `POST /api/auth/login`

**请求参数：**
```json
{
  "username": "xrilang@mllt.cc",
  "password": "123456"
}
```

**响应示例：**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "xrilang@mllt.cc",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 发送登录验证码

**接口地址：** `POST /api/auth/send-login-code`

**请求参数：**
```json
{
  "email": "xrilang@mllt.cc"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "验证码已发送到您的邮箱"
}
```

---

### 使用验证码登录

**接口地址：** `POST /api/auth/login-with-code`

**请求参数：**
```json
{
  "email": "xrilang@mllt.cc",
  "code": "123456"
}
```

**响应示例：**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "xrilang@mllt.cc",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 忘记密码

**接口地址：** `PUT /api/auth/forgot-password`

**功能：** 发送密码重置验证码到用户邮箱

**请求参数：**
```json
{
  "email": "xrilang@mllt.cc"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "验证码已发送到您的邮箱"
}
```

**接口地址：** `POST /api/auth/forgot-password`

**功能：** 使用验证码重置密码

**请求参数：**
```json
{
  "email": "xrilang@mllt.cc",
  "verificationCode": "123456",
  "newPassword": "newpassword123"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

**错误响应：**
```json
{
  "error": "验证码无效或已过期"
}
```

---

### 修改密码

**接口地址：** `POST /api/auth/change-password`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

### 验证Token

**接口地址：** `POST /api/auth/verify`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "xrilang@mllt.cc",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 网站管理

### 获取网站列表

**接口地址：** `GET /api/websites`

**请求头：**
```
Authorization: Bearer {token}
```

**查询参数：**
- `categoryId` (可选): 分类ID
- `status` (可选): 状态筛选（healthy, warning, error）

**响应示例：**
```json
{
  "success": true,
  "websites": [
    {
      "id": 1,
      "name": "示例网站",
      "url": "https://example.com",
      "category_id": 1,
      "category_name": "业务系统",
      "status": "healthy",
      "response_time": 123,
      "check_interval": 5,
      "sort_order": 0,
      "last_check_at": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 添加网站

**接口地址：** `POST /api/websites`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "name": "示例网站",
  "url": "https://example.com",
  "categoryId": 1,
  "checkInterval": 5,
  "sortOrder": 0
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "网站添加成功",
  "website": {
    "id": 1,
    "name": "示例网站",
    "url": "https://example.com",
    "category_id": 1,
    "check_interval": 5,
    "sort_order": 0,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 更新网站

**接口地址：** `PUT /api/websites/[id]`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "name": "更新后的网站名称",
  "url": "https://example.com",
  "categoryId": 1,
  "checkInterval": 10,
  "sortOrder": 1
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "网站更新成功",
  "website": {
    "id": 1,
    "name": "更新后的网站名称",
    "url": "https://example.com",
    "category_id": 1,
    "check_interval": 10,
    "sort_order": 1,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 删除网站

**接口地址：** `DELETE /api/websites/[id]`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "网站删除成功"
}
```

---

### 检查网站

**接口地址：** `POST /api/websites/[id]/check`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "status": "healthy",
  "response_time": 123,
  "http_status": 200,
  "checked_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 网站排序

**接口地址：** `POST /api/websites/order`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "websites": [
    { "id": 1, "sort_order": 0 },
    { "id": 2, "sort_order": 1 },
    { "id": 3, "sort_order": 2 }
  ]
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "排序更新成功"
}
```

---

## 分类管理

### 获取分类列表

**接口地址：** `GET /api/categories`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "业务系统",
      "sort_order": 0,
      "website_count": 5,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 添加分类

**接口地址：** `POST /api/categories`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "name": "新分类",
  "sortOrder": 0
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "分类添加成功",
  "category": {
    "id": 2,
    "name": "新分类",
    "sort_order": 0,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 更新分类

**接口地址：** `PUT /api/categories/[id]`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "name": "更新后的分类名称",
  "sortOrder": 1
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "分类更新成功",
  "category": {
    "id": 2,
    "name": "更新后的分类名称",
    "sort_order": 1,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 删除分类

**接口地址：** `DELETE /api/categories/[id]`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "分类删除成功"
}
```

**错误响应：**
```json
{
  "error": "该分类下还有网站，无法删除"
}
```

---

### 分类排序

**接口地址：** `POST /api/categories/reorder`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "categories": [
    { "id": 1, "sort_order": 0 },
    { "id": 2, "sort_order": 1 }
  ]
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "排序更新成功"
}
```

---

## 监控相关

### 批量检查

**接口地址：** `POST /api/monitor/batch`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "websiteIds": [1, 2, 3]
}
```

**响应示例：**
```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "status": "healthy",
      "response_time": 123,
      "checked_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 检查所有网站

**接口地址：** `POST /api/monitor/check-all`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "checked": 10,
  "results": [
    {
      "id": 1,
      "status": "healthy",
      "response_time": 123
    }
  ]
}
```

---

### 单个检查

**接口地址：** `POST /api/monitor/check`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "url": "https://example.com"
}
```

**响应示例：**
```json
{
  "success": true,
  "status": "healthy",
  "response_time": 123,
  "http_status": 200,
  "checked_at": "2024-01-01T00:00:00.000Z"
}
```

---

## 邮件配置

### 获取邮件配置

**接口地址：** `GET /api/email/config`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "config": {
    "id": 1,
    "smtp_host": "smtp.example.com",
    "smtp_port": 587,
    "smtp_secure": false,
    "smtp_user": "noreply@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 更新邮件配置

**接口地址：** `POST /api/email/config`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "smtp_host": "smtp.example.com",
  "smtp_port": 587,
  "smtp_secure": false,
  "smtp_user": "noreply@example.com",
  "smtp_password": "password"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "邮件配置已保存",
  "config": {
    "id": 1,
    "smtp_host": "smtp.example.com",
    "smtp_port": 587,
    "smtp_secure": false,
    "smtp_user": "noreply@example.com",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 测试邮件

**接口地址：** `POST /api/email/test`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "测试邮件已发送"
}
```

---

### 发送邮件

**接口地址：** `POST /api/email/send`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "to": "recipient@example.com",
  "subject": "邮件主题",
  "html": "<p>邮件内容</p>",
  "text": "纯文本内容"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "邮件发送成功"
}
```

---

## 通知规则

### 获取通知规则列表

**接口地址：** `GET /api/notification-rules`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "rules": [
    {
      "id": 1,
      "name": "宕机告警",
      "type": "email",
      "status": "down",
      "enabled": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 添加通知规则

**接口地址：** `POST /api/notification-rules`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "name": "宕机告警",
  "type": "email",
  "status": "down",
  "enabled": true
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "通知规则添加成功",
  "rule": {
    "id": 1,
    "name": "宕机告警",
    "type": "email",
    "status": "down",
    "enabled": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 更新通知规则

**接口地址：** `PUT /api/notification-rules/[id]`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "name": "更新后的规则名称",
  "type": "email",
  "status": "down",
  "enabled": false
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "通知规则更新成功",
  "rule": {
    "id": 1,
    "name": "更新后的规则名称",
    "type": "email",
    "status": "down",
    "enabled": false,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 删除通知规则

**接口地址：** `DELETE /api/notification-rules/[id]`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "通知规则删除成功"
}
```

---

### 切换通知规则状态

**接口地址：** `POST /api/notification-rules/[id]/toggle`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "规则状态已更新",
  "rule": {
    "id": 1,
    "enabled": false
  }
}
```

---

## 系统管理

### 获取系统配置

**接口地址：** `GET /api/system-config`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "config": {
    "id": 1,
    "monitor_interval": 5,
    "max_response_time": 1000,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 更新系统配置

**接口地址：** `POST /api/system-config`

**请求头：**
```
Authorization: Bearer {token}
```

**请求参数：**
```json
{
  "monitor_interval": 5,
  "max_response_time": 1000
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "系统配置已更新",
  "config": {
    "id": 1,
    "monitor_interval": 5,
    "max_response_time": 1000,
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 初始化数据库

**接口地址：** `POST /api/init-db`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "数据库初始化成功"
}
```

---

### 数据迁移

**接口地址：** `POST /api/migrate`

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "success": true,
  "message": "数据迁移成功"
}
```

---

## 公共接口

### 获取网站列表（前台）

**接口地址：** `GET /api/public/websites`

**无需认证**

**查询参数：**
- `categoryId` (可选): 分类ID

**响应示例：**
```json
{
  "success": true,
  "websites": [
    {
      "id": 1,
      "name": "示例网站",
      "url": "https://example.com",
      "category_name": "业务系统",
      "status": "healthy",
      "response_time": 123,
      "last_check_at": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 通用说明

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 响应时间判断标准

| 响应时间 | 状态 |
|---------|------|
| 0ms | 异常（无法连接） |
| < 1000ms | 健康 |
| >= 1000ms | 亚健康 |

### HTTP状态码判断标准

| HTTP状态码 | 说明 |
|-----------|------|
| 2xx | 根据响应时间判断健康/亚健康 |
| 401/403 | 健康（正常） |
| 4xx | 警告（除401/403外） |
| 5xx | 错误 |

### 时间格式

所有时间字段使用 ISO 8601 格式（UTC时间），前端需转换为本地时区显示。

### 验证码有效期

- 登录验证码：10分钟
- 密码重置验证码：10分钟

### 认证方式

使用 Bearer Token 认证，在请求头中添加：
```
Authorization: Bearer {token}
```

Token 有效期：24小时
