import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('[PUT /api/categories/:id] 开始处理请求');

    const user = await verifyToken(request);
    if (!user) {
      console.log('[PUT /api/categories/:id] 未授权访问');
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const categoryId = parseInt(id);

    console.log('[PUT /api/categories/:id] 用户:', user.email, '分类ID:', categoryId);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    const { name, color } = await request.json();

    console.log('[PUT /api/categories/:id] 更新数据:', { name, color });

    if (!name || !color) {
      return NextResponse.json(
        { error: '分类名称和颜色不能为空' },
        { status: 400 }
      );
    }

    // 验证分类是否属于当前用户或是系统分类（系统分类只有管理员可以修改）
    const categories = await query(`
      SELECT * FROM categories
      WHERE id = ? AND (user_id = ? OR user_id IS NULL)
    `, [categoryId, user.userId]) as any[];

    if (!categories || categories.length === 0) {
      console.log('[PUT /api/categories/:id] 分类不存在或无权限修改');
      return NextResponse.json(
        { error: '分类不存在或无权限修改' },
        { status: 404 }
      );
    }

    const category = categories[0];
    console.log('[PUT /api/categories/:id] 找到分类:', category);

    // 如果是系统分类，需要管理员权限
    if (category.user_id === null && !user.isAdmin) {
      console.log('[PUT /api/categories/:id] 系统分类需要管理员权限');
      return NextResponse.json(
        { error: '系统分类只有管理员可以修改' },
        { status: 403 }
      );
    }

    // 更新分类
    console.log('[PUT /api/categories/:id] 开始更新数据库');
    await query(`
      UPDATE categories
      SET name = ?, color = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, color, categoryId]);

    console.log('[PUT /api/categories/:id] 更新成功');

    return NextResponse.json({
      message: '分类更新成功'
    });

  } catch (error) {
    console.error('[PUT /api/categories/:id] 更新失败:', error);
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: '无效的分类ID' },
        { status: 400 }
      );
    }

    console.log(`Deleting category ${categoryId} for user ${user.userId}`);

    // 验证分类是否属于当前用户或是系统分类（系统分类不允许删除）
    const categories = await query(`
      SELECT * FROM categories 
      WHERE id = ? AND (user_id = ? OR user_id IS NULL)
    `, [categoryId, user.userId]) as any[];

    console.log(`Query result:`, categories);

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: '分类不存在或无权限删除' },
        { status: 404 }
      );
    }

    const category = categories[0];
    console.log(`Found category:`, category);

    // 系统分类不允许删除
    if (category.user_id === null) {
      return NextResponse.json(
        { error: '系统分类不能删除' },
        { status: 403 }
      );
    }

    // 检查是否有网站使用这个分类
    const websitesUsingCategory = await query(`
      SELECT COUNT(*) as count FROM websites 
      WHERE category_id = ?
    `, [categoryId]) as any[];

    console.log(`Websites using category: ${websitesUsingCategory[0]?.count}`);

    if (websitesUsingCategory[0]?.count > 0) {
      return NextResponse.json(
        { error: '该分类下还有网站，请先移动或删除网站后再删除分类' },
        { status: 400 }
      );
    }

    // 删除分类
    await query('DELETE FROM categories WHERE id = ?', [categoryId]);

    return NextResponse.json({
      message: '分类删除成功'
    });

  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    );
  }
}