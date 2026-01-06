'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [method, setMethod] = useState<'password' | 'email'>('password');
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    verificationCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 倒计时效果
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  // 如果用户未登录，重定向到登录页
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getMessageType = () => {
    if (message.includes('成功')) {
      return 'success';
    } else if (message) {
      return 'error';
    }
    return '';
  };

  const sendVerificationCode = async () => {
    if (!formData.email) {
      setMessage('请输入邮箱');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('验证码已发送到您的邮箱');
        setCountdown(60);
      } else {
        setMessage(data.error || '发送失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // 验证密码
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('新密码长度至少为6位');
      setLoading(false);
      return;
    }

    try {
      const requestBody: any = {
        method,
        newPassword: formData.newPassword
      };

      if (method === 'password') {
        requestBody.oldPassword = formData.oldPassword;
      } else {
        requestBody.email = formData.email;
        requestBody.verificationCode = formData.verificationCode;
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('密码修改成功！');
        // 清空表单
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
          email: '',
          verificationCode: ''
        });
        // 延迟跳转到仪表板
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage(data.error || '修改失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // 或者显示加载中
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-pink-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">修改密码</h1>
          <p className="text-gray-600">请选择验证方式</p>
        </div>

        <div className="flex mb-6 bg-pink-50 rounded-xl p-1">
          <button
            onClick={() => setMethod('password')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              method === 'password'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            旧密码验证
          </button>
          <button
            onClick={() => setMethod('email')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              method === 'email'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            邮箱验证
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm transition-all duration-200 ${
            getMessageType() === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : getMessageType() === 'error'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : ''
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {method === 'password' ? (
            <>
              <div>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleInputChange}
                  placeholder="旧密码"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="邮箱地址"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  placeholder="验证码"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={loading || !formData.email || countdown > 0}
                  className="px-4 py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-medium hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[100px]"
                >
                  {countdown > 0 ? `${countdown}s` : loading ? '发送中...' : '发送验证码'}
                </button>
              </div>
            </>
          )}

          <div>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="新密码（至少6位）"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
              required
              minLength={6}
            />
          </div>
          <div>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="确认新密码"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {loading ? '修改中...' : '修改密码'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-pink-600 text-sm font-medium transition-colors duration-200"
          >
            返回上页
          </button>
        </div>
      </div>
    </div>
  );
}