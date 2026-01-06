import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 删除现有表
    await query('DROP TABLE IF EXISTS email_configs');
    
    // 重新创建表
    await query(`
      CREATE TABLE email_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        smtp_host VARCHAR(100) NOT NULL,
        smtp_port INT NOT NULL DEFAULT 587,
        smtp_user VARCHAR(100) NOT NULL,
        smtp_password VARCHAR(255) NOT NULL,
        smtp_secure BOOLEAN DEFAULT FALSE,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    return NextResponse.json({ message: 'Email configs table reset successfully' });

  } catch (error) {
    console.error('Reset email table error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset email table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}