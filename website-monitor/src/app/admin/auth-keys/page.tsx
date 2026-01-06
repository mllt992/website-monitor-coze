'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff, Copy, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface AuthKey {
  id: number;
  user_id: number | null;
  key_name: string;
  api_key: string;
  is_active: number;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export default function AuthKeysPage() {
  const [keys, setKeys] = useState<AuthKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<number | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ success: boolean; data: any[]; error?: string }>(
        '/api/auth-keys'
      );
      if (data.success) {
        setKeys(data.data);
      }
    } catch (error) {
      console.error('加载授权密钥失败:', error);
      showToast('加载授权密钥失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      showToast('请输入密钥名称', 'error');
      return;
    }

    try {
      const data = await apiClient.post<{ success: boolean; data: { apiKey: string }; error?: string }>(
        '/api/auth-keys',
        { keyName: newKeyName }
      );

      if (data.success) {
        setNewApiKey(data.data.apiKey);
        setShowApiKey(true);
        setShowCreateModal(false);
        setNewKeyName('');
        await loadKeys();
        showToast('授权密钥创建成功', 'success');
      } else {
        showToast(data.error || '创建失败', 'error');
      }
    } catch (error) {
      console.error('创建授权密钥失败:', error);
      showToast('创建授权密钥失败', 'error');
    }
  };

  const handleDeleteKey = (id: number) => {
    setDeleteKeyId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteKey = async () => {
    if (!deleteKeyId) {
      setShowDeleteModal(false);
      return;
    }

    try {
      const data = await apiClient.delete<{ success: boolean; error?: string }>(
        `/api/auth-keys/${deleteKeyId}`
      );

      if (data.success) {
        await loadKeys();
        showToast('授权密钥删除成功', 'success');
      } else {
        showToast(data.error || '删除失败', 'error');
      }
    } catch (error) {
      console.error('删除授权密钥失败:', error);
      showToast('删除授权密钥失败', 'error');
    } finally {
      setShowDeleteModal(false);
      setDeleteKeyId(null);
    }
  };

  const handleToggleKey = async (id: number, isActive: boolean) => {
    try {
      const data = await apiClient.post<{ success: boolean; error?: string }>(
        `/api/auth-keys/${id}`,
        { isActive: !isActive }
      );

      if (data.success) {
        await loadKeys();
        showToast(!isActive ? '授权密钥已启用' : '授权密钥已禁用', 'success');
      } else {
        showToast(data.error || '操作失败', 'error');
      }
    } catch (error) {
      console.error('更新授权密钥失败:', error);
      showToast('更新授权密钥失败', 'error');
    }
  };

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    showToast('密钥已复制到剪贴板', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatLocalTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-8">
      {/* 页面标题 */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          返回管理
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">授权密钥管理</h1>
          <p className="text-gray-600">
            管理用于监控接口的授权密钥，密钥可用于定时任务调用监控接口
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl
                   hover:from-pink-600 hover:to-purple-600 transition-all duration-300
                   shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
        >
          <Plus size={20} />
          新增授权密钥
        </button>
      </div>

      {/* 密钥列表 */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="inline-block animate-spin mb-2" size={24} />
            <p>加载中...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">暂无授权密钥</p>
            <p className="text-sm">点击上方按钮创建授权密钥</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">密钥名称</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">API 密钥</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">状态</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">使用次数</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">最后使用</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">创建时间</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-t border-gray-100 hover:bg-white/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{key.key_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 font-mono">
                        {key.api_key.substring(0, 8)}•••••••••••••••••••••••••
                      </code>
                      <button
                        onClick={() => handleCopyApiKey(key.api_key)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="复制完整密钥"
                      >
                        <Copy size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        key.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {key.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{key.usage_count}</td>
                  <td className="px-6 py-4 text-gray-600">{formatLocalTime(key.last_used_at)}</td>
                  <td className="px-6 py-4 text-gray-600">{formatLocalTime(key.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleKey(key.id, key.is_active === 1)}
                        className={`p-2 rounded-lg transition-colors ${
                          key.is_active
                            ? 'text-yellow-600 hover:bg-yellow-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={key.is_active ? '禁用' : '启用'}
                      >
                        {key.is_active ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 新增密钥模态框 */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">新增授权密钥</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">密钥名称</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="请输入密钥名称"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreateKey}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all font-medium"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 显示新密钥模态框 */}
      {showApiKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowApiKey(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">授权密钥创建成功</h2>
            <p className="text-gray-600 mb-4">
              请妥善保存以下密钥，关闭后将无法再次查看完整密钥：
            </p>

            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <code className="text-lg font-mono text-gray-800 break-all">{newApiKey}</code>
            </div>

            <button
              onClick={() => handleCopyApiKey(newApiKey)}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all font-medium mb-3"
            >
              复制密钥
            </button>
            <button
              onClick={() => setShowApiKey(false)}
              className="w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">确认删除</h2>
            </div>

            <p className="text-gray-600 mb-6">
              确定要删除此授权密钥吗？删除后将无法恢复，且使用此密钥的定时任务将无法正常工作。
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteKeyId(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteKey}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">使用说明</h3>
        <div className="space-y-3 text-gray-600">
          <p>
            1. 创建授权密钥后，可通过以下接口调用监控检测：
          </p>
          <code className="block p-3 bg-gray-100 rounded-lg text-sm font-mono">
            GET /api/monitor/batch-check?key=&lt;你的密钥&gt;
          </code>
          <p>2. 该接口将自动检测所有网站状态，并根据通知规则发送邮件告警</p>
          <p>3. 建议配置定时任务（如每 5 分钟调用一次）</p>
          <p>4. 请妥善保管密钥，避免泄露</p>
        </div>
      </div>
    </div>
  );
}
