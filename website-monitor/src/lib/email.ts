import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

let transporter: nodemailer.Transporter | null = null;

export async function initEmailTransporter(config?: EmailConfig): Promise<void> {
  const defaultConfig = config || {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || ''
  };

  // 验证配置完整性
  if (!defaultConfig.host || !defaultConfig.port || !defaultConfig.user || !defaultConfig.password) {
    console.error('Email configuration is incomplete');
    throw new Error('邮件配置不完整');
  }

  transporter = nodemailer.createTransport({
    host: defaultConfig.host,
    port: defaultConfig.port,
    secure: defaultConfig.secure,
    auth: {
      user: defaultConfig.user,
      pass: defaultConfig.password,
    },
  });

  // 验证连接
  try {
    await transporter.verify();
    console.log('Email transporter initialized and verified successfully');
  } catch (error) {
    console.error('Email transporter verification failed:', error);
    throw error;
  }
}

export async function sendEmail(
  config: any,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    console.log('sendEmail called with config keys:', Object.keys(config));
    console.log('sendEmail config:', config);

    // 如果没有传入config，且已经有transporter，直接使用
    if ((!config || Object.keys(config).length === 0) && transporter) {
      console.log('Using existing transporter');
      const mailOptions = {
        from: `"网站监控系统" <${(transporter as any).options.auth?.user || 'noreply@monitor.com'}>`,
        to,
        subject,
        html,
        text,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    }

    // 否则使用传入的配置初始化邮件发送器
    // 支持多种配置格式：直接字段名或带smtp_前缀的字段名
    const emailConfig = {
      host: config.smtp_host || config.host,
      port: config.smtp_port || config.port,
      secure: config.smtp_secure !== undefined ? config.smtp_secure : config.secure,
      user: config.smtp_user || config.user,
      password: config.smtp_password || config.smtp_pass || config.password,
    };

    console.log('Normalized emailConfig:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.user,
      password: '***' // 隐藏密码
    });

    // 使用传入的配置初始化邮件发送器
    await initEmailTransporter(emailConfig);

    if (!transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    const mailOptions = {
      from: `"网站监控系统" <${emailConfig.user}>`,
      to,
      subject,
      html,
      text,
    };

    console.log('Sending email to:', to);
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function generateLoginCode(email: string, code: string, config?: EmailConfig): Promise<boolean> {
  const subject = '网站监控系统 - 登录验证码';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #ff6b6b, #ff8e8e); padding: 30px; border-radius: 10px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">网站监控系统</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">登录验证码</h2>
        <p style="color: #666; line-height: 1.6;">您好！</p>
        <p style="color: #666; line-height: 1.6;">您正在尝试登录网站监控系统，您的验证码是：</p>
        
        <div style="background: white; border: 2px solid #ff6b6b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 5px;">${code}</span>
        </div>
        
        <p style="color: #666; line-height: 1.6;">验证码有效期为10分钟，请及时使用。</p>
        <p style="color: #666; line-height: 1.6;">如果这不是您本人的操作，请忽略此邮件。</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>此邮件由系统自动发送，请勿回复。</p>
      </div>
    </div>
  `;

  try {
    // 如果提供了配置，则使用配置初始化邮件发送器
    if (config) {
      await initEmailTransporter(config);
    } else if (!transporter) {
      // 只有在没有transporter时才初始化
      await initEmailTransporter();
    }
    return await sendEmail(config || (transporter ? {} : {}), email, subject, html);
  } catch (error) {
    console.error('Failed to generate login code email:', error);
    return false;
  }
}

// 生成密码重置验证码邮件
export async function generatePasswordResetCode(email: string, code: string, config?: EmailConfig): Promise<boolean> {
  const subject = '网站监控系统 - 密码重置验证码';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 10px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">网站监控系统</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">密码重置验证码</h2>
        <p style="color: #666; line-height: 1.6;">您好！</p>
        <p style="color: #666; line-height: 1.6;">您正在尝试重置网站监控系统的密码，您的验证码是：</p>
        
        <div style="background: white; border: 2px solid #667eea; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${code}</span>
        </div>
        
        <p style="color: #666; line-height: 1.6;">验证码有效期为10分钟，请及时使用。</p>
        <p style="color: #666; line-height: 1.6;">如果这不是您本人的操作，请立即联系管理员。</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>此邮件由系统自动发送，请勿回复。</p>
      </div>
    </div>
  `;

  try {
    console.log('generatePasswordResetCode called for:', email);
    console.log('Config provided:', !!config);

    // 如果提供了配置，则使用配置初始化邮件发送器
    if (config) {
      console.log('Initializing transporter with config');
      await initEmailTransporter(config);
    } else if (!transporter) {
      // 只有在没有transporter时才初始化
      console.log('No config provided and no transporter, initializing default');
      await initEmailTransporter();
    } else {
      console.log('Using existing transporter');
    }

    console.log('Calling sendEmail...');
    const result = await sendEmail(config || (transporter ? {} : {}), email, subject, html);
    console.log('sendEmail returned:', result);
    return result;
  } catch (error) {
    console.error('Failed to generate password reset code email:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return false;
  }
}

// 发送网站监控告警邮件
export async function sendWebsiteAlert(
  email: string,
  websiteName: string,
  websiteUrl: string,
  status: 'down' | 'slow' | 'recovered',
  config?: EmailConfig,
  responseTime?: number,
  errorMessage?: string
): Promise<boolean> {
  const getStatusInfo = () => {
    switch (status) {
      case 'down':
        return {
          subject: `${websiteName} - 网站宕机告警`,
          color: '#ff4444',
          status: '宕机',
          message: '网站无法访问'
        };
      case 'slow':
        return {
          subject: `${websiteName} - 网站响应缓慢告警`,
          color: '#ff9800',
          status: '响应缓慢',
          message: `响应时间: ${responseTime}ms`
        };
      case 'recovered':
        return {
          subject: `${websiteName} - 网站恢复通知`,
          color: '#4caf50',
          status: '已恢复',
          message: '网站已恢复正常访问'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #ff6b6b, #ff8e8e); padding: 30px; border-radius: 10px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">网站监控系统</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">网站状态告警</h2>
        
        <div style="background: white; border: 2px solid ${statusInfo.color}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${statusInfo.color}; margin-top: 0;">${statusInfo.status}</h3>
          <p style="color: #333; margin: 10px 0;"><strong>网站名称:</strong> ${websiteName}</p>
          <p style="color: #333; margin: 10px 0;"><strong>网站地址:</strong> <a href="${websiteUrl}" target="_blank">${websiteUrl}</a></p>
          <p style="color: #333; margin: 10px 0;"><strong>状态信息:</strong> ${statusInfo.message}</p>
          ${errorMessage ? `<p style="color: #ff4444; margin: 10px 0;"><strong>错误信息:</strong> ${errorMessage}</p>` : ''}
          <p style="color: #666; margin: 10px 0;"><strong>检测时间:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">请及时检查网站状态并采取相应措施。</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>此邮件由网站监控系统自动发送，请勿回复。</p>
      </div>
    </div>
  `;

  try {
    // 如果提供了配置，则使用配置初始化邮件发送器
    if (config) {
      await initEmailTransporter(config);
    } else if (!transporter) {
      // 只有在没有transporter时才初始化
      await initEmailTransporter();
    }
    return await sendEmail(config || (transporter ? {} : {}), email, statusInfo.subject, html);
  } catch (error) {
    console.error('Failed to send website alert email:', error);
    throw error;
  }
}

// 发送测试邮件
export async function sendTestEmail(emailConfig: any, userEmail: string): Promise<boolean> {
  const subject = '网站监控系统 - 邮件配置测试';
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #4caf50, #45a049); padding: 30px; border-radius: 10px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">网站监控系统</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">邮件配置测试</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">✅ 测试成功</h2>
        <p style="color: #666; line-height: 1.6;">恭喜！您的邮件配置已成功设置。</p>
        
        <div style="background: white; border: 2px solid #4caf50; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="color: #333; margin: 10px 0;"><strong>SMTP服务器:</strong> ${emailConfig.host}</p>
          <p style="color: #333; margin: 10px 0;"><strong>SMTP端口:</strong> ${emailConfig.port}</p>
          <p style="color: #333; margin: 10px 0;"><strong>用户名:</strong> ${emailConfig.auth.user}</p>
          <p style="color: #333; margin: 10px 0;"><strong>安全连接:</strong> ${emailConfig.secure ? '是' : '否'}</p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">现在您可以使用邮件服务接收网站的监控告警通知。</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; background: #4caf50; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold;">
            邮件服务正常工作 🎉
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
        <p>此邮件由系统自动发送，请勿回复。</p>
        <p>测试时间: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  `;

  try {
    // 使用传入的配置创建transporter
    const testTransporter = nodemailer.createTransport(emailConfig);

    const mailOptions = {
      from: emailConfig.auth.user, // 使用认证用户作为发件人
      to: userEmail,
      subject,
      html,
    };

    const result = await testTransporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
}

export default {
  initEmailTransporter,
  sendEmail,
  generateLoginCode,
  generatePasswordResetCode,
  sendWebsiteAlert,
  sendTestEmail
};