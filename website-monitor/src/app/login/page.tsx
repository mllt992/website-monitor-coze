'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'password' | 'code'>('password');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getMessageType = () => {
    if (message.includes('成功') || message.includes('已发送')) {
      return 'success';
    } else if (message) {
      return 'error';
    }
    return '';
  };

  const getPasswordFieldType = () => {
    if (loginType === 'password') {
      return 'password';
    }
    return 'text';
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        setMessage('登录成功！');
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setMessage(data.error || '登录失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async () => {
    if (!formData.email) {
      setMessage('请输入邮箱');
      return;
    }

    setSendingCode(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('验证码已发送到您的邮箱');
        // 开始倒计时60秒
        setCountdown(60);
      } else {
        setMessage(data.error || '发送失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login-with-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code
        })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        setMessage('登录成功！');
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setMessage(data.error || '登录失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-pink-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">网站监控系统</h1>
          <p className="text-gray-600">请选择登录方式</p>
        </div>

        <div className="flex mb-6 bg-pink-50 rounded-xl p-1">
          <button
            onClick={() => setLoginType('password')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              loginType === 'password'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            密码登录
          </button>
          <button
            onClick={() => setLoginType('code')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              loginType === 'code'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-600 hover:text-pink-600'
            }`}
          >
            验证码登录
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

        {loginType === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="用户名或邮箱"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="密码"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? '登录中...' : '登录'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors duration-200"
              >
                忘记密码？
              </button>
            </div>
          </form>
        )}

        {loginType === 'code' && (
          <form onSubmit={handleCodeLogin} className="space-y-4">
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
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="验证码"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={sendEmailCode}
                disabled={sendingCode || !formData.email || countdown > 0}
                className="px-4 py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-medium hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[100px]"
              >
                {countdown > 0 ? `${countdown}s` : sendingCode ? '发送中...' : '发送验证码'}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>默认管理员账户：xrilang / 123456</p>
        </div>
      </div>
    </div>
  );
}