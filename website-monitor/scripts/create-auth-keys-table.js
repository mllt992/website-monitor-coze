const mysql = require('mysql2/promise');

async function createTable() {
  const connection = await mysql.createConnection({
    host: '批量替换_请输入数据IP地址',
    port: 3306,
    user: 't_monitor',
    password: '批量替换_请输入数据库密码',
    database: 't_monitor',
  });

  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS \`auth_keys\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
        \`user_id\` INT DEFAULT NULL COMMENT '用户ID（NULL表示系统密钥）',
        \`key_name\` VARCHAR(100) NOT NULL COMMENT '密钥名称',
        \`api_key\` VARCHAR(64) NOT NULL UNIQUE COMMENT 'API密钥',
        \`is_active\` TINYINT(1) DEFAULT 1 COMMENT '是否启用（0禁用，1启用）',
        \`last_used_at\` TIMESTAMP NULL DEFAULT NULL COMMENT '最后使用时间',
        \`usage_count\` INT DEFAULT 0 COMMENT '使用次数',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX \`idx_user_id\` (\`user_id\`),
        INDEX \`idx_api_key\` (\`api_key\`),
        INDEX \`idx_is_active\` (\`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='授权密钥表';
    `;

    await connection.execute(sql);
    console.log('✓ 授权密钥表创建成功');
  } catch (error) {
    console.error('✗ 创建授权密钥表失败:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createTable();
