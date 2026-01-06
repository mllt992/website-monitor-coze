import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const categories = await query(`
      SELECT * FROM categories 
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY sort_order ASC, name ASC
    `, [user.userId]) as any[];

    return NextResponse.json({
      categories: categories || []
    });

  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: '分类名称和颜色不能为空' },
        { status: 400 }
      );
    }

    // 先获取最大的sort_order值
    const [maxOrder] = await query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM categories WHERE user_id = ? OR user_id IS NULL',
      [user.userId]
    ) as any[];
    
    const result = await query(`
      INSERT INTO categories (name, color, user_id, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [name, color, user.userId, maxOrder.next_order]);

    return NextResponse.json({
      message: '分类添加成功',
      categoryId: (result as any).insertId
    });

  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: '添加分类失败' },
      { status: 500 }
    );
  }
}