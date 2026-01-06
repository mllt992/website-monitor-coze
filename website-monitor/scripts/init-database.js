const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: '批量替换_请输入数据IP地址',
  port: 3306,
  user: 't_monitor',
  password: '批量替换_请输入数据库密码',
  database: 't_monitor'
};

async function initializeDatabase() {
  let connection;
  
  try {
    console.log('连接到数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    // 分别创建每个表
    const createTables = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 分类表
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) NOT NULL DEFAULT '#FF6B6B',
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 网站表
      `CREATE TABLE IF NOT EXISTS websites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        category_id INT NULL,
        user_id INT NOT NULL,
        status ENUM('healthy', 'warning', 'error', 'unknown') DEFAULT 'unknown',
        response_time INT DEFAULT 0,
        last_checked TIMESTAMP NULL,
        tags VARCHAR(500),
        check_interval INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_category_id (category_id),
        INDEX idx_status (status),
        INDEX idx_last_checked (last_checked),
        INDEX idx_user_status (user_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 监控记录表
      `CREATE TABLE IF NOT EXISTS monitor_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        website_id INT NOT NULL,
        status ENUM('healthy', 'warning', 'error') NOT NULL,
        response_time INT DEFAULT 0,
        error_message TEXT,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_website_id (website_id),
        INDEX idx_checked_at (checked_at),
        INDEX idx_website_checked (website_id, checked_at),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 邮件配置表
      `CREATE TABLE IF NOT EXISTS email_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        smtp_host VARCHAR(100) NOT NULL,
        smtp_port INT NOT NULL DEFAULT 587,
        smtp_username VARCHAR(100) NOT NULL,
        smtp_password VARCHAR(255) NOT NULL,
        from_email VARCHAR(100) NOT NULL,
        from_name VARCHAR(100) DEFAULT '网站监控系统',
        is_default BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 邮件通知规则表
      `CREATE TABLE IF NOT EXISTS notification_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        website_id INT NULL,
        rule_type ENUM('all', 'specific') NOT NULL DEFAULT 'all',
        notification_events JSON,
        email_recipients JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_website_id (website_id),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 登录验证码表
      `CREATE TABLE IF NOT EXISTS login_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_code (email, code),
        INDEX idx_expires (expires_at),
        INDEX idx_email_used (email, used)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      
      // 系统设置表
      `CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];
    
    // 创建表
    for (let i = 0; i < createTables.length; i++) {
      console.log(`创建表 ${i + 1}/${createTables.length}...`);
      await connection.execute(createTables[i]);
    }
    
    console.log('✅ 所有表创建完成！');
    
    // 插入初始数据
    console.log('插入初始数据...');
    
    // 插入管理员用户
    await connection.execute(
      `INSERT INTO users (id, username, email, password, role) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       username = VALUES(username),
       password = VALUES(password),
       role = VALUES(role),
       updated_at = CURRENT_TIMESTAMP`,
      [1, 'xrilang', 'xrilang@mllt.cc', '$2b$10$PRv4oENX7f5/ILVOhtefP.CWDyW6uQJ6pdkeK43azUyj6PplVtzxe', 'admin']
    );
    
    // 插入默认分类
    const categories = [
      [1, '业务系统', '#FF6B6B', null],
      [2, '监控系统', '#4ECDC4', null],
      [3, '开发工具', '#45B7D1', null],
      [4, '文档网站', '#96CEB4', null],
      [5, '其他', '#FFEAA7', null]
    ];
    
    for (const category of categories) {
      await connection.execute(
        `INSERT INTO categories (id, name, color, user_id) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         color = VALUES(color),
         updated_at = CURRENT_TIMESTAMP`,
        category
      );
    }
    
    // 插入系统设置
    const settings = [
      ['check_interval', '5', '默认检查间隔（分钟）'],
      ['timeout', '10', '请求超时时间（秒）'],
      ['retry_count', '3', '失败重试次数'],
      ['notification_cooldown', '300', '通知冷却时间（秒）'],
      ['max_response_time', '200', '最大响应时间阈值（毫秒）'],
      ['cleanup_logs_days', '30', '日志清理天数'],
      ['max_websites_per_user', '50', '每个用户最大网站数量']
    ];
    
    for (const setting of settings) {
      await connection.execute(
        `INSERT INTO system_settings (setting_key, setting_value, description) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value),
         description = VALUES(description),
         updated_at = CURRENT_TIMESTAMP`,
        setting
      );
    }
    
    console.log('✅ 初始数据插入完成！');
    
    // 验证数据
    console.log('验证管理员账户...');
    const [adminRows] = await connection.execute(
      'SELECT id, username, email, role FROM users WHERE email = ?',
      ['xrilang@mllt.cc']
    );
    
    if (adminRows.length > 0) {
      console.log('✅ 管理员账户:', adminRows[0]);
    } else {
      console.log('❌ 管理员账户不存在');
    }
    
    // 验证分类
    const [categoryRows] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`✅ 分类数量: ${categoryRows[0].count}`);
    
    // 显示所有表
    const [tableRows] = await connection.execute('SHOW TABLES');
    console.log('✅ 数据库表:', tableRows.map(t => Object.values(t)[0]));
    
    console.log('🎉 数据库初始化成功完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };