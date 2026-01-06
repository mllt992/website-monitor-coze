import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// 切换通知规则状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    // 获取当前规则状态
    const ruleResult = await query(
      'SELECT is_active FROM notification_rules WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (ruleResult.length === 0) {
      return NextResponse.json({ error: '规则不存在或无权限' }, { status: 404 });
    }

    const currentStatus = ruleResult[0].is_active;
    const newStatus = !currentStatus;

    // 更新状态
    await query(
      'UPDATE notification_rules SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [newStatus, id, user.userId]
    );

    return NextResponse.json({ 
      success: true, 
      is_active: newStatus 
    });

  } catch (error) {
    console.error('Toggle notification rule error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}