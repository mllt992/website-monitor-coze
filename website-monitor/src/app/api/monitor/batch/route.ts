import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface CheckResult {
  status: 'healthy' | 'warning' | 'error';
  responseTime: number;
  errorMessage?: string;
}

async function checkWebsiteStatus(url: string): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // 第一步：尝试HEAD请求（轻量级）
    let response = await performRequest(url, 'HEAD');
    let responseTime = Date.now() - startTime;
    
    // 如果HEAD请求成功且不是404，直接使用结果
    if (response.ok && response.status !== 404) {
      return analyzeResponse(response, responseTime, 'HEAD');
    }
    
    // 如果HEAD请求失败（特别是404或服务器错误），尝试GET请求
    console.log(`HEAD请求失败 (${response.status})，尝试GET请求: ${url}`);
    
    const getStartTime = Date.now();
    response = await performRequest(url, 'GET');
    responseTime = Date.now() - getStartTime;
    
    return analyzeResponse(response, responseTime, 'GET');
    
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
    
    // 如果是GET请求，我们只需要状态，不需要读取body
    // 这样可以避免下载整个页面内容
    if (method === 'GET') {
      const response = await fetch(url, requestOptions);
      return response;
    }
    
    return await fetch(url, requestOptions);
    
  } finally {
    clearTimeout(timeoutId);
  }
}

// 分析响应并返回结果
function analyzeResponse(response: Response, responseTime: number, method: string): CheckResult {
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
  } else if (response.status === 404) {
    // 404错误：页面不存在，但网站是可达的
    return {
      status: 'warning',
      responseTime,
      errorMessage: `页面不存在 (404) 但网站可达 (${method}请求)`
    };
  } else if (response.status >= 400 && response.status < 500) {
    // 4xx错误：客户端错误
    return {
      status: 'warning',
      responseTime,
      errorMessage: `HTTP ${response.status}: ${response.statusText} (${method}请求)`
    };
  } else if (response.status >= 500) {
    // 5xx错误：服务器错误
    return {
      status: 'error',
      responseTime,
      errorMessage: `HTTP ${response.status}: ${response.statusText} (${method}请求)`
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
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取用户的所有网站
    const websiteRows = await query(
      'SELECT id, name, url FROM websites WHERE user_id = ?',
      [user.userId]
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
            'UPDATE websites SET status = ?, response_time = ?, last_checked = NOW() WHERE id = ?',
            [result.status, result.responseTime, website.id]
          );

          // 记录监控日志
          await query(
            'INSERT INTO monitor_logs (website_id, status, response_time, error_message) VALUES (?, ?, ?, ?)',
            [website.id, result.status, result.responseTime, result.errorMessage || null]
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
    console.error('Batch check error:', error);
    return NextResponse.json({ error: '服务器内部错误', details: error?.message }, { status: 500 });
  }
}