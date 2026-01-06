import { NextRequest, NextResponse } from 'next/server';
import { verifyUserPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body.username || body.email;
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证用户密码
    const user = await verifyUserPassword(username, password);

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 生成JWT令牌
    const token = require('jsonwebtoken').sign(
      { 
        userId: user.userId, 
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.userId,
      username: user.username,
      email: user.email,
      role: user.isAdmin ? 'admin' : 'user'
    };

    return NextResponse.json({
      message: '登录成功',
      token,
      user: userInfo
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}