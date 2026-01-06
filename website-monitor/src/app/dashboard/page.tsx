'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api';
import { formatLocalTime } from '@/lib/utils';
import './globals.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 高端图标组件，使用更现代的设计语言
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v16m8-8H4" />
  </svg>
);

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Trash2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5l2 2m0 0l2-2m-2 2v4" />
  </svg>
);

const Edit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-4-4l2 2m0 0l2-2m-2 2l-7 7m0 0v3h3l7-7" />
  </svg>
);

const Mail = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Save = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4m-6 0l-3 3m0 0l3 3m-3-3V4" />
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const Globe = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LogOut = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Timer = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Bell = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const Database = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
  </svg>
);

const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const Key = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    <path d="M15 7h.01" />
  </svg>
);

interface Website {
  id: number;
  name: string;
  url: string;
  description: string;
  category_id: number | null;
  category_name: string;
  category_color: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  response_time: number;
  last_checked: string;
  tags: string;
  sort_order: number;
  status_code?: number | null;  // HTTP状态码
  response_content?: string | null;  // 响应内容
}

interface Category {
  id: number;
  name: string;
  color: string;
  user_id: number | null;
}

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
}

interface SystemConfig {
  check_interval: number;
  timeout: number;
  retry_count: number;
  notification_cooldown: number;
  max_response_time: number;
  cleanup_logs_days: number;
  max_websites_per_user: number;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </ProtectedRoute>
  );
}

// 拖拽图标组件
const GripVertical = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={9} cy={12} r={1} />
    <circle cx={9} cy={5} r={1} />
    <circle cx={9} cy={19} r={1} />
    <circle cx={15} cy={12} r={1} />
    <circle cx={15} cy={5} r={1} />
    <circle cx={15} cy={19} r={1} />
  </svg>
);

