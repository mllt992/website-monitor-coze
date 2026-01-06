import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: '邮箱和验证码不能为空' },
        { status: 400 }
      );
    }

    // 查询验证码（使用 UTC_TIMESTAMP() 避免时区问题）
    const codeResult = await query(
      'SELECT * FROM login_codes WHERE email = ? AND code = ? AND expires_at > UTC_TIMESTAMP() AND used = FALSE',
      [email, code]
    );

    console.log('[Login with Code] Query result:', codeResult ? `${codeResult.length} records` : 'null');

    if (!codeResult || codeResult.length === 0) {
      // 查询未过期的验证码用于调试
      const debugResult = await query(
        'SELECT * FROM login_codes WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 5',
        [email]
      );
      console.log('[Login with Code] Recent unused codes for this email:', debugResult);

      return NextResponse.json(
        { error: '验证码无效或已过期' },
        { status: 401 }
      );
    }

    // 标记验证码为已使用
    await query(
      'UPDATE login_codes SET used = TRUE WHERE id = ?',
      [codeResult[0].id]
    );

    // 查询用户信息
    const userResult = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;

    return NextResponse.json({
      message: '登录成功',
      token,
      user: userInfo
    });

  } catch (error) {
    console.error('Login with code error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}