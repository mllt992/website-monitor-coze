// 检查表结构
const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    const connection = await mysql.createConnection({
      host: '批量替换_请输入数据IP地址',
      port: 3306,
      user: 't_monitor',
      password: '批量替换_请输入数据库密码',
      database: 't_monitor'
    });
    
    console.log('=== 检查websites表结构 ===\n');
    
    // 查看websites表结构
    const [websitesStructure] = await connection.execute('DESCRIBE websites');
    console.log('websites 表结构:');
    websitesStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n=== 检查是否包含status_code字段 ===');
    const hasStatusCode = websitesStructure.some(col => col.Field === 'status_code');
    const hasResponseContent = websitesStructure.some(col => col.Field === 'response_content');
    
    console.log(`status_code字段: ${hasStatusCode ? '存在' : '不存在'}`);
    console.log(`response_content字段: ${hasResponseContent ? '存在' : '不存在'}`);
    
    // 如果字段不存在，添加它们
    if (!hasStatusCode) {
      console.log('\n=== 添加status_code字段 ===');
      await connection.execute('ALTER TABLE websites ADD COLUMN status_code INT NULL');
      console.log('status_code字段添加成功');
    }
    
    if (!hasResponseContent) {
      console.log('\n=== 添加response_content字段 ===');
      await connection.execute('ALTER TABLE websites ADD COLUMN response_content TEXT NULL');
      console.log('response_content字段添加成功');
    }
    
    // 查看网站数据
    console.log('\n=== 查看现有网站数据 ===');
    const [websites] = await connection.execute(`
      SELECT 
        id,
        name,
        url,
        status,
        response_time,
        status_code,
        response_content,
        last_checked
      FROM websites
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    websites.forEach(site => {
      console.log(`\n${site.name} (ID: ${site.id})`);
      console.log(`  URL: ${site.url}`);
      console.log(`  状态: ${site.status}`);
      console.log(`  响应时间: ${site.response_time}ms`);
      console.log(`  状态码: ${site.status_code || 'N/A'}`);
      console.log(`  最后检查: ${site.last_checked || 'N/A'}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkTables();