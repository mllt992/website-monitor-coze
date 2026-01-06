import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const configs = await query(`
      SELECT config_key, config_value, description 
      FROM system_configs 
      ORDER BY config_key
    `) as any[];

    const configMap: Record<string, any> = {};
    configs.forEach(config => {
      const value = parseInt(config.config_value);
      configMap[config.config_key] = isNaN(value) ? config.config_value : value;
    });

    return NextResponse.json({ configs: configMap });
  } catch (error) {
    console.error('Get system config error:', error);
    return NextResponse.json({ 
      error: '获取系统配置失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];

    // 处理每个配置项
    const configFields = [
      'check_interval', 'timeout', 'retry_count', 'notification_cooldown',
      'max_response_time', 'cleanup_logs_days', 'max_websites_per_user'
    ];

    configFields.forEach(key => {
      if (body[key] !== undefined) {
        updates.push(`WHEN '${key}' THEN ?`);
        values.push(body[key].toString());
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ error: '没有要更新的配置' }, { status: 400 });
    }

    // 构建批量更新SQL
    const sql = `
      UPDATE system_configs 
      SET config_value = CASE config_key ${updates.join(' ')} END,
          updated_at = CURRENT_TIMESTAMP
      WHERE config_key IN (${configFields.filter(key => body[key] !== undefined).map(() => '?').join(',')})
    `;

    // 添加IN子句的参数
    configFields.forEach(key => {
      if (body[key] !== undefined) {
        values.push(key);
      }
    });

    await query(sql, values);

    return NextResponse.json({ 
      message: '系统配置更新成功' 
    });
  } catch (error) {
    console.error('Update system config error:', error);
    return NextResponse.json({ 
      error: '更新系统配置失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}