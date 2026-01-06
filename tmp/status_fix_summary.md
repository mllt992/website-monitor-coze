# HTTP状态码显示问题修复说明

## 问题描述
用户报告：网站"CRM-乖乖狼科技"返回HTTP 502状态码，但前端仍显示为"健康"状态。

## 问题根本原因
数据库中的网站状态数据是在修复逻辑之前创建的旧数据，所以status字段存储的是错误的值（healthy），虽然status_code字段已经正确记录为502。

## 修复方案

### 1. 代码层面的修复（已完成）
- 修改`check/route.ts`和`check-all/route.ts`中的`analyzeResponse`函数
- 确保HTTP 5xx状态码（包括502）被正确标记为`error`状态
- 在监控日志中保存HTTP状态码
- 前端显示HTTP状态码徽章，并根据状态码显示不同颜色

### 2. 数据库旧数据修复（刚完成）
创建了临时脚本`fix-status.js`，根据数据库中已有的`status_code`和`response_time`字段，重新计算并更新`status`字段。

修复逻辑：
- HTTP 2xx: 根据响应时间判断（<1000ms=healthy, >=1000ms=warning）
- HTTP 404: warning（页面不存在但网站可达）
- HTTP 4xx: warning（客户端错误）
- HTTP 5xx: error（服务器内部错误）

## 修复结果

### 修复前
```
CRM-乖乖狼科技: healthy, HTTP 502, 422ms  ❌ 错误
运维-乖乖狼科技: healthy, HTTP 401, 128ms  ❌ 错误
```

### 修复后
```
CRM-乖乖狼科技: error, HTTP 502, 422ms  ✅ 正确
运维-乖乖狼科技: warning, HTTP 401, 128ms  ✅ 正确
```

## 验证方法

### 方法1：查看数据库
```sql
SELECT name, status, status_code, response_time
FROM websites
WHERE name LIKE '%乖乖狼%';
```

预期结果：
- CRM-乖乖狼科技: error, 502, 422
- 运维-乖乖狼科技: warning, 401, 128

### 方法2：查看前端页面
访问 dashboard 页面，应该看到：
- "CRM-乖乖狼科技"显示为红色"error"状态 + "HTTP 502"红色徽章
- "运维-乖乖狼科技"显示为黄色"warning"状态 + "HTTP 401"黄色徽章

### 方法3：点击HTTP状态码徽章
点击HTTP 502徽章，应该能看到模态框显示：
```
HTTP状态码: 502
HTTP 502 (Bad Gateway): 服务器内部错误 (HEAD请求)
```

## 注意事项

1. **后续监控检查会自动使用新逻辑**：
   - 修复后的监控检查API会自动正确识别HTTP 5xx状态码
   - 新的监控记录会直接存储正确的status值

2. **不需要再次运行修复脚本**：
   - 旧数据已经修复完成
   - 后续的监控检查会自动使用新的正确逻辑

3. **HTTP状态码判断标准**：
   - **0ms或undefined**: error（异常）
   - **HTTP 2xx + <1000ms**: healthy（健康）
   - **HTTP 2xx + >=1000ms**: warning（响应慢）
   - **HTTP 404**: warning（页面不存在）
   - **HTTP 4xx**: warning（客户端错误）
   - **HTTP 5xx**: error（服务器错误）
   - **网络错误**: error（无法连接/超时）

## 相关文件修改
1. `website-monitor/src/app/api/monitor/check/route.ts`
2. `website-monitor/src/app/api/monitor/check-all/route.ts`
3. `website-monitor/src/app/dashboard/page.tsx`

临时文件（已删除）：
- `website-monitor/fix-status.js`
- `/tmp/fix_status_code.md`
