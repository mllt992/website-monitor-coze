'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import '../globals.css';

// 图标组件
const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const Copy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  auth: boolean;
  params?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: string;
  response?: string;
  example?: string;
}

const apiEndpoints: ApiEndpoint[] = [
  // 认证相关
  {
    path: '/api/auth/login',
    method: 'POST',
    description: '用户登录，获取访问令牌',
    auth: false,
    params: [
      { name: 'username', type: 'string', required: true, description: '用户名或邮箱' },
      { name: 'password', type: 'string', required: true, description: '密码' }
    ],
    response: `{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}`
  },
  {
    path: '/api/auth/send-login-code',
    method: 'POST',
    description: '发送登录验证码到邮箱',
    auth: false,
    params: [
      { name: 'email', type: 'string', required: true, description: '邮箱地址' }
    ],
    response: `{
  "message": "验证码已发送"
}`
  },
  {
    path: '/api/auth/login-with-code',
    method: 'POST',
    description: '使用验证码登录',
    auth: false,
    params: [
      { name: 'email', type: 'string', required: true, description: '邮箱地址' },
      { name: 'code', type: 'string', required: true, description: '6位验证码' }
    ],
    response: `{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}`
  },
  {
    path: '/api/auth/verify',
    method: 'GET',
    description: '验证令牌有效性',
    auth: true,
    response: `{
  "valid": true,
  "user": {
    "userId": 1,
    "username": "admin",
    "email": "admin@example.com",
    "isAdmin": true
  }
}`
  },
  {
    path: '/api/auth/change-password',
    method: 'POST',
    description: '修改用户密码',
    auth: true,
    params: [
      { name: 'oldPassword', type: 'string', required: true, description: '旧密码' },
      { name: 'newPassword', type: 'string', required: true, description: '新密码' }
    ],
    response: `{
  "message": "密码修改成功"
}`
  },
  {
    path: '/api/auth/forgot-password',
    method: 'POST',
    description: '重置密码（通过邮箱验证码）',
    auth: false,
    params: [
      { name: 'email', type: 'string', required: true, description: '邮箱地址' },
      { name: 'code', type: 'string', required: true, description: '验证码' },
      { name: 'newPassword', type: 'string', required: true, description: '新密码' }
    ],
    response: `{
  "message": "密码重置成功"
}`
  },

  // 网站管理
  {
    path: '/api/websites',
    method: 'GET',
    description: '获取当前用户的网站列表',
    auth: true,
    response: `{
  "websites": [
    {
      "id": 1,
      "name": "示例网站",
      "url": "https://example.com",
      "description": "网站描述",
      "status": "healthy",
      "response_time": 234,
      "last_checked": "2024-01-01T12:00:00Z",
      "category_id": 1,
      "category_name": "分类名称",
      "category_color": "#FF6B6B",
      "tags": "标签1,标签2",
      "sort_order": 1
    }
  ]
}`
  },
  {
    path: '/api/websites',
    method: 'POST',
    description: '添加新网站',
    auth: true,
    params: [
      { name: 'name', type: 'string', required: true, description: '网站名称' },
      { name: 'url', type: 'string', required: true, description: '网站URL' },
      { name: 'description', type: 'string', required: false, description: '网站描述' },
      { name: 'category_id', type: 'number', required: false, description: '分类ID' },
      { name: 'tags', type: 'string', required: false, description: '标签（逗号分隔）' }
    ],
    response: `{
  "message": "网站添加成功",
  "websiteId": 123
}`
  },
  {
    path: '/api/websites/{id}',
    method: 'PUT',
    description: '更新网站信息',
    auth: true,
    params: [
      { name: 'name', type: 'string', required: false, description: '网站名称' },
      { name: 'url', type: 'string', required: false, description: '网站URL' },
      { name: 'description', type: 'string', required: false, description: '网站描述' },
      { name: 'category_id', type: 'number', required: false, description: '分类ID' },
      { name: 'tags', type: 'string', required: false, description: '标签' }
    ],
    response: `{
  "message": "网站更新成功"
}`
  },
  {
    path: '/api/websites/{id}',
    method: 'DELETE',
    description: '删除网站',
    auth: true,
    response: `{
  "message": "网站删除成功"
}`
  },
  {
    path: '/api/websites/{id}/check',
    method: 'POST',
    description: '手动检查指定网站',
    auth: true,
    response: `{
  "success": true,
  "websiteId": 1,
  "status": "healthy",
  "responseTime": 234,
  "httpStatusCode": 200
}`
  },
  {
    path: '/api/websites/order',
    method: 'POST',
    description: '更新网站排序',
    auth: true,
    params: [
      { name: 'orders', type: 'array', required: true, description: '排序数组 [{id:1, order:1}]' }
    ],
    response: `{
  "message": "排序更新成功"
}`
  },

  // 公开接口（无需认证）
  {
    path: '/api/public/websites',
    method: 'GET',
    description: '获取所有公开网站列表（前台展示用）',
    auth: false,
    response: `{
  "websites": [
    {
      "id": 1,
      "name": "示例网站",
      "url": "https://example.com",
      "status": "healthy",
      "response_time": 234,
      "last_checked": "2024-01-01T12:00:00Z",
      "category_name": "分类名称",
      "category_color": "#FF6B6B"
    }
  ]
}`
  },

  // 分类管理
  {
    path: '/api/categories',
    method: 'GET',
    description: '获取分类列表',
    auth: true,
    response: `{
  "categories": [
    {
      "id": 1,
      "name": "分类名称",
      "color": "#FF6B6B",
      "sort_order": 1,
      "website_count": 5
    }
  ]
}`
  },
  {
    path: '/api/categories',
    method: 'POST',
    description: '添加新分类',
    auth: true,
    params: [
      { name: 'name', type: 'string', required: true, description: '分类名称' },
      { name: 'color', type: 'string', required: true, description: '分类颜色（hex）' }
    ],
    response: `{
  "message": "分类添加成功",
  "categoryId": 1
}`
  },
  {
    path: '/api/categories/{id}',
    method: 'PUT',
    description: '更新分类信息',
    auth: true,
    params: [
      { name: 'name', type: 'string', required: false, description: '分类名称' },
      { name: 'color', type: 'string', required: false, description: '分类颜色' }
    ],
    response: `{
  "message": "分类更新成功"
}`
  },
  {
    path: '/api/categories/{id}',
    method: 'DELETE',
    description: '删除分类',
    auth: true,
    response: `{
  "message": "分类删除成功"
}`
  },
  {
    path: '/api/categories/reorder',
    method: 'POST',
    description: '更新分类排序',
    auth: true,
    params: [
      { name: 'orders', type: 'array', required: true, description: '排序数组 [{id:1, order:1}]' }
    ],
    response: `{
  "message": "排序更新成功"
}`
  },

  // 监控相关
  {
    path: '/api/monitor/check',
    method: 'POST',
    description: '检查单个网站状态（内部使用）',
    auth: false,
    params: [
      { name: 'websiteId', type: 'number', required: true, description: '网站ID' }
    ],
    response: `{
  "success": true,
  "websiteId": 1,
  "status": "healthy",
  "responseTime": 234
}`
  },
  {
    path: '/api/monitor/check-all',
    method: 'GET',
    description: '批量检查所有网站',
    auth: true,
    response: `{
  "results": [
    {
      "websiteId": 1,
      "status": "healthy",
      "responseTime": 234
    }
  ]
}`
  },
  {
    path: '/api/monitor/batch',
    method: 'POST',
    description: '批量检查指定网站',
    auth: true,
    params: [
      { name: 'websiteIds', type: 'array', required: true, description: '网站ID数组 [1,2,3]' }
    ],
    response: `{
  "results": [
    {
      "websiteId": 1,
      "status": "healthy",
      "responseTime": 234
    }
  ]
}`
  },

  // 通知规则管理
  {
    path: '/api/notification-rules',
    method: 'GET',
    description: '获取通知规则列表',
    auth: true,
    response: `{
  "rules": [
    {
      "id": 1,
      "name": "网站异常告警",
      "status": "error",
      "notify_email": true,
      "conditions": {
        "response_time": 5000,
        "include_5xx": true,
        "include_4xx": false,
        "custom_status_codes": []
      },
      "enabled": true
    }
  ]
}`
  },
  {
    path: '/api/notification-rules',
    method: 'POST',
    description: '添加通知规则',
    auth: true,
    params: [
      { name: 'name', type: 'string', required: true, description: '规则名称' },
      { name: 'status', type: 'string', required: true, description: '触发状态(error/warning)' },
      { name: 'notify_email', type: 'boolean', required: true, description: '是否邮件通知' },
      { name: 'conditions', type: 'object', required: true, description: '触发条件JSON' }
    ],
    response: `{
  "message": "规则添加成功",
  "ruleId": 1
}`
  },
  {
    path: '/api/notification-rules/{id}',
    method: 'PUT',
    description: '更新通知规则',
    auth: true,
    params: [
      { name: 'name', type: 'string', required: false, description: '规则名称' },
      { name: 'status', type: 'string', required: false, description: '触发状态' },
      { name: 'notify_email', type: 'boolean', required: false, description: '是否邮件通知' },
      { name: 'conditions', type: 'object', required: false, description: '触发条件' }
    ],
    response: `{
  "message": "规则更新成功"
}`
  },
  {
    path: '/api/notification-rules/{id}',
    method: 'DELETE',
    description: '删除通知规则',
    auth: true,
    response: `{
  "message": "规则删除成功"
}`
  },
  {
    path: '/api/notification-rules/{id}/toggle',
    method: 'POST',
    description: '启用/禁用通知规则',
    auth: true,
    response: `{
  "message": "规则状态更新成功",
  "enabled": true
}`
  },

  // 邮件配置
  {
    path: '/api/email/config',
    method: 'GET',
    description: '获取邮件配置',
    auth: true,
    response: `{
  "config": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_secure": false,
    "smtp_user": "your-email@gmail.com"
  }
}`
  },
  {
    path: '/api/email/config',
    method: 'POST',
    description: '更新邮件配置',
    auth: true,
    params: [
      { name: 'smtp_host', type: 'string', required: true, description: 'SMTP服务器地址' },
      { name: 'smtp_port', type: 'number', required: true, description: 'SMTP端口' },
      { name: 'smtp_secure', type: 'boolean', required: true, description: '是否使用SSL' },
      { name: 'smtp_user', type: 'string', required: true, description: 'SMTP用户名' },
      { name: 'smtp_pass', type: 'string', required: true, description: 'SMTP密码' }
    ],
    response: `{
  "message": "邮件配置已更新"
}`
  },
  {
    path: '/api/email/test',
    method: 'POST',
    description: '发送测试邮件',
    auth: true,
    response: `{
  "message": "测试邮件已发送"
}`
  },
  {
    path: '/api/email/send',
    method: 'POST',
    description: '发送邮件通知',
    auth: false,
    params: [
      { name: 'to', type: 'string', required: true, description: '收件人邮箱' },
      { name: 'subject', type: 'string', required: true, description: '邮件主题' },
      { name: 'text', type: 'string', required: true, description: '邮件内容' }
    ],
    response: `{
  "message": "邮件发送成功"
}`
  },

  // 系统配置
  {
    path: '/api/system-config',
    method: 'GET',
    description: '获取系统配置',
    auth: true,
    response: `{
  "configs": {
    "check_interval": 5,
    "timeout": 10,
    "retry_count": 3,
    "notification_cooldown": 300,
    "max_response_time": 200,
    "cleanup_logs_days": 30,
    "max_websites_per_user": 50
  }
}`
  },
  {
    path: '/api/system-config',
    method: 'POST',
    description: '更新系统配置',
    auth: true,
    params: [
      { name: 'check_interval', type: 'number', required: false, description: '检查间隔（分钟）' },
      { name: 'timeout', type: 'number', required: false, description: '超时时间（秒）' },
      { name: 'retry_count', type: 'number', required: false, description: '重试次数' },
      { name: 'notification_cooldown', type: 'number', required: false, description: '通知冷却时间（秒）' }
    ],
    response: `{
  "message": "系统配置已更新"
}`
  },

  // 数据库初始化
  {
    path: '/api/init-db',
    method: 'POST',
    description: '初始化数据库表结构',
    auth: false,
    response: `{
  "message": "数据库初始化成功"
}`
  }
];

