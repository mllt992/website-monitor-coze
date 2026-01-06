const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: '批量替换_请输入数据IP地址',
  port: 3306,
  user: 't_monitor',
  password: '批量替换_请输入数据库密码',
  database: 't_monitor'
};

async function quickFix() {
  let connection;
  
  try {
    console.log('🔧 快速修复邮件配置...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // 获取最新的配置
    const [rows] = await connection.execute(
      'SELECT * FROM email_configs ORDER BY updated_at DESC, created_at DESC LIMIT 1'
    );
    
    if (rows.length > 0) {
      const config = rows[0];
      console.log('📋 当前配置:');
      console.log(`   - SMTP服务器: ${config.smtp_host}`);
      console.log(`   - 用户名: ${config.smtp_user}`);
      console.log(`   - 状态: 测试数据，无法发送邮件\n`);
      
      // 更新为更通用的配置，但仍需要用户提供真实信息
      console.log('💡 建议的配置方案:');
      console.log('   1. QQ邮箱: smtp.qq.com:587 (推荐)');
      console.log('   2. 163邮箱: smtp.163.com:465');
      console.log('   3. Gmail: smtp.gmail.com:587 (需要应用密码)\n');
      
      // 检查是否有真实的QQ邮箱可以测试
      console.log('🔍 检查是否有有效的用户邮箱...');
      const [userRows] = await connection.execute(
        'SELECT email FROM users WHERE email LIKE "%@qq.com%" OR email LIKE "%@163.com%" LIMIT 1'
      );
      
      if (userRows.length > 0) {
        console.log(`✅ 发现用户邮箱: ${userRows[0].email}`);
        console.log('\n📝 使用该邮箱更新配置:');
        console.log('   请提供该邮箱的SMTP授权码或应用密码');
      } else {
        console.log('❌ 未发现常见的邮箱账户');
      }
      
      console.log('\n🛠️  修复步骤:');
      console.log('   1. 登录系统管理界面');
      console.log('   2. 进入"系统设置" → "邮件配置"');
      console.log('   3. 点击"配置邮件"按钮');
      console.log('   4. 填入真实的SMTP配置信息');
      console.log('   5. 点击"测试邮件"验证配置');
      
    } else {
      console.log('❌ 未找到邮件配置记录');
    }
    
  } catch (error) {
    console.log('❌ 修复失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

quickFix();