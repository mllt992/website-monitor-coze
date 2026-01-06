const mysql = require('mysql2/promise');

async function checkTableStructure() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor',
    });

    const [rows] = await connection.execute('DESCRIBE websites');

    console.log('websites 表结构:');
    rows.forEach(r => console.log(`  ${r.Field} - ${r.Type}`));

    await connection.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkTableStructure();
