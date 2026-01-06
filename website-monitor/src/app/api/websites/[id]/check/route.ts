import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 单独检查单个网站状态
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const websiteId = parseInt(id);
    
    if (isNaN(websiteId)) {
      return NextResponse.json(
        { success: false, error: '无效的网站ID' },
        { status: 400 }
      );
    }

    // 获取网站信息
    const websites = await query(
      'SELECT * FROM websites WHERE id = ?',
      [websiteId]
    ) as any[];

    if (websites.length === 0) {
      return NextResponse.json(
        { success: false, error: '网站不存在' },
        { status: 404 }
      );
    }

    const website = websites[0];
    
    try {
      // 检查网站状态
      const startTime = Date.now();
      
      // 使用HEAD请求优先，失败时使用GET请求
      let response: Response | null = null;
      let error: string | null = null;
      
      let responseContent = '';
      try {
        // 先尝试HEAD请求
        response = await fetch(website.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Website Monitor)',
          }
        });
        
        // 如果HEAD请求状态码不是2xx，尝试GET请求获取更多信息
        if (!response.ok || response.status >= 400) {
          try {
            const getResponse = await fetch(website.url, {
              method: 'GET',
              signal: AbortSignal.timeout(10000),
              headers: {
                'User-Agent': 'Mozilla/5.0 (Website Monitor)',
              }
            });
            response = getResponse;
            // 获取响应内容
            try {
              responseContent = await response.text();
              // 限制响应内容长度，避免数据库过大
              if (responseContent.length > 1000) {
                responseContent = responseContent.substring(0, 1000) + '...';
              }
            } catch (contentError) {
              responseContent = '无法读取响应内容';
            }
          } catch (getError) {
            // GET请求失败，但HEAD请求成功了，所以还是用HEAD的结果
            console.log(`GET请求失败，使用HEAD结果: ${getError}`);
          }
        }
      } catch (fetchError) {
        console.error(`检查网站 ${website.name} 时出错:`, fetchError);
        error = fetchError instanceof Error ? fetchError.message : '未知错误';
      }
      
      const responseTime = Date.now() - startTime;
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // 更新数据库
      let status = 'error';
      let statusCode = null;
      
      if (error) {
        status = 'error';
        statusCode = null;
      } else if (response) {
        statusCode = response.status;
        // 主要根据响应时间判断健康状态，HTTP状态码作为参考信息
        // 0ms（或接近0）：异常，低于1000ms：健康，高于1000ms：亚健康
        if (responseTime <= 0) {
          status = 'error';
        } else if (responseTime < 1000) {
          status = 'healthy';
        } else {
          status = 'warning';
        }
      }
      
      await query(
        'UPDATE websites SET status = ?, response_time = ?, last_checked = ?, status_code = ?, response_content = ? WHERE id = ?',
        [status, responseTime, currentTime, statusCode, responseContent, websiteId]
      );
      
      // 返回更新后的状态
      const updatedWebsite = {
        ...website,
        status,
        response_time: responseTime,
        last_checked: currentTime,
        status_code: statusCode,
        response_content: responseContent
      };
      
      return NextResponse.json({
        success: true,
        website: updatedWebsite,
        message: '检查完成'
      });
      
    } catch (checkError) {
      console.error('检查网站时发生错误:', checkError);
      
      const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // 更新为错误状态
      await query(
        'UPDATE websites SET status = ?, response_time = ?, last_checked = ?, status_code = ?, response_content = ? WHERE id = ?',
        ['error', 0, currentTime, null, null, websiteId]
      );
      
      return NextResponse.json({
        success: true,
        website: {
          ...website,
          status: 'error',
          response_time: 0,
          last_checked: currentTime,
          status_code: null,
          response_content: null
        },
        message: '检查完成，但网站访问失败'
      });
    }
    
  } catch (error) {
    console.error('Single website check API error:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}