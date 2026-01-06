'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface SessionExpiredContextType {
  showSessionExpired: () => void;
}

const SessionExpiredContext = createContext<SessionExpiredContextType | undefined>(undefined);

export function useSessionExpired() {
  const context = useContext(SessionExpiredContext);
  if (!context) {
    throw new Error('useSessionExpired must be used within a SessionExpiredProvider');
  }
  return context;
}

interface SessionExpiredProviderProps {
  children: ReactNode;
}

export function SessionExpiredProvider({ children }: SessionExpiredProviderProps) {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const showSessionExpired = useCallback(() => {
    setShowModal(true);
    setCountdown(3);
  }, []);

  useEffect(() => {
    // 监听自定义事件，用于从api.ts触发
    const handleSessionExpired = () => {
      showSessionExpired();
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [showSessionExpired]);

  // 倒计时逻辑
  useEffect(() => {
    if (!showModal) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showModal]);

  // 倒计时结束后跳转登录页
  useEffect(() => {
    if (showModal && countdown === 0) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  }, [showModal, countdown]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  return (
    <SessionExpiredContext.Provider value={{ showSessionExpired }}>
      {children}

      {/* 登录过期提示模态框 */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(236, 72, 153, 0.3)' }}
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-[32px] shadow-2xl border border-white/30 max-w-sm w-full p-8 transform transition-all duration-500 scale-100 animate-in fade-in zoom-in-95">
            {/* 图标 */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%)',
                  border: '2px solid rgba(236, 72, 153, 0.2)'
                }}
              >
                <svg
                  className="w-10 h-10"
                  style={{ color: '#ec4899' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* 标题 */}
            <h2 className="text-2xl font-bold text-center mb-3" style={{ color: '#831843' }}>
              登录已过期
            </h2>

            {/* 描述 */}
            <p className="text-center mb-6" style={{ color: '#9d174d' }}>
              您的登录状态已失效，为了账户安全，请重新登录
            </p>

            {/* 倒计时 */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center px-6 py-2 rounded-full" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 100%)' }}>
                <span className="text-sm font-medium" style={{ color: '#be185d' }}>
                  {countdown > 0 ? `${countdown} 秒后自动跳转` : '正在跳转...'}
                </span>
              </div>
            </div>

            {/* 按钮 */}
            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-6 rounded-[24px] font-bold text-white shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)'
              }}
            >
              立即重新登录
            </button>
          </div>
        </div>
      )}
    </SessionExpiredContext.Provider>
  );
}
