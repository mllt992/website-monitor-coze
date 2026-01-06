import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/auth-keys - 获取授权密钥列表
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await query(
      `SELECT id, user_id, key_name, api_key,
              is_active, last_used_at, usage_count,
              created_at, updated_at
       FROM auth_keys
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('获取授权密钥列表失败:', error);
    return NextResponse.json(
      { error: '获取授权密钥列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/auth-keys - 创建授权密钥
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyName } = body;

    if (!keyName || keyName.trim().length === 0) {
      return NextResponse.json({ error: '密钥名称不能为空' }, { status: 400 });
    }

    // 生成随机 API 密钥
    const apiKey = generateApiKey();

    const result = await query(
      `INSERT INTO auth_keys (user_id, key_name, api_key, is_active)
       VALUES (?, ?, ?, 1)`,
      [user.userId, keyName.trim(), apiKey]
    ) as any;

    return NextResponse.json({
      success: true,
      message: '授权密钥创建成功',
      data: { apiKey }
    });
  } catch (error) {
    console.error('创建授权密钥失败:', error);
    return NextResponse.json(
      { error: '创建授权密钥失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 生成随机 API 密钥
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
