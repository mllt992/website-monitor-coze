const { query } = require('../src/lib/db.js');

async function insertTestData() {
  try {
    console.log('开始插入测试数据...');

    // 插入测试分类
    const categories = [
      { name: '系统分类', color: '#FF6B6B', user_id: null },
      { name: '个人网站', color: '#4ECDC4', user_id: 1 },
      { name: '商业网站', color: '#45B7D1', user_id: 1 },
      { name: '开发工具', color: '#96CEB4', user_id: 1 }
    ];

    for (const category of categories) {
      await query(
        'INSERT IGNORE INTO categories (name, color, user_id) VALUES (?, ?, ?)',
        [category.name, category.color, category.user_id]
      );
    }

    console.log('测试分类插入完成');

    // 插入测试网站
    const websites = [
      {
        name: 'Google',
        url: 'https://www.google.com',
        description: '全球最大的搜索引擎',
        category_id: 2,
        user_id: 1,
        tags: 'search,engine,google'
      },
      {
        name: 'GitHub',
        url: 'https://github.com',
        description: '全球最大的代码托管平台',
        category_id: 4,
        user_id: 1,
        tags: 'git,code,development'
      },
      {
        name: '百度',
        url: 'https://www.baidu.com',
        description: '中文搜索引擎',
        category_id: 2,
        user_id: 1,
        tags: 'search,chinese,baidu'
      },
      {
        name: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: '程序员问答社区',
        category_id: 4,
        user_id: 1,
        tags: 'programming,qa,community'
      }
    ];

    for (const website of websites) {
      await query(
        'INSERT IGNORE INTO websites (name, url, description, category_id, user_id, tags) VALUES (?, ?, ?, ?, ?, ?)',
        [website.name, website.url, website.description, website.category_id, website.user_id, website.tags]
      );
    }

    console.log('测试网站插入完成');

    // 插入系统配置
    const systemConfigs = [
      { config_key: 'check_interval', config_value: '5', description: '检查间隔（分钟）' },
      { config_key: 'timeout', config_value: '10', description: '请求超时时间（秒）' },
      { config_key: 'retry_count', config_value: '3', description: '重试次数' },
      { config_key: 'notification_cooldown', config_value: '300', description: '通知冷却时间（秒）' },
      { config_key: 'max_response_time', config_value: '200', description: '最大响应时间（毫秒）' },
      { config_key: 'cleanup_logs_days', config_value: '30', description: '日志清理天数' },
      { config_key: 'max_websites_per_user', config_value: '50', description: '每用户最大网站数' }
    ];

    for (const config of systemConfigs) {
      await query(
        'INSERT IGNORE INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
        [config.config_key, config.config_value, config.description]
      );
    }

    console.log('系统配置插入完成');

    console.log('所有测试数据插入完成！');
  } catch (error) {
    console.error('插入测试数据失败:', error);
  } finally {
    process.exit(0);
  }
}

insertTestData();