import mysql from 'mysql2/promise';
import { initEmailTransporter, generatePasswordResetCode } from './src/lib/email.js';

async function testForgotPassword() {
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor'
    });

    console.log('数据库连接成功');

    // 获取邮件配置
    const [rows] = await connection.execute(
      'SELECT * FROM email_configs ORDER BY updated_at DESC, created_at DESC LIMIT 1'
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      console.error('邮件配置不存在');
      process.exit(1);
    }

    const emailConfig = rows[0];
    console.log('邮件配置:', {
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_secure,
      user: emailConfig.smtp_user
    });

    // 测试初始化邮件发送器
    console.log('正在初始化邮件发送器...');
    await initEmailTransporter({
      host: emailConfig.smtp_host,
      port: parseInt(emailConfig.smtp_port),
      secure: emailConfig.smtp_secure === 1 || emailConfig.smtp_secure === true,
      user: emailConfig.smtp_user,
      password: emailConfig.smtp_password,
    });
    console.log('邮件发送器初始化成功');

    // 测试发送密码重置验证码邮件
    console.log('正在发送密码重置验证码邮件...');
    const result = await generatePasswordResetCode(
      'xrilang@mllt.cc',
      '123456',
      {
        host: emailConfig.smtp_host,
        port: parseInt(emailConfig.smtp_port),
        secure: emailConfig.smtp_secure === 1 || emailConfig.smtp_secure === true,
        user: emailConfig.smtp_user,
        password: emailConfig.smtp_password,
      }
    );

    if (result) {
      console.log('密码重置验证码邮件发送成功');
    } else {
      console.error('密码重置验证码邮件发送失败');
    }

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testForgotPassword();
