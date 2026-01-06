import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { initEmailTransporter } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode, newPassword } = await request.json();

    if (!email || !verificationCode || !newPassword) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为6位' },
        { status: 400 }
      );
    }

    // 验证用户邮箱是否存在
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: '该邮箱未注册' },
        { status: 404 }
      );
    }

    // 验证验证码（使用UTC_TIMESTAMP()确保时区一致性）
    const codes = await query(
      'SELECT * FROM password_reset_codes WHERE email = ? AND code = ? AND expires_at > UTC_TIMESTAMP() AND used = FALSE',
      [email, verificationCode]
    ) as any[];

    if (!codes || codes.length === 0) {
      return NextResponse.json(
        { error: '验证码无效或已过期' },
        { status: 400 }
      );
    }

    // 标记验证码为已使用
    await query(
      'UPDATE password_reset_codes SET used = TRUE WHERE id = ?',
      [codes[0].id]
    );

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 更新用户密码
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
      [hashedPassword, email]
    );

    return NextResponse.json({
      message: '密码重置成功',
      success: true
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 发送忘记密码验证码
export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '请输入邮箱' },
        { status: 400 }
      );
    }

    // 验证用户邮箱是否存在
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (!users || users.length === 0) {
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

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 保存验证码到数据库
    await query(
      'INSERT INTO password_reset_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    // 发送验证码邮件 - 使用与测试邮件相同的配置格式
    const { generatePasswordResetCode } = await import('@/lib/email');
    const emailSent = await generatePasswordResetCode(email, code, {
      host: emailConfig.smtp_host,
      port: parseInt(emailConfig.smtp_port),
      secure: emailConfig.smtp_secure === 1 || emailConfig.smtp_secure === true,
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
      message: '验证码已发送到您的邮箱',
      success: true
    });

  } catch (error) {
    console.error('Send forgot password code error:', error);
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    );
  }
}