-- 创建数据库
CREATE DATABASE IF NOT EXISTS t_monitor;
USE t_monitor;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 网站分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#FFB6C1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 网站表
CREATE TABLE IF NOT EXISTS websites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    category_id INT,
    status ENUM('healthy', 'warning', 'error') DEFAULT 'unknown',
    response_time INT DEFAULT 0,
    last_checked TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#FFB6C1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 网站标签关联表
CREATE TABLE IF NOT EXISTS website_tags (
    website_id INT,
    tag_id INT,
    PRIMARY KEY (website_id, tag_id),
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 邮件配置表
CREATE TABLE IF NOT EXISTS email_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_host VARCHAR(100) NOT NULL,
    smtp_port INT NOT NULL DEFAULT 587,
    smtp_user VARCHAR(100) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    smtp_secure BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 邮件模板表
CREATE TABLE IF NOT EXISTS email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    template_type ENUM('website_down', 'website_recovery', 'custom') DEFAULT 'custom',
    is_default BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 通知规则表
CREATE TABLE IF NOT EXISTS notification_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    website_id INT,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    notification_conditions JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 监控日志表
CREATE TABLE IF NOT EXISTS monitor_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    website_id INT NOT NULL,
    status ENUM('healthy', 'warning', 'error') NOT NULL,
    response_time INT DEFAULT 0,
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
    INDEX idx_website_checked (website_id, checked_at)
);

-- 邮件验证码表
CREATE TABLE IF NOT EXISTS email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose ENUM('login', 'register', 'password_reset') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_code (email, code)
);

-- 插入默认管理员账户 (密码: 123456)
INSERT INTO users (username, email, password_hash, is_admin, is_verified) 
VALUES ('xrilang', 'xrilang@mllt.cc', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', TRUE, TRUE)
ON DUPLICATE KEY UPDATE is_admin = TRUE;

-- 插入默认分类
INSERT INTO categories (name, description, color) VALUES 
('个人网站', '个人博客或作品集网站', '#FFB6C1'),
('企业网站', '公司官方网站', '#87CEEB'),
('电商网站', '在线购物平台', '#98FB98'),
('社交媒体', '社交平台和论坛', '#DDA0DD')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 插入默认邮件模板
INSERT INTO email_templates (name, subject, content, template_type, is_default) VALUES 
('网站下线通知', '⚠️ 网站监控告警 - {{website_name}} 状态异常', 
'尊敬的用户，\n\n您监控的网站 {{website_name}} ({{website_url}}) 检测到异常状态：\n\n状态：{{status}}\n响应时间：{{response_time}}ms\n检测时间：{{checked_time}}\n错误信息：{{error_message}}\n\n请及时检查网站状况。\n\n祝好！\n网站监控系统', 'website_down', TRUE),
('网站恢复通知', '✅ 网站监控恢复 - {{website_name}} 状态正常', 
'尊敬的用户，\n\n您监控的网站 {{website_name}} ({{website_url}}) 已恢复正常：\n\n状态：{{status}}\n响应时间：{{response_time}}ms\n恢复时间：{{checked_time}}\n\n网站现在可以正常访问了。\n\n祝好！\n网站监控系统', 'website_recovery', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);