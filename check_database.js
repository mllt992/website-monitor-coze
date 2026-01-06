// 检查数据库中的实际网站状态数据
const mysql = require('mysql2/promise');

async function checkDatabaseData() {
  console.log('=== 检查数据库中的网站状态数据 ===\n');
  
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor'
    });
    
    console.log('✓ 数据库连接成功\n');
    
    // 1. 查询所有网站的基本信息和状态
    console.log('1. 所有网站的当前状态:');
    const [websites] = await connection.execute(`
      SELECT 
        id, 
        name, 
        url, 
        status, 
        response_time, 
        last_checked,
        created_at,
        updated_at
      FROM websites 
      ORDER BY updated_at DESC
    `);
    
    websites.forEach(site => {
      console.log(`\n网站: ${site.name}`);
      console.log(`  ID: ${site.id}`);
      console.log(`  URL: ${site.url}`);
      console.log(`  数据库状态: ${site.status}`);
      console.log(`  响应时间: ${site.response_time}ms`);
      console.log(`  最后检查: ${site.last_checked}`);
      console.log(`  更新时间: ${site.updated_at}`);
      
      // 根据响应时间判断应该的状态
      let expectedStatus = 'unknown';
      if (site.response_time === 0) {
        expectedStatus = 'error';
      } else if (site.response_time > 1000) {
        expectedStatus = 'warning';
      } else if (site.response_time > 0 && site.response_time <= 1000) {
        expectedStatus = 'healthy';
      }
      
      console.log(`  应该状态: ${expectedStatus}`);
      console.log(`  状态匹配: ${site.status === expectedStatus ? '✓' : '✗ 不匹配！'}`);
    });
    
    // 2. 查询最近的监控日志
    console.log('\n\n2. 最近的监控日志:');
    const [logs] = await connection.execute(`
      SELECT 
        ml.website_id,
        w.name as website_name,
        w.url,
        ml.status,
        ml.response_time,
        ml.error_message,
        ml.created_at
      FROM monitor_logs ml
      JOIN websites w ON ml.website_id = w.id
      ORDER BY ml.created_at DESC
      LIMIT 20
    `);
    
    logs.forEach(log => {
      console.log(`\n${log.created_at} - ${log.website_name}`);
      console.log(`  URL: ${log.url}`);
      console.log(`  状态: ${log.status}`);
      console.log(`  响应时间: ${log.response_time}ms`);
      if (log.error_message) {
        console.log(`  错误: ${log.error_message}`);
      }
    });
    
    // 3. 检查是否有状态不一致的情况
    console.log('\n\n3. 状态一致性检查:');
    const [inconsistentSites] = await connection.execute(`
      SELECT 
        id, 
        name, 
        url, 
        status, 
        response_time,
        CASE 
          WHEN response_time = 0 THEN 'error'
          WHEN response_time > 1000 THEN 'warning' 
          WHEN response_time > 0 AND response_time <= 1000 THEN 'healthy'
          ELSE 'unknown'
        END as expected_status
      FROM websites 
      WHERE status != CASE 
        WHEN response_time = 0 THEN 'error'
        WHEN response_time > 1000 THEN 'warning' 
        WHEN response_time > 0 AND response_time <= 1000 THEN 'healthy'
        ELSE status
      END
    `);
    
    if (inconsistentSites.length > 0) {
      console.log('发现状态不一致的网站:');
      inconsistentSites.forEach(site => {
        console.log(`\n${site.name} (ID: ${site.id})`);
        console.log(`  当前状态: ${site.status}`);
        console.log(`  应该状态: ${site.expected_status}`);
        console.log(`  响应时间: ${site.response_time}ms`);
        console.log(`  URL: ${site.url}`);
      });
    } else {
      console.log('✓ 所有网站状态都一致');
    }
    
    await connection.end();
    console.log('\n✓ 数据库检查完成');
    
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  }
}

checkDatabaseData();