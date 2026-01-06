import { NextRequest, NextResponse } from 'next/server';
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

    return NextResponse.json({
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
        role: user.isAdmin ? 'admin' : 'user'
      }
    });

  } catch (error) {
    console.error('Failed to verify token:', error);
    return NextResponse.json(
      { error: 'token无效或已过期' },
      { status: 401 }
    );
  }
}