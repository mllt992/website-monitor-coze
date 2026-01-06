import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// DELETE /api/auth-keys/[id] - 删除授权密钥
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const keyId = parseInt(id);

    if (isNaN(keyId)) {
      return NextResponse.json({ error: '无效的密钥ID' }, { status: 400 });
    }

    // 检查密钥是否存在且属于当前用户
    const rows = await query(
      `SELECT id FROM auth_keys WHERE id = ? AND user_id = ?`,
      [keyId, user.userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '密钥不存在或无权限删除' }, { status: 404 });
    }

    // 删除密钥
    await query(
      `DELETE FROM auth_keys WHERE id = ? AND user_id = ?`,
      [keyId, user.userId]
    );

    return NextResponse.json({
      success: true,
      message: '授权密钥删除成功'
    });
  } catch (error) {
    console.error('删除授权密钥失败:', error);
    return NextResponse.json(
      { error: '删除授权密钥失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/auth-keys/[id] - 更新授权密钥状态
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const keyId = parseInt(id);

    if (isNaN(keyId)) {
      return NextResponse.json({ error: '无效的密钥ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
    }

    // 检查密钥是否存在且属于当前用户
    const rows = await query(
      `SELECT id FROM auth_keys WHERE id = ? AND user_id = ?`,
      [keyId, user.userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '密钥不存在或无权限修改' }, { status: 404 });
    }

    // 更新密钥状态
    await query(
      `UPDATE auth_keys SET is_active = ? WHERE id = ? AND user_id = ?`,
      [isActive ? 1 : 0, keyId, user.userId]
    );

    return NextResponse.json({
      success: true,
      message: isActive ? '授权密钥已启用' : '授权密钥已禁用'
    });
  } catch (error) {
    console.error('更新授权密钥失败:', error);
    return NextResponse.json(
      { error: '更新授权密钥失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
