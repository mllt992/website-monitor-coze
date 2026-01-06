'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastProvider, useToast } from '@/components/ui/Toast';

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Edit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-4-4l2 2m0 0l2-2m-2 2l-7 7m0 0v3h3l7-7" />
  </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5l2 2m0 0l2-2m-2 2v4" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Bell = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const LogOut = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Mail = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

interface NotificationRule {
  id: number;
  user_id: number;
  website_id: number | null;
  rule_type: 'all' | 'specific';
  notification_events: string[];
  email_recipients: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  website_name?: string;
}

interface Website {
  id: number;
  name: string;
  url: string;
}

// 格式化时间为本地时间字符串
function formatLocalTime(dateString: string | undefined): string {
  if (!dateString) return '未知';
  
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

export default function NotificationRulesPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <NotificationRulesContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}

function NotificationRulesContent() {
  const { token, logout } = useAuth();
  const { showToast, showConfirm } = useToast();
  
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    rule_type: 'all' as 'all' | 'specific',
    website_id: '',
    notification_events: [] as string[],
    email_recipients: [''] as string[]
  });

  const availableEvents = [
    { id: 'down', label: '网站宕机', description: '当网站无法访问时' },
    { id: 'slow', label: '响应缓慢', description: '当响应时间超过阈值时' },
    { id: 'error', label: 'HTTP错误', description: '当返回4xx/5xx状态码时' },
    { id: 'recovery', label: '恢复通知', description: '当网站恢复正常时' }
  ];

  useEffect(() => {
    if (token) {
      fetchRules();
      fetchWebsites();
    }
  }, [token]);

  const fetchRules = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/notification-rules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Failed to fetch notification rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebsites = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/websites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setWebsites(data.websites);
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        website_id: form.rule_type === 'specific' && form.website_id ? parseInt(form.website_id) : null,
        email_recipients: form.email_recipients.filter(email => email.trim())
      };

      const response = await fetch('/api/notification-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('success', '添加成功', '通知规则已创建');
        setShowModal(false);
        resetForm();
        fetchRules();
      } else {
        const error = await response.json();
        showToast('error', '添加失败', error.error || '创建通知规则失败');
      }
    } catch (error) {
      console.error('Failed to add notification rule:', error);
      showToast('error', '添加失败', '网络错误，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRule = (rule: NotificationRule) => {
    setEditingRule(rule);
    setForm({
      rule_type: rule.rule_type,
      website_id: rule.website_id?.toString() || '',
      notification_events: rule.notification_events || [],
      email_recipients: rule.email_recipients?.length > 0 ? rule.email_recipients : ['']
    });
    setShowModal(true);
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        website_id: form.rule_type === 'specific' && form.website_id ? parseInt(form.website_id) : null,
        email_recipients: form.email_recipients.filter(email => email.trim())
      };

      const response = await fetch(`/api/notification-rules/${editingRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('success', '更新成功', '通知规则已更新');
        setShowModal(false);
        setEditingRule(null);
        resetForm();
        fetchRules();
      } else {
        const error = await response.json();
        showToast('error', '更新失败', error.error || '更新通知规则失败');
      }
    } catch (error) {
      console.error('Failed to update notification rule:', error);
      showToast('error', '更新失败', '网络错误，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: number, ruleName: string) => {
    showConfirm(
      '删除通知规则确认',
      `确定要删除通知规则吗？此操作不可恢复。`,
      async () => {
        try {
          const response = await fetch(`/api/notification-rules/${ruleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            showToast('success', '删除成功', '通知规则已删除');
            fetchRules();
          } else {
            const error = await response.json();
            showToast('error', '删除失败', error.error || '删除通知规则失败');
          }
        } catch (error) {
          console.error('Failed to delete notification rule:', error);
          showToast('error', '删除失败', '网络错误，请稍后重试');
        }
      }
    );
  };

  const handleToggleActive = async (ruleId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/notification-rules/${ruleId}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('success', '状态更新', `通知规则已${isActive ? '启用' : '禁用'}`);
        fetchRules();
      } else {
        const error = await response.json();
        showToast('error', '更新失败', error.error || '更新状态失败');
      }
    } catch (error) {
      console.error('Failed to toggle rule status:', error);
      showToast('error', '更新失败', '网络错误，请稍后重试');
    }
  };

  const resetForm = () => {
    setForm({
      rule_type: 'all',
      website_id: '',
      notification_events: [],
      email_recipients: ['']
    });
  };

  const addEmailRecipient = () => {
    setForm({ ...form, email_recipients: [...form.email_recipients, ''] });
  };

  const removeEmailRecipient = (index: number) => {
    if (form.email_recipients.length > 1) {
      const newRecipients = form.email_recipients.filter((_, i) => i !== index);
      setForm({ ...form, email_recipients: newRecipients });
    }
  };

  const updateEmailRecipient = (index: number, value: string) => {
    const newRecipients = [...form.email_recipients];
    newRecipients[index] = value;
    setForm({ ...form, email_recipients: newRecipients });
  };

  const toggleEvent = (eventId: string) => {
    const events = form.notification_events.includes(eventId)
      ? form.notification_events.filter(e => e !== eventId)
      : [...form.notification_events, eventId];
    setForm({ ...form, notification_events: events });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">通知规则</h1>
            <p className="text-gray-600">配置网站监控通知规则</p>
          </div>
        </div>

        {/* 规则列表 */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">通知规则列表</h2>
            <button
              onClick={() => {
                setEditingRule(null);
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl
                       hover:from-pink-600 hover:to-purple-600 transition-all duration-300
                       shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              新建规则
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无通知规则</h3>
              <p className="text-gray-500 mb-4">创建第一个通知规则来开始接收监控通知</p>
              <button
                onClick={() => {
                  setEditingRule(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>创建规则</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {rule.rule_type === 'all' ? '所有网站' : rule.website_name || `网站 #${rule.website_id}`}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.is_active ? '启用' : '禁用'}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">通知事件：</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.notification_events.map((eventId) => {
                            const event = availableEvents.find(e => e.id === eventId);
                            return event ? (
                              <span key={eventId} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                {event.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">邮件收件人：</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.email_recipients.map((email, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded">
                              <Mail className="w-3 h-3 mr-1" />
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        创建时间：{formatLocalTime(rule.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(rule.id, !rule.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title={rule.is_active ? '禁用' : '启用'}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          rule.is_active 
                            ? 'bg-green-500 border-green-500' 
                            : 'bg-gray-300 border-gray-300'
                        }`} />
                      </button>
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id, rule.rule_type === 'all' ? '所有网站规则' : rule.website_name || `网站 #${rule.website_id}`)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rule Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingRule ? '编辑通知规则' : '创建通知规则'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={editingRule ? handleUpdateRule : handleAddRule} className="space-y-6">
                {/* Rule Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">规则类型</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="rule_type"
                        value="all"
                        checked={form.rule_type === 'all'}
                        onChange={(e) => setForm({ ...form, rule_type: 'all' })}
                        className="mr-2"
                      />
                      <span className="text-sm">所有网站</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="rule_type"
                        value="specific"
                        checked={form.rule_type === 'specific'}
                        onChange={(e) => setForm({ ...form, rule_type: 'specific' })}
                        className="mr-2"
                      />
                      <span className="text-sm">指定网站</span>
                    </label>
                  </div>
                </div>

                {/* Website Selection */}
                {form.rule_type === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">选择网站</label>
                    <select
                      value={form.website_id}
                      onChange={(e) => setForm({ ...form, website_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择网站</option>
                      {websites.map((website) => (
                        <option key={website.id} value={website.id}>
                          {website.name} ({website.url})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notification Events */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">通知事件</label>
                  <div className="space-y-2">
                    {availableEvents.map((event) => (
                      <label key={event.id} className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={form.notification_events.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                          className="mt-1"
                        />
                        <div>
                          <span className="text-sm font-medium">{event.label}</span>
                          <p className="text-xs text-gray-500">{event.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Email Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">邮件收件人</label>
                  {form.email_recipients.map((email, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmailRecipient(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="输入邮箱地址"
                      />
                      {form.email_recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmailRecipient(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEmailRecipient}
                    className="text-sm text-pink-600 hover:text-pink-800"
                  >
                    + 添加收件人
                  </button>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || form.notification_events.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isSaving ? '保存中...' : (editingRule ? '更新' : '创建')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}