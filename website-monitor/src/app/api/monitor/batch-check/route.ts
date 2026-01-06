import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// GET /api/monitor/batch-check?key=xxx - 批量检测网站并发送邮件通知
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const apiKey = searchParams.get('key');

  // 验证 API 密钥
  if (!apiKey) {
    return NextResponse.json({ error: '缺少 API 密钥' }, { status: 401 });
  }

  try {
    const connection = await getConnection();

    // 验证密钥是否有效
    const [keyRows] = await connection.execute(
      `SELECT id, user_id, is_active
       FROM auth_keys
       WHERE api_key = ? AND is_active = 1`,
      [apiKey]
    );

    if (!Array.isArray(keyRows) || keyRows.length === 0) {
      await connection.end();
      return NextResponse.json({ error: '无效的 API 密钥或密钥已禁用' }, { status: 401 });
    }

    const authKey = keyRows[0] as { id: number; user_id: number | null; is_active: number };

    // 更新密钥使用记录
    await connection.execute(
      `UPDATE auth_keys
       SET last_used_at = UTC_TIMESTAMP(),
           usage_count = usage_count + 1
       WHERE id = ?`,
      [authKey.id]
    );

    // 获取所有网站
    const [websiteRows] = await connection.execute(
      `SELECT id, url, category_id, user_id
       FROM websites`
    );

    if (!Array.isArray(websiteRows) || websiteRows.length === 0) {
      await connection.end();
      return NextResponse.json({
        success: true,
        message: '没有需要检测的网站',
        checkedCount: 0,
        sentCount: 0
      });
    }

    const websites = websiteRows as Array<{
      id: number;
      url: string;
      category_id: number;
      user_id: number | null;
    }>;

    let checkedCount = 0;
    let sentCount = 0;
    const alerts: Array<{
      websiteId: number;
      url: string;
      status: string;
      responseTime: number | null;
      httpCode: number | null;
      message: string;
    }> = [];

    // 批量检测网站
    for (const website of websites) {
      try {
        const result = await checkWebsite(website.url);

        // 更新监控记录
        await connection.execute(
          `INSERT INTO monitor_logs (website_id, status, response_time, http_status_code, error_message, checked_at)
           VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
          [website.id, result.status, result.responseTime, result.httpCode, result.message]
        );

        checkedCount++;

        // 判断是否需要发送告警（所有异常都发送）
        if (shouldSendAlert(result)) {
          alerts.push({
            websiteId: website.id,
            url: website.url,
            status: result.status,
            responseTime: result.responseTime,
            httpCode: result.httpCode,
            message: result.message
          });
        }
      } catch (error) {
        console.error(`检测网站 ${website.url} 失败:`, error);

        // 记录错误
        await connection.execute(
          `INSERT INTO monitor_logs (website_id, status, response_time, http_status_code, error_message, checked_at)
           VALUES (?, 'error', NULL, NULL, ?, UTC_TIMESTAMP())`,
          [website.id, error instanceof Error ? error.message : String(error)]
        );

        checkedCount++;
      }
    }

    // 发送邮件告警
    if (alerts.length > 0) {
      await sendAlertEmails(connection, alerts);
      sentCount = alerts.length;
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      message: `检测完成，共检测 ${checkedCount} 个网站，发送 ${sentCount} 条告警`,
      data: {
        checkedCount,
        sentCount,
        alerts: alerts.map(a => ({
          url: a.url,
          status: a.status,
          message: a.message
        }))
      }
    });
  } catch (error) {
    console.error('批量检测失败:', error);
    return NextResponse.json(
      {
        error: '批量检测失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 检测单个网站
async function checkWebsite(url: string): Promise<{
  status: string;
  responseTime: number | null;
  httpCode: number | null;
  message: string;
}> {
  const startTime = Date.now();

  try {
    // 优先尝试 HEAD 请求
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000), // 10秒超时
      });
    } catch (headError) {
      // HEAD 请求失败，回退到 GET
      response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
    }

    const responseTime = Date.now() - startTime;
    const httpCode = response.status;

    // 判断状态
    let status: string;
    let message: string;

    if (httpCode >= 200 && httpCode < 300) {
      if (responseTime < 1000) {
        status = 'healthy';
        message = '健康';
      } else {
        status = 'warning';
        message = `响应时间过长 (${responseTime}ms)`;
      }
    } else if (httpCode === 401 || httpCode === 403) {
      status = 'healthy';
      message = `HTTP ${httpCode}`;
    } else if (httpCode >= 400 && httpCode < 500) {
      status = 'warning';
      message = `HTTP ${httpCode}`;
    } else {
      status = 'error';
      message = `HTTP ${httpCode}`;
    }

    return {
      status,
      responseTime,
      httpCode,
      message
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'error',
      responseTime,
      httpCode: null,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// 判断是否需要发送告警
function shouldSendAlert(result: { status: string; responseTime: number | null }): boolean {
  return result.status === 'error' || result.status === 'warning';
}

// 发送告警邮件
async function sendAlertEmails(
  connection: any,
  alerts: Array<{
    websiteId: number;
    url: string;
    status: string;
    responseTime: number | null;
    httpCode: number | null;
    message: string;
  }>
): Promise<void> {
  try {
    // 获取邮箱配置
    const [configRows] = await connection.execute(
      `SELECT * FROM email_config LIMIT 1`
    );

    if (!Array.isArray(configRows) || configRows.length === 0) {
      console.error('未配置邮箱，无法发送邮件');
      return;
    }

    const emailConfig = configRows[0] as any;

    // 获取需要通知的网站用户
    const websiteIds = alerts.map(a => a.websiteId);
    const [userRows] = await connection.execute(
      `SELECT DISTINCT w.user_id, u.email
       FROM websites w
       LEFT JOIN users u ON w.user_id = u.id
       WHERE w.id IN (?) AND w.user_id IS NOT NULL`,
      [websiteIds]
    );

    if (!Array.isArray(userRows) || userRows.length === 0) {
      console.error('没有找到需要通知的用户');
      return;
    }

    // 按用户分组告警
    const userAlertsMap = new Map<number, typeof alerts>();

    for (const alert of alerts) {
      const [websiteUser] = await connection.execute(
        `SELECT user_id FROM websites WHERE id = ?`,
        [alert.websiteId]
      );

      if (Array.isArray(websiteUser) && websiteUser.length > 0) {
        const userId = (websiteUser[0] as any).user_id;
        if (userId) {
          if (!userAlertsMap.has(userId)) {
            userAlertsMap.set(userId, []);
          }
          userAlertsMap.get(userId)!.push(alert);
        }
      }
    }

    // 为每个用户发送邮件
    for (const [userId, alertsForUser] of userAlertsMap.entries()) {
      const [userInfo] = await connection.execute(
        `SELECT email FROM users WHERE id = ?`,
        [userId]
      );

      if (Array.isArray(userInfo) && userInfo.length > 0) {
        const userEmail = (userInfo[0] as any).email;
        await sendAlertEmail(emailConfig, userEmail, alertsForUser);
      }
    }
  } catch (error) {
    console.error('发送告警邮件失败:', error);
  }
}

// 发送单条告警邮件
async function sendAlertEmail(config: any, toEmail: string, alerts: Array<any>): Promise<void> {
  const subject = `[网站监控] 检测到 ${alerts.length} 个网站异常`;

  let content = '<h2>网站监控告警</h2>';
  content += '<p>以下网站检测结果异常：</p>';
  content += '<ul>';

  for (const alert of alerts) {
    const statusColor = alert.status === 'error' ? 'red' : 'orange';
    content += `<li style="margin-bottom: 10px;">
      <strong>${alert.url}</strong><br>
      状态：<span style="color: ${statusColor};">${alert.message}</span><br>
      ${alert.httpCode ? `HTTP 状态码：${alert.httpCode}<br>` : ''}
      ${alert.responseTime !== null ? `响应时间：${alert.responseTime}ms` : ''}
    </li>`;
  }

  content += '</ul>';
  content += '<p style="color: #666; font-size: 12px;">此邮件由网站监控系统自动发送，请勿回复。</p>';

  try {
    await sendEmail(config, toEmail, subject, content);
  } catch (error) {
    console.error(`发送邮件到 ${toEmail} 失败:`, error);
  }
}
