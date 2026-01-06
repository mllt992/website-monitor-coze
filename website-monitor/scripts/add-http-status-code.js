const mysql = require('mysql2/promise');

async function addHttpStatusCode() {
  const connection = await mysql.createConnection({
    host: '批量替换_请输入数据IP地址',
    port: 3306,
    user: 't_monitor',
    password: '批量替换_请输入数据库密码',
    database: 't_monitor'
  });

  try {
    console.log('开始添加http_status_code字段...');

    // 检查monitor_logs表是否已有http_status_code字段
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 't_monitor' AND TABLE_NAME = 'monitor_logs' AND COLUMN_NAME = 'http_status_code'
    `);

    if (columns.length === 0) {
      console.log('为monitor_logs表添加http_status_code字段...');
      await connection.query('ALTER TABLE monitor_logs ADD COLUMN http_status_code INT NULL AFTER error_message');
      console.log('✓ monitor_logs表添加http_status_code字段成功');
    } else {
      console.log('monitor_logs表已有http_status_code字段');
    }

    console.log('\n✅ 字段添加完成！');

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

addHttpStatusCode()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
