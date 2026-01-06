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

    const websites = await query(`
      SELECT 
        w.*,
        c.name as category_name,
        c.color as category_color,
        c.sort_order as category_sort_order
      FROM websites w
      LEFT JOIN categories c ON w.category_id = c.id
      WHERE w.user_id = ?
      ORDER BY c.sort_order ASC, w.sort_order ASC, w.created_at DESC
    `, [user.userId]) as any[];

    return NextResponse.json({
      websites: websites || []
    });

  } catch (error) {
    console.error('Failed to fetch websites:', error);
    return NextResponse.json(
      { error: '获取网站列表失败' },
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

    const { name, url, description, category_id, tags } = await request.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: '网站名称和URL不能为空' },
        { status: 400 }
      );
    }

    // 先添加网站，设置默认状态
    const result = await query(`
      INSERT INTO websites (name, url, description, category_id, tags, user_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'unknown', NOW(), NOW())
    `, [name, url, description || null, category_id || null, tags || null, user.userId]);

    const websiteId = (result as any).insertId;

    // 立即触发对新添加网站的检查
    try {
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/monitor/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteId })
      });
      
      if (checkResponse.ok) {
        console.log('新网站检查完成');
      }
    } catch (checkError) {
      console.error('新网站检查失败:', checkError);
    }

    return NextResponse.json({
      message: '网站添加成功',
      websiteId
    });

  } catch (error) {
    console.error('Failed to create website:', error);
    return NextResponse.json(
      { error: '添加网站失败' },
      { status: 500 }
    );
  }
}