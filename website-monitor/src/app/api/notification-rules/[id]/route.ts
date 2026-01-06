import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// 更新通知规则
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

    const { rule_type, website_id, notification_events, email_recipients } = await request.json();

    // 验证规则存在且属于用户
    const ruleCheck = await query(
      'SELECT id FROM notification_rules WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (ruleCheck.length === 0) {
      return NextResponse.json({ error: '规则不存在或无权限' }, { status: 404 });
    }

    // 验证必填字段
    if (!rule_type || !notification_events || !Array.isArray(notification_events) || notification_events.length === 0) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    if (!email_recipients || !Array.isArray(email_recipients) || email_recipients.length === 0) {
      return NextResponse.json({ error: '至少需要一个邮件收件人' }, { status: 400 });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of email_recipients) {
      if (!email || !emailRegex.test(email)) {
        return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
      }
    }

    // 如果是特定网站规则，验证网站存在且属于用户
    if (rule_type === 'specific' && website_id) {
      const websiteCheck = await query(
        'SELECT id FROM websites WHERE id = ? AND user_id = ?',
        [website_id, user.userId]
      );

      if (websiteCheck.length === 0) {
        return NextResponse.json({ error: '网站不存在或无权限' }, { status: 404 });
      }
    }

    // 更新规则
    await query(`
      UPDATE notification_rules 
      SET website_id = ?, rule_type = ?, notification_events = ?, email_recipients = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [
      rule_type === 'specific' ? website_id : null,
      rule_type,
      JSON.stringify(notification_events),
      JSON.stringify(email_recipients),
      id,
      user.userId
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update notification rule error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// 删除通知规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    // 验证规则存在且属于用户
    const ruleCheck = await query(
      'SELECT id FROM notification_rules WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    if (ruleCheck.length === 0) {
      return NextResponse.json({ error: '规则不存在或无权限' }, { status: 404 });
    }

    // 删除规则
    await query(
      'DELETE FROM notification_rules WHERE id = ? AND user_id = ?',
      [id, user.userId]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete notification rule error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}