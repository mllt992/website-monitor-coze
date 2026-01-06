import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const websiteId = parseInt(id);
    const { name, url, description, category_id, tags } = await request.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: '网站名称和URL不能为空' },
        { status: 400 }
      );
    }

    // 检查网站是否属于当前用户
    const websiteRows = await query(
      'SELECT id FROM websites WHERE id = ? AND user_id = ?',
      [websiteId, user.userId]
    ) as any[];

    if (!websiteRows || websiteRows.length === 0) {
      return NextResponse.json(
        { error: '网站不存在或无权限访问' },
        { status: 404 }
      );
    }

    // 更新网站信息
    await query(`
      UPDATE websites 
      SET name = ?, url = ?, description = ?, category_id = ?, tags = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [name, url, description || null, category_id || null, tags || null, websiteId, user.userId]);

    return NextResponse.json({
      message: '网站更新成功'
    });

  } catch (error) {
    console.error('Failed to update website:', error);
    return NextResponse.json(
      { error: '更新网站失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const websiteId = parseInt(id);

    // 检查网站是否属于当前用户
    const websiteRows = await query(
      'SELECT id FROM websites WHERE id = ? AND user_id = ?',
      [websiteId, user.userId]
    ) as any[];

    if (!websiteRows || websiteRows.length === 0) {
      return NextResponse.json(
        { error: '网站不存在或无权限访问' },
        { status: 404 }
      );
    }

    // 删除相关的监控日志
    await query('DELETE FROM monitor_logs WHERE website_id = ?', [websiteId]);

    // 删除网站
    await query('DELETE FROM websites WHERE id = ? AND user_id = ?', [websiteId, user.userId]);

    return NextResponse.json({
      message: '网站删除成功'
    });

  } catch (error) {
    console.error('Failed to delete website:', error);
    return NextResponse.json(
      { error: '删除网站失败' },
      { status: 500 }
    );
  }
}