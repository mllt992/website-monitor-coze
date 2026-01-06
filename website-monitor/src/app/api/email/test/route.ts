import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { sendTestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    // 解析JWT token获取用户信息
    let user;
    try {
      const jwt = require('jsonwebtoken');
      user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    // 连接数据库
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '批量替换_请输入数据IP地址',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 't_monitor',
      password: process.env.DB_PASSWORD || '批量替换_请输入数据库密码',
      database: process.env.DB_NAME || 't_monitor'
    });

    try {
      // 获取邮件配置
      const [rows] = await connection.execute(
        'SELECT smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure FROM email_configs ORDER BY updated_at DESC, created_at DESC LIMIT 1'
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        await connection.end();
        return NextResponse.json({ error: '邮件配置不存在' }, { status: 404 });
      }

      const config = rows[0] as any;

      // 验证配置完整性
      if (!config.smtp_host || !config.smtp_port || !config.smtp_user || !config.smtp_password) {
        await connection.end();
        return NextResponse.json({ error: '邮件配置不完整，请先配置邮件服务' }, { status: 400 });
      }

      // 获取用户邮箱
      const [userRows] = await connection.execute(
        'SELECT email FROM users WHERE id = ?',
        [user.userId]
      );

      if (!Array.isArray(userRows) || userRows.length === 0) {
        await connection.end();
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      const userInfo = userRows[0] as any;
      const userEmail = userInfo.email;

      if (!userEmail) {
        await connection.end();
        return NextResponse.json({ error: '用户邮箱不存在' }, { status: 400 });
      }

      // 发送测试邮件
      const emailConfig = {
        host: config.smtp_host,
        port: parseInt(config.smtp_port),
        secure: config.smtp_secure === 1 || config.smtp_secure === true,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password
        }
      };

      await sendTestEmail(emailConfig, userEmail);

      await connection.end();

      return NextResponse.json({ 
        success: true, 
        message: `测试邮件已发送到 ${userEmail}` 
      });

    } catch (dbError) {
      await connection.end();
      throw dbError;
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: '发送测试邮件失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}