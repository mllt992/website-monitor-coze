'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Home } from 'lucide-react';
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
import { Plus, GripVertical, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

// 拖拽组件
function SortableCategory({ category, onEdit, onDelete, isEditing, isSaving, editName, setEditName, handleUpdate, isAdmin }: any) {
  // 如果传入了 editName（编辑模式），使用传入的值；否则使用分类的原始名称
  const currentEditName = editName || category.name;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id, disabled: !isAdmin && category.user_id === null });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/70 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-4 transition-all hover:shadow-xl ${
        !isAdmin && category.user_id === null ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* 拖拽手柄 */}
        {(isAdmin || category.user_id !== null) && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
        )}

        {/* 分类颜色 */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: category.color }}
        />

        {/* 分类名称 */}
        {isEditing ? (
          <input
            type="text"
            value={currentEditName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            onKeyPress={(e) => e.key === 'Enter' && handleUpdate(category.id)}
            autoFocus
          />
        ) : (
          <span className="flex-1 text-gray-800 font-medium">
            {category.name}
            {category.user_id === null && (
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">系统</span>
            )}
          </span>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => handleUpdate(category.id)}
                disabled={isSaving}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '...' : '✓'}
              </button>
              <button
                onClick={() => onEdit(null)}
                disabled={isSaving}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              {(isAdmin || category.user_id !== null) && (
                <button
                  onClick={() => onEdit(category.id, category.name)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {(isAdmin || category.user_id !== null) && (
                <button
                  onClick={() => onDelete(category.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { user, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#FF6B6B');
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editNames, setEditNames] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  // 未登录状态
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">访问分类管理需要登录账户</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              前往登录
            </Link>
            <Link
              href="/"
              className="flex-1 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fetchCategories = async () => {
    try {
      console.log('[fetchCategories] 开始获取分类列表');
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      console.log('[fetchCategories] 获取到数据:', data);
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('[fetchCategories] 获取分类失败:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newCategoryName,
          color: newCategoryColor,
          user_id: user?.role === 'admin' ? null : user?.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        setNewCategoryName('');
        setNewCategoryColor('#FF6B6B');
        setIsAddingCategory(false);
        fetchCategories();
      } else {
        alert(data.error || '添加分类失败');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('添加分类失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (categoryId: number | null, name: string = '') => {
    // 如果之前有编辑中的分类，先清除其状态
    if (editingCategory !== null && editingCategory !== categoryId) {
      setEditNames(prev => {
        const newEditNames = { ...prev };
        delete newEditNames[editingCategory];
        return newEditNames;
      });
    }

    setEditingCategory(categoryId);
    if (categoryId !== null) {
      setEditNames(prev => ({ ...prev, [categoryId]: name }));
    } else {
      // 取消编辑时，确保清除所有编辑状态
      setEditNames({});
    }
  };

  const handleUpdateCategory = async (categoryId: number) => {
    const name = editNames[categoryId];
    if (!name || !name.trim()) return;

    console.log('[handleUpdateCategory] 开始更新分类:', categoryId, '新名称:', name);

    // 找到当前分类获取其颜色
    const currentCategory = categories.find(c => c.id === categoryId);
    const color = currentCategory?.color || '#FF6B6B';

    setIsEditing(true);
    try {
      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: name,
          color: color
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('[handleUpdateCategory] 响应状态:', response.status);
      const data = await response.json();
      console.log('[handleUpdateCategory] 响应数据:', data);

      if (response.ok) {
        setEditingCategory(null);
        setEditNames(prev => {
          const newEditNames = { ...prev };
          delete newEditNames[categoryId];
          return newEditNames;
        });
        await fetchCategories();
      } else {
        alert(data.error || '更新分类失败');
        // 编辑失败时也要清除编辑状态，避免状态残留
        setEditingCategory(null);
        setEditNames(prev => {
          const newEditNames = { ...prev };
          delete newEditNames[categoryId];
          return newEditNames;
        });
      }
    } catch (error) {
      console.error('[handleUpdateCategory] 请求失败:', error);
      if ((error as Error).name === 'AbortError') {
        alert('请求超时，请检查网络连接');
      } else {
        alert('更新分类失败');
      }
      // 异常时也要清除编辑状态，避免状态残留
      setEditingCategory(null);
      setEditNames(prev => {
        const newEditNames = { ...prev };
        delete newEditNames[categoryId];
        return newEditNames;
      });
    } finally {
      console.log('[handleUpdateCategory] 完成，重置 editing 状态');
      setIsEditing(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('确定要删除这个分类吗？删除后无法恢复。')) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        fetchCategories();
      } else {
        alert(data.error || '删除分类失败');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('删除分类失败');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // 先计算新的顺序
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over?.id);
      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      
      // 更新UI显示
      setCategories(reorderedCategories);

      // 调用API更新排序
      try {
        const categoryIds = reorderedCategories.map(item => item.id);
        const response = await fetch('/api/categories/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ categoryIds })
        });

        const data = await response.json();
        if (!response.ok) {
          alert(data.error || '更新排序失败');
          fetchCategories(); // 重新获取数据恢复原状
        }
      } catch (error) {
        console.error('Failed to reorder categories:', error);
        alert('更新排序失败');
        fetchCategories(); // 重新获取数据恢复原状
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回管理
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">分类管理</h1>
            <p className="text-gray-600">管理网站分类，拖拽可调整显示顺序</p>
          </div>
        </div>

        {/* 添加分类按钮 */}
        <div className="mb-6">
          {!isAddingCategory ? (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl
                       hover:from-pink-600 hover:to-purple-600 transition-all duration-300
                       shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
            >
              <Plus size={20} />
              添加分类
            </button>
          ) : (
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg p-4">
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="分类名称"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={isSubmitting || !newCategoryName.trim()}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? '添加中...' : '添加'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                    setNewCategoryColor('#FF6B6B');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 分类列表 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(cat => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {categories.map((category) => (
                <SortableCategory
                  key={category.id}
                  category={category}
                  isEditing={editingCategory === category.id}
                  isSaving={isEditing}
                  editName={editNames[category.id] || ''}
                  setEditName={(value: string) => setEditNames(prev => ({ ...prev, [category.id]: value }))}
                  onEdit={startEdit}
                  onDelete={handleDeleteCategory}
                  handleUpdate={handleUpdateCategory}
                  isAdmin={user?.role === 'admin'}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* 提示信息 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-2">
            <div className="text-blue-500 text-sm">ℹ️</div>
            <div className="text-blue-700 text-sm">
              <p className="font-medium mb-1">使用说明：</p>
              <ul className="space-y-1 text-xs">
                <li>• 拖拽分类可以调整显示顺序</li>
                <li>• 系统分类（标记为&quot;系统&quot;）只有管理员可以编辑和删除</li>
                <li>• 用户可以创建自己的分类，完全可管理</li>
                <li>• 分类在前台展示时会按设置的顺序排列</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}