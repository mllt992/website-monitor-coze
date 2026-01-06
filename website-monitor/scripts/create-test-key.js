const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function createTestKey() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor',
    });

    // 生成测试密钥
    const apiKey = 'test_' + crypto.randomBytes(16).toString('hex');

    // 获取用户ID
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');

    if (!Array.isArray(users) || users.length === 0) {
      console.log('⚠ 没有找到用户，无法创建密钥');
      process.exit(1);
    }

    const userId = users[0].id;

    // 插入密钥
    await connection.execute(
      `INSERT INTO auth_keys (user_id, key_name, api_key, is_active)
       VALUES (?, '测试密钥', ?, 1)`,
      [userId, apiKey]
    );

    await connection.end();

    console.log('✓ 测试密钥创建成功');
    console.log('密钥:', apiKey);
    console.log('');
    console.log('测试命令:');
    console.log(`curl "http://localhost:3002/api/monitor/batch-check?key=${apiKey}"`);
  } catch (error) {
    console.error('✗ 创建密钥失败:', error.message);
    process.exit(1);
  }
}

createTestKey();
