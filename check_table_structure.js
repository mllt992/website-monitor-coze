// 检查表结构
const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor'
    });
    
    console.log('=== 检查表结构 ===\n');
    
    // 查看monitor_logs表结构
    const [logsStructure] = await connection.execute('DESCRIBE monitor_logs');
    console.log('monitor_logs 表结构:');
    logsStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // 查看最近的监控日志
    console.log('\n=== 最近的监控日志 ===');
    const [logs] = await connection.execute(`
      SELECT 
        ml.website_id,
        w.name as website_name,
        w.url,
        ml.status,
        ml.response_time,
        ml.error_message,
        ml.checked_at
      FROM monitor_logs ml
      JOIN websites w ON ml.website_id = w.id
      ORDER BY ml.checked_at DESC
      LIMIT 10
    `);
    
    logs.forEach(log => {
      console.log(`\n${log.timestamp} - ${log.website_name}`);
      console.log(`  URL: ${log.url}`);
      console.log(`  状态: ${log.status}`);
      console.log(`  响应时间: ${log.response_time}ms`);
      if (log.error_message) {
        console.log(`  错误: ${log.error_message}`);
      }
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkTables();