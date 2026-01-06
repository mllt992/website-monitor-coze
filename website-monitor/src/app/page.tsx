'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatLocalTime } from '@/lib/utils';

// 简化的图标组件，避免 lucide-react 依赖问题
const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Globe = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Filter = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LogOut = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

interface Website {
  id: number;
  name: string;
  url: string;
  description: string;
  category_name: string;
  category_color: string;
  category_sort_order: number;
  status: 'healthy' | 'warning' | 'error' | 'unknown' | '' | null;
  response_time: number;
  last_checked: string;
  tags: string;
  status_code?: number | null;
  response_content?: string | null;
}

interface Category {
  name: string;
  color: string;
  sort_order: number;
  websites: Website[];
}

interface WebsiteCardProps {
  website: Website;
  refreshingIds: Set<number>;
  onRefresh: (id: number) => void;
  onShowResponse: (content: string | null | undefined) => void;
}

const WebsiteCard: React.FC<WebsiteCardProps> = ({ 
  website, 
  refreshingIds, 
  onRefresh, 
  onShowResponse 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusCodeColor = (statusCode: number | null | undefined) => {
    if (!statusCode) return 'text-gray-500';
    if (statusCode >= 200 && statusCode < 300) return 'text-green-700';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-700';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-700';
    if (statusCode >= 500) return 'text-red-700';
    return 'text-gray-500';
  };

  const getStatusCodeBgColor = (statusCode: number | null | undefined) => {
    if (!statusCode) return 'bg-gray-100';
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-50 border border-green-200';
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-50 border border-blue-200';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-50 border border-yellow-200';
    if (statusCode >= 500) return 'bg-red-50 border border-red-200';
    return 'bg-gray-100 border border-gray-200';
  };

  return (
    <div className="group bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 active:scale-[0.98] cursor-pointer">
      <div className="flex flex-col h-full">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-pink-600 transition-colors">
              {website.name}
            </h3>
            <a 
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-pink-600 transition-colors truncate block"
            >
              {website.url}
            </a>
          </div>
          <div className={`px-3 py-2 rounded-xl border flex items-center space-x-2 transition-all duration-300 ${getStatusColor(website.status || 'unknown')}`}>
            {getStatusIcon(website.status || 'unknown')}
            <span className="text-xs font-bold uppercase tracking-wide">
              {website.status === 'healthy' ? '健康' : website.status === 'warning' ? '亚健康' : website.status === 'error' ? '异常' : '未知'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
          {website.description || '暂无描述'}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 text-gray-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span className="font-medium">
                {website.response_time}MS
              </span>
            </span>
            {website.status_code ? (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => onShowResponse(website.response_content)}
                  className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${getStatusCodeBgColor(website.status_code)} ${getStatusCodeColor(website.status_code)}`}
                  title={`HTTP ${website.status_code} - 点击查看响应内容`}
                >
                  {website.status_code}
                </button>
              </>
            ) : (
              <>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200">
                  N/A
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => onRefresh(website.id)}
            disabled={refreshingIds.has(website.id)}
            className={`p-2 rounded-xl transition-all duration-200 ${
              refreshingIds.has(website.id)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white/80 hover:bg-pink-50 text-gray-600 hover:text-pink-600 border border-gray-200 hover:border-pink-200'
            }`}
            title="刷新检查"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingIds.has(website.id) ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Last Checked */}
        <div className="text-gray-400 text-xs font-medium mt-3 pt-3 border-t border-gray-100">
          {formatLocalTime(website.last_checked)}
        </div>
      </div>

      {/* Tags */}
      {website.tags && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          {website.tags.split(',').filter(Boolean).slice(0, 3).map((tag, index) => (
            <span key={index} className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-bold uppercase tracking-wide border border-pink-200">
              {tag.trim().length > 12 ? tag.trim().substring(0, 12) + '...' : tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default function HomePage() {
  const { user, logout } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingIds, setRefreshingIds] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [categoryList, setCategoryList] = useState<string[]>([]);

  useEffect(() => {
    fetchWebsites();
  }, []);

  useEffect(() => {
    filterWebsites();
  }, [websites, selectedCategory, selectedStatus]);

  const fetchWebsites = async () => {
    try {
      // 获取网站数据（用于显示）
      const websitesResponse = await fetch('/api/public/websites');

      // 获取网站数据
      if (websitesResponse.ok) {
        const data = await websitesResponse.json();
        setWebsites(data.websites);
        
        // 按分类分组网站
        const groupedByCategory = data.websites.reduce((acc: { [key: string]: any }, website: Website) => {
          const categoryName = website.category_name || '未分类';
          if (!acc[categoryName]) {
            acc[categoryName] = {
              name: categoryName,
              color: website.category_color || '#FFEAA7',
              sort_order: website.category_sort_order || 999,
              websites: []
            };
          }
          acc[categoryName].websites.push(website);
          return acc;
        }, {});

        // 从网站数据中提取分类信息
        const categoryArray = Object.values(groupedByCategory).sort((a: any, b: any) => {
          const orderA = a.sort_order || 999;
          const orderB = b.sort_order || 999;
          return orderA - orderB;
        }) as Category[];
        
        console.log('Categories from websites only:', categoryArray.map(c => ({ name: c.name, order: c.sort_order })));
        setCategories(categoryArray);
        setCategoryList(categoryArray.map((cat: Category) => cat.name));
        
        // 如果有网站且状态都是未知的，则触发一次检查
        const hasUnknownStatus = data.websites.some((w: any) => !w.status || w.status === 'unknown' || w.status === '');
        if (data.websites.length > 0 && hasUnknownStatus) {
          await checkAllWebsites();
        }
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllWebsites = async () => {
    try {
      const response = await fetch('/api/monitor/check-all', { method: 'GET' });
      if (response.ok) {
        console.log('网站检查完成');
        // 重新获取数据以更新状态
        setTimeout(() => {
          fetchWebsites();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to check websites:', error);
    }
  };

  const filterWebsites = () => {
    let filtered = categories;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cat => cat.name === selectedCategory);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.map(category => ({
        ...category,
        websites: category.websites.filter(w => w.status === selectedStatus)
      })).filter(cat => cat.websites.length > 0);
    }

    setFilteredCategories(filtered);
  };

  const showResponseContent = (content: string | null | undefined) => {
    if (!content) return;
    
    // 创建一个现代化的弹窗显示响应内容
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in';
    modal.innerHTML = `
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-4xl max-h-[85vh] overflow-auto shadow-2xl border border-white/60 animate-slide-up">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900">HTTP响应内容</h3>
              <p class="text-sm text-gray-500 font-medium">网站服务器返回的原始内容</p>
            </div>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-gray-100 rounded-xl transition-colors group">
            <svg class="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <div class="text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-auto custom-scrollbar">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        <div class="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] transition-all duration-200 font-semibold shadow-lg shadow-pink-500/25">
            关闭
          </button>
        </div>
      </div>
      <style>
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
      </style>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    // ESC键关闭
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  };

  const checkSingleWebsite = async (websiteId: number) => {
    // 添加到刷新中的状态
    setRefreshingIds(prev => new Set(prev).add(websiteId));
    
    try {
      const response = await fetch(`/api/websites/${websiteId}/check`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 更新本地状态中的网站信息
          setWebsites(prev => prev.map(w => 
            w.id === websiteId ? { ...w, ...data.website } : w
          ));
        }
      } else {
        console.error('Failed to check website:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to check website:', error);
    } finally {
      // 从刷新中的状态移除
      setRefreshingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(websiteId);
        return newSet;
      });
    }
  };

  const refreshData = () => {
    setLoading(true);
    checkAllWebsites().then(() => {
      fetchWebsites();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/60 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-8 text-gray-600 font-medium text-lg">加载中...</p>
          <p className="mt-2 text-gray-400 text-sm">正在获取网站监控数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
      {/* 增强装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-200/30 to-rose-200/20 rounded-full blur-[180px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-rose-200/25 to-pink-200/15 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-white/20 to-pink-100/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header - 现代化高端设计 */}
      <header className="relative bg-white/70 backdrop-blur-xl border-b border-white/60 sticky top-0 z-50 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg shadow-pink-500/25 border border-white/50">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                  网站监控系统
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Website Monitoring System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={refreshData}
                className="p-2.5 sm:p-3 text-gray-600 hover:text-pink-600 rounded-xl hover:bg-white/80 active:scale-95 transition-all duration-200 border border-transparent hover:border-pink-200/50 shadow-sm hover:shadow-md"
                title="刷新数据"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {user ? (
                <>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-pink-500/25 hover:shadow-xl"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-semibold tracking-tight text-sm sm:text-base">管理</span>
                  </button>
                  <button
                    onClick={logout}
                    className="bg-white border border-pink-200 text-pink-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl hover:bg-pink-50 active:scale-[0.98] transition-all duration-200 flex items-center space-x-2 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
                    title="退出登录"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">退出</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-white border border-pink-200 text-pink-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl hover:bg-pink-50 active:scale-[0.98] transition-all duration-200 font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
                >
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative z-10">
        {/* Statistics - 现代化统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8">
          <div className="group bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:shadow-pink-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base font-bold text-gray-500 mb-2 uppercase tracking-wide">总网站</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{websites.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg shadow-pink-500/25">
                <Globe className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="group bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:shadow-green-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base font-bold text-gray-500 mb-2 uppercase tracking-wide">健康</p>
                <p className="text-2xl sm:text-3xl font-black text-green-600 leading-tight">{websites.filter(w => w.status === 'healthy').length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/25">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="group bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:shadow-yellow-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base font-bold text-gray-500 mb-2 uppercase tracking-wide">亚健康</p>
                <p className="text-2xl sm:text-3xl font-black text-yellow-600 leading-tight">{websites.filter(w => w.status === 'warning').length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl shadow-lg shadow-yellow-500/25">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="group bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 sm:p-6 hover:shadow-xl hover:shadow-red-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm sm:text-base font-bold text-gray-500 mb-2 uppercase tracking-wide">异常</p>
                <p className="text-2xl sm:text-3xl font-black text-red-600 leading-tight">{websites.filter(w => w.status === 'error').length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl shadow-lg shadow-red-500/25">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters - 现代化筛选设计 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/60 shadow-md">
              <Filter className="w-5 h-5 text-pink-600" />
              <span className="text-gray-900 font-bold uppercase tracking-wide text-sm">筛选</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-transparent active:scale-[0.98] transition-all text-gray-700 text-sm font-medium hover:border-pink-200 shadow-md"
            >
              <option value="all">所有分类</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>{category.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-transparent active:scale-[0.98] transition-all text-gray-700 text-sm font-medium hover:border-pink-200 shadow-md"
            >
              <option value="all">所有状态</option>
              <option value="healthy">健康</option>
              <option value="warning">亚健康</option>
              <option value="error">异常</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="px-4 py-2.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 group shadow-md hover:shadow-lg flex items-center space-x-2"
              title="刷新数据"
            >
              <RefreshCw className="w-5 h-5 text-pink-600 group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-gray-700 font-medium text-sm">刷新</span>
            </button>
          </div>
        </div>

        {/* Category Blocks */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.name} className="space-y-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full shadow-md"
                  style={{ backgroundColor: category.color }}
                />
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                <span className="px-3 py-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-full text-sm font-bold text-gray-600">
                  {category.websites.length} 个网站
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
                {category.websites.map((website) => (
                  <WebsiteCard
                    key={website.id}
                    website={website}
                    refreshingIds={refreshingIds}
                    onRefresh={checkSingleWebsite}
                    onShowResponse={showResponseContent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl flex items-center justify-center shadow-xl shadow-pink-500/10 mx-auto">
                <Globe className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <p className="mt-6 text-gray-500 font-medium text-lg">暂无符合条件的网站</p>
            <p className="mt-2 text-gray-400 text-sm">请尝试调整筛选条件或添加新的网站</p>
          </div>
        )}
      </main>
    </div>
  );
}