// 可拖拽的Website Card组件
function SortableWebsiteCard({ 
  website, 
  onEdit, 
  onDelete, 
  onSetContentModal,
  getStatusIcon,
  getStatusColor
}: {
  website: Website;
  onEdit: (website: Website) => void;
  onDelete: (id: number, name: string) => void;
  onSetContentModal: (modal: any) => void;
  getStatusIcon: (status: string) => React.JSX.Element;
  getStatusColor: (status: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: website.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <WebsiteCardContent 
        website={website}
        onEdit={onEdit}
        onDelete={onDelete}
        onSetContentModal={onSetContentModal}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        dragHandleProps={{...listeners}}
      />
    </div>
  );
}

// Website Card内容组件
function WebsiteCardContent({ 
  website, 
  onEdit, 
  onDelete, 
  onSetContentModal,
  getStatusIcon,
  getStatusColor,
  dragHandleProps
}: {
  website: Website;
  onEdit: (website: Website) => void;
  onDelete: (id: number, name: string) => void;
  onSetContentModal: (modal: any) => void;
  getStatusIcon: (status: string) => React.JSX.Element;
  getStatusColor: (status: string) => string;
  dragHandleProps?: any;
}) {
  // 获取HTTP状态码的颜色
  const getStatusCodeColor = (code: number | null | undefined) => {
    if (!code) return 'text-gray-400';
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code >= 300 && code < 400) return 'text-blue-600';
    if (code >= 400 && code < 500) return 'text-yellow-600';
    if (code >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  // 获取HTTP状态码的背景色
  const getStatusCodeBg = (code: number | null | undefined) => {
    if (!code) return 'bg-gray-100';
    if (code >= 200 && code < 300) return 'bg-green-50 border-green-200';
    if (code >= 300 && code < 400) return 'bg-blue-50 border-blue-200';
    if (code >= 400 && code < 500) return 'bg-yellow-50 border-yellow-200';
    if (code >= 500) return 'bg-red-50 border-red-200';
    return 'bg-gray-100 border-gray-200';
  };

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow relative group">
      {/* 拖拽手柄 - 仅在hover时显示 */}
      <div 
        {...dragHandleProps}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getStatusIcon(website.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-sm font-medium text-gray-900 truncate">{website.name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(website.status)}`}>
                {website.status}
              </span>
              {website.status_code && (
                <button
                  onClick={() => onSetContentModal({
                    open: true,
                    title: `HTTP状态码: ${website.status_code}`,
                    content: website.response_content || `HTTP ${website.status_code} 状态响应`,
                    type: 'text'
                  })}
                  className={`
                    inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border
                    cursor-pointer hover:shadow-sm transition-shadow
                    ${getStatusCodeBg(website.status_code)} ${getStatusCodeColor(website.status_code)}
                  `}
                  title={`点击查看HTTP ${website.status_code}响应内容`}
                >
                  HTTP {website.status_code}
                </button>
              )}
            </div>
            <button
              onClick={() => onSetContentModal({
                open: true,
                title: website.url,
                content: website.url,
                type: 'url'
              })}
              className="text-xs text-blue-600 hover:text-blue-800 truncate block mt-1"
            >
              {website.url}
            </button>
            {website.description && (
              <p className="text-xs text-gray-600 mt-1">{website.description}</p>
            )}
            {website.category_name && (
              <div className="flex items-center space-x-1 mt-2">
                <div 
                  className="w-2 h-2 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: website.category_color }}
                ></div>
                <span className="text-xs text-gray-600">{website.category_name}</span>
              </div>
            )}
            <div className="flex items-center space-x-3 mt-2 text-[10px] text-gray-500">
              <span>响应: {website.response_time}ms</span>
              <span>检查: {formatLocalTime(website.last_checked)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={() => onEdit(website)}
            className="p-1.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(website.id, website.name)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user, token, logout } = useAuth();
  const { showToast, showConfirm } = useToast();
  
  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 移动5px后才触发拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [websites, setWebsites] = useState<Website[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    check_interval: 5,
    timeout: 10,
    retry_count: 3,
    notification_cooldown: 300,
    max_response_time: 200,
    cleanup_logs_days: 30,
    max_websites_per_user: 50
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'websites' | 'categories' | 'settings'>('overview');
  
  // 网站管理状态
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [websiteForm, setWebsiteForm] = useState({
    name: '',
    url: '',
    description: '',
    category_id: '',
    tags: ''
  });

  // 分类管理状态
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#FF6B6B'
  });

  // 邮件配置状态
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: '',
    smtp_password: ''
  });

  // 系统配置状态
  const [showSystemConfigModal, setShowSystemConfigModal] = useState(false);
  const [isSavingSystemConfig, setIsSavingSystemConfig] = useState(false);

  // 内容模态框状态
  const [contentModal, setContentModal] = useState<{
    open: boolean;
    title: string;
    content: string;
    type?: 'text' | 'url';
  }>({
    open: false,
    title: '',
    content: '',
    type: 'text'
  });

  useEffect(() => {
    if (token) {
      fetchWebsites();
      fetchCategories();
      fetchEmailConfig();
      fetchSystemConfig();
    }
  }, [token]);

  const fetchWebsites = async () => {
    if (!token) return;

    try {
      const data = await apiClient.get<{ websites: any[] }>('/api/websites');
      // API 已经按 category_sort_order, sort_order 排序，直接使用
      setWebsites(data.websites);
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;

    try {
      const data = await apiClient.get<{ categories: any[] }>('/api/categories');
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchEmailConfig = async () => {
    if (!token) return;

    try {
      const data = await apiClient.get<{ config: any }>('/api/email/config');
      if (data.config) {
        setEmailConfig({
          smtp_host: data.config.smtp_host || '',
          smtp_port: data.config.smtp_port || 587,
          smtp_secure: data.config.smtp_secure || false,
          smtp_user: data.config.smtp_user || '',
          smtp_password: '' // 不回显密码
        });
      }
    } catch (error) {
      console.error('Failed to fetch email config:', error);
    }
  };

  const fetchSystemConfig = async () => {
    if (!token) return;

    try {
      const data = await apiClient.get<{ configs: any }>('/api/system-config');
      setSystemConfig(data.configs);
    } catch (error) {
      console.error('Failed to fetch system config:', error);
    }
  };

  // 处理网站拖拽排序
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = websites.findIndex((item) => item.id === active.id);
    const newIndex = websites.findIndex((item) => item.id === over.id);

    // 获取被拖拽的网站
    const draggedWebsite = websites[oldIndex];
    const targetWebsite = websites[newIndex];

    // 分类视图下，确保在同一分类内拖拽
    if (viewMode === 'category' && draggedWebsite.category_id !== targetWebsite.category_id) {
      console.warn('分类视图下不能跨分类拖拽排序');
      return;
    }

    // 先更新本地状态
    const newWebsites = arrayMove(websites, oldIndex, newIndex);
    setWebsites(newWebsites);

    // 生成新的排序数据
    let orders: { id: number; sort_order: number }[];

    if (viewMode === 'category') {
      // 分类视图：只更新当前分类内的网站
      const categoryId = draggedWebsite.category_id;
      const categoryWebsites = newWebsites.filter(w => w.category_id === categoryId);
      orders = categoryWebsites.map((website, index) => ({
        id: website.id,
        sort_order: index
      }));
      console.log('更新分类内的排序:', categoryId, orders);
    } else {
      // 列表视图：更新所有网站的排序
      orders = newWebsites.map((website, index) => ({
        id: website.id,
        sort_order: index
      }));
      console.log('更新全局排序:', orders);
    }

    // 保存到服务器
    try {
      await apiClient.post('/api/websites/order', { orders });
    } catch (error) {
      console.error('Failed to update website order:', error);
      showToast('error', '更新排序失败');
      // 失败后重新获取数据
      fetchWebsites();
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      await apiClient.post('/api/websites', {
        ...websiteForm,
        category_id: websiteForm.category_id ? parseInt(websiteForm.category_id) : null
      });

      showToast('success', '添加成功', '网站已添加到监控列表');
      setShowWebsiteModal(false);
      setWebsiteForm({ name: '', url: '', description: '', category_id: '', tags: '' });
      fetchWebsites();
    } catch (error) {
      console.error('Failed to add website:', error);
      showToast('error', '添加失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBatchCheck = async () => {
    setIsChecking(true);

    try {
      const data = await apiClient.get<{ results: any[] }>('/api/monitor/check-all');
      showToast('success', '检查完成', `共检查 ${data.results.length} 个网站`);
      fetchWebsites();
    } catch (error) {
      console.error('Failed to batch check:', error);
      showToast('error', '检查失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebsite) return;

    setIsEditing(true);

    try {
      await apiClient.put(`/api/websites/${editingWebsite.id}`, {
        ...websiteForm,
        category_id: websiteForm.category_id ? parseInt(websiteForm.category_id) : null
      });
      showToast('success', '更新成功', '网站信息已更新');
      setShowWebsiteModal(false);
      setEditingWebsite(null);
      setWebsiteForm({ name: '', url: '', description: '', category_id: '', tags: '' });
      fetchWebsites();
    } catch (error) {
      console.error('Failed to update website:', error);
      showToast('error', '更新失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteWebsite = async (websiteId: number, websiteName: string) => {
    showConfirm(
      '删除网站确认',
      `确定要删除网站 "${websiteName}" 吗？此操作不可恢复。`,
      async () => {
        try {
          await apiClient.delete(`/api/websites/${websiteId}`);
          showToast('success', '删除成功', `网站 "${websiteName}" 已删除`);
          fetchWebsites();
        } catch (error) {
          console.error('Failed to delete website:', error);
          showToast('error', '删除失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
        }
      }
    );
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCategory(true);

    try {
      await apiClient.post('/api/categories', categoryForm);
      showToast('success', '添加成功', '分类已添加');
      setShowCategoryModal(false);
      setCategoryForm({ name: '', color: '#FF6B6B' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to add category:', error);
      showToast('error', '添加失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsAddingCategory(true);

    try {
      await apiClient.put(`/api/categories/${editingCategory.id}`, categoryForm);
      showToast('success', '更新成功', '分类已更新');
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', color: '#FF6B6B' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      showToast('error', '更新失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    showConfirm(
      '删除分类确认',
      `确定要删除分类 "${categoryName}" 吗？此操作不可恢复。`,
      async () => {
        try {
          await apiClient.delete(`/api/categories/${categoryId}`);
          showToast('success', '删除成功', `分类 "${categoryName}" 已删除`);
          fetchCategories();
        } catch (error) {
          console.error('Failed to delete category:', error);
          showToast('error', '删除失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
        }
      }
    );
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);

    try {
      await apiClient.post('/api/email/config', emailConfig);
      showToast('success', '配置成功', '邮件配置保存成功');
      setShowEmailModal(false);
      fetchEmailConfig();
    } catch (error) {
      console.error('Failed to save email config:', error);
      showToast('error', '配置失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        showToast('success', '测试成功', `测试邮件发送成功！${data.message}`);
      } else {
        const data = await response.json();
        showToast('error', '测试失败', `测试邮件发送失败：${data.error}`);
      }
    } catch (error) {
      console.error('Failed to test email:', error);
      showToast('error', '测试失败', '测试邮件发送失败，请检查网络连接');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSystemConfig(true);

    try {
      await apiClient.put('/api/system-config', systemConfig);
      showToast('success', '保存成功', '系统配置已更新');
      setShowSystemConfigModal(false);
      fetchSystemConfig();
    } catch (error) {
      console.error('Failed to save system config:', error);
      showToast('error', '保存失败', error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsSavingSystemConfig(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', '复制成功', '已复制到剪贴板');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('error', '复制失败', '无法复制到剪贴板');
    }
  };

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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleEditWebsite = (website: Website) => {
    setEditingWebsite(website);
    setWebsiteForm({
      name: website.name,
      url: website.url,
      description: website.description,
      category_id: website.category_id?.toString() || '',
      tags: website.tags
    });
    setShowWebsiteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-2 text-gray-500 text-xs">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-sm">
                <Globe className="w-3 h-3 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#1C1C1E]">网站监控系统</h1>
                <p className="text-[8px] text-[#8E8E93]">实时监控 · 智能告警</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEmailModal(true)}
                className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="邮件设置"
              >
                <Mail className="w-3 h-3 text-[#007AFF]" />
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="跳转到前台"
              >
                <Globe className="w-3 h-3 text-[#007AFF]" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut className="w-3 h-3 text-red-600" />
              </button>
              <div className="text-right">
                <p className="text-xs font-medium text-[#1C1C1E]">{user?.email}</p>
                <p className="text-[8px] text-[#8E8E93]">管理员</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3">
          <div className="flex space-x-1">
            {[
              { id: 'overview' as const, label: '概览', icon: Globe },
              { id: 'websites' as const, label: '网站', icon: Settings },
              { id: 'categories' as const, label: '分类', icon: Database },
              { id: 'settings' as const, label: '系统', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`
                  px-3 py-2 text-xs font-medium border-b-2 transition-colors
                  ${activeSection === tab.id
                    ? 'border-pink-500 text-pink-500 bg-pink-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center space-x-1">
                  <tab.icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
            <a
              href="/notification-rules"
              className="px-3 py-2 text-xs font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-1">
                <Bell className="w-3 h-3" />
                <span>通知</span>
              </div>
            </a>
            <a
              href="/api-docs"
              className="px-3 py-2 text-xs font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>接口文档</span>
              </div>
            </a>
            <a
              href="/admin/auth-keys"
              className="px-3 py-2 text-xs font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-1">
                <Key className="w-3 h-3" />
                <span>授权密钥</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 py-4">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/70 backdrop-blur-lg p-3 rounded-xl border border-white/20">
                <div className="text-lg font-bold text-pink-600">{websites.length}</div>
                <div className="text-[10px] text-gray-600">监控网站</div>
              </div>
              <div className="bg-white/70 backdrop-blur-lg p-3 rounded-xl border border-white/20">
                <div className="text-lg font-bold text-green-600">
                  {websites.filter(w => w.status === 'healthy').length}
                </div>
                <div className="text-[10px] text-gray-600">健康</div>
              </div>
              <div className="bg-white/70 backdrop-blur-lg p-3 rounded-xl border border-white/20">
                <div className="text-lg font-bold text-yellow-600">
                  {websites.filter(w => w.status === 'warning').length}
                </div>
                <div className="text-[10px] text-gray-600">亚健康</div>
              </div>
              <div className="bg-white/70 backdrop-blur-lg p-3 rounded-xl border border-white/20">
                <div className="text-lg font-bold text-red-600">
                  {websites.filter(w => w.status === 'error').length}
                </div>
                <div className="text-[10px] text-gray-600">异常</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
              <h3 className="text-sm font-bold text-gray-900 mb-3">快速操作</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setActiveSection('websites');
                    setShowWebsiteModal(true);
                  }}
                  className="p-3 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg transition-colors text-left"
                >
                  <Plus className="w-4 h-4 text-pink-600 mb-1" />
                  <p className="text-xs font-medium text-pink-800">添加网站</p>
                  <p className="text-[10px] text-pink-600">开始监控新网站</p>
                </button>
                <button
                  onClick={handleBatchCheck}
                  disabled={isChecking}
                  className="p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors text-left disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-green-600 mb-1 ${isChecking ? 'animate-spin' : ''}`} />
                  <p className="text-xs font-medium text-green-800">批量检查</p>
                  <p className="text-[10px] text-green-600">检查所有网站</p>
                </button>
                <button
                  onClick={() => setActiveSection('settings')}
                  className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-purple-600 mb-1" />
                  <p className="text-xs font-medium text-purple-800">系统设置</p>
                  <p className="text-[10px] text-purple-600">配置系统参数</p>
                </button>
              </div>
            </div>

            {/* Recent Websites */}
            <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
              <h3 className="text-sm font-bold text-gray-900 mb-3">最近检查</h3>
              <div className="space-y-2">
                {websites
                  .sort((a, b) => new Date(b.last_checked).getTime() - new Date(a.last_checked).getTime())
                  .slice(0, 3)
                  .map((website) => (
                  <div key={website.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(website.status)}
                      <div>
                        <p className="text-xs font-medium text-gray-900">{website.name}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{website.url}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-900">{website.response_time}ms</p>
                      <p className="text-[10px] text-gray-500">
                        {formatLocalTime(website.last_checked)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Websites Section */}
        {activeSection === 'websites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">网站管理</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('category')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                      viewMode === 'category' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    分类视图
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    列表视图
                  </button>
                </div>
                <button
                  onClick={() => setShowWebsiteModal(true)}
                  className="flex items-center space-x-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-3 h-3" />
                  <span>添加网站</span>
                </button>
              </div>
            </div>

            {/* 分类视图 */}
            {viewMode === 'category' && (
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryWebsites = websites.filter(w => w.category_id === category.id);
                  if (categoryWebsites.length === 0) return null;
                  
                  return (
                    <DndContext
                      key={category.id}
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                            <span className="text-xs text-gray-500">({categoryWebsites.length})</span>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          <SortableContext
                            items={categoryWebsites.map(w => w.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {categoryWebsites.map((website) => (
                              <SortableWebsiteCard
                                key={website.id}
                                website={website}
                                onEdit={handleEditWebsite}
                                onDelete={handleDeleteWebsite}
                                onSetContentModal={setContentModal}
                                getStatusIcon={getStatusIcon}
                                getStatusColor={getStatusColor}
                              />
                            ))}
                          </SortableContext>
                        </div>
                      </div>
                    </DndContext>
                  );
                })}
                
                {/* 未分类网站 */}
                {(() => {
                  const uncategorizedWebsites = websites.filter(w => !w.category_id);
                  if (uncategorizedWebsites.length === 0) return null;
                  
                  return (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full border border-white shadow-sm bg-gray-400"></div>
                            <h3 className="text-sm font-medium text-gray-900">未分类</h3>
                            <span className="text-xs text-gray-500">({uncategorizedWebsites.length})</span>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          <SortableContext
                            items={uncategorizedWebsites.map(w => w.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {uncategorizedWebsites.map((website) => (
                              <SortableWebsiteCard
                                key={website.id}
                                website={website}
                                onEdit={handleEditWebsite}
                                onDelete={handleDeleteWebsite}
                                onSetContentModal={setContentModal}
                                getStatusIcon={getStatusIcon}
                                getStatusColor={getStatusColor}
                              />
                            ))}
                          </SortableContext>
                        </div>
                      </div>
                    </DndContext>
                  );
                })()}
              </div>
            )}

            {/* 列表视图 */}
            {viewMode === 'list' && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={websites.map(w => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-3">
                    {websites.map((website) => (
                      <SortableWebsiteCard
                        key={website.id}
                        website={website}
                        onEdit={handleEditWebsite}
                        onDelete={handleDeleteWebsite}
                        onSetContentModal={setContentModal}
                        getStatusIcon={getStatusIcon}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* Categories Section */}
        {activeSection === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">分类管理</h2>
              <div className="flex items-center space-x-2">
                <a
                  href="/admin/categories"
                  className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  <span>拖拽排序</span>
                </a>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center space-x-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-3 h-3" />
                  <span>添加分类</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((category) => (
                <div key={category.id} className="bg-white/70 backdrop-blur-lg p-3 rounded-xl border border-white/20 shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                        <p className="text-[10px] text-gray-500">
                          {category.user_id === null ? '系统分类' : '自定义'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryForm({ name: category.name, color: category.color });
                          setShowCategoryModal(true);
                        }}
                        className="p-1 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        disabled={category.user_id === null}
                        className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={category.user_id === null ? '系统分类不可删除' : '删除'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {websites.filter(w => w.category_id === category.id).length} 个网站
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">系统设置</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Settings */}
              <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-900">邮件配置</h3>
                  </div>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    配置
                  </button>
                </div>
                <div className="space-y-1 text-[10px] text-gray-600">
                  <p>SMTP: {emailConfig.smtp_host || '未配置'}</p>
                  <p>端口: {emailConfig.smtp_port || '-'}</p>
                  <p>用户: {emailConfig.smtp_user || '未配置'}</p>
                </div>
              </div>

              {/* System Config */}
              <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-900">系统参数</h3>
                  </div>
                  <button
                    onClick={() => setShowSystemConfigModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    配置
                  </button>
                </div>
                <div className="space-y-1 text-[10px] text-gray-600">
                  <p>检查间隔: {systemConfig.check_interval} 分钟</p>
                  <p>超时时间: {systemConfig.timeout} 秒</p>
                  <p>重试次数: {systemConfig.retry_count} 次</p>
                </div>
              </div>

              {/* Database Info */}
              <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-medium text-gray-900">数据库信息</h3>
                </div>
                <div className="space-y-1 text-[10px] text-gray-600">
                  <p>网站数量: {websites.length} 个</p>
                  <p>分类数量: {categories.length} 个</p>
                  <p>清理周期: {systemConfig.cleanup_logs_days} 天</p>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Timer className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-medium text-gray-900">性能设置</h3>
                </div>
                <div className="space-y-1 text-[10px] text-gray-600">
                  <p>响应阈值: {systemConfig.max_response_time}ms</p>
                  <p>通知冷却: {systemConfig.notification_cooldown}s</p>
                  <p>最大网站数: {systemConfig.max_websites_per_user} 个</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Website Modal */}
      {showWebsiteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl max-w-md w-full p-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingWebsite ? '编辑网站' : '添加网站'}
              </h3>
              <button
                onClick={() => {
                  setShowWebsiteModal(false);
                  setEditingWebsite(null);
                  setWebsiteForm({ name: '', url: '', description: '', category_id: '', tags: '' });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={editingWebsite ? handleUpdateWebsite : handleAddWebsite} className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">网站名称</label>
                <input
                  type="text"
                  value={websiteForm.name}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入网站名称"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">网站URL</label>
                <input
                  type="url"
                  value={websiteForm.url}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={websiteForm.description}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="网站描述（可选）"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={websiteForm.category_id}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWebsiteModal(false);
                    setEditingWebsite(null);
                    setWebsiteForm({ name: '', url: '', description: '', category_id: '', tags: '' });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isAdding || isEditing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isAdding || isEditing ? '保存中...' : (editingWebsite ? '更新' : '添加')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl max-w-sm w-full p-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingCategory ? '编辑分类' : '添加分类'}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setCategoryForm({ name: '', color: '#FF6B6B' });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">分类名称</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入分类名称"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">分类颜色</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="h-8 w-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    placeholder="#FF6B6B"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', color: '#FF6B6B' });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isAddingCategory}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isAddingCategory ? '保存中...' : (editingCategory ? '更新' : '添加')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Config Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl max-w-lg w-full p-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">邮件配置</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveEmailConfig} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">SMTP服务器</label>
                  <input
                    type="text"
                    value={emailConfig.smtp_host}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">端口</label>
                  <input
                    type="number"
                    value={emailConfig.smtp_port}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smtp_secure"
                  checked={emailConfig.smtp_secure}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_secure: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <label htmlFor="smtp_secure" className="text-sm text-gray-700">使用SSL/TLS</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">用户名</label>
                  <input
                    type="text"
                    value={emailConfig.smtp_user}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">密码</label>
                  <input
                    type="password"
                    value={emailConfig.smtp_password}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-password"
                  />
                </div>
              </div>



              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={isTestingEmail}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {isTestingEmail ? '测试中...' : '测试'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingEmail}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSavingEmail ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Config Modal */}
      {showSystemConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl max-w-lg w-full p-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">系统参数配置</h3>
              <button
                onClick={() => setShowSystemConfigModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveSystemConfig} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">检查间隔 (分钟)</label>
                  <input
                    type="number"
                    value={systemConfig.check_interval}
                    onChange={(e) => setSystemConfig({ ...systemConfig, check_interval: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">超时时间 (秒)</label>
                  <input
                    type="number"
                    value={systemConfig.timeout}
                    onChange={(e) => setSystemConfig({ ...systemConfig, timeout: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">重试次数</label>
                  <input
                    type="number"
                    value={systemConfig.retry_count}
                    onChange={(e) => setSystemConfig({ ...systemConfig, retry_count: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">通知冷却 (秒)</label>
                  <input
                    type="number"
                    value={systemConfig.notification_cooldown}
                    onChange={(e) => setSystemConfig({ ...systemConfig, notification_cooldown: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">响应阈值 (毫秒)</label>
                  <input
                    type="number"
                    value={systemConfig.max_response_time}
                    onChange={(e) => setSystemConfig({ ...systemConfig, max_response_time: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">日志清理天数</label>
                  <input
                    type="number"
                    value={systemConfig.cleanup_logs_days}
                    onChange={(e) => setSystemConfig({ ...systemConfig, cleanup_logs_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-1">最大网站数量</label>
                <input
                  type="number"
                  value={systemConfig.max_websites_per_user}
                  onChange={(e) => setSystemConfig({ ...systemConfig, max_websites_per_user: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSystemConfigModal(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSavingSystemConfig}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSavingSystemConfig ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Modal */}
      {contentModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl max-w-md w-full p-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-900">{contentModal.title}</h3>
              <button
                onClick={() => setContentModal({ ...contentModal, open: false })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-700 break-all">{contentModal.content}</p>
            </div>
            <div className="flex space-x-2">
              {contentModal.type === 'url' && (
                <button
                  onClick={() => window.open(contentModal.content, '_blank')}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  打开
                </button>
              )}
              <button
                onClick={() => handleCopyToClipboard(contentModal.content)}
                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
              >
                复制
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

