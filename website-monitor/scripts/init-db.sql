-- 网站监控系统数据库初始化脚本（无外键版本）
-- 适用于 MySQL 5.7+

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#FF6B6B',
  sort_order INT DEFAULT 0,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 网站表
CREATE TABLE IF NOT EXISTS websites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  category_id INT NULL,
  user_id INT NOT NULL,
  status ENUM('healthy', 'warning', 'error', 'unknown') DEFAULT 'unknown',
  response_time INT DEFAULT 0,
  status_code INT NULL,
  response_content TEXT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 监控记录表
CREATE TABLE IF NOT EXISTS monitor_logs (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 邮件配置表
DROP TABLE IF EXISTS email_configs;
CREATE TABLE email_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  smtp_host VARCHAR(100) NOT NULL,
  smtp_port INT NOT NULL DEFAULT 587,
  smtp_user VARCHAR(100) NOT NULL,
  smtp_password VARCHAR(255) NOT NULL,
  smtp_secure BOOLEAN DEFAULT FALSE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 邮件通知规则表
CREATE TABLE IF NOT EXISTS notification_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  website_id INT NULL,
  rule_type ENUM('all', 'specific') NOT NULL DEFAULT 'all',
  notification_events JSON NOT NULL DEFAULT '{"down": true, "up": true, "slow": false}',
  email_recipients JSON NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_website_id (website_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录验证码表
CREATE TABLE IF NOT EXISTS login_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_code (email, code),
  INDEX idx_expires (expires_at),
  INDEX idx_email_used (email, used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 密码重置验证码表
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_code (email, code),
  INDEX idx_expires (expires_at),
  INDEX idx_email_used (email, used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户（密码: 123456）
-- 密码哈希: $2b$10$PRv4oENX7f5/ILVOhtefP.CWDyW6uQJ6pdkeK43azUyj6PplVtzxe
INSERT IGNORE INTO users (id, username, email, password, role) 
VALUES (1, 'xrilang', 'xrilang@mllt.cc', '$2b$10$PRv4oENX7f5/ILVOhtefP.CWDyW6uQJ6pdkeK43azUyj6PplVtzxe', 'admin')
ON DUPLICATE KEY UPDATE 
  username = VALUES(username),
  password = VALUES(password),
  role = VALUES(role),
  updated_at = CURRENT_TIMESTAMP;

-- 插入默认分类（系统级分类，user_id = NULL）
INSERT IGNORE INTO categories (id, name, color, sort_order, user_id) VALUES 
(1, '业务系统', '#FF6B6B', 0, NULL),
(2, '监控系统', '#4ECDC4', 1, NULL),
(3, '开发工具', '#45B7D1', 2, NULL),
(4, '文档网站', '#96CEB4', 3, NULL),
(5, '其他', '#FFEAA7', 4, NULL)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  color = VALUES(color),
  sort_order = VALUES(sort_order),
  updated_at = CURRENT_TIMESTAMP;

-- 插入默认系统设置
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('check_interval', '5', '默认检查间隔（分钟）'),
('timeout', '10', '请求超时时间（秒）'),
('retry_count', '3', '失败重试次数'),
('notification_cooldown', '300', '通知冷却时间（秒）'),
('max_response_time', '200', '最大响应时间阈值（毫秒）'),
('cleanup_logs_days', '30', '日志清理天数'),
('max_websites_per_user', '50', '每个用户最大网站数量')
ON DUPLICATE KEY UPDATE 
  setting_value = VALUES(setting_value),
  description = VALUES(description),
  updated_at = CURRENT_TIMESTAMP;