function ApiDocsContent() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE'>('ALL');
  const [filterAuth, setFilterAuth] = useState<'ALL' | 'auth' | 'public'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const methodMatch = filterMethod === 'ALL' || endpoint.method === filterMethod;
    const authMatch = filterAuth === 'ALL' || 
                     (filterAuth === 'auth' && endpoint.auth) ||
                     (filterAuth === 'public' && !endpoint.auth);
    const searchMatch = searchTerm === '' || 
                      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    return methodMatch && authMatch && searchMatch;
  });

  const getMethodBadge = (method: string) => {
    const styles = {
      'GET': 'bg-green-50 text-green-700 border-green-200',
      'POST': 'bg-blue-50 text-blue-700 border-blue-200',
      'PUT': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'DELETE': 'bg-red-50 text-red-700 border-red-200'
    };
    return styles[method as keyof typeof styles] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('success', '复制成功', '代码已复制到剪贴板');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('error', '复制失败', '无法复制到剪贴板');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8 flex items-center gap-4">
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回管理
          </a>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">API 接口文档</h1>
            <p className="text-gray-600">RESTful API · 开发者文档</p>
          </div>
        </div>

      {/* Main Content */}
      <main>
        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索接口路径或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Method Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterMethod('ALL')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  filterMethod === 'ALL'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterMethod('GET')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  filterMethod === 'GET'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                GET
              </button>
              <button
                onClick={() => setFilterMethod('POST')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  filterMethod === 'POST'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                POST
              </button>
              <button
                onClick={() => setFilterMethod('PUT')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  filterMethod === 'PUT'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                PUT
              </button>
              <button
                onClick={() => setFilterMethod('DELETE')}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  filterMethod === 'DELETE'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                DELETE
              </button>
            </div>

            {/* Auth Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterAuth('ALL')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  filterAuth === 'ALL'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterAuth('auth')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  filterAuth === 'auth'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                需认证
              </button>
              <button
                onClick={() => setFilterAuth('public')}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                  filterAuth === 'public'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                公开
              </button>
            </div>
          </div>
        </div>

        {/* API Endpoints List */}
        <div className="space-y-4">
          {filteredEndpoints.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">未找到匹配的接口</p>
            </div>
          ) : (
            filteredEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Endpoint Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Method Badge */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold border ${getMethodBadge(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      
                      {/* Path */}
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono text-pink-600 break-all">
                          {endpoint.path}
                        </code>
                        <p className="text-xs text-gray-600 mt-1">
                          {endpoint.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Auth Badge */}
                    {endpoint.auth ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        🔐 需认证
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                        🌐 公开
                      </span>
                    )}
                  </div>
                </div>

                {/* Endpoint Details */}
                <div className="p-4 space-y-4">
                  {/* Request Parameters */}
                  {endpoint.params && endpoint.params.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[#1C1C1E] mb-2">请求参数</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 text-left font-medium text-gray-700">参数名</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">类型</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">必填</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-700">说明</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.params.map((param, idx) => (
                              <tr key={idx} className="border-t border-gray-200">
                                <td className="px-3 py-2 font-mono text-pink-600">{param.name}</td>
                                <td className="px-3 py-2">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-200 text-gray-700">
                                    {param.type}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  {param.required ? (
                                    <span className="text-red-600 font-medium">是</span>
                                  ) : (
                                    <span className="text-gray-500">否</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-gray-600">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Response Example */}
                  {endpoint.response && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-[#1C1C1E]">响应示例</h4>
                        <button
                          onClick={() => handleCopyCode(endpoint.response!)}
                          className="flex items-center space-x-1 text-[10px] text-pink-600 hover:text-pink-800 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>复制</span>
                        </button>
                      </div>
                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                          <code>{endpoint.response}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Authentication Info */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#1C1C1E] mb-3">📝 使用说明</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <p><strong>1. 认证方式：</strong>对于需要认证的接口，请在请求头中添加 Authorization 字段：</p>
            <pre className="bg-gray-50 p-2 rounded border border-gray-200 text-xs mt-1">
Authorization: Bearer YOUR_TOKEN_HERE
            </pre>
            <p className="mt-2"><strong>2. 获取令牌：</strong>调用 /api/auth/login 接口获取访问令牌</p>
            <p><strong>3. 响应格式：</strong>所有接口返回 JSON 格式数据</p>
            <p><strong>4. 错误处理：</strong>HTTP 状态码 4xx 表示客户端错误，5xx 表示服务器错误</p>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <ApiDocsContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}
