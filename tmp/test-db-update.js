const mysql = require('mysql2/promise');

const dbConfig = {
  host: '212.64.14.96',
  port: 3306,
  user: 't_monitor',
  password: 'qq2686485465',
  database: 't_monitor'
};

async function testDatabaseUpdate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 查看当前状态
    const [rows] = await connection.execute('SELECT id, name, status, response_time FROM websites WHERE id = 8');
    console.log('更新前状态:', rows[0]);
    
    // 手动更新状态
    await connection.execute(
      'UPDATE websites SET status = ?, response_time = ?, last_checked = NOW() WHERE id = ?',
      ['error', 0, 8]
    );
    
    // 查看更新后状态
    const [rows2] = await connection.execute('SELECT id, name, status, response_time FROM websites WHERE id = 8');
    console.log('更新后状态:', rows2[0]);
    
  } catch (error) {
    console.error('数据库测试失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDatabaseUpdate();