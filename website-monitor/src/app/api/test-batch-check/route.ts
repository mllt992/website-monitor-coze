import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET /api/test-batch-check?key=xxx - 测试接口
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('key');

  // 验证 API 密钥
  if (!apiKey) {
    return NextResponse.json({ error: '缺少 API 密钥' }, { status: 401 });
  }

  try {
    const connection = await getConnection();

    // 验证密钥是否有效
    const [keyRows] = await connection.execute(
      `SELECT id, user_id, is_active
       FROM auth_keys
       WHERE api_key = ? AND is_active = 1`,
      [apiKey]
    );

    await connection.end();

    if (!Array.isArray(keyRows) || keyRows.length === 0) {
      return NextResponse.json({ error: '无效的 API 密钥或密钥已禁用' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: '测试成功',
      data: {
        apiKey,
        authKey: keyRows[0]
      }
    });
  } catch (error) {
    console.error('测试接口错误:', error);
    return NextResponse.json(
      {
        error: '测试失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
