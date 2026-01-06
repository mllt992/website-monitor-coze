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

async function comprehensiveTest() {
  let connection;
  
  try {
    console.log('🔬 开始综合邮件功能测试...\n');
    
    // 1. 连接数据库
    console.log('1. 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');
    
    // 2. 获取最新邮件配置
    console.log('2. 获取最新邮件配置...');
    const [configRows] = await connection.execute(
      'SELECT smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure FROM email_configs ORDER BY updated_at DESC, created_at DESC LIMIT 1'
    );
    
    if (!configRows || configRows.length === 0) {
      console.log('❌ 邮件配置不存在');
      return false;
    }
    
    const config = configRows[0];
    console.log('✅ 邮件配置获取成功');
    console.log(`   - 服务器: ${config.smtp_host}:${config.smtp_port}`);
    console.log(`   - 用户: ${config.smtp_user}`);
    console.log(`   - SSL: ${config.smtp_secure ? '是' : '否'}\n`);
    
    // 3. 测试SMTP连接
    console.log('3. 测试SMTP连接...');
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure === 1 || config.smtp_secure === true,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password
      }
    });
    
    await transporter.verify();
    console.log('✅ SMTP连接验证成功\n');
    
    // 4. 测试发送验证码邮件
    console.log('4. 测试登录验证码邮件...');
    const testCode = Math.floor(100000 + Math.random() * 900000);
    const [userRows] = await connection.execute(
      'SELECT email FROM users WHERE email IS NOT NULL AND email != "" LIMIT 1'
    );
    
    if (!userRows || userRows.length === 0) {
      console.log('❌ 没有找到用户邮箱');
      return false;
    }
    
    const testEmail = userRows[0].email;
    
    const loginCodeHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #ff6b6b, #ff8e8e); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">网站监控系统</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">登录验证码测试</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">登录验证码</h2>
          <p style="color: #666; line-height: 1.6;">您的测试验证码是：</p>
          
          <div style="background: white; border: 2px solid #ff6b6b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 5px;">${testCode}</span>
          </div>
          
          <p style="color: #666; line-height: 1.6;">这是一封测试邮件，验证邮件功能是否正常。</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>测试时间: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
    
    await transporter.sendMail({
      from: config.smtp_user,
      to: testEmail,
      subject: '网站监控系统 - 登录验证码测试',
      html: loginCodeHtml
    });
    console.log('✅ 登录验证码邮件发送成功');
    
    // 5. 测试密码重置邮件
    console.log('5. 测试密码重置验证码邮件...');
    const resetCode = Math.floor(100000 + Math.random() * 900000);
    
    const resetCodeHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">网站监控系统</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">密码重置验证码测试</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">密码重置验证码</h2>
          <p style="color: #666; line-height: 1.6;">您的测试验证码是：</p>
          
          <div style="background: white; border: 2px solid #667eea; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${resetCode}</span>
          </div>
          
          <p style="color: #666; line-height: 1.6;">这是一封测试邮件，验证密码重置功能是否正常。</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>测试时间: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
    
    await transporter.sendMail({
      from: config.smtp_user,
      to: testEmail,
      subject: '网站监控系统 - 密码重置验证码测试',
      html: resetCodeHtml
    });
    console.log('✅ 密码重置验证码邮件发送成功');
    
    // 6. 测试网站告警邮件
    console.log('6. 测试网站告警邮件...');
    const alertHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #ff6b6b, #ff8e8e); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">网站监控系统</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">告警通知测试</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">网站状态告警</h2>
          
          <div style="background: white; border: 2px solid #ff4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #ff4444; margin-top: 0;">宕机</h3>
            <p style="color: #333; margin: 10px 0;"><strong>网站名称:</strong> 测试网站</p>
            <p style="color: #333; margin: 10px 0;"><strong>网站地址:</strong> <a href="https://example.com" target="_blank">https://example.com</a></p>
            <p style="color: #333; margin: 10px 0;"><strong>状态信息:</strong> 网站无法访问</p>
            <p style="color: #666; margin: 10px 0;"><strong>检测时间:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">这是一封测试告警邮件，验证告警功能是否正常。</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>此邮件由网站监控系统自动发送，请勿回复。</p>
          <p>测试时间: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
    
    await transporter.sendMail({
      from: config.smtp_user,
      to: testEmail,
      subject: '测试网站 - 网站宕机告警',
      html: alertHtml
    });
    console.log('✅ 网站告警邮件发送成功\n');
    
    console.log('🎉 所有邮件功能测试完成！');
    console.log(`📧 测试邮件已发送到: ${testEmail}`);
    console.log('🔍 请检查邮箱，确认收到以下测试邮件：');
    console.log('   1. 登录验证码测试邮件');
    console.log('   2. 密码重置验证码测试邮件'); 
    console.log('   3. 网站告警测试邮件');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ 测试失败:');
    console.log('错误信息:', error.message);
    
    if (error.code) {
      console.log('错误代码:', error.code);
      
      if (error.code === 'EAUTH') {
        console.log('\n💡 建议检查:');
        console.log('   - 邮箱用户名和密码是否正确');
        console.log('   - 是否使用了正确的授权码/应用密码');
      } else if (error.code === 'ECONNECTION') {
        console.log('\n💡 建议检查:');
        console.log('   - SMTP服务器地址和端口');
        console.log('   - 网络连接');
      } else if (error.code === 'ESOCKET') {
        console.log('\n💡 建议检查:');
        console.log('   - SMTP端口配置');
        console.log('   - SSL/TLS设置');
      }
    }
    
    return false;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
comprehensiveTest().then(success => {
  process.exit(success ? 0 : 1);
});