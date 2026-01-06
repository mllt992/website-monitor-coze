# 修复状态码显示问题

## 问题描述
- 网站返回HTTP 502状态码时，前端仍显示为"健康"状态
- 前端没有显示具体的HTTP状态码（如502、503等）

## 问题根因分析
1. **监控逻辑问题**：原来的监控逻辑主要基于响应时间判断健康状态，HTTP状态码仅作为参考信息
2. **HTTP 5xx状态码未正确处理**：5xx状态码（包括502、503、504等）被标记为"警告"而非"错误"
3. **前端未显示HTTP状态码**：前端界面没有显示HTTP状态码，用户无法看到具体的错误状态

## 修复方案

### 1. 数据库修改
```sql
ALTER TABLE monitor_logs ADD COLUMN http_status_code INT DEFAULT NULL AFTER status;
```
在监控日志表中添加`http_status_code`字段，用于记录HTTP状态码。

### 2. 后端API修改

#### 修改1: check/route.ts
- 修改`CheckResult`接口，添加`httpStatusCode`字段
- 修改`checkWebsiteStatus`函数，捕获并返回HTTP状态码
- 修改`analyzeResponse`函数的判断逻辑：
  - **HTTP 2xx**: 根据响应时间判断（<1000ms健康，>=1000ms警告）
  - **HTTP 404**: 标记为警告（页面不存在但网站可达）
  - **HTTP 4xx**: 标记为警告（客户端错误）
  - **HTTP 5xx**: 标记为错误（服务器内部错误，包括502、503、504等）
- 修改监控日志记录SQL，保存HTTP状态码：
  ```sql
  INSERT INTO monitor_logs (website_id, status, response_time, error_message, http_status_code) VALUES (?, ?, ?, ?, ?)
  ```

#### 修改2: check-all/route.ts
- 修改`analyzeResponse`函数的判断逻辑，确保HTTP 5xx状态码被正确标记为错误
- 修改监控日志记录SQL，保存HTTP状态码

### 3. 前端页面修改

#### 修改1: 接口定义
```typescript
interface Website {
  // ... 其他字段
  status_code?: number | null;  // 添加HTTP状态码字段
  response_content?: string | null;  // 添加响应内容字段
}
```

#### 修改2: WebsiteCard组件
- 在网站卡片上显示HTTP状态码徽章
- 根据HTTP状态码范围显示不同颜色：
  - **2xx**: 绿色
  - **3xx**: 蓝色
  - **4xx**: 黄色
  - **5xx**: 红色
- 点击HTTP状态码可查看响应内容
- 支持响应内容模态框显示

## 修复效果

### 修复前
- HTTP 502 → 显示"健康" ❌
- 无法看到具体的HTTP状态码

### 修复后
- HTTP 502 → 显示"错误" + "HTTP 502"红色徽章 ✅
- HTTP 404 → 显示"警告" + "HTTP 404"黄色徽章 ✅
- HTTP 200 (<1000ms) → 显示"健康" + "HTTP 200"绿色徽章 ✅
- HTTP 200 (>=1000ms) → 显示"警告" + "HTTP 200"绿色徽章 ✅

## 测试建议
1. 添加一个返回HTTP 502的测试网站
2. 执行批量检查
3. 查看前端是否正确显示为"错误"状态
4. 点击HTTP 502徽章，查看是否能显示响应内容

## 技术细节

### HTTP状态码判断标准
- **0ms**: 响应时间异常，标记为错误
- **<1000ms + HTTP 2xx**: 健康
- **>=1000ms + HTTP 2xx**: 警告（响应时间过长）
- **HTTP 404**: 警告（页面不存在但网站可达）
- **HTTP 4xx**: 警告（客户端错误）
- **HTTP 5xx**: 错误（服务器内部错误）
- **网络错误**: 错误（无法连接或超时）

### 错误信息格式
```
HTTP 502 (Bad Gateway): 服务器内部错误 (HEAD请求)
```
包含：
- HTTP状态码
- 状态描述
- 错误类型说明
- 请求方法（HEAD/GET）

## 相关文件
- `website-monitor/src/app/api/monitor/check/route.ts`
- `website-monitor/src/app/api/monitor/check-all/route.ts`
- `website-monitor/src/app/dashboard/page.tsx`
