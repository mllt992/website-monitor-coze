import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// 获取通知规则列表
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const rules = await query(`
      SELECT 
        nr.*,
        w.name as website_name
      FROM notification_rules nr
      LEFT JOIN websites w ON nr.website_id = w.id
      WHERE nr.user_id = ?
      ORDER BY nr.created_at DESC
    `, [user.userId]);

    console.log('获取通知规则成功，记录数:', rules.length);

    // 解析JSON字段（MySQL 8.0+的JSON类型会自动解析，其他版本需要手动解析）
    const formattedRules = rules.map((rule: any) => ({
      ...rule,
      notification_events: typeof rule.notification_events === 'string' 
        ? JSON.parse(rule.notification_events) 
        : (rule.notification_events || []),
      email_recipients: typeof rule.email_recipients === 'string' 
        ? JSON.parse(rule.email_recipients) 
        : (rule.email_recipients || [])
    }));

    return NextResponse.json({ rules: formattedRules });

  } catch (error) {
    console.error('Get notification rules error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// 创建通知规则
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const { rule_type, website_id, notification_events, email_recipients } = await request.json();

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

    // 创建规则
    console.log('创建通知规则:', { user_id: user.userId, rule_type, notification_events, email_recipients });
    
    const result = await query(`
      INSERT INTO notification_rules (
        user_id, website_id, rule_type, notification_events, email_recipients, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      user.userId,
      rule_type === 'specific' ? website_id : null,
      rule_type,
      JSON.stringify(notification_events),
      JSON.stringify(email_recipients),
      true
    ]);

    console.log('创建成功，ID:', result.insertId);

    return NextResponse.json({ 
      success: true, 
      id: result.insertId 
    });

  } catch (error) {
    console.error('Create notification rule error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}