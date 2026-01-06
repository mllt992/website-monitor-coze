const mysql = require('mysql2/promise');

async function checkWebsites() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor',
    });

    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count FROM websites WHERE is_active = 1`
    );

    console.log('启用的网站数量:', rows[0].count);

    const [websites] = await connection.execute(
      `SELECT id, url FROM websites WHERE is_active = 1 LIMIT 10`
    );

    console.log('前10个网站:');
    websites.forEach(w => console.log(`  ${w.id}: ${w.url}`));

    await connection.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkWebsites();
