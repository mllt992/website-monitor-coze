import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CheckResult {
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  errorMessage?: string;
  statusCode?: number;
  responseContent?: string;
}

async function checkWebsiteStatus(url: string): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // 第一步：尝试HEAD请求（轻量级）
    let { response, content } = await performRequest(url, 'HEAD');
    let responseTime = Date.now() - startTime;
    
    // 如果HEAD请求成功且不是404，直接使用结果
    if (response.ok && response.status !== 404) {
      return analyzeResponse(response, responseTime, 'HEAD', content);
    }
    
    // 如果HEAD请求失败（特别是404或服务器错误），尝试GET请求
    console.log(`HEAD请求失败 (${response.status})，尝试GET请求: ${url}`);
    
    const getStartTime = Date.now();
    const getResult = await performRequest(url, 'GET');
    response = getResult.response;
    content = getResult.content;
    responseTime = Date.now() - getStartTime;
    
    return analyzeResponse(response, responseTime, 'GET', content);
    
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
      errorMessage
    };
  }
}

// 执行HTTP请求的通用函数
async function performRequest(url: string, method: 'HEAD' | 'GET'): Promise<{response: Response, content: string}> {
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
    
    const response = await fetch(url, requestOptions);
    let content = '';
    
    // 如果状态码不是2xx或者不是HEAD请求，尝试获取响应内容
    if (!response.ok || response.status >= 400 || method === 'GET') {
      try {
        content = await response.text();
        // 限制响应内容长度
        if (content.length > 1000) {
          content = content.substring(0, 1000) + '...';
        }
      } catch (contentError) {
        content = '无法读取响应内容';
      }
    }
    
    return { response, content };
    
  } finally {
    clearTimeout(timeoutId);
  }
}

// 分析响应并返回结果
function analyzeResponse(response: Response, responseTime: number, method: string, content: string): CheckResult {
  // 0ms（或接近0）：异常，低于1000ms：健康，高于1000ms：亚健康
  if (responseTime <= 0) {
    return {
      status: 'error',
      responseTime: 0,
      errorMessage: '响应时间异常: 检测时间戳错误',
      statusCode: response.status,
      responseContent: content
    };
  }
  
  // 根据HTTP状态码判断状态
  if (response.ok) {
    // 2xx状态码：根据响应时间判断
    if (responseTime >= 1000) {
      return {
        status: 'warning',
        responseTime,
        errorMessage: `响应时间较长: ${responseTime}ms (${method}请求)`,
        statusCode: response.status,
        responseContent: content
      };
    } else {
      return {
        status: 'healthy',
        responseTime,
        errorMessage: '',
        statusCode: response.status,
        responseContent: content
      };
    }
  } else if (response.status === 401 || response.status === 403) {
    // 401未授权、403禁止访问：这是正常的业务响应，说明网站正常运行
    // 只是页面需要认证或权限，不是网站问题
    return {
      status: 'healthy',
      responseTime,
      errorMessage: `需要认证 (HTTP ${response.status}): ${response.statusText} (${method}请求)`,
      statusCode: response.status,
      responseContent: content
    };
  } else if (response.status === 404) {
    // 404错误：页面不存在，但网站是可达的
    return {
      status: 'warning',
      responseTime,
      errorMessage: `页面不存在 (HTTP 404) - ${response.statusText} (${method}请求)`,
      statusCode: response.status,
      responseContent: content
    };
  } else if (response.status >= 400 && response.status < 500) {
    // 其他4xx错误：客户端错误
    return {
      status: 'warning',
      responseTime,
      errorMessage: `HTTP ${response.status}: ${response.statusText} (${method}请求)`,
      statusCode: response.status,
      responseContent: content
    };
  } else if (response.status >= 500) {
    // 5xx错误：服务器错误（包括502、503、504等）
    return {
      status: 'error',
      responseTime,
      errorMessage: `HTTP ${response.status} (${response.statusText}): 服务器内部错误 (${method}请求)`,
      statusCode: response.status,
      responseContent: content
    };
  } else {
    // 其他状态码
    return {
      status: 'warning',
      responseTime,
      errorMessage: `HTTP ${response.status}: ${response.statusText} (${method}请求)`,
      statusCode: response.status,
      responseContent: content
    };
  }
}

export async function GET() {
  try {
    // 获取所有网站
    const websiteRows = await query(
      'SELECT id, name, url FROM websites ORDER BY created_at DESC'
    ) as any[];

    if (!websiteRows || websiteRows.length === 0) {
      return NextResponse.json({
        message: '没有网站需要检查',
        results: []
      });
    }

    const results = [];

    // 并发检查所有网站，但限制并发数
    const concurrencyLimit = 5;
    for (let i = 0; i < websiteRows.length; i += concurrencyLimit) {
      const batch = websiteRows.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (website) => {
        try {
          const result = await checkWebsiteStatus(website.url);

          // 更新网站状态
          await query(
            'UPDATE websites SET status = ?, response_time = ?, last_checked = NOW(), status_code = ?, response_content = ? WHERE id = ?',
            [result.status, result.responseTime, result.statusCode || null, result.responseContent || null, website.id]
          );

          // 记录监控日志（包含HTTP状态码）
          await query(
            'INSERT INTO monitor_logs (website_id, status, response_time, error_message, http_status_code) VALUES (?, ?, ?, ?, ?)',
            [website.id, result.status, result.responseTime, result.errorMessage || null, result.statusCode || null]
          );

          return {
            websiteId: website.id,
            websiteName: website.name,
            url: website.url,
            status: result.status,
            responseTime: result.responseTime,
            errorMessage: result.errorMessage,
            success: true
          };
        } catch (error) {
          return {
            websiteId: website.id,
            websiteName: website.name,
            url: website.url,
            status: 'error',
            responseTime: 0,
            errorMessage: error instanceof Error ? error.message : '检查失败',
            success: false
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // 统计结果
    const stats = {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      warning: results.filter(r => r.status === 'warning').length,
      error: results.filter(r => r.status === 'error').length,
    };

    return NextResponse.json({
      message: `批量检查完成，共检查 ${results.length} 个网站`,
      results,
      stats
    });

  } catch (error: any) {
    console.error('Check all websites error:', error);
    return NextResponse.json({ error: '服务器内部错误', details: error?.message }, { status: 500 });
  }
}