const mysql = require('mysql2/promise');

async function checkMonitorLogs() {
  const connection = await mysql.createConnection({
    host: '批量替换_请输入数据IP地址',
    port: 3306,
    user: 't_monitor',
    password: '批量替换_请输入数据库密码',
    database: 't_monitor'
  });

  try {
    console.log('=== monitor_logs 表结构 ===');
    const [columns] = await connection.query('DESCRIBE monitor_logs');
    console.table(columns);

    console.log('\n=== 检查是否有 http_status_code 字段 ===');
    const [result] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 't_monitor' AND TABLE_NAME = 'monitor_logs' AND COLUMN_NAME = 'http_status_code'
    `);
    
    if (result.length > 0) {
      console.log('✓ http_status_code 字段已存在');
    } else {
      console.log('✗ http_status_code 字段不存在，需要添加');
    }

    console.log('\n=== 最新的监控日志 ===');
    const [logs] = await connection.query('SELECT * FROM monitor_logs ORDER BY checked_at DESC LIMIT 5');
    console.table(logs);

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkMonitorLogs()
  .then(() => {
    console.log('\n检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('检查失败:', error);
    process.exit(1);
  });
