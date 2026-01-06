import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CheckResult {
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  errorMessage?: string;
  httpStatusCode?: number;
}

async function checkWebsiteStatus(url: string): Promise<CheckResult> {
  const startTime = Date.now();
  let httpStatusCode: number | undefined;
  
  try {
    // 第一步：尝试HEAD请求（轻量级）
    let response = await performRequest(url, 'HEAD');
    let responseTime = Date.now() - startTime;
    httpStatusCode = response.status;
    
    // 如果HEAD请求成功且不是404，直接使用结果
    if (response.ok && response.status !== 404) {
      return { ...analyzeResponse(response, responseTime, 'HEAD'), httpStatusCode };
    }
    
    // 如果HEAD请求失败（特别是404或服务器错误），尝试GET请求
    console.log(`HEAD请求失败 (${response.status})，尝试GET请求: ${url}`);
    
    const getStartTime = Date.now();
    response = await performRequest(url, 'GET');
    responseTime = Date.now() - getStartTime;
    httpStatusCode = response.status;
    
    return { ...analyzeResponse(response, responseTime, 'GET'), httpStatusCode };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMessage = error instanceof Error ? error.message : '网络连接失败';
    
    // 检查是否是超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      errorMessage = '请求超时: 网站响应超过10秒';
    }
    
    return {
      status: 'error',
      responseTime: 0,
      errorMessage,
      httpStatusCode: undefined
    };
  }
}

// 执行HTTP请求的通用函数
async function performRequest(url: string, method: 'HEAD' | 'GET'): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
  
  try {
    const requestOptions: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Website-Monitor/1.0',
        'Accept': method === 'HEAD' ? '*/*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };
    
    // 如果是GET请求，限制接收的数据量
    if (method === 'GET') {
      // 注意：fetch API本身不支持限制响应大小，但我们可以快速取消
      const response = await fetch(url, requestOptions);
      
      // 对于GET请求，我们只需要状态，不需要读取body
      // 这样可以避免下载整个页面内容
      return response;
    }
    
    return await fetch(url, requestOptions);
    
  } finally {
    clearTimeout(timeoutId);
  }
}

