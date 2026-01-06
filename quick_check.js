// 快速检查当前状态
const mysql = require('mysql2/promise');

async function quickCheck() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor'
    });
    
    const [websites] = await connection.execute(`
      SELECT id, name, url, status, response_time, last_checked
      FROM websites 
      ORDER BY id
    `);
    
    console.log('当前数据库状态:');
    websites.forEach(site => {
      console.log(`${site.name}: ${site.status} (${site.response_time}ms) - ${site.url}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

quickCheck();