const http = require('http');

// 测试函数
async function testStatusCheck() {
  // 模拟不同的网站响应情况
  
  console.log('=== 测试网站状态判断逻辑 ===\n');
  
  // 测试1: 正常网站 - 模拟google.com (应该返回healthy或warning)
  console.log('1. 测试正常网站 (google.com):');
  try {
    const startTime = Date.now();
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      headers: { 'User-Agent': 'Website-Monitor/1.0' }
    });
    const responseTime = Date.now() - startTime;
    console.log(`  响应时间: ${responseTime}ms`);
    console.log(`  HTTP状态: ${response.status}`);
    
    // 应用我们的状态判断逻辑
    if (response.ok) {
      if (responseTime > 1000) {
        console.log(`  判断结果: warning (亚健康) - 响应时间过长\n`);
      } else {
        console.log(`  判断结果: healthy (健康)\n`);
      }
    } else {
      console.log(`  判断结果: error (异常) - HTTP错误\n`);
    }
  } catch (error) {
    console.log(`  判断结果: error (异常) - ${error.message}\n`);
  }
  
  // 测试2: 慢速网站 - 模拟jet.mllt.vip
  console.log('2. 测试慢速网站 (jet.mllt.vip):');
  try {
    const startTime = Date.now();
    const response = await fetch('https://jet.mllt.vip', {
      method: 'HEAD',
      headers: { 'User-Agent': 'Website-Monitor/1.0' }
    });
    const responseTime = Date.now() - startTime;
    console.log(`  响应时间: ${responseTime}ms`);
    console.log(`  HTTP状态: ${response.status}`);
    
    // 应用我们的状态判断逻辑
    if (response.ok) {
      if (responseTime > 1000) {
        console.log(`  判断结果: warning (亚健康) - 响应时间过长\n`);
      } else {
        console.log(`  判断结果: healthy (健康)\n`);
      }
    } else {
      console.log(`  判断结果: error (异常) - HTTP错误\n`);
    }
  } catch (error) {
    console.log(`  判断结果: error (异常) - ${error.message}\n`);
  }
  
  // 测试3: 不存在的网站
  console.log('3. 测试不存在的网站:');
  try {
    const startTime = Date.now();
    const response = await fetch('https://thissitedoesnotexist12345.com', {
      method: 'HEAD',
      headers: { 'User-Agent': 'Website-Monitor/1.0' }
    });
    const responseTime = Date.now() - startTime;
    console.log(`  响应时间: ${responseTime}ms`);
    console.log(`  HTTP状态: ${response.status}`);
    
    // 应用我们的状态判断逻辑
    if (response.ok) {
      if (responseTime > 1000) {
        console.log(`  判断结果: warning (亚健康) - 响应时间过长\n`);
      } else {
        console.log(`  判断结果: healthy (健康)\n`);
      }
    } else {
      console.log(`  判断结果: error (异常) - HTTP错误\n`);
    }
  } catch (error) {
    console.log(`  判断结果: error (异常) - ${error.message}\n`);
  }
}

// 由于fetch在Node中需要polyfill，我们使用http模块来模拟
async function testWithHttp() {
  console.log('=== 使用HTTP模块测试 ===\n');
  
  const testUrls = [
    'https://www.google.com',
    'https://jet.mllt.vip',
    'https://thissitedoesnotexist12345.com'
  ];
  
  for (const url of testUrls) {
    console.log(`测试 ${url}:`);
    const startTime = Date.now();
    
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: '/',
        method: 'HEAD',
        headers: { 'User-Agent': 'Website-Monitor/1.0' },
        timeout: 10000
      };
      
      const req = require(urlObj.protocol === 'https:' ? 'https' : 'http').request(options, (res) => {
        const responseTime = Date.now() - startTime;
        console.log(`  响应时间: ${responseTime}ms`);
        console.log(`  HTTP状态: ${res.statusCode}`);
        
        // 应用我们的状态判断逻辑
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (responseTime > 1000) {
            console.log(`  判断结果: warning (亚健康) - 响应时间过长\n`);
          } else {
            console.log(`  判断结果: healthy (健康)\n`);
          }
        } else {
          console.log(`  判断结果: error (异常) - HTTP错误\n`);
        }
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        console.log(`  响应时间: ${responseTime}ms`);
        console.log(`  判断结果: error (异常) - ${error.message}\n`);
      });
      
      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        console.log(`  响应时间: ${responseTime}ms`);
        console.log(`  判断结果: error (异常) - 请求超时\n`);
      });
      
      req.end();
      
      // 等待响应
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`  响应时间: ${responseTime}ms`);
      console.log(`  判断结果: error (异常) - ${error.message}\n`);
    }
  }
}

// 直接使用Node.js的https模块测试
const https = require('https');
const clientHttp = require('http');

function testUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : clientHttp;
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: '/',
      method: 'HEAD',
      headers: { 'User-Agent': 'Website-Monitor/1.0' },
      timeout: 10000
    }, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        responseTime,
        statusCode: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 300,
        error: null
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        responseTime,
        statusCode: 0,
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        responseTime,
        statusCode: 0,
        success: false,
        error: '请求超时'
      });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('=== 测试网站状态判断逻辑 ===\n');
  
  const testUrls = [
    'https://www.google.com',
    'https://jet.mllt.vip',
    'https://thissitedoesnotexist12345.com'
  ];
  
  for (const url of testUrls) {
    console.log(`测试 ${url}:`);
    const result = await testUrl(url);
    console.log(`  响应时间: ${result.responseTime}ms`);
    console.log(`  HTTP状态: ${result.statusCode}`);
    console.log(`  错误信息: ${result.error || '无'}`);
    
    // 应用我们的状态判断逻辑
    if (result.error) {
      console.log(`  判断结果: error (异常) - ${result.error}`);
    } else if (result.success) {
      if (result.responseTime > 1000) {
        console.log(`  判断结果: warning (亚健康) - 响应时间过长`);
      } else {
        console.log(`  判断结果: healthy (健康)`);
      }
    } else {
      console.log(`  判断结果: error (异常) - HTTP错误 ${result.statusCode}`);
    }
    console.log();
  }
}

runTests().catch(console.error);