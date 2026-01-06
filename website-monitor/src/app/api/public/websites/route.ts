import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 获取所有网站，包含分类信息
    const result = await query(`
      SELECT 
        w.*,
        c.name as category_name,
        c.color as category_color,
        c.sort_order as category_sort_order
      FROM websites w
      LEFT JOIN categories c ON w.category_id = c.id
      ORDER BY c.sort_order ASC, w.sort_order ASC, w.created_at DESC
    `) as any[];

    // 直接使用数据库中已计算好的状态，保持一致性
    const websitesWithStatus = result.map((website: any) => {
      return {
        ...website,
        status: website.status || 'unknown',
        response_time: website.response_time || 0,
        category_sort_order: website.category_sort_order || 999
      };
    });

    return NextResponse.json({
      websites: websitesWithStatus
    });

  } catch (error) {
    console.error('Failed to fetch public websites:', error);
    return NextResponse.json(
      { error: '获取网站列表失败' },
      { status: 500 }
    );
  }
}