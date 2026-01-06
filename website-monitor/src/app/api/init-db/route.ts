import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { force } = await request.json();

    // 检查是否已经初始化
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    if (userCount && (userCount as any)[0].count > 0 && !force) {
      return NextResponse.json({
        message: '数据库已初始化',
        initialized: true
      });
    }

    // 读取SQL文件
    const sqlPath = path.join(process.cwd(), 'scripts', 'init-db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 分割SQL语句
    const statements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));

    // 执行每个SQL语句
    for (const statement of statements) {
      const cleanStatement = statement.trim();
      if (cleanStatement) {
        try {
          await query(cleanStatement);
        } catch (error) {
          // 忽略INSERT IGNORE的错误
          if (!cleanStatement.toUpperCase().includes('INSERT IGNORE')) {
            throw error;
          }
        }
      }
    }

    return NextResponse.json({
      message: '数据库初始化成功',
      initialized: true
    });

  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: '数据库初始化失败', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}