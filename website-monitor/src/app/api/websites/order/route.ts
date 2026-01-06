import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const { sort_order } = await request.json();

    // 验证权限
    const websiteResult = await query(
      'SELECT user_id FROM websites WHERE id = ?',
      [id]
    );

    if (websiteResult.length === 0) {
      return NextResponse.json({ error: '网站不存在' }, { status: 404 });
    }

    if (websiteResult[0].user_id !== user.userId && user.email !== 'xrilang@mllt.cc') {
      return NextResponse.json({ error: '无权限操作此网站' }, { status: 403 });
    }

    // 更新排序
    await query(
      'UPDATE websites SET sort_order = ? WHERE id = ?',
      [sort_order, id]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update website order error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const { orders } = await request.json();

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: '无效的排序数据' }, { status: 400 });
    }

    console.log('开始批量更新网站排序，用户:', user.email, '订单数量:', orders.length);
    console.log('订单数据:', JSON.stringify(orders));

    // 批量更新排序
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of orders) {
      const { id, sort_order } = item;
      
      console.log(`处理网站 ID: ${id}, sort_order: ${sort_order}`);
      
      // 验证权限
      const websiteResult = await query(
        'SELECT user_id FROM websites WHERE id = ?',
        [id]
      ) as any[];

      if (!websiteResult || websiteResult.length === 0) {
        console.error(`网站 ID ${id} 不存在`);
        errorCount++;
        continue;
      }

      const websiteUserId = websiteResult[0].user_id;
      console.log(`网站 ${id} 的 user_id: ${websiteUserId}, 用户 ID: ${user.userId}`);

      // 权限检查：管理员或者网站所有者可以修改
      const isAdmin = user.email === 'xrilang@mllt.cc' || user.isAdmin;
      const isOwner = websiteUserId === user.userId;
      
      if (!isAdmin && !isOwner) {
        console.error(`用户 ${user.email} 无权限修改网站 ${id}`);
        errorCount++;
        continue;
      }

      // 更新排序
      await query(
        'UPDATE websites SET sort_order = ? WHERE id = ?',
        [sort_order, id]
      );
      successCount++;
      console.log(`网站 ${id} 排序更新成功`);
    }

    console.log(`批量更新完成: 成功 ${successCount}, 失败 ${errorCount}`);

    if (successCount === 0 && errorCount > 0) {
      return NextResponse.json({ 
        error: '没有网站被更新，可能所有网站都无权限',
        success: false
      }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      updated: successCount,
      failed: errorCount
    });

  } catch (error) {
    console.error('Batch update website orders error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}