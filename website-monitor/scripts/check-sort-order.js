const mysql = require('mysql2/promise');

async function checkSortOrder() {
  const connection = await mysql.createConnection({
    host: '批量替换_请输入数据IP地址',
    port: 3306,
    user: 't_monitor',
    password: '批量替换_请输入数据库密码',
    database: 't_monitor'
  });

  try {
    console.log('=== 检查网站 sort_order ===');
    const [websites] = await connection.query('SELECT id, name, sort_order, user_id FROM websites ORDER BY sort_order');
    console.table(websites);

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkSortOrder()
  .then(() => {
    console.log('\n检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('检查失败:', error);
    process.exit(1);
  });
