// 测试前端实际调用的API
const http = require('http');

async function testFrontendAPI() {
  console.log('=== 测试前端实际调用的API ===\n');
  
  try {
    // 1. 测试获取网站列表API (需要登录token)
    console.log('1. 测试 /api/websites (无token):');
    const response1 = await makeRequest('/api/websites');
    console.log(`状态码: ${response1.statusCode}`);
    console.log('响应:', JSON.stringify(response1.body, null, 2));
    
    // 2. 测试公共网站API
    console.log('\n2. 测试 /api/public/websites (公开API):');
    const response2 = await makeRequest('/api/public/websites');
    console.log(`状态码: ${response2.statusCode}`);
    if (response2.statusCode === 200 && response2.body) {
      console.log('网站数量:', response2.body.websites ? response2.body.websites.length : '无数据');
      if (response2.body.websites && response2.body.websites.length > 0) {
        response2.body.websites.forEach(site => {
          console.log(`\n网站: ${site.name}`);
          console.log(`  URL: ${site.url}`);
          console.log(`  接口返回状态: ${site.status}`);
          console.log(`  接口返回响应时间: ${site.response_time}ms`);
          console.log(`  最后检查: ${site.last_checked}`);
        });
      }
    } else {
      console.log('响应:', response2.body);
    }
    
    // 3. 测试单个网站检查
    console.log('\n3. 测试单个网站检查 (jet.mllt.vip):');
    const response3 = await makeRequest('/api/monitor/check', JSON.stringify({websiteId: 7}), 'POST');
    console.log(`状态码: ${response3.statusCode}`);
    console.log('响应:', JSON.stringify(response3.body, null, 2));
    
    // 4. 再次检查公共API看更新后的状态
    console.log('\n4. 再次检查公共API (更新后):');
    setTimeout(async () => {
      const response4 = await makeRequest('/api/public/websites');
      console.log(`状态码: ${response4.statusCode}`);
      if (response4.statusCode === 200 && response4.body && response4.body.websites) {
        const jetSite = response4.body.websites.find(w => w.id === 7);
        if (jetSite) {
          console.log(`Jet家族认证更新后状态: ${jetSite.status}, 响应时间: ${jetSite.response_time}ms`);
        }
      }
    }, 2000);
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

function makeRequest(url, data = null, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`http://localhost:5000${url}`);
    const client = http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

testFrontendAPI();