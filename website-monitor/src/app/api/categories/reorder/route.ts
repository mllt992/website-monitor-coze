import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { verifyToken } from '@/lib/auth';

const dbConfig = {
  host: '批量替换_请输入数据IP地址',
  port: 3306,
  user: 't_monitor',
  password: '批量替换_请输入数据库密码',
  database: 't_monitor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export async function POST(request: NextRequest) {
  let connection;
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { categoryIds } = await request.json();

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: '分类ID列表不能为空' },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // 验证所有分类都属于当前用户或是系统分类
    const [userCategories] = await connection.execute(`
      SELECT id FROM categories 
      WHERE user_id = ? OR user_id IS NULL
    `, [user.userId]);

    const userCategoryIds = (userCategories as any[]).map((cat: any) => cat.id);
    const hasInvalidCategory = categoryIds.some(id => !userCategoryIds.includes(id));

    if (hasInvalidCategory) {
      return NextResponse.json(
        { error: '包含无效的分类ID' },
        { status: 400 }
      );
    }

    // 更新每个分类的sort_order
    for (let i = 0; i < categoryIds.length; i++) {
      await connection.execute('UPDATE categories SET sort_order = ? WHERE id = ?', [i + 1, categoryIds[i]]);
    }

    return NextResponse.json({
      message: '分类排序更新成功'
    });

  } catch (error) {
    console.error('Failed to reorder categories:', error);
    return NextResponse.json(
      { error: '更新分类排序失败' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}