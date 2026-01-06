import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { initEmailTransporter } from '@/lib/email';

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    await query('DROP TABLE IF EXISTS email_configs');
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    return NextResponse.json({ message: 'Email configs table recreated successfully' });
  } catch (error) {
    console.error('Recreate email table error:', error);
    return NextResponse.json({ 
      error: 'Failed to recreate email table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Email config API called');
    
    const user = await verifyToken(request);
    console.log('User verification result:', user);
    
    if (!user || !user.isAdmin) {
      console.log('Permission denied: user=', user, 'isAdmin=', user?.isAdmin);
      return NextResponse.json({ error: '权限不足', user: user }, { status: 403 });
    }

    console.log('Checking email_configs table...');
    
    // 先检查表是否存在
    try {
      await query('SELECT 1 FROM email_configs LIMIT 1');
      console.log('email_configs table exists');
    } catch (tableError) {
      console.log('Table does not exist, creating...');
      // 表不存在，创建表
      await query(`
        CREATE TABLE IF NOT EXISTS email_configs (
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
      console.log('Table created');
    }

    console.log('Querying email configs...');
    
    // 先获取表的所有列
    const columns = await query('SHOW COLUMNS FROM email_configs') as any[];
    console.log('Table columns:', columns.map(col => col.Field));
    
    // 构建动态查询
    const availableColumns = columns.map(col => col.Field);
    const selectColumns = ['id', 'smtp_host', 'smtp_port', 'smtp_secure', 'created_at']
      .filter(col => availableColumns.includes(col));
    
    // 添加用户名列（可能是smtp_user或smtp_username）
    if (availableColumns.includes('smtp_user')) {
      selectColumns.push('smtp_user');
    } else if (availableColumns.includes('smtp_username')) {
      selectColumns.push('smtp_username');
    }
    
    console.log('Selecting columns:', selectColumns);
    
    let rows;
    try {
      rows = await query(
        `SELECT ${selectColumns.join(', ')} FROM email_configs ORDER BY updated_at DESC, created_at DESC LIMIT 1`
      ) as any[];
    } catch (queryError) {
      console.error('Query execution failed:', queryError);
      return NextResponse.json({ 
        error: '查询邮件配置失败',
        details: queryError instanceof Error ? queryError.message : 'Unknown error'
      }, { status: 500 });
    }

    console.log('Query result:', rows);

    if (!rows || rows.length === 0) {
      console.log('No email configs found');
      return NextResponse.json({ config: null });
    }

    const config = rows[0];
    console.log('Returning config:', config);
    
    // 动态构建返回对象
    const result: any = {
      id: config.id,
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      created_at: config.created_at
    };
    
    // 处理用户名列名的差异
    result.smtp_user = config.smtp_user || config.smtp_username;
    
    return NextResponse.json({ 
      config: result
    });
  } catch (error) {
    console.error('Get email config error:', error);
    return NextResponse.json({ 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure } = await request.json();

    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
      return NextResponse.json({ error: '请填写完整的邮件配置信息' }, { status: 400 });
    }

    // 测试连接
    try {
      const nodemailer = require('nodemailer');
      const testTransporter = nodemailer.createTransport({
        host: smtp_host,
        port: parseInt(smtp_port),
        secure: smtp_secure || false,
        auth: {
          user: smtp_user,
          pass: smtp_password,
        },
      });

      await testTransporter.verify();
      console.log('Email configuration test successful');
    } catch (testError) {
      console.error('Email configuration test failed:', testError);
      return NextResponse.json({ 
        error: '邮件配置测试失败',
        details: testError instanceof Error ? testError.message : 'Unknown error'
      }, { status: 400 });
    }

    // 保存配置
    const result = await query(
      'INSERT INTO email_configs (smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure || false, user.userId]
    ) as any;

    return NextResponse.json({
      message: '邮件配置保存成功',
      configId: result.insertId
    });
  } catch (error) {
    console.error('Save email config error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}