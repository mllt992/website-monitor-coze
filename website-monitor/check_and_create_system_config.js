const mysql = require('mysql2/promise');

async function checkAndCreateSystemConfig() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor'
    });

    console.log('Connected to database');

    // 检查表是否存在
    const [tables] = await connection.execute("SHOW TABLES LIKE 'system_configs'");
    if (tables.length === 0) {
      console.log('Creating system_configs table...');
      await connection.execute(`
        CREATE TABLE system_configs (
          config_key VARCHAR(50) PRIMARY KEY,
          config_value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('Table created');

      // 插入默认配置
      const defaultConfigs = [
        ['check_interval', '5', '默认检查间隔（分钟）'],
        ['timeout', '10', '请求超时时间（秒）'],
        ['retry_count', '3', '失败重试次数'],
        ['notification_cooldown', '300', '通知冷却时间（秒）'],
        ['max_response_time', '200', '最大响应时间阈值（毫秒）'],
        ['cleanup_logs_days', '30', '日志清理天数'],
        ['max_websites_per_user', '50', '每个用户最大网站数量']
      ];

      for (const [key, value, description] of defaultConfigs) {
        await connection.execute(
          'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
          [key, value, description]
        );
      }
      console.log('Default configurations inserted');
    } else {
      console.log('system_configs table already exists');
    }

    // 查询配置
    const [configs] = await connection.execute('SELECT * FROM system_configs');
    console.log('Current configurations:');
    console.table(configs);

    await connection.end();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCreateSystemConfig();