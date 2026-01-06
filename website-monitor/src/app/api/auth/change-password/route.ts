import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { initEmailTransporter } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { method, oldPassword, newPassword, email, verificationCode } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少为6位' },
        { status: 400 }
      );
    }

    let userRecord: any;

    if (method === 'password') {
      // 使用旧密码验证
      if (!oldPassword) {
        return NextResponse.json(
          { error: '请输入旧密码' },
          { status: 400 }
        );
      }

      // 获取用户信息
      const users = await query(
        'SELECT * FROM users WHERE id = ?',
        [user.userId]
      ) as any[];

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }

      userRecord = users[0];

      // 验证旧密码
      const isPasswordValid = await bcrypt.compare(oldPassword, userRecord.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '旧密码错误' },
          { status: 400 }
        );
      }

    } else if (method === 'email') {
      // 使用邮箱验证码验证
      if (!email || !verificationCode) {
        return NextResponse.json(
          { error: '请输入邮箱和验证码' },
          { status: 400 }
        );
      }

      // 验证邮箱是否属于当前用户
      const users = await query(
        'SELECT * FROM users WHERE id = ? AND email = ?',
        [user.userId, email]
      ) as any[];

      if (!users || users.length === 0) {
        return NextResponse.json(
          { error: '邮箱不匹配' },
          { status: 400 }
        );
      }

      userRecord = users[0];

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

    } else {
      return NextResponse.json(
        { error: '无效的验证方式' },
        { status: 400 }
      );
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 更新密码
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userRecord.id]
    );

    return NextResponse.json({
      message: '密码修改成功',
      success: true
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 发送密码重置验证码
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '请输入邮箱' },
        { status: 400 }
      );
    }

    // 验证邮箱是否属于当前用户
    const users = await query(
      'SELECT * FROM users WHERE id = ? AND email = ?',
      [user.userId, email]
    ) as any[];

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: '邮箱不匹配当前账户' },
        { status: 400 }
      );
    }

    // 获取邮件配置
    const emailConfigResult = await query(
      'SELECT * FROM email_configs ORDER BY created_at DESC LIMIT 1'
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 保存验证码到数据库
    await query(
      'INSERT INTO password_reset_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    // 发送验证码邮件
    const { generatePasswordResetCode } = await import('@/lib/email');
    const emailSent = await generatePasswordResetCode(email, code);

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
    console.error('Send password reset code error:', error);
    return NextResponse.json(
      { error: '发送验证码失败' },
      { status: 500 }
    );
  }
}