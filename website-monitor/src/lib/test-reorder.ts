const dbConfig = {
  host: '批量替换_请输入数据IP地址',
  port: 3306,
  user: 't_monitor',
  password: '批量替换_请输入数据库密码',
  database: 't_monitor'
};

async function testReorderAPI() {
  const mysql = require('mysql2/promise');
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 获取当前分类
    const [categories] = await connection.execute(`
      SELECT id, name, sort_order, user_id 
      FROM categories 
      ORDER BY sort_order ASC
    `);
    
    console.log('Current categories order:');
    (categories as any[]).forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id}, Name: ${cat.name}, Sort Order: ${cat.sort_order}, User ID: ${cat.user_id}`);
    });
    
    // 模拟一个重新排序：把第2个分类移到最后
    const categoryIds = (categories as any[]).map(cat => cat.id);
    if (categoryIds.length >= 2) {
      const [second] = categoryIds.splice(1, 1);
      categoryIds.push(second);
      
      console.log('\nNew order should be:', categoryIds);
      
      // 执行更新
      for (let i = 0; i < categoryIds.length; i++) {
        await connection.execute(
          'UPDATE categories SET sort_order = ? WHERE id = ?',
          [i + 1, categoryIds[i]]
        );
      }
      
      console.log('Order updated successfully!');
      
      // 验证更新
      const [updatedCategories] = await connection.execute(`
        SELECT id, name, sort_order, user_id 
        FROM categories 
        ORDER BY sort_order ASC
      `);
      
      console.log('\nUpdated categories order:');
      (updatedCategories as any[]).forEach((cat, index) => {
        console.log(`${index + 1}. ID: ${cat.id}, Name: ${cat.name}, Sort Order: ${cat.sort_order}, User ID: ${cat.user_id}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testReorderAPI();