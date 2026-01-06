import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initEmailTransporter } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '邮箱不能为空' },
        { status: 400 }
      );
    }

    // 查询用户
    const result = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: '该邮箱未注册' },
        { status: 404 }
      );
    }

    // 获取邮件配置
    const emailConfigResult = await query(
      'SELECT * FROM email_configs ORDER BY updated_at DESC, created_at DESC LIMIT 1'
    ) as any[];

    if (!emailConfigResult || emailConfigResult.length === 0) {
      return NextResponse.json(
        { error: '邮件服务未配置，请联系管理员' },
        { status: 500 }
      );
    }

    const emailConfig = emailConfigResult[0];

    // 初始化邮件发送器
    await initEmailTransporter({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_secure,
      user: emailConfig.smtp_user,
      password: emailConfig.smtp_password,
    });

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 计算过期时间：使用时间戳确保准确性
    const nowTimestamp = Date.now();
    const expiresTimestamp = nowTimestamp + 10 * 60 * 1000; // 10分钟后过期（毫秒时间戳）

    console.log('[Send Login Code] Current timestamp:', nowTimestamp);
    console.log('[Send Login Code] Expires timestamp:', expiresTimestamp);
    console.log('[Send Login Code] Expires at (ISO):', new Date(expiresTimestamp).toISOString());

    // 保存验证码到数据库（直接使用 Date 对象，让 mysql2 驱动处理时区转换）
    const expiresAt = new Date(expiresTimestamp);
    await query(
      'INSERT INTO login_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    // 发送验证码邮件
    const { generateLoginCode } = await import('@/lib/email');
    const emailSent = await generateLoginCode(email, code, {
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_secure,
      user: emailConfig.smtp_user,
      password: emailConfig.smtp_password,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: '邮件发送失败，请检查邮件配置' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '验证码已发送',
      success: true
    });

  } catch (error) {
    console.error('Send login code error:', error);
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    );
  }
}