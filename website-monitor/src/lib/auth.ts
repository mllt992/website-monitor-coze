import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface User {
  userId: number;
  username: string;
  email: string;
  isAdmin?: boolean;
}

// 从请求中获取用户信息
export function getUserFromRequest(request: NextRequest): User | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false
    };
  } catch (error) {
    return null;
  }
}

// 验证JWT令牌
export async function verifyToken(request: NextRequest): Promise<User | null> {
  const user = getUserFromRequest(request);
  if (!user) {
    return null;
  }

  // 从数据库获取最新用户信息
  try {
    const result = await query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [user.userId]
    ) as any[];

    if (!result || result.length === 0) {
      return null;
    }

    const dbUser = result[0];
    return {
      userId: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      isAdmin: dbUser.role === 'admin'
    };
  } catch (error) {
    console.error('Failed to verify user:', error);
    return null;
  }
}

// 生成JWT令牌
export function generateToken(user: { id: number; username: string; email: string; role?: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.role === 'admin'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 验证用户密码
export async function verifyUserPassword(username: string, password: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?',
      [username, username]
    ) as any[];

    if (!result || result.length === 0) {
      return null;
    }

    const user = result[0];
    
    // 在实际应用中，这里应该使用 bcrypt 来验证密码
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.role === 'admin'
    };
  } catch (error) {
    console.error('Failed to verify password:', error);
    return null;
  }
}

export default {
  getUserFromRequest,
  verifyToken,
  generateToken,
  verifyUserPassword
};