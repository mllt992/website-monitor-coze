// 测试网站监控API的实际状态判断
const https = require('https');
const http = require('http');

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

async function testMonitorAPI() {
  console.log('=== 测试网站监控API ===\n');
  
  try {
    // 1. 首先获取所有网站
    console.log('1. 获取所有网站:');
    const websitesResponse = await makeRequest('/api/websites');
    console.log(`状态码: ${websitesResponse.statusCode}`);
    if (websitesResponse.statusCode === 200) {
      console.log('网站列表:', JSON.stringify(websitesResponse.body, null, 2));
    } else {
      console.log('响应:', websitesResponse.body);
    }
    
    console.log('\n2. 测试批量检查:');
    // 2. 测试批量检查
    const batchResponse = await makeRequest('/api/monitor/check-all', null, 'POST');
    console.log(`状态码: ${batchResponse.statusCode}`);
    if (batchResponse.statusCode === 200) {
      console.log('批量检查结果:', JSON.stringify(batchResponse.body, null, 2));
    } else {
      console.log('响应:', batchResponse.body);
    }
    
    console.log('\n3. 再次获取网站状态 (检查更新):');
    // 3. 再次获取网站状态检查更新
    const updatedWebsitesResponse = await makeRequest('/api/websites');
    console.log(`状态码: ${updatedWebsitesResponse.statusCode}`);
    if (updatedWebsitesResponse.statusCode === 200) {
      console.log('更新后的网站列表:', JSON.stringify(updatedWebsitesResponse.body, null, 2));
    } else {
      console.log('响应:', updatedWebsitesResponse.body);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testMonitorAPI();