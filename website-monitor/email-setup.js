const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

// 数据库配置
const dbConfig = {
  host: '批量替换_请输入数据IP地址',
  port: 3306,
  user: 't_monitor',
  password: '批量替换_请输入数据库密码',
  database: 't_monitor'
};

// 常用邮件服务商配置模板
const emailTemplates = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    note: '需要使用应用专用密码'
  },
  qq: {
    name: 'QQ邮箱',
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    note: '需要使用授权码'
  },
  '163': {
    name: '163邮箱',
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    note: '需要使用客户端授权密码'
  },
  '126': {
    name: '126邮箱',
    host: 'smtp.126.com',
    port: 465,
    secure: true,
    note: '需要使用客户端授权密码'
  }
};

async function updateEmailConfig(template, email, password) {
  let connection;
  
  try {
    console.log(`🔄 更新邮件配置为 ${template.name}...`);
    
    connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(`
      UPDATE email_configs 
      SET 
        smtp_host = ?,
        smtp_port = ?,
        smtp_user = ?,
        smtp_password = ?,
        smtp_secure = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [template.host, template.port, email, password, template.secure]);
    
    console.log('✅ 配置更新成功');
    
    // 测试新配置
    const transporter = nodemailer.createTransport({
      host: template.host,
      port: template.port,
      secure: template.secure,
      auth: {
        user: email,
        pass: password
      }
    });
    
    console.log('🔍 测试SMTP连接...');
    await transporter.verify();
    console.log('✅ SMTP连接验证成功');
    
    return true;
    
  } catch (error) {
    console.log('❌ 配置更新失败:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function showCurrentConfig() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT smtp_host, smtp_port, smtp_user, smtp_secure FROM email_configs WHERE id = 1'
    );
    
    if (rows.length > 0) {
      const config = rows[0];
      console.log('\n📋 当前邮件配置:');
      console.log(`   - 服务器: ${config.smtp_host}`);
      console.log(`   - 端口: ${config.smtp_port}`);
      console.log(`   - 用户名: ${config.smtp_user}`);
      console.log(`   - 安全连接: ${config.smtp_secure ? '是' : '否'}`);
    }
    
  } catch (error) {
    console.log('❌ 获取配置失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function interactiveSetup() {
  console.log('🚀 邮件配置快速设置工具\n');
  
  // 显示当前配置
  await showCurrentConfig();
  
  console.log('\n📧 支持的邮件服务商:');
  Object.keys(emailTemplates).forEach(key => {
    const template = emailTemplates[key];
    console.log(`   ${key}. ${template.name} (${template.host}:${template.port})`);
    console.log(`      备注: ${template.note}`);
  });
  
  console.log('\n请选择邮件服务商 (输入数字):');
  
  // 由于这是脚本，我们提供示例用法
  console.log('\n💡 使用方法:');
  console.log('   node email-setup.js gmail your-email@gmail.com your-app-password');
  console.log('   node email-setup.js qq your-qq@qq.com your-authorization-code');
  console.log('   node email-setup.js 163 your-email@163.com your-client-password');
  
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.log('\n⚠️  请提供完整的参数: <服务商> <邮箱> <密码>');
    process.exit(1);
  }
  
  const [service, email, password] = args;
  const template = emailTemplates[service];
  
  if (!template) {
    console.log(`\n❌ 不支持的服务商: ${service}`);
    console.log('支持的服务商:', Object.keys(emailTemplates).join(', '));
    process.exit(1);
  }
  
  console.log(`\n📧 准备配置 ${template.name}:`);
  console.log(`   - 邮箱: ${email}`);
  console.log(`   - 服务器: ${template.host}:${template.port}`);
  console.log(`   - 安全连接: ${template.secure ? '是' : '否'}`);
  
  // 确认操作
  console.log('\n⚠️  确认要更新配置吗? (y/N)');
  // 在实际使用中，这里需要用户输入确认
  
  const success = await updateEmailConfig(template, email, password);
  
  if (success) {
    console.log('\n🎉 邮件配置更新成功!');
    console.log('💡 现在可以在Web界面点击"测试邮件"验证配置');
  } else {
    console.log('\n❌ 邮件配置更新失败');
    console.log('💡 请检查邮箱和密码是否正确，或参考邮件配置修复指南');
  }
}

// 显示使用说明
if (process.argv.length === 2) {
  console.log('邮件配置快速设置工具\n');
  console.log('使用方法:');
  console.log('  node email-setup.js <服务商> <邮箱> <密码>\n');
  console.log('示例:');
  console.log('  node email-setup.js gmail myemail@gmail.com my-app-password');
  console.log('  node email-setup.js qq myqq@qq.com my-authorization-code');
  console.log('  node email-setup.js 163 myemail@163.com my-client-password\n');
  console.log('支持的服务商: gmail, qq, 163, 126');
} else {
  interactiveSetup();
}