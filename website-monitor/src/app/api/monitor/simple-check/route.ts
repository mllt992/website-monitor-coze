import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET /api/monitor/simple-check?key=xxx - 简化版检查接口
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('key');

  // 验证 API 密钥
  if (!apiKey) {
    return NextResponse.json({ error: '缺少 API 密钥' }, { status: 401 });
  }

  try {
    console.log('开始验证密钥...');
    const connection = await getConnection();

    // 验证密钥是否有效
    console.log('查询密钥...');
    const [keyRows] = await connection.execute(
      `SELECT id, user_id, is_active
       FROM auth_keys
       WHERE api_key = ? AND is_active = 1`,
      [apiKey]
    );

    if (!Array.isArray(keyRows) || keyRows.length === 0) {
      await connection.end();
      return NextResponse.json({ error: '无效的 API 密钥或密钥已禁用' }, { status: 401 });
    }

    const authKey = keyRows[0] as { id: number; user_id: number | null; is_active: number };

    // 更新密钥使用记录
    console.log('更新密钥使用记录...');
    await connection.execute(
      `UPDATE auth_keys
       SET last_used_at = UTC_TIMESTAMP(),
           usage_count = usage_count + 1
       WHERE id = ?`,
      [authKey.id]
    );

    // 获取所有网站
    console.log('获取网站列表...');
    const [websiteRows] = await connection.execute(
      `SELECT id, url, category_id, user_id
       FROM websites`
    );

    await connection.end();

    if (!Array.isArray(websiteRows) || websiteRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要检测的网站',
        checkedCount: 0,
        sentCount: 0
      });
    }

    console.log(`找到 ${websiteRows.length} 个网站`);

    return NextResponse.json({
      success: true,
      message: `找到 ${websiteRows.length} 个网站`,
      data: {
        checkedCount: websiteRows.length,
        sentCount: 0,
        websites: websiteRows.map((w: any) => ({ id: w.id, url: w.url }))
      }
    });
  } catch (error) {
    console.error('批量检测失败:', error);
    return NextResponse.json(
      {
        error: '批量检测失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
