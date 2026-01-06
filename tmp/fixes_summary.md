# 问题修复总结

## 修复的问题

### 问题1：刷新后时间显示不对

**问题描述：**
- 网站的最后检查时间（last_checked）显示为UTC时间，而不是本地时间
- 通知规则的创建时间也存在同样问题

**根本原因：**
- 直接使用`new Date(dateString).toLocaleString()`显示时间
- 但数据库存储的是UTC时间字符串（如 "2025-12-30T03:09:11.000Z"）
- 需要正确的时区转换

**修复方案：**

1. **添加formatLocalTime工具函数**
```typescript
function formatLocalTime(dateString: string | null | undefined): string {
  if (!dateString) return '未检查'（或'未知'）;
  
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
}
```

2. **在dashboard页面应用时间格式化**
   - WebsiteCard组件中的"检查"时间
   - Overview视图中的时间显示

3. **在通知规则页面应用时间格式化**
   - 规则卡片中的"创建时间"显示

**修复效果：**
- UTC时间：`2025-12-30T03:09:11.000Z`
- 转换后显示：`2025-12-30 11:09:11`（北京时间，+8小时）

---

### 问题2：通知规则添加成功，但刷新看不到

**问题描述：**
- 添加通知规则后显示"添加成功"提示
- 刷新页面后，新添加的规则不显示
- API调用返回500错误

**根本原因：**

1. **JWT_SECRET不一致**
   - `.env.local`文件中：`JWT_SECRET=your-secret-key-change-this-in-production`
   - `auth.ts`文件中默认值：`'your-secret-key'`
   - 导致登录时用不同secret生成token，验证时失败

2. **JSON字段类型处理问题**
   - MySQL 8.0+的JSON类型自动解析为对象
   - 其他版本返回字符串需要手动解析
   - API路由在格式化数据时没有处理这两种情况

3. **密码hash验证失败**
   - 用户密码hash格式不正确
   - 导致无法登录获取有效token

**修复方案：**

1. **统一JWT_SECRET**
```typescript
// src/lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
```

2. **修复JSON字段解析**
```typescript
const formattedRules = rules.map((rule: any) => ({
  ...rule,
  notification_events: typeof rule.notification_events === 'string' 
    ? JSON.parse(rule.notification_events) 
    : (rule.notification_events || []),
  email_recipients: typeof rule.email_recipients === 'string' 
    ? JSON.parse(rule.email_recipients) 
    : (rule.email_recipients || [])
}));
```

3. **重置管理员密码**
```javascript
const passwordHash = await bcrypt.hash('123456', 12);
await query('UPDATE users SET password = ? WHERE id = 1', [passwordHash]);
```

4. **添加调试日志**
```typescript
console.log('创建通知规则:', { user_id, rule_type, notification_events, email_recipients });
console.log('创建成功，ID:', result.insertId);
```

**修复效果：**
- ✅ 登录功能正常
- ✅ 添加通知规则成功
- ✅ 刷新后能看到新添加的规则
- ✅ API正常返回规则列表

---

## 测试验证

### 测试1：时间显示
```bash
# 预期：时间显示为本地时间（北京时间）
# 示例：2025-12-30 11:09:11
```

### 测试2：通知规则添加
```bash
# 1. 登录获取token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"xrilang@mllt.cc","password":"123456"}'

# 2. 添加规则
curl -X POST http://localhost:3000/api/notification-rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_type": "all",
    "notification_events": ["error", "slow"],
    "email_recipients": ["test@example.com"]
  }'

# 3. 获取规则列表
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/notification-rules
```

预期结果：
- 步骤1：返回token和用户信息
- 步骤2：返回 `{"success":true,"id":N}`
- 步骤3：返回包含新规则的列表

---

## 修改的文件

1. **website-monitor/src/lib/auth.ts**
   - 统一JWT_SECRET默认值

2. **website-monitor/src/app/api/notification-rules/route.ts**
   - 修复JSON字段类型处理
   - 添加调试日志

3. **website-monitor/src/app/dashboard/page.tsx**
   - 添加formatLocalTime函数
   - 应用时间格式化到所有时间显示

4. **website-monitor/src/app/notification-rules/page.tsx**
   - 添加formatLocalTime函数
   - 应用时间格式化到创建时间显示

---

## 注意事项

1. **JWT_SECRET安全**
   - 生产环境应使用强密钥
   - 不要使用默认的`your-secret-key-change-this-in-production`
   - 建议使用环境变量或密钥管理服务

2. **时区处理**
   - 所有时间都应以UTC格式存储在数据库
   - 显示时转换为用户本地时间
   - `formatLocalTime`函数可以复用到其他页面

3. **JSON字段兼容性**
   - 考虑不同MySQL版本的JSON类型处理差异
   - 使用`typeof`检查确保兼容性
