const mysql = require('mysql2/promise');

async function countWebsites() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor',
    });

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM websites');

    console.log('网站总数:', rows[0].count);

    if (rows[0].count > 0) {
      const [websites] = await connection.execute('SELECT id, name, url FROM websites LIMIT 5');

      console.log('\n前5个网站:');
      websites.forEach(w => {
        console.log(`  ${w.id}. ${w.name} - ${w.url}`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

countWebsites();
