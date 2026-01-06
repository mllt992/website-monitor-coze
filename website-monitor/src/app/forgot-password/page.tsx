'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // 1: 输入邮箱, 2: 重置密码
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
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

  const sendVerificationCode = async () => {
    if (!formData.email) {
      setMessage('请输入邮箱');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('验证码已发送到您的邮箱');
        setStep(2); // 切换到第二步
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

  const resetPassword = async (e: React.FormEvent) => {
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
      setMessage('密码长度至少为6位');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          verificationCode: formData.verificationCode,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('密码重置成功！');
        // 延迟跳转到登录页
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setMessage(data.error || '重置失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!formData.email) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('验证码已重新发送');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-pink-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {step === 1 ? '忘记密码' : '重置密码'}
          </h1>
          <p className="text-gray-600">
            {step === 1 ? '请输入您的邮箱地址' : '请输入验证码和新密码'}
          </p>
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

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="请输入您的邮箱地址"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <button
              onClick={sendVerificationCode}
              disabled={loading || !formData.email}
              className="w-full bg-gradient-to-r from-purple-400 to-purple-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </div>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="请输入验证码"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={resendCode}
                disabled={loading || countdown > 0}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[100px]"
              >
                {countdown > 0 ? `${countdown}s` : '重新发送'}
              </button>
            </div>
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
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-600 hover:text-pink-600 text-sm font-medium transition-colors duration-200"
          >
            返回登录
          </button>
        </div>
      </div>
    </div>
  );
}