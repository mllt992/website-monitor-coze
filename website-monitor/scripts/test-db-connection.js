const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('开始连接数据库...');
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor',
    });

    console.log('✓ 数据库连接成功');

    // 测试查询
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM auth_keys');
    console.log('✓ 查询成功:', rows[0]);

    await connection.end();
    console.log('✓ 连接已关闭');
  } catch (error) {
    console.error('✗ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

testConnection();