// 分析响应并返回结果
function analyzeResponse(response: Response, responseTime: number, method: string): { status: 'healthy' | 'warning' | 'error', responseTime: number, errorMessage?: string } {
  // 如果响应时间异常（小于等于0），可能是时钟问题或其他异常
  if (responseTime <= 0) {
    return {
      status: 'error',
      responseTime: 0,
      errorMessage: '响应时间异常: 检测时间戳错误'
    };
  }
  
  // 基于HTTP状态码判断
  if (response.ok) {
    // 2xx状态码：成功
    if (responseTime > 1000) {
      return {
        status: 'warning',
        responseTime,
        errorMessage: `响应时间过长: ${responseTime}ms (${method}请求)`
      };
    } else {
      return {
        status: 'healthy',
        responseTime
      };
    }
  } else if (response.status === 401 || response.status === 403) {
    // 401未授权、403禁止访问：这是正常的业务响应，说明网站正常运行
    // 只是页面需要认证或权限，不是网站问题
    return {
      status: 'healthy',
      responseTime,
      errorMessage: `需要认证 (HTTP ${response.status}): ${response.statusText} (${method}请求)`
    };
  } else if (response.status === 404) {
    // 404错误：页面不存在，但网站是可达的
    return {
      status: 'warning',
      responseTime,
      errorMessage: `页面不存在 (HTTP 404) - ${response.statusText} (${method}请求)`
    };
  } else if (response.status >= 400 && response.status < 500) {
    // 其他4xx错误：客户端错误
    return {
      status: 'warning',
      responseTime,
      errorMessage: `HTTP ${response.status}: ${response.statusText} (${method}请求)`
    };
  } else if (response.status >= 500) {
    // 5xx错误：服务器错误（包括502、503、504等）
    return {
      status: 'error',
      responseTime,
      errorMessage: `HTTP ${response.status} (${response.statusText}): 服务器内部错误 (${method}请求)`
    };
  } else {
    // 其他状态码
    return {
      status: 'warning',
      responseTime,
      errorMessage: `HTTP ${response.status}: ${response.statusText} (${method}请求)`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { websiteId } = await request.json();

    if (!websiteId) {
      return NextResponse.json({ error: '网站ID不能为空' }, { status: 400 });
    }

    // 获取网站信息
    const websiteRows = await query(
      'SELECT id, name, url FROM websites WHERE id = ?',
      [websiteId]
    ) as any[];

    if (!websiteRows || websiteRows.length === 0) {
      return NextResponse.json({ error: '网站不存在' }, { status: 404 });
    }

    const website = websiteRows[0];

    // 检查网站状态
    const result = await checkWebsiteStatus(website.url);

    // 更新网站状态
    await query(
      'UPDATE websites SET status = ?, response_time = ?, last_checked = NOW() WHERE id = ?',
      [result.status, result.responseTime, websiteId]
    );

    // 验证更新是否成功
    const verifyRows = await query(
      'SELECT status, response_time FROM websites WHERE id = ?',
      [websiteId]
    ) as any[];
    
    console.log(`验证网站 ${websiteId} 更新后的状态:`, verifyRows[0]);

    // 记录监控日志（包含HTTP状态码）
    await query(
      'INSERT INTO monitor_logs (website_id, status, response_time, error_message, http_status_code) VALUES (?, ?, ?, ?, ?)',
      [websiteId, result.status, result.responseTime, result.errorMessage || null, result.httpStatusCode || null]
    );

    // 获取网站之前的状态用于比较
    const previousStatus = await query(
      'SELECT status FROM websites WHERE id = ?',
      [websiteId]
    ) as any[];
    
    const previousStatusValue = previousStatus.length > 0 ? previousStatus[0].status : 'unknown';

    // 发送通知（基于通知规则）
    await sendNotifications(websiteId, website.name, website.url, result, previousStatusValue);

    return NextResponse.json({
      success: true,
      websiteId,
      status: result.status,
      responseTime: result.responseTime,
      errorMessage: result.errorMessage
    });

  } catch (error) {
    console.error('Website check error:', error);
    return NextResponse.json({ 
      error: '检查失败', 
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 发送通知的核心函数
async function sendNotifications(
  websiteId: number, 
  websiteName: string, 
  websiteUrl: string, 
  currentResult: CheckResult,
  previousStatus: string
) {
  try {
    // 获取适用的通知规则
    const rules = await query(`
      SELECT 
        nr.*,
        u.email as user_email
      FROM notification_rules nr
      JOIN users u ON nr.user_id = u.id
      JOIN websites w ON w.user_id = nr.user_id AND w.id = ?
      WHERE nr.is_active = 1 
        AND (
          nr.rule_type = 'all' 
          OR (nr.rule_type = 'specific' AND nr.website_id = ?)
        )
    `, [websiteId, websiteId]) as any[];

    if (!rules || rules.length === 0) {
      console.log(`网站 ${websiteId} 没有适用的通知规则`);
      return;
    }

    // 获取邮件配置
    const configRows = await query(
      'SELECT * FROM email_configs ORDER BY created_at DESC LIMIT 1'
    ) as any[];

    if (!configRows || configRows.length === 0) {
      console.log('没有找到邮件配置，跳过通知发送');
      return;
    }

    const emailConfig = configRows[0];
    const { sendEmail } = await import('@/lib/email');

    // 处理每个通知规则
    for (const rule of rules) {
      try {
        const events = rule.notification_events ? JSON.parse(rule.notification_events) : [];
        const recipients = rule.email_recipients ? JSON.parse(rule.email_recipients) : [];

        // 检查是否需要发送通知
        if (shouldSendNotification(events, currentResult, previousStatus)) {
          const subject = generateNotificationSubject(websiteName, currentResult, previousStatus);
          const content = generateNotificationContent(websiteName, websiteUrl, currentResult, previousStatus);

          // 发送邮件给所有收件人
          for (const recipient of recipients) {
            await sendEmail(emailConfig, recipient, subject, content);
          }

          console.log(`已发送通知给规则 ${rule.id} 的收件人:`, recipients);
        }
      } catch (ruleError) {
        console.error(`处理通知规则 ${rule.id} 时出错:`, ruleError);
      }
    }

  } catch (error) {
    console.error('发送通知时出错:', error);
  }
}

// 判断是否需要发送通知
function shouldSendNotification(
  events: string[], 
  currentResult: CheckResult, 
  previousStatus: string
): boolean {
  // 网站宕机
  if (events.includes('down') && currentResult.status === 'error') {
    return true;
  }

  // 响应缓慢
  if (events.includes('slow') && currentResult.status === 'warning' && currentResult.responseTime > 1000) {
    return true;
  }

  // HTTP错误
  if (events.includes('error') && currentResult.status === 'warning' && currentResult.errorMessage?.includes('HTTP')) {
    return true;
  }

  // 恢复通知
  if (events.includes('recovery') && 
      previousStatus !== 'healthy' && 
      currentResult.status === 'healthy') {
    return true;
  }

  return false;
}

// 生成通知主题
function generateNotificationSubject(
  websiteName: string, 
  currentResult: CheckResult, 
  previousStatus: string
): string {
  const timestamp = new Date().toLocaleString('zh-CN');
  
  if (currentResult.status === 'error') {
    return `[紧急] 网站监控告警: ${websiteName} - 网站宕机`;
  } else if (currentResult.status === 'warning' && currentResult.responseTime > 1000) {
    return `[警告] 网站监控告警: ${websiteName} - 响应缓慢`;
  } else if (currentResult.status === 'warning' && currentResult.errorMessage?.includes('HTTP')) {
    return `[警告] 网站监控告警: ${websiteName} - HTTP错误`;
  } else if (previousStatus !== 'healthy' && currentResult.status === 'healthy') {
    return `[恢复] 网站监控通知: ${websiteName} - 已恢复正常`;
  }
  
  return `[通知] 网站监控: ${websiteName} - 状态变化`;
}

// 生成通知内容
function generateNotificationContent(
  websiteName: string, 
  websiteUrl: string, 
  currentResult: CheckResult, 
  previousStatus: string
): string {
  const timestamp = new Date().toLocaleString('zh-CN');
  
  let statusIcon = '';
  let statusText = '';
  
  if (currentResult.status === 'error') {
    statusIcon = '🚨';
    statusText = '宕机';
  } else if (currentResult.status === 'warning') {
    statusIcon = '⚠️';
    statusText = '警告';
  } else if (currentResult.status === 'healthy') {
    statusIcon = '✅';
    statusText = '正常';
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${statusIcon} 网站监控通知</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${timestamp}</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">${websiteName}</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 120px;">网站地址:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">
              <a href="${websiteUrl}" target="_blank" style="color: #007bff; text-decoration: none;">${websiteUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">当前状态:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${getStatusColor(currentResult.status)};">
              <strong>${statusText}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">之前状态:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${getStatusLabel(previousStatus)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">响应时间:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${currentResult.responseTime}ms</td>
          </tr>
          ${currentResult.errorMessage ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">错误信息:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #dc3545;">${currentResult.errorMessage}</td>
          </tr>
          ` : ''}
        </table>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            💡 提示: 您可以在通知规则设置中自定义通知条件和收件人。
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            查看监控仪表板
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>此邮件由网站监控系统自动发送，请勿回复。</p>
      </div>
    </div>
  `;
}

// 获取状态颜色
function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy': return '#28a745';
    case 'warning': return '#ffc107';
    case 'error': return '#dc3545';
    default: return '#6c757d';
  }
}

// 获取状态标签
function getStatusLabel(status: string): string {
  switch (status) {
    case 'healthy': return '正常';
    case 'warning': return '警告';
    case 'error': return '宕机';
    default: return '未知';
  }
}